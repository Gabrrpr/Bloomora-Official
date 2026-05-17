import uuid
import enum
from sqlalchemy import Column, String, Text, Enum, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc


class RoleEnum(str, enum.Enum):
    admin    = "admin"
    staff    = "staff"
    customer = "customer"
    delivery = "delivery"


class BranchEnum(str, enum.Enum):
    manila   = "manila"
    pampanga = "pampanga"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone_number = Column(String(20), nullable=True)
    google_id = Column(String(255), nullable=True)
    facebook_id = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.customer)
    branch = Column(Enum(BranchEnum), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_staff_verified = Column(Boolean, default=False, nullable=False)
    staff_verification_token = Column(String(255), nullable=True)
    staff_token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    orders = relationship("Order", back_populates="user", foreign_keys="Order.user_id")
    reviews = relationship("Review", back_populates="user")
    deliveries = relationship("Delivery", back_populates="rider", foreign_keys="Delivery.rider_id")
    chats = relationship("Chat", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")
    ai_usage_logs = relationship("AIUsageLog", back_populates="user")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    arrangements = relationship("Arrangement", back_populates="user")