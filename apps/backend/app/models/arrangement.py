import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, now_utc

class ArrangementFlower(Base):
    __tablename__ = "arrangement_flowers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    arrangement_id = Column(UUID(as_uuid=True), ForeignKey("arrangements.id"), nullable=False)
    flower_id = Column(UUID(as_uuid=True), ForeignKey("flowers.id"), nullable=False)
    quantity = Column(Integer, default=1)

    # Relationships
    arrangement = relationship("Arrangement", back_populates="flower_items")
    flower = relationship("Flower")

class Arrangement(Base):
    __tablename__ = "arrangements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    prompt_text = Column(Text, nullable=True)
    generated_image_url = Column(String(500), nullable=True)
    estimated_price = Column(Numeric(10, 2), nullable=True)

    # FK links to other materials
    vase_id = Column(UUID(as_uuid=True), ForeignKey("vases.id"), nullable=True)
    wrapping_id = Column(UUID(as_uuid=True), ForeignKey("wrappings.id"), nullable=True)
    accessory_id = Column(UUID(as_uuid=True), ForeignKey("accessories.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # UPDATED Relationships
    orders = relationship("Order", back_populates="arrangement")

    # This is the key: it links to the many flowers table
    flower_items = relationship("ArrangementFlower", back_populates="arrangement", cascade="all, delete-orphan")

    vase = relationship("Vase", back_populates="arrangements", foreign_keys=[vase_id])
    wrapping = relationship("Wrapping", back_populates="arrangements", foreign_keys=[wrapping_id])
    accessory = relationship("Accessory", back_populates="arrangements", foreign_keys=[accessory_id])


class Flower(Base):
    __tablename__ = "flowers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    color = Column(String(100), nullable=True)
    style = Column(String(100), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    shelf_life_days = Column(Integer, nullable=True)    
    care_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    product = relationship("Product", back_populates="flower")
    # This now refers to the association table if needed, 
    # but the ArrangementFlower -> Flower link is usually enough.
    
class Vase(Base):
    __tablename__ = "vases"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    material = Column(String(100), nullable=True)
    color = Column(String(100), nullable=True)
    size = Column(String(50), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    # Relationships
    product = relationship("Product", back_populates="vase")
    arrangements = relationship("Arrangement", back_populates="vase", foreign_keys="Arrangement.vase_id")


class Wrapping(Base):
    __tablename__ = "wrappings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    material = Column(String(100), nullable=True)
    color = Column(String(100), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    # Relationships
    product = relationship("Product", back_populates="wrapping")
    arrangements = relationship("Arrangement", back_populates="wrapping", foreign_keys="Arrangement.wrapping_id")


class Accessory(Base):
    __tablename__ = "accessories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    accessory_type = Column(String(100), nullable=True)
    color = Column(String(100), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    # Relationships
    product = relationship("Product", back_populates="accessory")
    arrangements = relationship("Arrangement", back_populates="accessory", foreign_keys="Arrangement.accessory_id")


