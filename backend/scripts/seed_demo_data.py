"""
Seed script for TARA's demo dataset.

Loads data/demo_identities.json directly into the in-memory identity graph,
preserving each record's verified_at timestamp (the live /identities/verify
endpoint always stamps "now", which would collapse the ring's staggered
onboarding window — this script bypasses that to keep the demo timeline
intact) and best-effort mirrors each identity into Postgres.

Because the graph is an in-memory, per-process structure, this only has an
effect on API responses when it runs inside the same process as the running
server — so app/main.py calls load_demo_dataset() once at startup. Running
this file directly (`python backend/scripts/seed_demo_data.py`) is useful to
validate the dataset parses and loads cleanly, independent of a live server.
"""
from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.append(str(BACKEND_DIR))

from sqlalchemy import select  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.models import Identity, Relationship  # noqa: E402
from app.services.graph_service import get_edges_for_identity, upsert_identity_node  # noqa: E402

DEMO_DATA_PATH = ROOT_DIR / "data" / "demo_identities.json"


def load_demo_dataset(path: Path = DEMO_DATA_PATH) -> int:
    """Loads every identity in the demo dataset into the in-memory graph.

    Returns the number of identities loaded. Best-effort persists the same
    rows to Postgres — a missing/unreachable DB does not block seeding the
    graph, since the graph is what the demo and detection patterns read from.

    Restarting the backend against a Postgres instance that already has this
    dataset (e.g. a rehearsal restart) must not re-mint fresh UUIDs for
    already-seeded identities — that would desync the in-memory graph from
    Postgres and break relationship inserts on the next /identities/verify
    call (foreign key violation). So each record's BVN is looked up first;
    if it already exists, its DB id is reused for the graph node and nothing
    is re-written to Postgres.
    """
    with open(path, encoding="utf-8") as f:
        records = json.load(f)

    db = None
    try:
        db = SessionLocal()
    except Exception:
        db = None

    loaded = 0
    for record in records:
        existing = None
        if db is not None:
            try:
                existing = db.scalar(select(Identity).where(Identity.bvn == record.get("bvn")))
            except Exception:
                db.rollback()
                existing = None

        node = upsert_identity_node(
            name=record["name"],
            device_id=record.get("device_id"),
            address=record.get("address"),
            phone=record.get("phone"),
            employer=record.get("employer"),
            referral_source=record.get("referral_source"),
            verified_at=record.get("verified_at"),
            identity_id=str(existing.id) if existing is not None else None,
        )
        loaded += 1

        if db is not None and existing is None:
            try:
                db.add(
                    Identity(
                        id=uuid.UUID(node.id),
                        name=node.name,
                        bvn=record.get("bvn"),
                        device_id=node.device_id,
                        address=node.address,
                        phone=node.phone,
                        employer=node.employer,
                        referral_source=node.referral_source,
                        verified_at=node.verified_at,
                    )
                )
                for edge in get_edges_for_identity(node.id):
                    db.add(
                        Relationship(
                            identity_a_id=uuid.UUID(edge["source"]),
                            identity_b_id=uuid.UUID(edge["target"]),
                            attribute_type=edge["attribute_type"],
                            attribute_value=edge["attribute_value"],
                        )
                    )
                db.commit()
            except Exception:
                db.rollback()

    if db is not None:
        db.close()

    return loaded


if __name__ == "__main__":
    count = load_demo_dataset()
    print(f"[seed_demo_data] loaded {count} identities into the graph")
