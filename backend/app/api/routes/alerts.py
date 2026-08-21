from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Alert, AlertStatus
from app.schemas.alerts import AlertDetailResponse, AlertListItemResponse, AlertsListResponse


router = APIRouter()


@router.get("/alerts", response_model=AlertsListResponse)
def list_alerts(
    limit: int = Query(default=50, ge=1, le=500),
    status_filter: AlertStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> AlertsListResponse:
    count_query = select(func.count()).select_from(Alert)
    list_query = select(Alert)
    if status_filter is not None:
        count_query = count_query.where(Alert.status == status_filter)
        list_query = list_query.where(Alert.status == status_filter)

    total = db.scalar(count_query) or 0
    rows = db.scalars(list_query.order_by(desc(Alert.created_at)).limit(limit)).all()
    items = [
        AlertListItemResponse(
            id=row.id,
            pattern_type=row.pattern_type.value,
            risk_score=row.risk_score,
            anomaly_score=float(row.anomaly_score),
            anomaly_confidence=float(row.anomaly_confidence),
            anomaly_flag=bool(row.anomaly_flag),
            reason=row.reason,
            status=row.status.value,
            entity_ids=[str(x) for x in row.entity_ids],
            transaction_ids=[str(x) for x in row.transaction_ids],
            created_at=row.created_at,
        )
        for row in rows
    ]
    return AlertsListResponse(alerts=items, total=total)


@router.get("/alerts/{alert_id}", response_model=AlertDetailResponse)
def get_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
) -> AlertDetailResponse:
    row = db.get(Alert, alert_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    return AlertDetailResponse(
        id=row.id,
        pattern_type=row.pattern_type.value,
        risk_score=row.risk_score,
        anomaly_score=float(row.anomaly_score),
        anomaly_confidence=float(row.anomaly_confidence),
        anomaly_flag=bool(row.anomaly_flag),
        reason=row.reason,
        status=row.status.value,
        entity_ids=[str(x) for x in row.entity_ids],
        transaction_ids=[str(x) for x in row.transaction_ids],
        subgraph_json=row.subgraph_json,
        created_at=row.created_at,
    )
