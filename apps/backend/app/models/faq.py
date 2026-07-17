from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base, now_utc


class FaqCategory(Base):
    __tablename__ = "faq_categories"

    id = Column(String(100), primary_key=True)
    name = Column(String(160), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0, index=True)
    created_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc, nullable=False)

    items = relationship(
        "FaqItem",
        back_populates="category",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="FaqItem.sort_order",
    )


class FaqItem(Base):
    __tablename__ = "faq_items"

    id = Column(String(100), primary_key=True)
    category_id = Column(
        String(100),
        ForeignKey("faq_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0, index=True)
    created_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc, nullable=False)

    category = relationship("FaqCategory", back_populates="items")
