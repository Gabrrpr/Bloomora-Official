import uuid
import enum
from sqlalchemy import Column, String, Text, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc


class SenderEnum(str, enum.Enum):
    customer = "customer"
    staff = "staff"
    admin = "admin"


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    star_rating = Column(Integer, nullable=False)       # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    sender = Column(Enum(SenderEnum), nullable=False)   # who sent this message
    image_url = Column(Text, nullable=True)             # URL to attached image
    is_read = Column(Integer, default=0)                # 0 = unread, 1 = read
    created_at = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    user = relationship("User", back_populates="chats")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    role = Column(String(50), nullable=True)
    action = Column(String(500), nullable=False)        # e.g. "Updated product price"
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    user = relationship("User", back_populates="activity_logs")