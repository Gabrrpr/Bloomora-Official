import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, now_utc


class SiteCustomization(Base):
    """Key-value store for site-wide customizable content (e.g. hero slides)."""
    __tablename__ = "site_customizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)   # JSON string
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

