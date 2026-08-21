from pydantic import BaseModel, Field


class AgentIntakeRequest(BaseModel):
    data: str = Field(min_length=1)
    format: str = Field(default='csv')
    sensitivity: str = Field(default='medium')
    reason_mode: str = Field(default='deterministic')
    generate_report: bool = Field(default=False)
    case_reference: str | None = None
    reporting_period: str | None = None
    source: str | None = None
    tenant: str | None = None


class AgentIntakeResponse(BaseModel):
    success: bool
    run_id: str | None = None
    source: str | None = None
    analysis_status: str | None = None
    str_draft_id: str | None = None
    analysis: dict | None = None
    report: dict | None = None
    error: dict | None = None
