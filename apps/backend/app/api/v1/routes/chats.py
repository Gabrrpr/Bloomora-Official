from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from app.core.config import settings
from supabase import create_client, Client
import os
import shutil

from app.core.dependencies import get_db, get_current_user
from app.core.connection_manager import manager
from app.core.security import decode_token
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
        # 🚀 ADDED CONTEXT SUPPORT
        "context_id": getattr(msg, "context_id", None) 
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
    """Upload an image for chat messages to Supabase. Returns the public URL."""
    
    if not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase Service Key is not configured.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    try:
        # Initialize Supabase
        supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Generate unique filename
        ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        filename = f"{current_user.id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}.{ext}"
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Upload directly to Supabase cloud storage
        supabase_admin.storage.from_("chat_images").upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Get the permanent public https://... URL
        public_url = supabase_admin.storage.from_("chat_images").get_public_url(filename)
        
        return {"image_url": public_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
    
@router.delete("/messages/{message_id}", response_model=dict)
def delete_chat_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific chat message."""
    from app.models import Chat 
    
    import uuid
    try:
        valid_msg_id = uuid.UUID(message_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Message ID")
    
    msg = db.query(Chat).filter(Chat.id == valid_msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    is_staff = current_user.role in [RoleEnum.admin, RoleEnum.staff]
    if not is_staff and str(msg.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="You can only delete your own messages.")
        
    db.delete(msg)
    db.commit()
    
    return {"status": "success", "deleted_id": message_id}

@router.post("/messages", response_model=MessageOut)
async def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sender = 'customer' if current_user.role == RoleEnum.customer else 'staff'
    
    if sender == 'customer':
        verified_user_id = current_user.id
    else:
        verified_user_id = message.user_id
    
    new_message = Chat(
        user_id=message.user_id,
        message=message.text,
        sender=sender,
        image_url=message.image_url,
        is_read=0,
        context_id=message.context_id
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
        "is_read": new_message.is_read,
        "context_id": new_message.context_id
    }

    if sender == 'customer':
        try:
            await manager.send_to_user(str(message.user_id), payload)
        except Exception as e:
            print(f"❌ HTTP-WS Customer Echo Error: {e}")

        try:
            await manager.broadcast_to_staff(payload)
        except Exception as e:
            print(f"❌ HTTP-WS Staff Broadcast Error: {e}")

        try:
            db.execute(
                text("""
                    INSERT INTO notifications (user_id, type, title, message, order_id, is_global)
                    VALUES (NULL, 'message', 'New Message from Customer', :message, NULL, true)
                """),
                {
                    "message": f"Customer said: {new_message.message}",
                }
            )
            db.commit()
        except Exception as e:
            print(f"❌ Notification Insert Error: {e}")
            db.rollback()
    else:
        try:
            await manager.send_to_user(str(message.user_id), payload)
        except Exception as e:
            print(f"❌ HTTP-WS Customer Send Error: {e}")

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
        try:
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

            orders_list = []
            for o in recent_orders:
                try:
                    product_name = "Custom Order"
                    
                    # 🚀 THE FIX: Safely check for attributes before accessing them!
                    if hasattr(o, 'product_name') and o.product_name:
                        product_name = o.product_name
                    elif hasattr(o, 'product') and o.product and hasattr(o.product, 'name'):
                        product_name = o.product.name
                    elif hasattr(o, 'items') and o.items:
                        product_name = f"{len(o.items)} Item(s)"
                    elif hasattr(o, 'arrangement') and o.arrangement and hasattr(o.arrangement, 'name'):
                        product_name = o.arrangement.name
                    
                    orders_list.append({
                        "order_number": f"ORD-{o.id.hex[:8].upper()}",
                        "product": product_name,
                        "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
                        "total_amount": float(o.total_amount) if hasattr(o, 'total_amount') and o.total_amount else 0.0
                    })
                except Exception as e:
                    print(f"Error processing order {o.id}: {e}")
                    continue

            # 🚀 ADDED: user_avatar fetch
            conversations.append(ConversationOut(
                customer_id=UUID(customer_id),
                user_name=f"{customer.first_name or ''} {customer.last_name or ''}".strip() or customer.username,
                user_avatar=getattr(customer, "profile_picture_url", None),
                unread_count=unread_count,
                last_message=recent_message.message if recent_message else "",
                recent_orders=orders_list,
                last_message_time=recent_message.created_at if recent_message else None
            ))
        except Exception as e:
            print(f"Error building conversation for user {u_id[0]}: {e}")
            continue

    return ConversationList(conversations=conversations)

@router.patch("/history/{user_id}/read")
def mark_messages_as_read(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_staff = current_user.role in [RoleEnum.admin, RoleEnum.staff]
    if not is_staff and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
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
    token: str = Query(...), 
    db: Session = Depends(get_db),
):
    print(f"\n--- 🔌 NEW WS CONNECTION ATTEMPT --- ID: {user_id}")
    
    payload = decode_token(token, expected_type="access")
    
    if not payload:
        print("❌ WebSocket Auth Failed: Invalid or expired token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        token_user_id = payload.get("sub")
        
        if token_user_id != user_id and payload.get("role") not in ["admin", "staff"]:
            print("❌ WebSocket Auth Failed: ID mismatch (IDOR attempt)")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
    except Exception as e:
        print(f"❌ WebSocket Auth Failed: {e}")
        # 🚀 FIXED: Completed the broken syntax line here!
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        from uuid import UUID
        valid_uuid = UUID(user_id)
        user = db.query(User).filter(User.id == valid_uuid).first()
    except Exception as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    is_staff = False
    if user:
        role_val = user.role.value if hasattr(user.role, 'value') else str(user.role)
        if role_val.lower() in ['admin', 'staff', 'roleenum.admin', 'roleenum.staff']:
            is_staff = True

    await manager.connect(websocket, user_id, is_staff=is_staff)

    try:
        while True:
            data = await websocket.receive_json()
            data["customer_id"] = data.get("customer_id", user_id)
            
            if is_staff:
                target = data.get("customer_id")
                if target:
                    await manager.send_to_user(target, data)
            else:
                await manager.broadcast_to_staff(data)
                await manager.send_to_user(user_id, data)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)