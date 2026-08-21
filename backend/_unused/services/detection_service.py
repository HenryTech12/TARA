from __future__ import annotations

import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from decimal import Decimal

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.core.redis_client import redis_client
from app.models import Alert, AlertStatus, Entity, PatternType, Transaction
from app.models.enums import DecisionStatus
from app.services.anomaly_service import score_transaction
from app.services.audit_service import write_audit_event


UTC = timezone.utc


@dataclass
class DetectionContext:
    now: datetime
    transactions: list[Transaction]
    entities: dict[uuid.UUID, Entity]
    sender_degree: dict[uuid.UUID, int]
    receiver_fan_in: dict[uuid.UUID, int]


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _load_context(db: Session) -> DetectionContext:
    tx_rows = db.scalars(select(Transaction).order_by(Transaction.occurred_at.asc())).all()
    entity_rows = db.scalars(select(Entity)).all()
    entity_map = {row.id: row for row in entity_rows}
    sender_degree: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    receiver_fan_in: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    for row in tx_rows:
        sender_degree[row.source_entity_id].add(row.destination_entity_id)
        receiver_fan_in[row.destination_entity_id].add(row.source_entity_id)
    return DetectionContext(
        now=datetime.now(UTC),
        transactions=tx_rows,
        entities=entity_map,
        sender_degree={key: len(value) for key, value in sender_degree.items()},
        receiver_fan_in={key: len(value) for key, value in receiver_fan_in.items()},
    )


def _anomaly_summary_for_transactions(
    transactions: list[Transaction],
    sender_degree: dict[uuid.UUID, int],
    receiver_fan_in: dict[uuid.UUID, int],
    model_dir: Path | None = None,
) -> dict[str, float | bool]:
    if not transactions:
        return {
            "anomaly_score": 0.0,
            "anomaly_confidence": 0.0,
            "anomaly_flag": False,
        }

    scores: list[float] = []
    confidences: list[float] = []
    flags: list[bool] = []

    for tx in transactions:
        result = score_transaction(
            {
                "amount_ngn": float(tx.amount),
                "occurred_at": tx.occurred_at,
            },
            sender_degree=sender_degree.get(tx.source_entity_id, 0),
            receiver_fan_in=receiver_fan_in.get(tx.destination_entity_id, 0),
            model_dir=model_dir,
        )
        scores.append(float(result["anomaly_score"]))
        confidences.append(float(result["confidence"]))
        flags.append(bool(result["is_anomaly"]))

    return {
        "anomaly_score": min(scores),
        "anomaly_confidence": max(confidences),
        "anomaly_flag": any(flags),
    }


def _existing_fingerprints(db: Session, pattern_type: PatternType) -> set[str]:
    query: Select[tuple[Alert]] = select(Alert).where(
        Alert.pattern_type == pattern_type,
        Alert.status == AlertStatus.open,
    )
    rows = db.scalars(query).all()
    fingerprints: set[str] = set()
    for row in rows:
        value = str(row.subgraph_json.get("fingerprint", ""))
        if value:
            fingerprints.add(value)
    return fingerprints


def _create_alert(
    db: Session,
    pattern_type: PatternType,
    risk_score: Decimal,
    reason: str,
    entity_ids: list[uuid.UUID],
    transaction_ids: list[uuid.UUID],
    subgraph_json: dict,
    anomaly_score: float,
    anomaly_confidence: float,
    anomaly_flag: bool,
) -> Alert:
    alert = Alert(
        pattern_type=pattern_type,
        risk_score=risk_score,
        anomaly_score=anomaly_score,
        anomaly_confidence=anomaly_confidence,
        anomaly_flag=anomaly_flag,
        reason=reason,
        entity_ids=[str(x) for x in entity_ids],
        transaction_ids=[str(x) for x in transaction_ids],
        subgraph_json=subgraph_json,
        status=AlertStatus.open,
    )
    db.add(alert)
    db.flush()

    write_audit_event(
        db=db,
        action="alert_created",
        entity_ids=[str(x) for x in entity_ids],
        alert_id=alert.id,
        model_version="heuristic_v1",
        decision=DecisionStatus.pending,
        payload_json={
            "alert_id": str(alert.id),
            "pattern_type": pattern_type.value,
            "risk_score": str(risk_score),
            "anomaly_score": str(anomaly_score),
            "anomaly_confidence": str(anomaly_confidence),
            "anomaly_flag": anomaly_flag,
            "reason": reason,
            "entity_ids": [str(x) for x in entity_ids],
            "transaction_ids": [str(x) for x in transaction_ids],
            "subgraph_json": subgraph_json,
        },
    )
    return alert


def _risk_score(base: Decimal, bump: Decimal) -> Decimal:
    value = base + bump
    if value > Decimal("0.9900"):
        value = Decimal("0.9900")
    return value.quantize(Decimal("0.0001"))


def _detect_pos_cash_out_ring(db: Session, ctx: DetectionContext) -> int:
    cutoff = ctx.now - timedelta(hours=72)
    recent = [tx for tx in ctx.transactions if _ensure_utc(tx.occurred_at) >= cutoff]

    by_beneficiary: dict[uuid.UUID, list[Transaction]] = defaultdict(list)
    for tx in recent:
        by_beneficiary[tx.destination_entity_id].append(tx)

    existing = _existing_fingerprints(db, PatternType.pos_cash_out_ring)
    created = 0

    for beneficiary_id, rows in by_beneficiary.items():
        source_ids = sorted({row.source_entity_id for row in rows})
        total_amount = sum(Decimal(row.amount) for row in rows)
        if len(source_ids) < 5 or total_amount <= Decimal("500000"):
            continue

        fingerprint = f"pos:{beneficiary_id}"
        if fingerprint in existing:
            continue

        bump = Decimal(min(0.20, (len(source_ids) - 5) * 0.02)) + Decimal(
            min(0.20, float((total_amount - Decimal("500000")) / Decimal("2500000")))
        )
        score = _risk_score(Decimal("0.7000"), bump)

        reason = (
            f"POS cash-out ring detected: {len(source_ids)} sources sent NGN {total_amount:.2f} "
            f"to beneficiary {beneficiary_id} within 72 hours"
        )
        tx_ids = [row.id for row in rows]
        entity_ids = [*source_ids, beneficiary_id]
        anomaly_summary = _anomaly_summary_for_transactions(rows, ctx.sender_degree, ctx.receiver_fan_in)
        _create_alert(
            db=db,
            pattern_type=PatternType.pos_cash_out_ring,
            risk_score=score,
            reason=reason,
            entity_ids=entity_ids,
            transaction_ids=tx_ids,
            subgraph_json={
                "fingerprint": fingerprint,
                "beneficiary_id": str(beneficiary_id),
                "source_count": len(source_ids),
                "total_volume": f"{total_amount:.2f}",
                "anomaly_score": anomaly_summary["anomaly_score"],
                "anomaly_confidence": anomaly_summary["anomaly_confidence"],
                "anomaly_flag": anomaly_summary["anomaly_flag"],
            },
            anomaly_score=float(anomaly_summary["anomaly_score"]),
            anomaly_confidence=float(anomaly_summary["anomaly_confidence"]),
            anomaly_flag=bool(anomaly_summary["anomaly_flag"]),
        )
        created += 1

    return created


def _extract_directors(entity: Entity) -> tuple[str, ...]:
    value = entity.metadata_json.get("directors", [])
    if not isinstance(value, list):
        return ()
    return tuple(sorted(str(item) for item in value if item))


def _detect_shell_director_web(db: Session, ctx: DetectionContext) -> int:
    businesses = [x for x in ctx.entities.values() if x.entity_type.lower() == "business"]
    if len(businesses) < 3:
        return 0

    by_address: dict[str, list[Entity]] = defaultdict(list)
    by_directors: dict[tuple[str, ...], list[Entity]] = defaultdict(list)
    for business in businesses:
        if business.address:
            by_address[business.address].append(business)
        directors = _extract_directors(business)
        if len(directors) >= 2:
            by_directors[directors].append(business)

    groups: list[tuple[str, list[Entity]]] = []
    for address, rows in by_address.items():
        if len(rows) >= 3:
            groups.append((f"address:{address}", rows))
    for directors, rows in by_directors.items():
        if len(rows) >= 3:
            groups.append((f"directors:{'|'.join(directors)}", rows))

    if not groups:
        return 0

    existing = _existing_fingerprints(db, PatternType.shell_director_web)
    created = 0

    for group_key, rows in groups:
        business_ids = {row.id for row in rows}
        inter_business = [
            tx
            for tx in ctx.transactions
            if tx.source_entity_id in business_ids and tx.destination_entity_id in business_ids
        ]
        if len(inter_business) < 1:
            continue

        distinct_director_count = max((len(_extract_directors(row)) for row in rows), default=0)
        if distinct_director_count < 2 and not group_key.startswith("address:"):
            continue

        fingerprint = f"shell:{group_key}:{'|'.join(sorted(str(x.id) for x in rows))}"
        if fingerprint in existing:
            continue

        score = _risk_score(Decimal("0.7600"), Decimal(min(0.18, (len(rows) - 3) * 0.04)))
        reason = (
            f"Shell director web detected: {len(rows)} businesses linked by shared directors/address "
            f"with {len(inter_business)} inter-business transactions"
        )
        anomaly_summary = _anomaly_summary_for_transactions(inter_business, ctx.sender_degree, ctx.receiver_fan_in)

        _create_alert(
            db=db,
            pattern_type=PatternType.shell_director_web,
            risk_score=score,
            reason=reason,
            entity_ids=[row.id for row in rows],
            transaction_ids=[tx.id for tx in inter_business],
            subgraph_json={
                "fingerprint": fingerprint,
                "group_key": group_key,
                "business_count": len(rows),
                "inter_business_tx_count": len(inter_business),
                "anomaly_score": anomaly_summary["anomaly_score"],
                "anomaly_confidence": anomaly_summary["anomaly_confidence"],
                "anomaly_flag": anomaly_summary["anomaly_flag"],
            },
            anomaly_score=float(anomaly_summary["anomaly_score"]),
            anomaly_confidence=float(anomaly_summary["anomaly_confidence"]),
            anomaly_flag=bool(anomaly_summary["anomaly_flag"]),
        )
        created += 1

    return created



def _detect_layered_transfer_chain(db: Session, ctx: DetectionContext) -> int:
    """
    Detects linear hop chains: A → B → C → D → ... within a 48-hour window.
    Each intermediate passes funds along a single path (not fan-in).
    Minimum 3 hops (4 entities) to fire.
    """
    existing = _existing_fingerprints(db, PatternType.layered_transfer_chain)
    created = 0

    end_time = ctx.now
    window_start = end_time - timedelta(hours=48)
    windowed = [tx for tx in ctx.transactions if window_start <= _ensure_utc(tx.occurred_at) <= end_time]

    outbound: dict[uuid.UUID, list[Transaction]] = defaultdict(list)
    all_receivers: set[uuid.UUID] = set()
    for tx in windowed:
        outbound[tx.source_entity_id].append(tx)
        all_receivers.add(tx.destination_entity_id)

    # Chain origins: entities that send within the window but never receive
    origins = set(outbound.keys()) - all_receivers

    for origin_id in origins:
        chain_entities: list[uuid.UUID] = [origin_id]
        chain_txs: list[Transaction] = []
        current = origin_id
        visited: set[uuid.UUID] = {origin_id}

        # Walk forward — linear chain means exactly 1 outbound per hop
        while True:
            next_txs = outbound.get(current, [])
            if len(next_txs) != 1:
                break
            next_tx = next_txs[0]
            next_entity = next_tx.destination_entity_id
            if next_entity in visited:
                break
            chain_entities.append(next_entity)
            chain_txs.append(next_tx)
            visited.add(next_entity)
            current = next_entity

        if len(chain_txs) < 3:
            continue

        destination_id = chain_entities[-1]
        fingerprint = f"layered:{origin_id}:{destination_id}"
        if fingerprint in existing:
            continue

        score = _risk_score(Decimal("0.8400"), Decimal(min(0.14, (len(chain_txs) - 3) * 0.03)))
        reason = (
            f"Layered transfer chain detected: funds routed through {len(chain_txs)} hops "
            f"from {origin_id} to {destination_id} within 48 hours"
        )
        anomaly_summary = _anomaly_summary_for_transactions(chain_txs, ctx.sender_degree, ctx.receiver_fan_in)
        _create_alert(
            db=db,
            pattern_type=PatternType.layered_transfer_chain,
            risk_score=score,
            reason=reason,
            entity_ids=chain_entities,
            transaction_ids=[tx.id for tx in chain_txs],
            subgraph_json={
                "fingerprint": fingerprint,
                "origin_id": str(origin_id),
                "destination_id": str(destination_id),
                "chain_length": len(chain_txs),
                "anomaly_score": anomaly_summary["anomaly_score"],
                "anomaly_confidence": anomaly_summary["anomaly_confidence"],
                "anomaly_flag": anomaly_summary["anomaly_flag"],
            },
            anomaly_score=float(anomaly_summary["anomaly_score"]),
            anomaly_confidence=float(anomaly_summary["anomaly_confidence"]),
            anomaly_flag=bool(anomaly_summary["anomaly_flag"]),
        )
        created += 1

    return created


def run_heuristic_detection(db: Session) -> dict[str, int]:
    lock = redis_client.lock("detection:lock", timeout=60)
    with lock:
        ctx = _load_context(db)
        created_pos = _detect_pos_cash_out_ring(db, ctx)
        created_shell = _detect_shell_director_web(db, ctx)
        created_layered = _detect_layered_transfer_chain(db, ctx)
        return {
            "pos_cash_out_ring": created_pos,
            "shell_director_web": created_shell,
            "layered_transfer_chain": created_layered,
            "total": created_pos + created_shell + created_layered,
        }
