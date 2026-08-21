from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class EntityNeighborResponse(BaseModel):
    entity_id: UUID
    entity_type: str
    full_name: str | None
    relationship: str
    transaction_count: int
    total_amount: Decimal
    last_transaction_at: datetime | None


class EntityLookupResponse(BaseModel):
    id: UUID
    entity_type: str
    full_name: str | None
    bvn: str | None
    nin: str | None
    business_reg_no: str | None
    address: str | None
    metadata_json: dict
    created_at: datetime
    neighbors: list[EntityNeighborResponse]


class EntityListItem(BaseModel):
    id: UUID
    entity_type: str
    full_name: str | None
    address: str | None
    created_at: datetime
    metadata_json: dict = {}


class EntityListResponse(BaseModel):
    items: list[EntityListItem]
    total: int


class EntityRiskResponse(BaseModel):
    entity_id: UUID
    risk_score: Decimal
    reason: str
    contributing_alert_ids: list[UUID]
    model_version: str
