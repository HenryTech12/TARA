from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

# TARA keeps the identity graph in memory — no Neo4j provisioning needed
# for this build (PRD Section 02/05). The previous VERA graph_service.py
# was 100% Neo4j Cypher with no in-memory logic to adapt, so this is a
# fresh implementation rather than a port.

SHARED_ATTRIBUTES = ("device_id", "address", "employer")


@dataclass
class IdentityNode:
    id: str
    name: str
    bvn: str | None = None
    device_id: str | None = None
    address: str | None = None
    phone: str | None = None
    employer: str | None = None
    referral_source: str | None = None
    verified_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "bvn": self.bvn,
            "device_id": self.device_id,
            "address": self.address,
            "phone": self.phone,
            "employer": self.employer,
            "referral_source": self.referral_source,
            "verified_at": self.verified_at,
        }


_nodes: dict[str, IdentityNode] = {}
_edges: list[dict] = []


def _find_shared_attribute_edges(node: IdentityNode) -> list[dict]:
    """Compares a node against every existing node and returns one edge dict
    per shared attribute (device_id, address, employer) found."""
    new_edges: list[dict] = []
    for other in _nodes.values():
        if other.id == node.id:
            continue
        for attr in SHARED_ATTRIBUTES:
            value = getattr(node, attr)
            if value and value == getattr(other, attr):
                new_edges.append(
                    {
                        "source": other.id,
                        "target": node.id,
                        "attribute_type": attr,
                        "attribute_value": value,
                    }
                )
    return new_edges


def upsert_identity_node(
    name: str,
    device_id: str | None = None,
    address: str | None = None,
    phone: str | None = None,
    employer: str | None = None,
    referral_source: str | None = None,
    verified_at: str | datetime | None = None,
    identity_id: str | None = None,
) -> IdentityNode:
    """Adds (or updates) a verified identity in the in-memory graph and
    derives shared-attribute edges against every existing node."""
    node_id = identity_id or str(uuid.uuid4())

    if isinstance(verified_at, str):
        verified_at_dt = datetime.now(timezone.utc) if verified_at == "now" else datetime.fromisoformat(verified_at)
    elif isinstance(verified_at, datetime):
        verified_at_dt = verified_at
    else:
        verified_at_dt = datetime.now(timezone.utc)

    # Coordinated-onboarding detection sorts and diffs verified_at values —
    # keep every node timezone-aware so those comparisons never raise.
    if verified_at_dt.tzinfo is None:
        verified_at_dt = verified_at_dt.replace(tzinfo=timezone.utc)

    node = IdentityNode(
        id=node_id,
        name=name,
        device_id=device_id,
        address=address,
        phone=phone,
        employer=employer,
        referral_source=referral_source,
        verified_at=verified_at_dt,
    )

    new_edges = _find_shared_attribute_edges(node)
    _nodes[node_id] = node
    _edges.extend(new_edges)
    return node


def get_full_graph() -> dict[str, dict]:
    """Returns the current in-memory graph as {identity_id: node_dict},
    the shape every detection pattern in pattern_service.py expects."""
    return {node_id: node.to_dict() for node_id, node in _nodes.items()}


def get_graph_edges() -> list[dict]:
    """Returns the derived shared-attribute edges, for the graph explorer."""
    return list(_edges)


def get_edges_for_identity(identity_id: str) -> list[dict]:
    """Returns the shared-attribute edges touching one identity — used to
    persist Relationship rows right after a new identity is upserted."""
    return [edge for edge in _edges if identity_id in (edge["source"], edge["target"])]


def reset_graph() -> None:
    """Clears the in-memory graph — used by the seed script and tests."""
    _nodes.clear()
    _edges.clear()
