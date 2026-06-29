from sqlalchemy.orm import Session
from app.models import ActivityLog, User

def log_activity(db: Session, action: str, user=None, details: str = None, user_id=None, **kwargs):
    """
    Safely drops an activity log into the database.
    Automatically extracts user ID, role, and branch from the user object.
    """
    try:
        role = kwargs.get("role")
        branch = kwargs.get("branch")
        ip_address = kwargs.get("ip_address")

        if user:
            user_id = str(user.id)
            role = user.role.value if hasattr(user.role, 'value') else str(user.role)
            branch = user.branch.value if hasattr(user.branch, 'value') else user.branch
        elif user_id:
            user_id = str(user_id)
            db_user = db.query(User).filter(User.id == user_id).first()
            if db_user:
                role = role or (db_user.role.value if hasattr(db_user.role, 'value') else str(db_user.role))
                branch = branch or (db_user.branch.value if hasattr(db_user.branch, 'value') else db_user.branch)
        else:
            user_id = None

        new_log = ActivityLog(
            user_id=user_id,
            role=role,
            branch=str(branch).title() if branch else None,
            action=action,
            details=details,
            ip_address=ip_address,
        )

        db.add(new_log)
        db.commit()

    except Exception as e:
        print(f"Failed to save activity log: {e}")
        db.rollback()
