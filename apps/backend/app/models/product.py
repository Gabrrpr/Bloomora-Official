import uuid
import enum
from sqlalchemy import Column, String, Text, Numeric, Enum, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import Base, now_utc

# 👇 We deleted ProductCategoryEnum because we want infinite dynamic categories!

class ProductStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    care_guide = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    
    
    product_group = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    product_type = Column(String(100), nullable=True, index=True)
    branches = Column(JSONB, default=[])
    
    season_key = Column(String(100), nullable=True, index=True)
    
 
    limited_start_at = Column(DateTime(timezone=True), nullable=True)
    limited_end_at = Column(DateTime(timezone=True), nullable=True)
    # ──────────────────────────────────

    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True)
    status = Column(Enum(ProductStatusEnum), default=ProductStatusEnum.active)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    is_visible = Column(Boolean, default=True)
    occasions = Column(JSONB, default=[])
    composition = Column(JSONB, default=[])
    sold_count = Column(Integer, default=0, nullable=False)

    
    # Relationships (Unchanged)
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product")
    flower = relationship("Flower", back_populates="product", uselist=False, cascade="all, delete-orphan")
    wrapping = relationship("Wrapping", back_populates="product", uselist=False)
    accessory = relationship("Accessory", back_populates="product", uselist=False)
    discounts = relationship("Discount", back_populates="product")
    campaigns = relationship("Campaign", secondary="product_campaigns", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    components = relationship("ProductRecipe", foreign_keys="[ProductRecipe.parent_product_id]", cascade="all, delete-orphan")
    tags = Column(JSONB, default=[])
    original_price = Column(Numeric(10, 2), nullable=True)
    


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, unique=True)
    current_stock = Column(Integer, default=0, nullable=False)
    reorder_point = Column(Integer, default=10, nullable=False)
    stock_manila = Column(Integer, default=0)
    stock_pampanga = Column(Integer, default=0)
    unit_type = Column(String(50), nullable=True)       # e.g. "stems", "pieces", "meters"
    cost_per_unit = Column(Numeric(10, 2), nullable=True)
    last_restocked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    product = relationship("Product", back_populates="inventory")

class Discount(Base):
    __tablename__ = "discounts"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id     = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    discount_type  = Column(String(50), nullable=False)      # 'percentage' | 'fixed'
    discount_value = Column(Numeric(10, 2), nullable=False)
    start_date     = Column(DateTime(timezone=True), nullable=True)
    end_date       = Column(DateTime(timezone=True), nullable=True)
    status         = Column(String(20), default="active")
    created_at     = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    product = relationship("Product", back_populates="discounts")
    
    
# Paste this at the bottom of the file where your Product class is:

class ProductRecipe(Base):
    __tablename__ = "product_recipes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    component_product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    quantity_required = Column(Numeric(10, 2), nullable=False)
    
    # 🚀 FIXED: Changed from server_default=func.now() to match your project's pattern
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    parent_product = relationship("Product", foreign_keys=[parent_product_id], backref="recipe_items")
    component_product = relationship("Product", foreign_keys=[component_product_id])
    
class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # The actual string they type at checkout (e.g., "SUMMER20")
    code = Column(String(50), unique=True, nullable=False, index=True) 
    
    # 'percent' or 'fixed'
    discount_type = Column(String(20), nullable=False) 
    discount_value = Column(Numeric(10, 2), nullable=False)
    
    # Optional threshold to trigger the discount
    min_spend = Column(Numeric(10, 2), default=0) 
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
