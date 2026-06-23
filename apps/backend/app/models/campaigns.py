from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid
from sqlalchemy.dialects.postgresql import JSONB, UUID

# This handles the Many-to-Many link in SQLAlchemy
product_campaigns = Table(
    "product_campaigns",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE")),
    Column("campaign_id", UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE")),
)

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    campaign_key = Column(String(50), nullable=False, unique=True)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    status = Column(String(20), nullable=False, default="draft")
    branches = Column(JSONB, nullable=False, default=lambda: ["all"])
    accessible_title = Column(String(160), nullable=True)
    description = Column(Text, nullable=True)
    badge = Column(String(80), nullable=True)
    cta_label = Column(String(80), nullable=True)
    cta_destination = Column(String(500), nullable=True)
    web_banner_url = Column(Text, nullable=True)
    mobile_banner_url = Column(Text, nullable=True)
    feed_media_type = Column(String(10), nullable=False, default="image")
    feed_media_url = Column(Text, nullable=True)
    feed_poster_url = Column(Text, nullable=True)
    voucher_id = Column(UUID(as_uuid=True), ForeignKey("promo_codes.id", ondelete="SET NULL"), nullable=True)
    linked_product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    # Relationship to get all products in this campaign
    products = relationship("Product", secondary=product_campaigns, back_populates="campaigns")
