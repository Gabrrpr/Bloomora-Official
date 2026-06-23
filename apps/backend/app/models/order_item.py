import uuid
from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

# Make sure this import matches where your Base is located!
from .base import Base, now_utc

class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint(
            "(product_id IS NOT NULL AND arrangement_id IS NULL) OR "
            "(product_id IS NULL AND arrangement_id IS NOT NULL)",
            name="ck_order_items_exactly_one_item_type",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=True)
    arrangement_id = Column(UUID(as_uuid=True), ForeignKey("arrangements.id", ondelete="RESTRICT"), nullable=True)
    
    quantity = Column(Integer, nullable=False, default=1)
    
    # Crucial for e-commerce: Locks in the price they actually paid
    price_at_purchase = Column(Numeric(10, 2), nullable=False)
    card_message = Column(Text, nullable=True)
    card_enabled = Column(Boolean, nullable=False, default=False)

    # ── Relationships ──
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    arrangement = relationship("Arrangement", back_populates="order_items")


class StockReservation(Base):
    __tablename__ = "stock_reservations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_item_id = Column(UUID(as_uuid=True), ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, unique=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="active")
    reserved_until = Column(DateTime(timezone=True), nullable=False)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
