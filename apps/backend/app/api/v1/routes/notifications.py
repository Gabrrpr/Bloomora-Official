from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.execute(
        text("SELECT COUNT(*) FROM notifications WHERE user_id = :uid AND is_read = FALSE"),
        {"uid": str(current_user.id)}
    ).scalar()
    return {"unread_count": result or 0}


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.execute(
        text("""
            SELECT id, type, title, message, order_id, is_read, created_at
            FROM notifications
            WHERE user_id = :uid
            ORDER BY created_at DESC
            LIMIT 30
        """),
        {"uid": str(current_user.id)}
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
        # Return defaults if not yet set
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
