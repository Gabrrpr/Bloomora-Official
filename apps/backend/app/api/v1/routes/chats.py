from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
import uuid
from datetime import datetime, timezone

from app.core.dependencies import get_db, get_current_user
from app.core.connection_manager import manager
from app.models import Chat, User, RoleEnum, SenderEnum
from app.schemas.chat import ChatMessageOut, ChatHistoryOut

router = APIRouter(prefix="/chats", tags=["Chats"])


# ---------------------------------------------------------------------------
# REST — Load chat history
# ---------------------------------------------------------------------------

@router.get("/history/{user_id}", response_model=List[ChatMessageOut])
def get_chat_history(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the full message history for a given user_id.
    - Customers can only fetch their own history.
    - Staff and Admin can fetch any user's history.
    """
    if current_user.role == RoleEnum.customer:
        if str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own chat history."
            )

    messages = (
        db.query(Chat)
        .filter(Chat.user_id == user_id)
        .order_by(Chat.created_at.asc())
        .all()
    )
    return messages


@router.get("/conversations", response_model=List[ChatHistoryOut])
def get_all_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Staff/Admin only — returns a list of all users who have sent messages,
    with their latest message and online status.
    """
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff and admin can view all conversations."
        )

    # Get distinct users who have chats, with their latest message
    subquery = (
        db.query(Chat.user_id, Chat.message, Chat.created_at, Chat.is_read)
        .order_by(Chat.user_id, Chat.created_at.desc())
        .distinct(Chat.user_id)
        .subquery()
    )

    results = db.query(User, subquery).join(subquery, User.id == subquery.c.user_id).all()

    conversations = []
    for user, *chat_data in results:
        conversations.append({
            "user_id": str(user.id),
            "username": user.username,
            "full_name": f"{user.first_name} {user.last_name}",
            "latest_message": chat_data[1] if chat_data else None,
            "last_message_at": chat_data[2] if chat_data else None,
            "is_online": manager.is_online(str(user.id)),
            "unread_count": db.query(Chat).filter(
                Chat.user_id == user.id,
                Chat.is_read == 0,
                Chat.sender == SenderEnum.customer
            ).count()
        })

    return conversations


@router.patch("/history/{user_id}/read")
def mark_messages_as_read(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all messages from a customer as read — called when staff opens the conversation."""
    db.query(Chat).filter(
        Chat.user_id == user_id,
        Chat.is_read == 0
    ).update({"is_read": 1})
    db.commit()
    return {"detail": "Messages marked as read."}


# ---------------------------------------------------------------------------
# WebSocket — Real-time messaging
# ---------------------------------------------------------------------------

@router.websocket("/ws/{user_id}")
async def websocket_chat(
    websocket: WebSocket,
    user_id: str,
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time chat.

    Flow:
    - Customer connects with their user_id
    - Staff connects with their own user_id
    - When customer sends a message:
        1. Message is saved to DB
        2. Echoed back to customer
        3. Broadcast to all online staff
    - When staff sends a message:
        1. Message is saved to DB (linked to the customer's user_id)
        2. Sent to the specific customer
    """
    await manager.connect(websocket, user_id)

    # Identify the sender
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=4001)
        return

    is_staff = user.role in [RoleEnum.admin, RoleEnum.staff]

    try:
        while True:
            data = await websocket.receive_json()

            # Expected payload:
            # { "message": "...", "target_user_id": "..." (staff only) }
            message_text = data.get("message", "").strip()
            target_user_id = data.get("target_user_id")  # staff specifies which customer

            if not message_text:
                continue

            sender_enum = SenderEnum.staff if is_staff else SenderEnum.customer

            # Determine which user_id to store the chat under (always the customer)
            chat_user_id = target_user_id if is_staff and target_user_id else user_id

            # Save to database
            new_message = Chat(
                id=uuid.uuid4(),
                user_id=chat_user_id,
                message=message_text,
                sender=sender_enum,
                is_read=0,
                created_at=datetime.now(timezone.utc),
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)

            # Build message payload
            payload = {
                "id": str(new_message.id),
                "message": message_text,
                "sender": sender_enum.value,
                "user_id": chat_user_id,
                "created_at": new_message.created_at.isoformat(),
            }

            if is_staff:
                # Staff → send to the specific customer
                await manager.send_to_user(chat_user_id, payload)
                # Echo back to staff too (so their UI updates)
                await manager.send_to_user(user_id, payload)
            else:
                # Customer → echo back to themselves
                await manager.send_to_user(user_id, payload)

                # Broadcast to all online staff
                online_users = manager.get_online_users()
                staff_users = db.query(User).filter(
                    User.id.in_(online_users),
                    User.role.in_([RoleEnum.admin, RoleEnum.staff])
                ).all()
                staff_ids = [str(s.id) for s in staff_users]
                await manager.broadcast_to_staff(payload, staff_ids)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)