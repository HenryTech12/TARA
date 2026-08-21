import uuid as _uuid
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.models import Alert, Entity, STRDraft, Transaction
from app.models.enums import AlertStatus, DecisionStatus
from app.schemas.str_drafts import EnforcementResult, STRDecisionUpdate, STRDraftResponse, STRFileResponse, STRGenerateRequest, STRListResponse
from app.services.audit_service import write_audit_event
from app.services.str_service import STRGenerationError, generate_str_draft, get_str_draft


router = APIRouter()


@router.get("/str/list", response_model=STRListResponse)
def list_strs(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> STRListResponse:
    total = db.scalar(select(func.count()).select_from(STRDraft)) or 0
    rows = db.scalars(
        select(STRDraft).order_by(desc(STRDraft.created_at)).limit(limit).offset(offset)
    ).all()
    return STRListResponse(
        strs=[
            STRDraftResponse(
                id=r.id,
                alert_id=r.alert_id,
                reviewer_notes=r.reviewer_notes,
                provider=r.provider,
                model_name=r.model_name,
                model_version=r.model_version,
                decision=r.decision.value,
                content_json=r.content_json,
                content_text=r.content_text,
                created_at=r.created_at,
            )
            for r in rows
        ],
        total=total,
    )


@router.post("/str/generate", response_model=STRDraftResponse, status_code=status.HTTP_201_CREATED)
def generate_str(
    payload: STRGenerateRequest,
    db: Session = Depends(get_db),
) -> STRDraftResponse:
    try:
        return generate_str_draft(db=db, alert_id=payload.alert_id, reviewer_notes=payload.reviewer_notes)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except STRGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.patch("/str/{str_id}/decision", response_model=STRDraftResponse)
def update_str_decision(
    str_id: UUID,
    body: STRDecisionUpdate,
    db: Session = Depends(get_db),
) -> STRDraftResponse:
    draft = db.scalar(select(STRDraft).where(STRDraft.id == str_id))
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="STR draft not found")
    requested = DecisionStatus(body.decision)
    if draft.decision != DecisionStatus.pending:
        if draft.decision == requested:
            return get_str_draft(db=db, str_id=str_id)  # idempotent — already at this decision
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Decision already recorded")
    draft.decision = requested
    write_audit_event(
        db=db,
        action="str_decision_updated",
        entity_ids=[],
        alert_id=draft.alert_id,
        model_version=draft.model_version,
        decision=DecisionStatus(body.decision),
        payload_json={"str_id": str(str_id), "decision": body.decision},
    )
    db.commit()
    db.refresh(draft)
    return get_str_draft(db=db, str_id=str_id)


@router.get("/str/{str_id}", response_model=STRDraftResponse)
def fetch_str(
    str_id: UUID,
    db: Session = Depends(get_db),
) -> STRDraftResponse:
    row = get_str_draft(db=db, str_id=str_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="STR draft not found")
    return row


def _execute_enforcement(db: Session, draft: STRDraft) -> EnforcementResult:
    """Freeze all entities linked to the alert and record quarantine transfer stubs."""
    alert = db.scalar(select(Alert).where(Alert.id == draft.alert_id))
    if not alert:
        return EnforcementResult(frozen_count=0, frozen_entities=[])

    # Get or create the TARA quarantine account
    quarantine = db.scalar(
        select(Entity).where(Entity.metadata_json["external_id"].astext == "TARA-QUARANTINE")
    )
    if quarantine is None:
        quarantine = Entity(
            entity_type="institution",
            full_name="TARA Compliance Quarantine Account",
            metadata_json={"external_id": "TARA-QUARANTINE", "system": True},
        )
        db.add(quarantine)
        db.flush()

    frozen_at = datetime.now(timezone.utc).isoformat()
    frozen_entities: list[dict] = []

    for entity_id_str in (alert.entity_ids or []):
        try:
            entity = db.scalar(select(Entity).where(Entity.id == _uuid.UUID(entity_id_str)))
            if entity is None:
                continue

            # Freeze — stored in metadata_json, no schema migration needed
            meta = dict(entity.metadata_json or {})
            meta["frozen"] = True
            meta["frozen_at"] = frozen_at
            meta["frozen_str_id"] = str(draft.id)
            entity.metadata_json = meta

            # Symbolic quarantine transfer (₦1) — creates an audit-visible ledger entry
            db.add(Transaction(
                source_entity_id=entity.id,
                destination_entity_id=quarantine.id,
                amount=Decimal("1.00"),
                currency="NGN",
                occurred_at=datetime.now(timezone.utc),
                reference=f"ENFORCE-{str(draft.id)[:8].upper()}-{_uuid.uuid4().hex[:6].upper()}",
                channel="enforcement",
                metadata_json={
                    "enforcement": True,
                    "str_id": str(draft.id),
                    "alert_id": str(draft.alert_id),
                    "action": "account_frozen_quarantine_transfer",
                },
            ))
            frozen_entities.append({"entity_id": entity_id_str, "name": entity.full_name or entity_id_str})
        except Exception:
            continue

    db.flush()

    write_audit_event(
        db=db,
        action="accounts_frozen",
        entity_ids=alert.entity_ids or [],
        alert_id=draft.alert_id,
        model_version="enforcement_v1",
        decision=DecisionStatus.approved,
        payload_json={
            "str_id": str(draft.id),
            "frozen_count": len(frozen_entities),
            "quarantine_entity_id": str(quarantine.id),
            "frozen_entities": frozen_entities,
        },
    )

    return EnforcementResult(
        frozen_count=len(frozen_entities),
        frozen_entities=frozen_entities,
        quarantine_entity_id=str(quarantine.id),
    )


@router.post("/str/{str_id}/file", response_model=STRFileResponse)
def file_str(
    str_id: UUID,
    db: Session = Depends(get_db),
) -> STRFileResponse:
    """File the STR: record the Squad reference, freeze linked accounts, create quarantine transfers."""
    draft = db.scalar(select(STRDraft).where(STRDraft.id == str_id))
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="STR draft not found")
    if draft.decision != DecisionStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only approved STR drafts can be filed",
        )

    squad_ref: str | None = None
    if settings.squad_secret_key_1:
        try:
            payload = {
                "amount": 100,
                "currency": "NGN",
                "email": "compliance@tara.ng",
                "transaction_ref": f"STR-FILE-{str_id}",
                "description": f"TARA STR filing: {str_id}",
            }
            headers = {"Authorization": f"Bearer {settings.squad_secret_key_1}"}
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(
                    f"{settings.squad_api_base_url}/transaction/initiate",
                    json=payload,
                    headers=headers,
                )
            if resp.status_code < 400:
                squad_ref = resp.json().get("data", {}).get("transaction_ref") or f"STR-FILE-{str_id}"
            else:
                squad_ref = f"STR-FILE-{str_id}-OFFLINE"
        except Exception:
            squad_ref = f"STR-FILE-{str_id}-OFFLINE"
    else:
        squad_ref = f"STR-FILE-{str_id}-NO-SQUAD"

    # Run enforcement: freeze entities + quarantine transfers
    enforcement = _execute_enforcement(db, draft)

    # Close the alert now that the STR has been filed
    alert_obj = db.scalar(select(Alert).where(Alert.id == draft.alert_id))
    if alert_obj:
        alert_obj.status = AlertStatus.closed

    # Persist Squad ref + enforcement summary in the draft
    meta = dict(draft.content_json or {})
    meta["squad_transaction_ref"] = squad_ref
    meta["enforcement"] = {
        "frozen_count": enforcement.frozen_count,
        "frozen_entities": enforcement.frozen_entities,
        "quarantine_entity_id": enforcement.quarantine_entity_id,
    }
    draft.content_json = meta

    write_audit_event(
        db=db,
        action="str_filed",
        entity_ids=[],
        alert_id=draft.alert_id,
        model_version=draft.model_version,
        decision=DecisionStatus.approved,
        payload_json={"str_id": str(str_id), "squad_transaction_ref": squad_ref},
    )
    db.commit()

    return STRFileResponse(
        str_id=str_id,
        squad_transaction_ref=squad_ref,
        status="filed",
        enforcement=enforcement,
    )
