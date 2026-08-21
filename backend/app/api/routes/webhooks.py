import asyncio
import hmac
import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from uuid import uuid4
from typing import Dict, Any
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import DecisionStatus, Entity, Alert, Transaction
from app.schemas.transactions import TransactionIngestItem
from app.services.audit_service import write_audit_event
from app.services.ingest_service import create_ingest_job
from app.services.detection_service import run_heuristic_detection
from app.core.deps import get_session_factory

router = APIRouter()
logger = logging.getLogger(__name__)

MERCHANT_KEYS = [
    {"key": settings.squad_secret_key_1, "name": "Alpha Remit Ltd"},
    {"key": settings.squad_secret_key_2, "name": "Quick Cash Services"},
    {"key": settings.squad_secret_key_3, "name": "Shell Co Alpha Ltd"},
    {"key": settings.squad_secret_key_4, "name": "Musa Lawal"},
]

# Ordered chain for synthetic layering hops — each real payment advances one step
MERCHANT_CHAIN_ORDER = [
    "Alpha Remit Ltd",
    "Quick Cash Services",
    "Shell Co Alpha Ltd",
    "Musa Lawal",
]

# Stable entity IDs for real-payment chain hops — deliberately different from
# SIM-* simulate entities so a prior simulate run cannot block detection here
CHAIN_ENTITY_IDS = {
    "Alpha Remit Ltd":     "CHAIN-ALPHA-REMIT",
    "Quick Cash Services": "CHAIN-QUICK-CASH",
    "Shell Co Alpha Ltd":  "CHAIN-SHELL-CO",
    "Musa Lawal":          "CHAIN-MUSA-LAWAL",
}


async def verify_multi_merchant_signature(request: Request, x_squad_encrypted_body: str = Header(None)):
    """Validates HMAC-SHA512 by trying all registered merchant secret keys."""
    if not x_squad_encrypted_body:
        raise HTTPException(status_code=401, detail="Missing x-squad-encrypted-body header")

    body = await request.body()
    verified_merchant_name = None

    for merchant in MERCHANT_KEYS:
        if not merchant["key"]:
            continue
        secret = merchant["key"].encode("utf-8")
        computed_sig = hmac.new(secret, body, hashlib.sha512).hexdigest().upper()

        if hmac.compare_digest(computed_sig, x_squad_encrypted_body.upper()):
            verified_merchant_name = merchant["name"]
            break

    if not verified_merchant_name:
        logger.warning("Squad signature mismatch for all registered merchants")
        raise HTTPException(status_code=401, detail="Invalid Squad Signature")

    return body, verified_merchant_name


@router.post("/squad", status_code=200)
async def squad_webhook(verification_data: tuple = Depends(verify_multi_merchant_signature)):
    """Receives webhooks for all 4 merchant accounts at one URL."""
    body, merchant_name = verification_data
    try:
        payload_dict = json.loads(body)

        event_type = payload_dict.get("Event") or payload_dict.get("event")
        if event_type != "charge_successful":
            logger.info(f"Ignoring non-charge Squad event: {event_type}")
            return {"status": "ignored", "event": event_type}

        payload_dict["_verified_merchant"] = merchant_name
        asyncio.create_task(process_squad_webhook(payload_dict))
        return {"status": "success", "message": f"Webhook accepted for {merchant_name}"}
    except Exception as e:
        logger.error(f"Error queuing Squad webhook: {e}", exc_info=True)
        return {"status": "error", "message": "Payload processing failed — logged internally"}


@router.post("/demo/reset", status_code=200)
async def demo_reset():
    """Reset to a clean demo state with one alert of each pattern type visible.

    Removes all Squad/chain/simulate data, wipes alerts, then injects:
    - 1 POS cash-out ring  (RESET-POS-* entities, fresh timestamps)
    Shell director web fires from seeded business entities.
    Layered transfer chain is triggered live via the Simulate button.
    """
    from sqlalchemy import text
    from app.core.neo4j_client import neo4j_driver
    from app.core.redis_client import redis_client as _redis
    from app.services.detection_service import run_heuristic_detection

    results = {}

    # Clear detection lock so re-detection acquires it immediately
    try:
        _redis.delete("ingest:jobs:queue", "detection:lock")
        results["redis"] = "cleared"
    except Exception as e:
        results["redis"] = f"error: {e}"

    db_factory = get_session_factory()
    with db_factory() as db:
        # Collect existing demo entity UUIDs for Neo4j cleanup
        demo_entity_rows = db.execute(
            text("SELECT id FROM entities WHERE metadata_json::jsonb ? 'external_id'")
        ).fetchall()
        demo_entity_ids = [str(r[0]) for r in demo_entity_rows]

        # Delete all demo transactions and entities
        db.execute(text(
            "DELETE FROM transactions WHERE channel IN ('squad', 'squad_chain', 'squad_simulate', 'demo_reset', 'enforcement')"
        ))
        db.execute(text(
            "DELETE FROM entities WHERE metadata_json::jsonb ? 'external_id'"
        ))
        # Unfreeze any seeded entities that were frozen during a prior demo
        db.execute(text(
            "UPDATE entities SET metadata_json = metadata_json - 'frozen' - 'frozen_at' - 'frozen_str_id' "
            "WHERE metadata_json::jsonb ? 'frozen'"
        ))
        # Wipe alerts, STR drafts, audit log (raw SQL bypasses immutability listener)
        db.execute(text("TRUNCATE TABLE str_drafts, audit_log, alerts CASCADE"))
        db.commit()

        # --- Inject showcase: POS cash-out ring (6 sources → 1 beneficiary) ---
        now = datetime.now(timezone.utc)
        pos_sources = [
            _get_or_create_entity(db, f"RESET-POS-SRC-{j}", f"POS Source {j}")
            for j in range(1, 7)
        ]
        pos_beneficiary = _get_or_create_entity(db, "RESET-POS-BEN", "Kano Cash Outlet")
        db.flush()
        for j, src in enumerate(pos_sources):
            db.add(Transaction(
                source_entity_id=src.id,
                destination_entity_id=pos_beneficiary.id,
                amount=Decimal("150000"),
                currency="NGN",
                occurred_at=now - timedelta(minutes=(60 + j * 5)),
                reference=f"RESET-POS-{j + 1}-{uuid4().hex[:8].upper()}",
                channel="demo_reset",
                metadata_json={"demo": True, "pos_step": j + 1},
            ))
        db.flush()

        # Capture IDs before session closes (attributes expire on session close)
        injected_entity_ids = (
            [str(e.id) for e in pos_sources]
            + [str(pos_beneficiary.id)]
        )

        # Run detection — fires POS ring + shell director web from seeded data
        # Layered chain is triggered live via the Simulate button
        run_heuristic_detection(db)
        db.commit()

    results["postgres"] = (
        f"cleared {len(demo_entity_ids)} old demo entities; "
        f"injected POS ring showcase; alerts regenerated"
    )

    # Remove old demo nodes from Neo4j
    try:
        with neo4j_driver.session() as session:
            if demo_entity_ids:
                session.run(
                    "MATCH (e:Entity) WHERE e.entity_id IN $ids DETACH DELETE e",
                    ids=demo_entity_ids,
                )
        results["neo4j"] = f"cleared {len(demo_entity_ids)} old demo nodes"
    except Exception as e:
        results["neo4j"] = f"error: {e}"

    logger.info("Demo reset completed: %s", results)
    return {"status": "ok", "cleared": results}


@router.post("/squad/chain-step", status_code=200)
async def squad_chain_step(request: Request):
    """Called by the frontend after each Squad onSuccess — advances the fraud chain by one hop.
    No HMAC required; this is an internal call from TARA's own frontend."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    merchant_name = str(body.get("merchant_name", ""))
    amount_naira = Decimal(str(body.get("amount_naira", 100000)))
    if not merchant_name:
        return {"status": "error", "message": "merchant_name required"}
    asyncio.create_task(_write_chain_hop(merchant_name, amount_naira))
    return {"status": "queued", "merchant": merchant_name}


@router.post("/squad/simulate", status_code=200)
async def squad_webhook_simulate():
    """Demo: inject a 3-hop layered transfer chain for judge presentations — no Squad HMAC required."""
    chain = [
        {
            "sender_id": "SIM-ALPHA-REMIT", "sender_name": "Alpha Remit Ltd",
            "recv_id":   "SIM-QUICK-CASH",  "recv_name":  "Quick Cash Services",
            "amount": Decimal("200000"),
        },
        {
            "sender_id": "SIM-QUICK-CASH",  "sender_name": "Quick Cash Services",
            "recv_id":   "SIM-SHELL-CO",    "recv_name":   "Shell Co Alpha Ltd",
            "amount": Decimal("400000"),
        },
        {
            "sender_id": "SIM-SHELL-CO",    "sender_name": "Shell Co Alpha Ltd",
            "recv_id":   "SIM-MUSA-LAWAL",  "recv_name":   "Musa Lawal",
            "amount": Decimal("600000"),
        },
        {
            "sender_id": "SIM-MUSA-LAWAL",  "sender_name": "Musa Lawal",
            "recv_id":   "SIM-FINAL-BEN",   "recv_name":   "Final Beneficiary",
            "amount": Decimal("800000"),
        },
    ]
    asyncio.create_task(_process_simulate_ring(chain))
    return {"status": "success", "message": "Fraud ring simulation queued", "steps": len(chain)}


async def process_squad_webhook(payload: Dict[str, Any]):
    """Records the real customer→merchant payment then writes one synthetic chain hop for detection."""
    db_factory = get_session_factory()
    merchant_name = payload.get("_verified_merchant", "Unknown Merchant")

    with db_factory() as db:
        try:
            data = payload.get("Body") or payload.get("data") or payload

            sender_id = str(data.get("customer_identifier") or data.get("sender_id") or "").strip()
            receiver_id = str(data.get("merchant_id") or merchant_name).strip()

            if not sender_id or not receiver_id:
                logger.warning(f"Squad webhook missing sender/receiver — keys present: {list(data.keys())}")
                return

            sender_entity = _get_or_create_entity(db, sender_id, data.get("sender_name") or sender_id)
            receiver_entity = _get_or_create_entity(db, receiver_id, merchant_name)

            # Write arrival audit event — powers the Webhooks tab in Squad Monitor
            write_audit_event(
                db=db,
                action="squad_webhook_enqueued",
                entity_ids=[str(sender_entity.id), str(receiver_entity.id)],
                alert_id=None,
                model_version="webhook_v1",
                decision=DecisionStatus.pending,
                payload_json={
                    "merchant": merchant_name,
                    "ref": data.get("transaction_ref", ""),
                    "amount": str(_parse_amount(data)),
                },
            )
            db.flush()

            ingest_item = TransactionIngestItem(
                source_entity_id=sender_entity.id,
                destination_entity_id=receiver_entity.id,
                amount=_parse_amount(data),
                currency="NGN",
                occurred_at=_parse_timestamp(data),
                reference=data.get("transaction_ref") or f"SQUAD-{uuid4().hex[:10].upper()}",
                channel="squad",
                metadata_json={"tenant": merchant_name},
            )
            create_ingest_job(db=db, payload=ingest_item)
            # create_ingest_job commits internally; session stays open

            # Kick off the synthetic chain hop as a separate background task so it
            # gets its own DB session (create_ingest_job already committed above)
            asyncio.create_task(_write_chain_hop(merchant_name, _parse_amount(data)))

        except Exception as e:
            logger.error(f"Background processing failure: {e}", exc_info=True)
            db.rollback()


async def _write_chain_hop(merchant_name: str, amount: Decimal):
    """Write one synthetic layering hop and immediately run detection.
    Shared by both the Squad webhook path and the /chain-step frontend path."""
    try:
        chain_idx = MERCHANT_CHAIN_ORDER.index(merchant_name)
    except ValueError:
        logger.warning(f"_write_chain_hop: {merchant_name!r} not in chain — skipping")
        return

    if chain_idx >= len(MERCHANT_CHAIN_ORDER) - 1:
        return  # terminal merchant (Musa Lawal) — no hop needed

    next_name = MERCHANT_CHAIN_ORDER[chain_idx + 1]
    db_factory = get_session_factory()
    with db_factory() as db:
        try:
            this_chain = _get_or_create_entity(db, CHAIN_ENTITY_IDS[merchant_name], merchant_name)
            next_chain = _get_or_create_entity(db, CHAIN_ENTITY_IDS[next_name], next_name)
            chain_tx = Transaction(
                source_entity_id=this_chain.id,
                destination_entity_id=next_chain.id,
                amount=amount if amount > 0 else Decimal("100000"),
                currency="NGN",
                occurred_at=datetime.now(timezone.utc),
                reference=f"CHAIN-{chain_idx + 1}-{uuid4().hex[:8].upper()}",
                channel="squad_chain",
                metadata_json={"chain_step": chain_idx + 1, "merchant": merchant_name},
            )
            db.add(chain_tx)
            db.flush()
            run_heuristic_detection(db)
            db.commit()
            logger.info(f"Chain hop {chain_idx + 1}: {merchant_name} → {next_name}")
        except Exception as e:
            logger.error(f"Chain hop failed for {merchant_name}: {e}", exc_info=True)
            db.rollback()


async def _process_simulate_ring(chain: list):
    """Writes chain transactions directly to DB and runs detection immediately for the demo."""
    db_factory = get_session_factory()
    now = datetime.now(timezone.utc)
    with db_factory() as db:
        try:
            for i, step in enumerate(chain):
                sender = _get_or_create_entity(db, step["sender_id"], step["sender_name"])
                receiver = _get_or_create_entity(db, step["recv_id"], step["recv_name"])
                tx = Transaction(
                    source_entity_id=sender.id,
                    destination_entity_id=receiver.id,
                    amount=step["amount"],
                    currency="NGN",
                    occurred_at=now,
                    reference=f"SIM-RING-{i + 1}-{uuid4().hex[:8].upper()}",
                    channel="squad_simulate",
                    metadata_json={"simulation": True, "step": i + 1},
                )
                db.add(tx)
                db.flush()

            run_heuristic_detection(db)
            db.commit()
            logger.info("Simulate ring: transactions written and detection complete")
        except Exception as e:
            logger.error(f"Simulate ring processing failed: {e}", exc_info=True)
            db.rollback()


# --- Helper functions ---

def _get_or_create_entity(db: Session, external_id: str, display_name: str | None) -> Entity:
    entity = db.scalar(
        select(Entity).where(Entity.metadata_json["external_id"].astext == external_id)
    )
    if entity is None:
        entity = Entity(
            entity_type="individual",
            full_name=display_name or external_id,
            metadata_json={"external_id": external_id},
        )
        db.add(entity)
        db.flush()
    return entity


def _parse_amount(data: dict) -> Decimal:
    raw = data.get("transaction_amount") or data.get("amount") or 0
    try:
        return Decimal(str(raw)) / 100  # kobo → naira
    except InvalidOperation:
        return Decimal("0")


def _parse_timestamp(data: dict) -> datetime:
    raw = data.get("createdAt") or data.get("created_at") or data.get("timestamp")
    if raw:
        try:
            return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(timezone.utc)
