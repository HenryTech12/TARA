from __future__ import annotations

import csv
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AuditLog
from app.models.enums import DecisionStatus
from app.services.anomaly_service import DEFAULT_CONTAMINATION, FEATURES

ROOT_DIR = Path(__file__).resolve().parents[3]
DATA_PATH = ROOT_DIR / "data" / "synthetic" / "transactions.csv"


def _count_training_rows(path: Path = DATA_PATH) -> int:
    if not path.exists():
        return 0
    with path.open("r", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        row_count = -1
        for row_count, _ in enumerate(reader):
            pass
    return max(row_count, 0)


def _compute_false_positive_rate(dismissed: int, reviewed: int) -> float:
    if reviewed == 0:
        return 0.0
    return round(dismissed / reviewed, 4)


def get_responsible_ai_metrics(db: Session) -> dict[str, object]:
    alerts_raised = db.scalar(select(func.count()).select_from(AuditLog).where(AuditLog.action == "alert_created"))
    reviewed = db.scalar(
        select(func.count()).select_from(AuditLog).where(AuditLog.action == "str_decision_updated")
    )
    dismissed = db.scalar(
        select(func.count())
        .select_from(AuditLog)
        .where(
            AuditLog.action == "str_decision_updated",
            AuditLog.decision == DecisionStatus.rejected,
        )
    )

    alerts_raised_total = int(alerts_raised or 0)
    alerts_reviewed_total = int(reviewed or 0)
    alerts_dismissed_total = int(dismissed or 0)

    return {
        "false_positive_rate": _compute_false_positive_rate(alerts_dismissed_total, alerts_reviewed_total),
        "alerts_raised_total": alerts_raised_total,
        "alerts_reviewed_total": alerts_reviewed_total,
        "alerts_dismissed_total": alerts_dismissed_total,
        "model_contamination": DEFAULT_CONTAMINATION,
        "model_feature_list": FEATURES,
        "training_data_size": _count_training_rows(),
    }
