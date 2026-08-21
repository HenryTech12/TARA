from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.responsible_ai import ResponsibleAIMetricsResponse
from app.services.responsible_ai_service import get_responsible_ai_metrics


router = APIRouter()


@router.get("/responsible-ai/metrics", response_model=ResponsibleAIMetricsResponse)
def get_metrics(db: Session = Depends(get_db)) -> ResponsibleAIMetricsResponse:
    metrics = get_responsible_ai_metrics(db)
    return ResponsibleAIMetricsResponse(**metrics)
