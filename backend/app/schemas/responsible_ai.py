from pydantic import BaseModel, Field


class ResponsibleAIMetricsResponse(BaseModel):
    false_positive_rate: float = Field(ge=0.0, le=1.0)
    alerts_raised_total: int = Field(ge=0)
    alerts_reviewed_total: int = Field(ge=0)
    alerts_dismissed_total: int = Field(ge=0)
    model_contamination: float = Field(ge=0.0, le=1.0)
    model_feature_list: list[str]
    training_data_size: int = Field(ge=0)
