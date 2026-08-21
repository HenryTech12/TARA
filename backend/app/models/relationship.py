import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Relationship(Base):
    """A shared-attribute edge between two identities — replaces VERA's
    Transaction for TARA's domain. Unlike a transaction, a relationship has
    no direction or amount: it records which attribute (device, address,
    phone prefix, employer) the two identities have in common.
    """

    __tablename__ = "relationships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    identity_a_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("identities.id"), nullable=False, index=True)
    identity_b_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("identities.id"), nullable=False, index=True)
    attribute_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    attribute_value: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
