from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Identity, Relationship
from app.services.graph_service import get_edges_for_identity, upsert_identity_node
from app.services.qoreid_service import QoreIDService

router = APIRouter(prefix="/identities", tags=["identities"])
qoreid = QoreIDService()


@router.post("/verify")
async def verify_and_ingest(payload: dict, db: Session = Depends(get_db)) -> dict:
    """Verifies an identity via QoreID (stubbed for now), then upserts it
    into the identity graph and persists it alongside any shared-attribute
    relationships it forms with existing identities.
    """
    try:
        result = await qoreid.verify_identity(
            bvn=payload.get("bvn"),
            nin=payload.get("nin"),
            first_name=payload.get("first_name"),
            last_name=payload.get("last_name"),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"QoreID call failed: {e}")

    if not result["verified"]:
        return {"status": "rejected", "reason": "identity_not_verified"}

    bvn = payload.get("bvn")
    if bvn:
        existing = db.scalar(select(Identity).where(Identity.bvn == bvn))
        if existing is not None:
            # Same BVN re-verified (e.g. a resubmitted form) — treat as
            # idempotent rather than inserting a duplicate graph node.
            return {
                "status": "verified",
                "identity_id": str(existing.id),
                "qoreid_raw": result["raw_response"],
            }

    node = upsert_identity_node(
        name=result["matched_name"],
        device_id=payload.get("device_id"),
        address=payload.get("address"),
        phone=result["matched_phone"],
        employer=payload.get("employer"),
        referral_source=payload.get("referral_source"),
        verified_at="now",
    )

    identity_row = Identity(
        id=uuid.UUID(node.id),
        name=node.name,
        bvn=payload.get("bvn"),
        device_id=node.device_id,
        address=node.address,
        phone=node.phone,
        employer=node.employer,
        referral_source=node.referral_source,
        verified_at=node.verified_at,
    )
    db.add(identity_row)

    for edge in get_edges_for_identity(node.id):
        db.add(
            Relationship(
                identity_a_id=uuid.UUID(edge["source"]),
                identity_b_id=uuid.UUID(edge["target"]),
                attribute_type=edge["attribute_type"],
                attribute_value=edge["attribute_value"],
            )
        )
    db.commit()

    return {
        "status": "verified",
        "identity_id": node.id,
        "qoreid_raw": result["raw_response"],  # show this on screen live
    }
