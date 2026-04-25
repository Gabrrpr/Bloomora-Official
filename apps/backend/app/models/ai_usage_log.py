import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, now_utc

DAILY_AI_LIMIT = 5  # max AI generations per user per day


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    used_at     = Column(DateTime(timezone=True), default=now_utc)
    prompt_text = Column(Text, nullable=True)
    image_url   = Column(Text, nullable=True)

    # Relationship
    user = relationship("User", back_populates="ai_usage_logs")