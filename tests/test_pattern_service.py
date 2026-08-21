from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.append(str(BACKEND_DIR))

from app.services.pattern_service import (  # noqa: E402
    build_explanation,
    compute_trust_score,
    detect_coordinated_onboarding,
    detect_identity_fragmentation,
    detect_shared_attribute_clusters,
)


def _node(identity_id: str, name: str, **overrides) -> dict:
    base = {
        "id": identity_id,
        "name": name,
        "device_id": None,
        "address": None,
        "phone": None,
        "employer": None,
        "referral_source": None,
        "verified_at": datetime(2026, 8, 21, 6, 0, 0, tzinfo=timezone.utc),
    }
    base.update(overrides)
    return base


def test_shared_attribute_cluster_fires_at_min_size() -> None:
    graph = {
        f"id-{i}": _node(f"id-{i}", f"Person {i}", device_id="DEV-RING", address="14 Allen Ave, Ikeja")
        for i in range(4)
    }
    findings = detect_shared_attribute_clusters(graph, min_cluster_size=4)
    assert len(findings) == 2  # device_id cluster + address cluster
    pattern_types = {f["pattern_type"] for f in findings}
    assert pattern_types == {"shared_attribute_cluster"}
    ring_finding = next(f for f in findings if f["shared_attribute"] == "device_id")
    assert set(ring_finding["identity_ids"]) == set(graph.keys())


def test_shared_attribute_cluster_does_not_fire_below_min_size() -> None:
    graph = {
        "id-0": _node("id-0", "Person A", device_id="DEV-SOLO"),
        "id-1": _node("id-1", "Person B", device_id="DEV-SOLO"),
        "id-2": _node("id-2", "Person C", device_id="DEV-OTHER"),
    }
    findings = detect_shared_attribute_clusters(graph, min_cluster_size=4)
    assert findings == []


def test_identity_fragmentation_fires_on_similar_name_and_shared_context() -> None:
    graph = {
        "id-0": _node("id-0", "Adaeze Nwankwo", address="14 Allen Ave, Ikeja"),
        "id-1": _node("id-1", "Adaeze N. Nwankwo", address="14 Allen Ave, Ikeja"),
    }
    findings = detect_identity_fragmentation(graph, similarity_threshold=85)
    assert len(findings) == 1
    assert findings[0]["pattern_type"] == "identity_fragmentation"
    assert set(findings[0]["identity_ids"]) == {"id-0", "id-1"}


def test_identity_fragmentation_does_not_fire_without_shared_context() -> None:
    graph = {
        "id-0": _node("id-0", "Adaeze Nwankwo", address="14 Allen Ave, Ikeja"),
        "id-1": _node("id-1", "Adaeze N. Nwankwo", address="9 Bode Thomas St, Surulere"),
    }
    findings = detect_identity_fragmentation(graph, similarity_threshold=85)
    assert findings == []


def test_coordinated_onboarding_fires_within_window() -> None:
    base_time = datetime(2026, 8, 21, 6, 0, 0, tzinfo=timezone.utc)
    graph = {
        f"id-{i}": _node(
            f"id-{i}",
            f"Person {i}",
            device_id="DEV-RING",
            verified_at=base_time + timedelta(hours=i),
        )
        for i in range(4)
    }
    findings = detect_coordinated_onboarding(graph, window_hours=48, min_group_size=4)
    assert len(findings) == 1
    assert findings[0]["pattern_type"] == "coordinated_onboarding"
    assert set(findings[0]["identity_ids"]) == set(graph.keys())


def test_coordinated_onboarding_does_not_fire_outside_window() -> None:
    base_time = datetime(2026, 8, 21, 6, 0, 0, tzinfo=timezone.utc)
    graph = {
        f"id-{i}": _node(
            f"id-{i}",
            f"Person {i}",
            device_id="DEV-SLOW",
            verified_at=base_time + timedelta(hours=i * 20),
        )
        for i in range(4)
    }
    findings = detect_coordinated_onboarding(graph, window_hours=48, min_group_size=4)
    assert findings == []


def test_compute_trust_score_approves_uninvolved_identity() -> None:
    result = compute_trust_score("id-clean", findings=[], graph={})
    assert result["verdict"] == "APPROVE"
    assert result["evidence"] == []


def test_compute_trust_score_never_returns_hard_reject() -> None:
    findings = [
        {"identity_ids": ["id-0"], "evidence_summary": "shared device"},
        {"identity_ids": ["id-0"], "evidence_summary": "shared address"},
        {"identity_ids": ["id-0"], "evidence_summary": "coordinated onboarding"},
    ]
    result = compute_trust_score("id-0", findings, graph={})
    assert result["verdict"] == "REJECT_REVIEW"
    assert result["verdict"] != "REJECT"


def test_build_explanation_lists_evidence() -> None:
    assert build_explanation([]) == "No relationship signals found. This identity appears independent."
    text = build_explanation(["signal one", "signal two"])
    assert "signal one" in text and "signal two" in text
