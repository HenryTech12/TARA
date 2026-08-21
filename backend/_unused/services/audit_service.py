from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import AuditLog, DecisionStatus


def _sha256_payload(payload_json: dict) -> str:
    normalized = json.dumps(payload_json, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def write_audit_event(
    db: Session,
    action: str,
    entity_ids: list[str],
    alert_id: UUID | None,
    model_version: str,
    decision: DecisionStatus,
    payload_json: dict,
    user_id: str = "system",
) -> AuditLog:
    row = AuditLog(
        user_id=user_id,
        timestamp=datetime.now(timezone.utc),
        action=action,
        entity_ids=entity_ids,
        alert_id=alert_id,
        payload_hash=_sha256_payload(payload_json),
        model_version=model_version,
        decision=decision,
        payload_json=payload_json,
    )
    db.add(row)
    return row
