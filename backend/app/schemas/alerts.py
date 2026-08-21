from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AlertListItemResponse(BaseModel):
    id: UUID
    pattern_type: str
    risk_score: Decimal
    anomaly_score: float
    anomaly_confidence: float
    anomaly_flag: bool
    reason: str
    status: str
    entity_ids: list[str]
    transaction_ids: list[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertsListResponse(BaseModel):
    alerts: list[AlertListItemResponse]
    total: int = Field(ge=0)


class AlertDetailResponse(BaseModel):
    id: UUID
    pattern_type: str
    risk_score: Decimal
    anomaly_score: float
    anomaly_confidence: float
    anomaly_flag: bool
    reason: str
    status: str
    entity_ids: list[str]
    transaction_ids: list[str]
    subgraph_json: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
