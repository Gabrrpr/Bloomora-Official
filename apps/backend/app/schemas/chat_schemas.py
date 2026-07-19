from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class MessageCreate(BaseModel):
    user_id: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    context_id: Optional[str] = None

class MessageOut(BaseModel):
    id: UUID
    user_id: UUID
    message: str
    sender: str
    image_url: str | None = None
    is_read: int
    created_at: datetime
    context_id: Optional[str] = None
    is_auto_reply: bool = False

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    user_name: str
    # 🚀 ADDED: To send the profile picture to the frontend
    user_avatar: str | None = None 
    unread_count: int
    last_message: str
    customer_id: UUID
    recent_orders: List[dict]
    last_message_time: datetime | None = None

class ConversationList(BaseModel):
    conversations: List[ConversationOut]
