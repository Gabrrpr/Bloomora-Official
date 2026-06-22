from sqlalchemy.orm import Session
from app.models import ActivityLog  # Adjust import based on where your models live

def log_activity(db: Session, action: str, user=None, details: str = None, user_id=None, **kwargs):
    """
    Safely drops an activity log into the database.
    Automatically extracts user ID, role, and branch from the user object.
    """
    try:
        user_id = None
        role = None
        branch = "Manila" # Fallback default

        # Extract data directly from the user object if provided
        if user:
            user_id = str(user.id)
            role = user.role.value if hasattr(user.role, 'value') else str(user.role)
            branch = user.branch.value if hasattr(user.branch, 'value') else (user.branch or "Manila")

        new_log = ActivityLog(
            user_id=user_id,
            role=role,
            branch=branch.title(), # Ensures clean capitalization like "Pampanga"
            action=action,
            details=details # Replaced ip_address with details
        )
        
        db.add(new_log)
        db.commit()
        
    except Exception as e:
        print(f"⚠️ Failed to save activity log: {e}")
        db.rollback()