from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

from rapidfuzz import fuzz
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Entity


SHELL_KEYWORDS = {
    "holdings",
    "ventures",
    "enterprise",
    "enterprises",
    "trading",
    "global",
    "international",
    "solutions",
    "services",
    "capital",
    "investments",
    "resources",
}


@dataclass(frozen=True)
class NameMatch:
    entity_id: str
    score: int


def _normalize_name(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", name.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _detect_shell_keywords(name: str) -> list[str]:
    normalized = _normalize_name(name)
    flags: list[str] = []
    for keyword in SHELL_KEYWORDS:
        if re.search(rf"\b{re.escape(keyword)}\b", normalized):
            flags.append(f"shell_keyword:{keyword}")
    return flags


def _compute_name_flags(full_name: str | None, entity_type: str) -> list[str]:
    if not full_name:
        return ["missing_name"]

    flags = _detect_shell_keywords(full_name)
    if entity_type.lower() == "business" and not flags:
        for keyword in ("holdings", "ventures", "trading"):
            if keyword in _normalize_name(full_name):
                flags.append(f"shell_keyword:{keyword}")
                break
    return flags


def _find_similar_entities(entities: list[Entity], threshold: int = 92) -> dict[str, list[NameMatch]]:
    normalized = []
    for entity in entities:
        if entity.full_name:
            normalized.append((entity, _normalize_name(entity.full_name)))

    matches: dict[str, list[NameMatch]] = {str(entity.id): [] for entity, _ in normalized}
    for i, (left_entity, left_name) in enumerate(normalized):
        for right_entity, right_name in normalized[i + 1 :]:
            score = int(fuzz.token_set_ratio(left_name, right_name))
            if score >= threshold:
                left_id = str(left_entity.id)
                right_id = str(right_entity.id)
                matches[left_id].append(NameMatch(entity_id=right_id, score=score))
                matches[right_id].append(NameMatch(entity_id=left_id, score=score))
    return matches


def apply_name_verification(db: Session) -> int:
    entities = db.scalars(select(Entity)).all()
    if not entities:
        return 0

    similarity_matches = _find_similar_entities(entities)
    updated = 0

    for entity in entities:
        flags = _compute_name_flags(entity.full_name, entity.entity_type)
        if similarity_matches.get(str(entity.id)):
            flags.append("near_duplicate_name")

        new_metadata = dict(entity.metadata_json or {})
        new_metadata["entity_name_risk_flags"] = sorted(set(flags))
        new_metadata["entity_name_similarities"] = [
            {"entity_id": match.entity_id, "score": match.score}
            for match in similarity_matches.get(str(entity.id), [])
        ]

        if new_metadata != entity.metadata_json:
            entity.metadata_json = new_metadata
            updated += 1

    if updated:
        db.commit()
    return updated
