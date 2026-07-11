import uuid
import enum
from sqlalchemy import Column, String, Text, Numeric, Enum, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc


class OrderStatusEnum(str, enum.Enum):
    pending = "pending"
    pending_payment = "pending_payment"
    paid = "paid"
    confirmed = "confirmed"
    preparing = "preparing"
    processing = "processing"
    ready_for_pickup = "ready_for_pickup"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
    payment_failed = "payment_failed"


class PaymentMethodEnum(str, enum.Enum):
    cash = "cash"
    ewallet = "ewallet"
    card = "card"
    bank_transfer = "bank_transfer"
    qrph = "qrph"


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    expired = "expired"
    refunded = "refunded"
    credited = "credited"


class DeliveryStatusEnum(str, enum.Enum):
    assigned = "assigned"
    picked_up = "picked_up"
    in_transit = "in_transit"
    out_for_delivery = "out_for_delivery"
    arrived = "arrived"
    delivered = "delivered"
    issue_reported = "issue_reported"
    failed = "failed"


class DeliveryOrderStatusEnum(str, enum.Enum):
    draft = "draft"
    assigned = "assigned"
    picked_up = "picked_up"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    arrangement_id = Column(UUID(as_uuid=True), ForeignKey("arrangements.id"), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.pending)
    delivery_address = Column(Text, nullable=True)
    delivery_lat = Column(Numeric(10, 7), nullable=True)
    delivery_lng = Column(Numeric(10, 7), nullable=True)
    delivery_geocode_precision = Column(String(50), nullable=True)
    delivery_notes = Column(Text, nullable=True)
    special_note = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    can_review = Column(Boolean, default=False)
    has_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    branch_name = Column(String(50), nullable=False, default="Manila")
    checkout_attempt_id = Column(String(64), nullable=True, unique=True, index=True)
    recipient_first_name = Column(String(120), nullable=True)
    recipient_last_name = Column(String(120), nullable=True)
    recipient_phone = Column(String(40), nullable=True)
    recipient_type = Column(String(20), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    fulfillment_method = Column(String(20), nullable=True)
    shipping_method_id = Column(UUID(as_uuid=True), ForeignKey("shipping_methods.id"), nullable=True)
    courier_selected = Column(String(120), nullable=True)
    shipping_delivery_type = Column(String(120), nullable=True)
    delivery_provider = Column(String(50), nullable=True)
    lalamove_order_id = Column(String(255), nullable=True)
    lalamove_share_link = Column(Text, nullable=True)
    lalamove_status = Column(String(80), nullable=True)
    time_slot = Column(String(50), nullable=True)
    subtotal_amount = Column(Numeric(10, 2), nullable=True)
    delivery_fee = Column(Numeric(10, 2), nullable=True)
    voucher_code = Column(String(50), nullable=True)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0)
    # Relationships
    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    arrangement = relationship("Arrangement", back_populates="orders")
    transaction = relationship("Transaction", back_populates="order", uselist=False)
    delivery = relationship("Delivery", back_populates="order", uselist=False)
    shipping_method = relationship("ShippingMethod", foreign_keys=[shipping_method_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True)
    payment_method = Column(Enum(PaymentMethodEnum), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    reference_number = Column(String(255), nullable=True)
    provider = Column(String(50), nullable=False, default="manual")
    provider_checkout_session_id = Column(String(255), nullable=True)
    provider_payment_intent_id = Column(String(255), nullable=True)
    provider_payment_id = Column(String(255), nullable=True)
    checkout_url = Column(Text, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    stock_released_at = Column(DateTime(timezone=True), nullable=True)
    raw_webhook_event = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    order = relationship("Order", back_populates="transaction")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True)
    delivery_order_id = Column(UUID(as_uuid=True), ForeignKey("delivery_orders.id"), nullable=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_area = Column(String(255), nullable=True)
    status = Column(Enum(DeliveryStatusEnum), default=DeliveryStatusEnum.assigned)
    lalamove_order_id = Column(String(255), nullable=True)
    delivery_fee = Column(Numeric(10, 2), nullable=True)
    estimated_arrival = Column(DateTime(timezone=True), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    in_transit_at = Column(DateTime(timezone=True), nullable=True)
    arrived_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    proof_photo_url = Column(Text, nullable=True)
    proof_note = Column(Text, nullable=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    order = relationship("Order", back_populates="delivery")
    delivery_order = relationship("DeliveryOrder", back_populates="deliveries")
    rider = relationship("User", back_populates="deliveries", foreign_keys=[rider_id])
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])


class DeliveryOrder(Base):
    __tablename__ = "delivery_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    delivery_order_number = Column(String(40), nullable=False, unique=True, index=True)
    branch = Column(String(50), nullable=False, default="Pampanga")
    rider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    status = Column(Enum(DeliveryOrderStatusEnum), nullable=False, default=DeliveryOrderStatusEnum.assigned)
    notes = Column(Text, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    deliveries = relationship("Delivery", back_populates="delivery_order")
    rider = relationship("User", foreign_keys=[rider_id])
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
