import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, event
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import AlertStatus, DecisionStatus, JobStatus, PatternType


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bvn: Mapped[str | None] = mapped_column(String(32), nullable=True, unique=True)
    nin: Mapped[str | None] = mapped_column(String(32), nullable=True, unique=True)
    business_reg_no: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True)
    destination_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="NGN")
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    reference: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    channel: Mapped[str | None] = mapped_column(String(64), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)


class IngestJob(Base):
    __tablename__ = "ingest_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus, name="job_status"), nullable=False, default=JobStatus.queued)
    total_records: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    processed_records: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pattern_type: Mapped[PatternType] = mapped_column(
        Enum(PatternType, name="pattern_type"), nullable=False, index=True
    )
    risk_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    anomaly_score: Mapped[float] = mapped_column(Numeric(8, 5), nullable=False, default=0.0)
    anomaly_confidence: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False, default=0.0)
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    entity_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    transaction_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    subgraph_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status"), nullable=False, default=AlertStatus.open
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)


class STRDraft(Base):
    __tablename__ = "str_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("alerts.id"), nullable=False, index=True)
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="groq")
    model_name: Mapped[str] = mapped_column(String(128), nullable=False, default="llama-3.3-70b-versatile")
    model_version: Mapped[str] = mapped_column(String(64), nullable=False, default="heuristic_v1")
    content_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    decision: Mapped[DecisionStatus] = mapped_column(
        Enum(DecisionStatus, name="decision_status"), nullable=False, default=DecisionStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, default="system")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    action: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    entity_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    alert_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("alerts.id"), nullable=True, index=True)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    decision: Mapped[DecisionStatus] = mapped_column(
        Enum(DecisionStatus, name="audit_decision_status"), nullable=False, default=DecisionStatus.pending
    )
    payload_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)


def _raise_audit_immutable(*args, **kwargs) -> None:
    raise ValueError("audit_log is immutable and cannot be updated or deleted")


event.listen(AuditLog, "before_update", _raise_audit_immutable)
event.listen(AuditLog, "before_delete", _raise_audit_immutable)
