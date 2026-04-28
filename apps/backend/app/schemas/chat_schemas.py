from pydantic import BaseModel
from typing import List
from uuid import UUID
from datetime import datetime

class MessageCreate(BaseModel):
    user_id: UUID
    text: str
    image_url: str | None = None

class MessageOut(BaseModel):
    id: UUID
    user_id: UUID
    message: str
    sender: str
    image_url: str | None = None
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    user_name: str
    unread_count: int
    last_message: str
    customer_id: UUID
    recent_orders: List[dict]

class ConversationList(BaseModel):
    conversations: List[ConversationOut]
