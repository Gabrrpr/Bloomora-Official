import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base, now_utc


class BranchDeliverySetting(Base):
    __tablename__ = "branch_delivery_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    branch = Column(String(50), nullable=False, unique=True, index=True)
    pickup_address = Column(Text, nullable=False)
    pickup_lat = Column(Numeric(10, 7), nullable=False)
    pickup_lng = Column(Numeric(10, 7), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    verified_by = relationship("User", foreign_keys=[verified_by_id])


class ExternalShipment(Base):
    __tablename__ = "external_shipments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    provider_code = Column(String(50), nullable=False, index=True)
    provider_name = Column(String(120), nullable=True)
    external_reference = Column(String(255), nullable=True, index=True)
    tracking_url = Column(Text, nullable=True)
    status = Column(String(40), nullable=False, default="awaiting_booking", index=True)
    provider_status = Column(String(120), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    intervention_required = Column(Boolean, nullable=False, default=False)
    last_error = Column(Text, nullable=True)
    booked_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    in_transit_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    order = relationship("Order", back_populates="external_shipments")
    events = relationship(
        "ExternalShipmentEvent",
        back_populates="shipment",
        cascade="all, delete-orphan",
        order_by="ExternalShipmentEvent.created_at",
    )
    created_by = relationship("User", foreign_keys=[created_by_id])


class ExternalShipmentEvent(Base):
    __tablename__ = "external_shipment_events"
    __table_args__ = (UniqueConstraint("shipment_id", "event_key", name="uq_external_shipment_event_key"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("external_shipments.id", ondelete="CASCADE"), nullable=False)
    event_key = Column(String(180), nullable=False)
    status = Column(String(40), nullable=False)
    provider_status = Column(String(120), nullable=True)
    message = Column(Text, nullable=True)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    shipment = relationship("ExternalShipment", back_populates="events")
