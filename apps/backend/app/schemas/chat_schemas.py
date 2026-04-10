from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class ChatMessageOut(BaseModel):
    id: UUID
    user_id: UUID
    message: str
    sender: str
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryOut(BaseModel):
    user_id: str
    username: str
    full_name: str
    latest_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    is_online: bool
    unread_count: int

    class Config:
        from_attributes = True