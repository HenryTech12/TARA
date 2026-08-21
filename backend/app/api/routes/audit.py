from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import AuditLog

router = APIRouter()


@router.get("/audit-log")
def list_audit_log(
    limit: int = Query(default=50, ge=1, le=200),
    action: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    rows = db.scalars(stmt).all()
    return [
        {
            "id": str(row.id),
            "timestamp": row.timestamp.isoformat(),
            "action": row.action,
            "user": row.user_id,
            "target": str(row.alert_id) if row.alert_id else (row.entity_ids[0] if row.entity_ids else "system"),
            "targetType": "alert" if row.alert_id else ("entity" if row.entity_ids else "system"),
            "hash": row.payload_hash[:16] + "...",
            "verified": True,
            "decision": row.decision.value if row.decision else None,
        }
        for row in rows
    ]
