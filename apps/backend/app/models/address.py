import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc


class Address(Base):
    __tablename__ = "addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(50), nullable=False, default="Home")
    recipient_name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False)
    street = Column(Text, nullable=False)
    barangay = Column(String(100), nullable=True)
    city = Column(String(100), nullable=False)
    province = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    geocode_precision = Column(String(50), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="addresses")

