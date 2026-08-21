from fastapi import APIRouter, HTTPException

from app.services.graph_service import get_full_graph
from app.services.pattern_service import (
    build_explanation,
    compute_trust_score,
    detect_coordinated_onboarding,
    detect_identity_fragmentation,
    detect_shared_attribute_clusters,
)

router = APIRouter(prefix="/verdict", tags=["verdict"])


@router.get("/{identity_id}")
async def get_verdict(identity_id: str) -> dict:
    """Runs all three detection patterns against the current identity graph
    and returns a trust score, three-state verdict, and plain-English
    explanation for one identity.
    """
    graph = get_full_graph()
    if identity_id not in graph:
        raise HTTPException(status_code=404, detail="Identity not found")

    findings = (
        detect_shared_attribute_clusters(graph)
        + detect_identity_fragmentation(graph)
        + detect_coordinated_onboarding(graph)
    )

    result = compute_trust_score(identity_id, findings, graph)

    return {
        "identity_id": identity_id,
        "trust_score": result["score"],
        "verdict": result["verdict"],
        "evidence": result["evidence"],
        "explanation": build_explanation(result["evidence"]),
    }
