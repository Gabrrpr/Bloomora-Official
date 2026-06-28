from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from typing import List
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models.user import RoleEnum, User
from app.models import Order, Product, Inventory, Chat

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_customer = current_user.role == RoleEnum.customer
    result = db.execute(
        text("""
            SELECT COUNT(*) FROM notifications
            WHERE (user_id = :uid OR is_global = true)
              AND is_read = FALSE
              AND NOT (:is_customer AND type = 'message' AND is_global = true)
              AND NOT (:is_customer AND target_role IS NOT NULL AND target_role != 'customer')
        """),
        {"uid": str(current_user.id), "is_customer": is_customer}
    ).scalar()
    return {"unread_count": result or 0}


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_customer = current_user.role == RoleEnum.customer
    rows = db.execute(
        text("""
            SELECT id, type, title, message, order_id, is_read, created_at
            FROM notifications
            WHERE (user_id = :uid OR is_global = true)
              AND NOT (:is_customer AND type = 'message' AND is_global = true)
              AND NOT (:is_customer AND target_role IS NOT NULL AND target_role != 'customer')
            ORDER BY created_at DESC
            LIMIT 30
        """),
        {"uid": str(current_user.id), "is_customer": is_customer}
    ).fetchall()

    return [
        {
            "id": str(r.id),
            "type": r.type,
            "title": r.title,
            "message": r.message,
            "order_id": str(r.order_id) if r.order_id else None,
            "is_read": r.is_read,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.execute(
        text("UPDATE notifications SET is_read = TRUE WHERE user_id = :uid"),
        {"uid": str(current_user.id)}
    )
    db.commit()
    return {"status": "success"}


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.execute(
        text("""
            UPDATE notifications SET is_read = TRUE
            WHERE id = :nid AND user_id = :uid
        """),
        {"nid": notification_id, "uid": str(current_user.id)}
    )
    db.commit()
    return {"status": "success"}


@router.get("/preferences")
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.execute(
        text("SELECT * FROM user_notification_preferences WHERE user_id = :uid"),
        {"uid": str(current_user.id)}
    ).fetchone()

    if not row:
        return {"order_updates": True, "promotions": True, "chat_messages": True}

    return {
        "order_updates": row.order_updates,
        "promotions": row.promotions,
        "chat_messages": row.chat_messages,
    }


@router.patch("/preferences")
def update_preferences(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.execute(
        text("""
            INSERT INTO user_notification_preferences (user_id, order_updates, promotions, chat_messages)
            VALUES (:uid, :order_updates, :promotions, :chat_messages)
            ON CONFLICT (user_id) DO UPDATE SET
                order_updates = EXCLUDED.order_updates,
                promotions    = EXCLUDED.promotions,
                chat_messages = EXCLUDED.chat_messages
        """),
        {
            "uid": str(current_user.id),
            "order_updates": payload.get("order_updates", True),
            "promotions":    payload.get("promotions", True),
            "chat_messages": payload.get("chat_messages", True),
        }
    )
    db.commit()
    return {"status": "success"}


@router.post("/seed")
def seed_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate notifications from existing system state (orders, inventory, chats)."""
    created = 0

    # 1. Recent orders without notification
    recent_orders = db.query(Order).order_by(desc(Order.created_at)).limit(20).all()
    existing_order_ids = {
        str(r.order_id)
        for r in db.execute(
            text("SELECT order_id FROM notifications WHERE type = 'order' AND order_id IS NOT NULL")
        ).fetchall()
    }
    for order in recent_orders:
        if str(order.id) in existing_order_ids:
            continue
        order_num = f"ORD-{order.id.hex[:8].upper()}"
        title = "New Order Received"
        message = f"Order {order_num} placed by {order.user.first_name if order.user else 'Customer'} for {order.branch_name}."
        db.execute(
            text("""
                INSERT INTO notifications (user_id, type, title, message, order_id, is_global)
                VALUES (:uid, 'order', :title, :message, :oid, true)
            """),
            {"uid": str(current_user.id), "title": title, "message": message, "oid": str(order.id)},
        )
        created += 1

    # 2. Low stock / OOS items
    low_stock_products = (
        db.query(Product, Inventory)
        .join(Inventory, Product.id == Inventory.product_id)
        .filter(Inventory.current_stock <= Inventory.reorder_point)
        .order_by(Inventory.current_stock.asc())
        .limit(10)
        .all()
    )
    for product, inventory in low_stock_products:
        if inventory.current_stock <= 0:
            title = "Critical: Out of Stock"
            message = f"{product.name} is now out of stock."
        else:
            title = "Low Stock Alert"
            message = f"{product.name} has only {inventory.current_stock} {inventory.unit_type or 'units'} left (reorder at {inventory.reorder_point})."
        db.execute(
            text("""
                INSERT INTO notifications (user_id, type, title, message, order_id, is_global)
                VALUES (:uid, 'inventory', :title, :message, NULL, true)
            """),
            {"uid": str(current_user.id), "title": title, "message": message},
        )
        created += 1

    # 3. Unread customer chats
    unread_chats = (
        db.query(Chat)
        .filter(Chat.is_read == 0, Chat.sender == "customer")
        .order_by(desc(Chat.created_at))
        .limit(10)
        .all()
    )
    for chat in unread_chats:
        db.execute(
            text("""
                INSERT INTO notifications (user_id, type, title, message, order_id, is_global)
                VALUES (NULL, 'message', 'New Customer Message', :message, NULL, true)
            """),
            {"message": chat.message},
        )
        created += 1

    db.commit()
    return {"status": "success", "created": created}
