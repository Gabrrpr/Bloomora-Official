from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import uuid
from datetime import datetime, timezone

from app.core.dependencies import get_db, get_current_user
from app.core.connection_manager import manager
from app.models import User, RoleEnum, Chat, Order
from app.schemas.chat_schemas import MessageCreate, MessageOut, ConversationList, ConversationOut

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.post("/sessions")
def create_session(
    current_user: User = Depends(get_current_user),
):
    return {"id": str(current_user.id)}

@router.post("/messages", response_model=MessageOut)
def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_message = Chat(
        user_id=message.user_id,
        message=message.text,
        sender='customer' if current_user.role == RoleEnum.customer else 'staff',
        is_read=0
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    payload = {
        "id": str(new_message.id),
        "user_id": str(new_message.user_id),
        "message": new_message.message,
        "sender": new_message.sender,
        "created_at": new_message.created_at.isoformat(),
        "is_read": new_message.is_read
    }

    # Broadcast to sender and staff
    manager.send_to_user(str(current_user.id), payload)
    if new_message.sender == 'customer':
        # Notify all staff
        manager.broadcast_to_staff(payload)

    return new_message

@router.get("/history/{user_id}", response_model=List[MessageOut])
def get_chat_history(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == RoleEnum.customer:
        if str(current_user.id) != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

    messages = db.query(Chat).filter(Chat.user_id == user_id).order_by(Chat.created_at.asc()).all()
    return messages

@router.get("/conversations", response_model=ConversationList)
def get_all_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Staff only")

    conversations = []
    users_with_chats = db.query(Chat.user_id.distinct()).all()

    for u_id in users_with_chats:
        customer_id = str(u_id[0])
        customer = db.query(User).filter(User.id == customer_id).first()
        if not customer:
            continue

        unread_count = db.query(Chat).filter(
            Chat.user_id == customer_id,
            Chat.sender == 'customer',
            Chat.is_read == 0
        ).count()

        recent_message = db.query(Chat).filter(Chat.user_id == customer_id)\
            .order_by(desc(Chat.created_at)).first()

        recent_orders = db.query(Order).filter(Order.customer_id == customer_id)\
            .order_by(desc(Order.created_at)).limit(3).all()

        conversations.append(ConversationOut(
            customer_id=UUID(customer_id),
            user_name=f"{customer.first_name or ''} {customer.last_name or ''}".strip() or customer.email.split('@')[0],
            unread_count=unread_count,
            last_message=recent_message.message if recent_message else "",
            recent_orders=[{
                "order_number": o.order_number,
                "product": o.product.name if o.product else "Custom",
                "status": o.status.value,
                "total_amount": float(o.total_amount)
            } for o in recent_orders]
        ))

    return ConversationList(conversations=conversations)

@router.patch("/history/{user_id}/read")
def mark_messages_as_read(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Chat).filter(
        Chat.user_id == user_id,
        Chat.is_read == 0
    ).update({"is_read": 1})
    db.commit()
    return {"detail": "Marked as read"}

# WebSocket
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

