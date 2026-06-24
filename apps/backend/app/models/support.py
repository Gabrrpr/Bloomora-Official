import uuid
import enum
from sqlalchemy import CheckConstraint, Column, String, Text, Integer, Boolean, Enum, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc
from .user import RoleEnum, BranchEnum


class SenderEnum(str, enum.Enum):
    customer = "customer"
    staff = "staff"
    admin = "admin"


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("star_rating >= 1 AND star_rating <= 5", name="ck_reviews_star_rating"),
        UniqueConstraint("user_id", "product_id", name="uq_reviews_user_product"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    star_rating = Column(Integer, nullable=False)       # 1 to 5
    comment = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
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
    context_id = Column(String(255), nullable=True)
    

    # Relationships
    user = relationship("User", back_populates="chats")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    role = Column(String(50), nullable=True)
    action = Column(String(500), nullable=False)        # e.g. "Updated product price"
    details = Column(Text, nullable=True)
    branch = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="activity_logs")
    
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # 🚀 FIX: Nullable is now True so global alerts don't crash
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True) 
    
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # 🚀 Includes your existing order_id relation
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    
    is_read = Column(Boolean, default=False)
    
    # 🚀 NEW: The global broadcast flag
    is_global = Column(Boolean, default=False) 

    # New columns for targeting
    target_role = Column(Enum(RoleEnum), nullable=True)
    target_branch = Column(Enum(BranchEnum), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    user = relationship("User", back_populates="notifications")
