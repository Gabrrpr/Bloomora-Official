import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from .base import Base, now_utc


class FeedPlacement(Base):
    __tablename__ = "feed_placements"
    __table_args__ = (
        UniqueConstraint("campaign_id", "tab", "branch", name="uq_feed_placement_campaign_tab_branch"),
        CheckConstraint("slot >= 1", name="ck_feed_placement_slot_positive"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tab = Column(String(20), nullable=False, index=True)
    branch = Column(String(20), nullable=False, default="all", index=True)
    slot = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class ProductFeedControl(Base):
    __tablename__ = "product_feed_controls"
    __table_args__ = (
        UniqueConstraint("product_id", "branch", name="uq_product_feed_control_product_branch"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    branch = Column(String(20), nullable=False, default="all", index=True)
    is_hidden = Column(Boolean, nullable=False, default=False)
    boost_level = Column(String(10), nullable=False, default="none")
    start_at = Column(DateTime(timezone=True), nullable=True)
    end_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class CampaignReaction(Base):
    __tablename__ = "campaign_reactions"
    __table_args__ = (
        UniqueConstraint("campaign_id", "actor_key", name="uq_campaign_reaction_actor"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    installation_id = Column(String(120), nullable=True)
    actor_key = Column(String(160), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), default=now_utc)


class FeedEvent(Base):
    __tablename__ = "feed_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(40), nullable=False, index=True)
    item_type = Column(String(20), nullable=False)
    item_id = Column(String(120), nullable=False, index=True)
    tab = Column(String(20), nullable=False, index=True)
    branch = Column(String(20), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    installation_id = Column(String(120), nullable=True)
    session_id = Column(String(120), nullable=True)
    event_metadata = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=now_utc, index=True)
