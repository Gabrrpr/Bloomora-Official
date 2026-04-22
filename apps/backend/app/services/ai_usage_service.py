from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timezone
from uuid import UUID

from app.models.ai_usage_log import AIUsageLog, DAILY_AI_LIMIT


def get_daily_usage_count(db: Session, user_id: UUID) -> int:
    """Returns how many times the user has used AI generation today."""
    today = datetime.now(timezone.utc).date()

    count = (
        db.query(func.count(AIUsageLog.id))
        .filter(
            AIUsageLog.user_id == user_id,
            cast(AIUsageLog.used_at, Date) == today,
        )
        .scalar()
    )
    return count or 0


def has_reached_daily_limit(db: Session, user_id: UUID) -> bool:
    """Returns True if the user has hit their 5 generations for today."""
    return get_daily_usage_count(db, user_id) >= DAILY_AI_LIMIT


def log_ai_usage(
    db: Session,
    user_id: UUID,
    prompt_text: str,
    image_url: str,
) -> AIUsageLog:
    """Logs a successful AI generation for the user."""
    log = AIUsageLog(
        user_id=user_id,
        prompt_text=prompt_text,
        image_url=image_url,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_remaining_generations(db: Session, user_id: UUID) -> int:
    """Returns how many AI generations the user has left today."""
    used = get_daily_usage_count(db, user_id)
    return max(0, DAILY_AI_LIMIT - used)