from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TransactionIngestItem(BaseModel):
    source_entity_id: UUID
    destination_entity_id: UUID
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    currency: str = Field(default="NGN", min_length=3, max_length=8)
    occurred_at: datetime
    reference: str | None = Field(default=None, min_length=4, max_length=128)
    channel: str | None = Field(default=None, max_length=64)
    metadata_json: dict = Field(default_factory=dict)

    model_config = ConfigDict(extra="forbid")

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("destination_entity_id")
    @classmethod
    def ensure_non_self_transfer(cls, destination: UUID, info) -> UUID:
        source = info.data.get("source_entity_id")
        if source is not None and destination == source:
            raise ValueError("source_entity_id and destination_entity_id cannot be the same")
        return destination


class TransactionIngestBatchRequest(BaseModel):
    transactions: list[TransactionIngestItem] = Field(min_length=1)

    model_config = ConfigDict(extra="forbid")


class IngestAcceptedResponse(BaseModel):
    job_id: UUID
    status: str
    total_records: int
    accepted_at: datetime


class IngestJobStatusResponse(BaseModel):
    job_id: UUID
    status: str
    total_records: int
    processed_records: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class TransactionResponse(BaseModel):
    id: UUID
    fromEntity: UUID
    toEntity: UUID
    amount: Decimal
    date: datetime
    channel: str | None = None


class TransactionRecentResponse(BaseModel):
    id: UUID
    from_entity_id: UUID
    to_entity_id: UUID
    from_entity_name: str | None = None
    to_entity_name: str | None = None
    amount: Decimal
    channel: str | None = None
    date: datetime
