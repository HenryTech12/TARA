from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from redis.exceptions import RedisError
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Alert, Entity, IngestJob, Transaction
from app.schemas.transactions import (
    IngestAcceptedResponse,
    IngestJobStatusResponse,
    TransactionIngestBatchRequest,
    TransactionIngestItem,
    TransactionResponse,
    TransactionRecentResponse,
)
from app.services.ingest_service import create_ingest_job


router = APIRouter()


@router.post(
    "/transactions/ingest",
    response_model=IngestAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def ingest_transactions(
    payload: TransactionIngestItem | TransactionIngestBatchRequest,
    db: Session = Depends(get_db),
) -> IngestAcceptedResponse:
    try:
        return create_ingest_job(db=db, payload=payload)
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingest queue is currently unavailable",
        ) from exc


@router.get("/jobs/{job_id}", response_model=IngestJobStatusResponse)
def get_job_status(
    job_id: UUID,
    db: Session = Depends(get_db),
) -> IngestJobStatusResponse:
    job = db.get(IngestJob, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return IngestJobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        total_records=job.total_records,
        processed_records=job.processed_records,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.get("/transactions/recent", response_model=list[TransactionRecentResponse])
def list_recent_transactions(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[TransactionRecentResponse]:
    rows = db.scalars(
        select(Transaction)
        .where(Transaction.channel.notin_(["enforcement", "demo_reset"]))
        .order_by(Transaction.occurred_at.desc())
        .limit(limit)
    ).all()

    entity_ids = {r.source_entity_id for r in rows} | {r.destination_entity_id for r in rows}
    entities = {
        e.id: e
        for e in db.scalars(select(Entity).where(Entity.id.in_(entity_ids))).all()
    }

    return [
        TransactionRecentResponse(
            id=row.id,
            from_entity_id=row.source_entity_id,
            to_entity_id=row.destination_entity_id,
            from_entity_name=entities[row.source_entity_id].full_name if row.source_entity_id in entities else None,
            to_entity_name=entities[row.destination_entity_id].full_name if row.destination_entity_id in entities else None,
            amount=row.amount,
            channel=row.channel,
            date=row.occurred_at,
        )
        for row in rows
    ]


@router.get("/transactions", response_model=list[TransactionResponse])
def list_transactions(
    alertId: UUID | None = None,
    entityId: UUID | None = None,
    db: Session = Depends(get_db),
) -> list[TransactionResponse]:
    if alertId is not None:
        alert = db.get(Alert, alertId)
        if alert is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        tx_ids = [UUID(str(x)) for x in (alert.transaction_ids or [])]
        if not tx_ids:
            return []
        rows = db.scalars(select(Transaction).where(Transaction.id.in_(tx_ids))).all()
    elif entityId is not None:
        rows = db.scalars(
            select(Transaction).where(
                or_(
                    Transaction.source_entity_id == entityId,
                    Transaction.destination_entity_id == entityId,
                )
            )
        ).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide alertId or entityId query parameter",
        )

    return [
        TransactionResponse(
            id=row.id,
            fromEntity=row.source_entity_id,
            toEntity=row.destination_entity_id,
            amount=row.amount,
            date=row.occurred_at,
            channel=row.channel,
        )
        for row in rows
    ]
