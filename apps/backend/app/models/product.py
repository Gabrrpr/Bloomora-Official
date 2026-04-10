import uuid
import enum
from sqlalchemy import Column, String, Text, Numeric, Enum, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc


class ProductCategoryEnum(str, enum.Enum):
    flower = "flower"
    vase = "vase"
    wrapping = "wrapping"
    accessory = "accessory"
    arrangement = "arrangement"


class ProductStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    category = Column(Enum(ProductCategoryEnum), nullable=False)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True)
    status = Column(Enum(ProductStatusEnum), default=ProductStatusEnum.active)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    inventory = relationship("Inventory", back_populates="product", uselist=False)
    reviews = relationship("Review", back_populates="product")
    order_items = relationship("Order", back_populates="product")
    flower = relationship("Flower", back_populates="product", uselist=False)
    vase = relationship("Vase", back_populates="product", uselist=False)
    wrapping = relationship("Wrapping", back_populates="product", uselist=False)
    accessory = relationship("Accessory", back_populates="product", uselist=False)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, unique=True)
    current_stock = Column(Integer, default=0, nullable=False)
    reorder_point = Column(Integer, default=10, nullable=False)
    unit_type = Column(String(50), nullable=True)       # e.g. "stems", "pieces", "meters"
    cost_per_unit = Column(Numeric(10, 2), nullable=True)
    last_restocked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    product = relationship("Product", back_populates="inventory")