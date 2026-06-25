import uuid
import enum
from sqlalchemy import Column, String, Text, Enum, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc


class VehicleTypeEnum(str, enum.Enum):
    motorcycle = "motorcycle"
    car = "car"
    van = "van"
    truck = "truck"
    bicycle = "bicycle"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate_number = Column(String(20), nullable=False, unique=True, index=True)
    vehicle_type = Column(Enum(VehicleTypeEnum), nullable=False)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    capacity = Column(String(50), nullable=True)
    document_url = Column(Text, nullable=True)
    assigned_rider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    branch = Column(String(50), nullable=False, default="Manila")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    assigned_rider = relationship("User", foreign_keys=[assigned_rider_id])
