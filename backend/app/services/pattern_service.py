from __future__ import annotations

from datetime import timedelta

from rapidfuzz import fuzz


def detect_shared_attribute_clusters(graph: dict, min_cluster_size: int = 4) -> list[dict]:
    """Groups identities by shared device_id, address, or employer.

    Flags any group at or above min_cluster_size as a shared-attribute
    cluster finding — the clearest signature of a coordinated identity ring.
    """
    clusters: dict[str, list[str]] = {}
    for identity_id, node in graph.items():
        for attr_key in ("device_id", "address", "employer"):
            attr_val = node.get(attr_key)
            if not attr_val:
                continue
            cluster_key = f"{attr_key}:{attr_val}"
            clusters.setdefault(cluster_key, []).append(identity_id)

    findings = []
    for cluster_key, members in clusters.items():
        if len(members) >= min_cluster_size:
            attr_type, attr_val = cluster_key.split(":", 1)
            findings.append(
                {
                    "pattern_type": "shared_attribute_cluster",
                    "shared_attribute": attr_type,
                    "value": attr_val,
                    "identity_ids": members,
                    "evidence_summary": (
                        f"{len(members)} verified identities share the same "
                        f"{attr_type.replace('_', ' ')}: {attr_val}"
                    ),
                }
            )
    return findings


def detect_identity_fragmentation(graph: dict, similarity_threshold: int = 85) -> list[dict]:
    """Flags identity pairs whose names are highly similar but registered as
    separate verified identities, and who also share address or phone-prefix
    context — the signature of one person operating multiple identities.

    Reuses the repo's existing RapidFuzz fuzzy-matching approach (see
    name_verification_service.py) adapted to identity records and the
    same_context check described in the PRD.
    """
    findings = []
    identities = list(graph.values())
    for i in range(len(identities)):
        for j in range(i + 1, len(identities)):
            a, b = identities[i], identities[j]
            score = fuzz.token_sort_ratio(a["name"], b["name"])
            if score >= similarity_threshold and a["id"] != b["id"]:
                same_context = (a.get("address") is not None and a.get("address") == b.get("address")) or (
                    (a.get("phone") or "")[:4] == (b.get("phone") or "")[:4] != ""
                )
                if same_context:
                    findings.append(
                        {
                            "pattern_type": "identity_fragmentation",
                            "identity_ids": [a["id"], b["id"]],
                            "similarity_score": score,
                            "evidence_summary": (
                                f"'{a['name']}' and '{b['name']}' are "
                                f"{score:.0f}% name-similar and share context — "
                                f"likely the same person under two verified identities"
                            ),
                        }
                    )
    return findings


def detect_coordinated_onboarding(
    graph: dict, window_hours: int = 48, min_group_size: int = 4
) -> list[dict]:
    """Groups identities verified within the same rolling time window that
    also share a device_id or referral_source — the classic mule-farm
    onboarding-velocity signature.
    """
    findings = []
    by_device: dict[str, list[dict]] = {}
    for node in graph.values():
        key = node.get("device_id") or node.get("referral_source")
        if not key:
            continue
        by_device.setdefault(key, []).append(node)

    for members in by_device.values():
        if len(members) < min_group_size:
            continue
        times = sorted(m["verified_at"] for m in members)
        earliest, latest = times[0], times[-1]
        if (latest - earliest) <= timedelta(hours=window_hours):
            findings.append(
                {
                    "pattern_type": "coordinated_onboarding",
                    "identity_ids": [m["id"] for m in members],
                    "window_hours": window_hours,
                    "evidence_summary": (
                        f"{len(members)} identities verified within "
                        f"{window_hours} hours, sharing device or referral source"
                    ),
                }
            )
    return findings


def compute_trust_score(identity_id: str, findings: list[dict], graph: dict) -> dict:
    """Computes a trust score and three-state verdict for one identity.

    Direct involvement in a flagged pattern sets the base score. The verdict
    gate never auto-rejects: high-confidence findings map to REJECT_REVIEW,
    not REJECT — a human always makes the final call.
    """
    direct_findings = [f for f in findings if identity_id in f["identity_ids"]]
    if not direct_findings:
        return {"score": 0.05, "verdict": "APPROVE", "evidence": []}

    base_score = min(0.95, 0.35 + 0.2 * len(direct_findings))

    if base_score >= 0.7:
        verdict = "REJECT_REVIEW"  # never auto-reject — always human review
    elif base_score >= 0.4:
        verdict = "REVIEW"
    else:
        verdict = "APPROVE"

    return {
        "score": round(base_score, 2),
        "verdict": verdict,
        "evidence": [f["evidence_summary"] for f in direct_findings],
    }


def build_explanation(evidence: list[str]) -> str:
    """Produces a plain-English explanation string from an evidence list."""
    if not evidence:
        return "No relationship signals found. This identity appears independent."
    return "Flagged because: " + " Also: ".join(evidence)
