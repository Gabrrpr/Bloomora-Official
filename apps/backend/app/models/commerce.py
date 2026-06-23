import uuid

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, now_utc


class CommerceSetting(Base):
    __tablename__ = "commerce_settings"

    key = Column(String(80), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class Advertisement(Base):
    __tablename__ = "advertisements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(120), nullable=False)
    image_url = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
