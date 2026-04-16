from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime

from .base import Base
from .user import User

class Chat(Base):
    __table_args__ = {'extend_existing': True}

    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String, nullable=False)
    sender = Column(String(20), nullable=False)  # customer/staff/admin
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="chats")

User.chats = relationship("Chat", foreign_keys="[Chat.user_id]", order_by=Chat.created_at.desc(), back_populates="user")
