from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Alert, AlertStatus, Entity, Transaction
from app.schemas.entities import (
    EntityListItem,
    EntityListResponse,
    EntityLookupResponse,
    EntityNeighborResponse,
    EntityRiskResponse,
)


router = APIRouter()


@router.get("/entities", response_model=EntityListResponse)
def list_entities(
    limit: int = Query(default=200, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
) -> EntityListResponse:
    # Hide synthetic entities (CHAIN-*, SIM-*, RESET-*, quarantine) UNLESS they are frozen.
    # Frozen synthetic entities must appear so compliance officers can find and review them.
    stmt = select(Entity).where(
        or_(
            ~Entity.metadata_json.op("?")("external_id"),   # real seeded entities
            Entity.metadata_json.op("?")("frozen"),          # frozen fraud entities
        )
    )
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Entity.full_name.ilike(term),
                Entity.bvn.ilike(term),
                Entity.nin.ilike(term),
                Entity.business_reg_no.ilike(term),
            )
        )
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0
    rows = db.scalars(stmt.order_by(desc(Entity.created_at)).limit(limit).offset(offset)).all()
    return EntityListResponse(
        items=[
            EntityListItem(
                id=row.id,
                entity_type=row.entity_type,
                full_name=row.full_name,
                address=row.address,
                created_at=row.created_at,
                metadata_json=row.metadata_json or {},
            )
            for row in rows
        ],
        total=total,
    )


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("/entities/{entity_id}", response_model=EntityLookupResponse)
def get_entity(
    entity_id: UUID,
    db: Session = Depends(get_db),
) -> EntityLookupResponse:
    entity = db.get(Entity, entity_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found")

    tx_rows = db.scalars(
        select(Transaction)
        .where(
            or_(
                Transaction.source_entity_id == entity_id,
                Transaction.destination_entity_id == entity_id,
            )
        )
        .order_by(desc(Transaction.occurred_at))
    ).all()

    neighbor_stats: dict[UUID, dict] = defaultdict(
        lambda: {
            "inbound": 0,
            "outbound": 0,
            "transaction_count": 0,
            "total_amount": Decimal("0.00"),
            "last_transaction_at": None,
        }
    )

    for tx in tx_rows:
        if tx.source_entity_id == entity_id:
            neighbor_id = tx.destination_entity_id
            neighbor_stats[neighbor_id]["outbound"] += 1
        else:
            neighbor_id = tx.source_entity_id
            neighbor_stats[neighbor_id]["inbound"] += 1

        neighbor_stats[neighbor_id]["transaction_count"] += 1
        neighbor_stats[neighbor_id]["total_amount"] += Decimal(tx.amount)

        occurred = _ensure_utc(tx.occurred_at)
        last_at = neighbor_stats[neighbor_id]["last_transaction_at"]
        if last_at is None or occurred > last_at:
            neighbor_stats[neighbor_id]["last_transaction_at"] = occurred

    neighbor_ids = list(neighbor_stats.keys())
    neighbor_entities = db.scalars(select(Entity).where(Entity.id.in_(neighbor_ids))).all() if neighbor_ids else []
    neighbor_map = {row.id: row for row in neighbor_entities}

    neighbors: list[EntityNeighborResponse] = []
    for neighbor_id, stats in neighbor_stats.items():
        neighbor_entity = neighbor_map.get(neighbor_id)
        if neighbor_entity is None:
            continue

        relationship = "bidirectional"
        if stats["inbound"] == 0:
            relationship = "outbound"
        elif stats["outbound"] == 0:
            relationship = "inbound"

        neighbors.append(
            EntityNeighborResponse(
                entity_id=neighbor_id,
                entity_type=neighbor_entity.entity_type,
                full_name=neighbor_entity.full_name,
                relationship=relationship,
                transaction_count=stats["transaction_count"],
                total_amount=stats["total_amount"].quantize(Decimal("0.01")),
                last_transaction_at=stats["last_transaction_at"],
            )
        )

    neighbors.sort(key=lambda row: (row.transaction_count, row.last_transaction_at or datetime.min), reverse=True)

    return EntityLookupResponse(
        id=entity.id,
        entity_type=entity.entity_type,
        full_name=entity.full_name,
        bvn=entity.bvn,
        nin=entity.nin,
        business_reg_no=entity.business_reg_no,
        address=entity.address,
        metadata_json=entity.metadata_json,
        created_at=entity.created_at,
        neighbors=neighbors,
    )


@router.get("/entities/{entity_id}/risk", response_model=EntityRiskResponse)
def get_entity_risk(
    entity_id: UUID,
    db: Session = Depends(get_db),
) -> EntityRiskResponse:
    entity = db.get(Entity, entity_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found")

    alert_rows = db.scalars(
        select(Alert)
        .where(Alert.status == AlertStatus.open)
        .order_by(desc(Alert.created_at))
    ).all()

    matching = [row for row in alert_rows if str(entity_id) in {str(x) for x in row.entity_ids}]
    if not matching:
        return EntityRiskResponse(
            entity_id=entity_id,
            risk_score=Decimal("0.0000"),
            reason="No active alerts found for this entity",
            contributing_alert_ids=[],
            model_version="heuristic_v1",
        )

    top = max(matching, key=lambda row: Decimal(row.risk_score))
    reason = (
        f"Highest active risk from {top.pattern_type.value} alert "
        f"({Decimal(top.risk_score).quantize(Decimal('0.0001'))}): {top.reason}"
    )
    return EntityRiskResponse(
        entity_id=entity_id,
        risk_score=Decimal(top.risk_score).quantize(Decimal("0.0001")),
        reason=reason,
        contributing_alert_ids=[row.id for row in matching],
        model_version="heuristic_v1",
    )
