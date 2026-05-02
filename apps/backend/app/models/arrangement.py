import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, now_utc


class Arrangement(Base):
    __tablename__ = "arrangements"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # ← add
    product_id          = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    name                = Column(String(255), nullable=True)
    description         = Column(Text, nullable=True)
    prompt_text         = Column(Text, nullable=True)
    generated_image_url = Column(Text, nullable=True)
    estimated_price     = Column(Numeric(10, 2), nullable=True)
    flower_id           = Column(UUID(as_uuid=True), ForeignKey("flowers.id"), nullable=True)
    vase_id             = Column(UUID(as_uuid=True), ForeignKey("vases.id"), nullable=True)
    wrapping_id         = Column(UUID(as_uuid=True), ForeignKey("wrappings.id"), nullable=True)
    accessory_id        = Column(UUID(as_uuid=True), ForeignKey("accessories.id"), nullable=True)
    last_restock_date   = Column(DateTime(timezone=True), nullable=True)  # ← add (from ERD)
    created_at          = Column(DateTime(timezone=True), default=now_utc)
    updated_at          = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships
    user        = relationship("User", back_populates="arrangements")  # ← add
    orders      = relationship("Order", back_populates="arrangement")
    flower      = relationship("Flower", back_populates="arrangements", foreign_keys=[flower_id])
    vase        = relationship("Vase", back_populates="arrangements", foreign_keys=[vase_id])
    wrapping    = relationship("Wrapping", back_populates="arrangements", foreign_keys=[wrapping_id])
    accessory   = relationship("Accessory", back_populates="arrangements", foreign_keys=[accessory_id])

class Flower(Base):
    __tablename__ = "flowers"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id          = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    color               = Column(String(100), nullable=True)
    style               = Column(String(100), nullable=True)
    size                = Column(String(100), nullable=True)
    quantity            = Column(Integer, default=1)
    unit_price          = Column(Numeric(10, 2), nullable=False)
    shelf_life_days     = Column(Integer, nullable=True)
    care_instructions   = Column(Text, nullable=True)
    created_at          = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    product      = relationship("Product", back_populates="flower")
    arrangements = relationship("Arrangement", back_populates="flower", foreign_keys="Arrangement.flower_id")


class Vase(Base):
    __tablename__ = "vases"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name         = Column(String(255), nullable=True)        # ← add
    description  = Column(Text, nullable=True)               # ← add
    image_url    = Column(String(500), nullable=True)        # ← add
    is_available = Column(Boolean, default=True)             # ← add
    style        = Column(String(100), nullable=True)
    material     = Column(String(100), nullable=True)
    color        = Column(String(100), nullable=True)
    size         = Column(String(100), nullable=True)
    quantity     = Column(Integer, default=1)
    unit_price   = Column(Numeric(10, 2), nullable=True)
    category     = Column(String(80), nullable=True)
    created_at   = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    arrangements = relationship("Arrangement", back_populates="vase", foreign_keys="Arrangement.vase_id")


class Wrapping(Base):
    __tablename__ = "wrappings"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id  = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    style       = Column(String(100), nullable=True)
    color       = Column(String(100), nullable=True)
    material    = Column(String(100), nullable=True)
    size        = Column(String(100), nullable=True)
    quantity    = Column(Integer, default=1)
    unit_price  = Column(Numeric(10, 2), nullable=False)
    created_at  = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    product      = relationship("Product", back_populates="wrapping")
    arrangements = relationship("Arrangement", back_populates="wrapping", foreign_keys="Arrangement.wrapping_id")


class Accessory(Base):
    __tablename__ = "accessories"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id  = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    name        = Column(String(255), nullable=True)
    style       = Column(String(100), nullable=True)
    color       = Column(String(100), nullable=True)
    size        = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    quantity    = Column(Integer, default=1)
    unit_price  = Column(Numeric(10, 2), nullable=False)
    created_at  = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    product      = relationship("Product", back_populates="accessory")
    arrangements = relationship("Arrangement", back_populates="accessory", foreign_keys="Arrangement.accessory_id")
