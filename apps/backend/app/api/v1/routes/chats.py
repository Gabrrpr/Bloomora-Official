from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from uuid import UUID
from datetime import datetime, timezone
import os
import shutil

from app.core.dependencies import get_db, get_current_user
from app.core.connection_manager import manager
from app.models import User, RoleEnum, Chat, Order
from app.schemas.chat_schemas import MessageCreate, MessageOut, ConversationList, ConversationOut

router = APIRouter(prefix="/chats", tags=["Chats"])

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "chat_images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def serialize_chat(msg: Chat) -> dict:
    """Convert a Chat ORM object to a plain dict compatible with MessageOut."""
    return {
        "id": msg.id,
        "user_id": msg.user_id,
        "message": msg.message,
        "sender": msg.sender.value if hasattr(msg.sender, "value") else str(msg.sender),
        "image_url": msg.image_url,
        "is_read": msg.is_read,
        "created_at": msg.created_at,
    }


@router.post("/sessions")
def create_session(
    current_user: User = Depends(get_current_user),
):
    return {"id": str(current_user.id)}

@router.post("/upload", response_model=dict)
async def upload_chat_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image for chat messages. Returns the public URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{current_user.id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return the public URL path
    return {"image_url": f"/uploads/chat_images/{filename}"}

@router.post("/messages", response_model=MessageOut)
async def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sender = 'customer' if current_user.role == RoleEnum.customer else 'staff'
    new_message = Chat(
        user_id=message.user_id,
        message=message.text,
        sender=sender,
        image_url=message.image_url,
        is_read=0
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    payload = {
        "id": str(new_message.id),
        "customer_id": str(message.user_id),
        "user_id": str(message.user_id),
        "message": new_message.message,
        "image_url": new_message.image_url,
        "sender": sender,
        "created_at": new_message.created_at.isoformat(),
        "is_read": new_message.is_read
    }

    if sender == 'customer':
        # Echo back to the customer
        try:
            await manager.send_to_user(str(message.user_id), payload)
        except Exception:
            pass
        # Notify all connected staff
        try:
            await manager.broadcast_to_staff(payload)
        except Exception:
            pass
    else:
        # Staff replied — notify only the customer
        try:
            await manager.send_to_user(str(message.user_id), payload)
        except Exception:
            pass

    return serialize_chat(new_message)

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
    return [serialize_chat(m) for m in messages]

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

        recent_orders = db.query(Order).filter(Order.user_id == customer_id)\
            .order_by(desc(Order.created_at)).limit(3).all()

        conversations.append(ConversationOut(
            customer_id=UUID(customer_id),
            user_name=f"{customer.first_name or ''} {customer.last_name or ''}".strip() or customer.username,
            unread_count=unread_count,
            last_message=recent_message.message if recent_message else "",
            recent_orders=[{
                "order_number": f"ORD-{o.id.hex[:8].upper()}",
                "product": o.product.name if o.product else (o.arrangement.name if o.arrangement else "Custom"),
                "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
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
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    db: Session = Depends(get_db),
):
    # Determine if this user is staff/admin
    user = db.query(User).filter(User.id == user_id).first()
    is_staff = user and user.role in [RoleEnum.admin, RoleEnum.staff]

    await manager.connect(websocket, user_id, is_staff=is_staff)
    try:
        while True:
            data = await websocket.receive_json()
            # Real-time: if message comes through WS directly
            data["customer_id"] = data.get("customer_id", user_id)
            if is_staff:
                # Staff sending to a customer
                target = data.get("customer_id")
                if target:
                    await manager.send_to_user(target, data)
            else:
                # Customer sending — notify all staff
                await manager.broadcast_to_staff(data)
                await manager.send_to_user(user_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

