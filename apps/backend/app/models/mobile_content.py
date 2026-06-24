import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID

from .base import Base, now_utc


class FeedPost(Base):
    __tablename__ = "feed_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    internal_title = Column(String(160), nullable=False)
    title = Column(String(160), nullable=False)
    caption = Column(Text, nullable=True)
    badge = Column(String(80), nullable=True)
    media_kind = Column(String(10), nullable=False, default="image")
    media_url = Column(Text, nullable=False)
    poster_url = Column(Text, nullable=True)
    media_width = Column(Integer, nullable=False)
    media_height = Column(Integer, nullable=False)
    media_duration_seconds = Column(Integer, nullable=True)
    media_mime_type = Column(String(80), nullable=False)
    media_size_bytes = Column(Integer, nullable=True)
    action = Column(JSONB, nullable=False, default=lambda: {"type": "none"})
    tab = Column(String(20), nullable=False, index=True)
    branch = Column(String(20), nullable=False, default="all", index=True)
    status = Column(String(20), nullable=False, default="draft", index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    sort_order = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class FeedPostReaction(Base):
    __tablename__ = "feed_post_reactions"
    __table_args__ = (
        UniqueConstraint("feed_post_id", "actor_key", name="uq_feed_post_reaction_actor"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feed_post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("feed_posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    installation_id = Column(String(120), nullable=True)
    actor_key = Column(String(160), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class CategoryBanner(Base):
    __tablename__ = "category_banners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    internal_title = Column(String(160), nullable=False)
    accessible_label = Column(String(240), nullable=False)
    media_url = Column(Text, nullable=False)
    media_width = Column(Integer, nullable=False, default=1080)
    media_height = Column(Integer, nullable=False, default=500)
    media_mime_type = Column(String(80), nullable=False, default="image/webp")
    media_size_bytes = Column(Integer, nullable=True)
    action = Column(JSONB, nullable=False, default=lambda: {"type": "none"})
    branch = Column(String(20), nullable=False, default="all", index=True)
    status = Column(String(20), nullable=False, default="draft", index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    sort_order = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

