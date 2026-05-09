from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

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
    end_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationship to get all products in this campaign
    products = relationship("Product", secondary=product_campaigns, back_populates="campaigns")