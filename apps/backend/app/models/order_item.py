import uuid
from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

# Make sure this import matches where your Base is located!
from .base import Base, now_utc

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    quantity = Column(Integer, nullable=False, default=1)
    
    # Crucial for e-commerce: Locks in the price they actually paid
    price_at_purchase = Column(Float, nullable=False) 

    # ── Relationships ──
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")