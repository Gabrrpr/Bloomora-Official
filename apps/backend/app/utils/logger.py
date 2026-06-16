from sqlalchemy.orm import Session
from app.models import ActivityLog  # Adjust import based on where your models live

def log_activity(db: Session, action: str, user_id: str = None, role: str = None, ip_address: str = None):
    """Safely drops an activity log into the database."""
    try:
        new_log = ActivityLog(
            user_id=user_id,
            role=role,
            action=action,
            ip_address=ip_address
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        print(f"⚠️ Failed to save activity log: {e}")
        db.rollback()