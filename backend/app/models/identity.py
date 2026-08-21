import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Identity(Base):
    """A verified human identity — replaces VERA's Entity for TARA's domain.

    Persisted for durable storage / audit trail, matching the existing
    Entity/Transaction ORM convention. The live graph used by detection
    patterns is the in-memory structure maintained by graph_service.py.
    """

    __tablename__ = "identities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    bvn: Mapped[str | None] = mapped_column(String(32), nullable=True, unique=True)
    device_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    employer: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    referral_source: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
