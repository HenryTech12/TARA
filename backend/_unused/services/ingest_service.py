import json
import uuid
from datetime import timezone

from sqlalchemy.orm import Session

from app.core.redis_client import redis_client
from app.models import IngestJob, JobStatus
from app.schemas.transactions import IngestAcceptedResponse, TransactionIngestBatchRequest, TransactionIngestItem


REDIS_INGEST_TTL_SECONDS = 24 * 60 * 60
REDIS_INGEST_QUEUE_KEY = "ingest:jobs:queue"


def _normalize_payload(payload: TransactionIngestItem | TransactionIngestBatchRequest) -> list[TransactionIngestItem]:
    if isinstance(payload, TransactionIngestBatchRequest):
        return payload.transactions
    return [payload]


def _serialize_record(record: TransactionIngestItem) -> dict:
    occurred_at = record.occurred_at.astimezone(timezone.utc).replace(microsecond=0).isoformat()
    reference = record.reference or f"INGEST-{uuid.uuid4().hex[:20].upper()}"
    return {
        "source_entity_id": str(record.source_entity_id),
        "destination_entity_id": str(record.destination_entity_id),
        "amount": f"{record.amount:.2f}",
        "currency": record.currency,
        "occurred_at": occurred_at,
        "reference": reference,
        "channel": record.channel,
        "metadata_json": record.metadata_json,
    }


def create_ingest_job(
    db: Session,
    payload: TransactionIngestItem | TransactionIngestBatchRequest,
) -> IngestAcceptedResponse:
    records = _normalize_payload(payload)

    job = IngestJob(
        status=JobStatus.queued,
        total_records=len(records),
        processed_records=0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    redis_key = f"ingest:job:{job.id}:payload"
    redis_payload = {
        "job_id": str(job.id),
        "status": JobStatus.queued.value,
        "records": [_serialize_record(record) for record in records],
    }
    redis_client.setex(redis_key, REDIS_INGEST_TTL_SECONDS, json.dumps(redis_payload))
    redis_client.rpush(REDIS_INGEST_QUEUE_KEY, str(job.id))

    return IngestAcceptedResponse(
        job_id=job.id,
        status=job.status.value,
        total_records=job.total_records,
        accepted_at=job.created_at,
    )
