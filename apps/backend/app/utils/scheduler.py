from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models import ActivityLog

try:
    from apscheduler.schedulers.background import BackgroundScheduler
except ModuleNotFoundError:
    BackgroundScheduler = None


def cleanup_old_logs():
    """Finds and deletes activity logs older than 90 days."""
    db = SessionLocal()
    try:
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
        deleted_count = db.query(ActivityLog).filter(ActivityLog.created_at < ninety_days_ago).delete()
        db.commit()

        if deleted_count > 0:
            print(f"Successfully cleaned up {deleted_count} old activity logs.")
    except Exception as e:
        db.rollback()
        print(f"Error cleaning activity logs: {e}")
    finally:
        db.close()


def start_scheduler():
    """Initializes the background scheduler when the optional dependency is installed."""
    if BackgroundScheduler is None:
        print("Background scheduler disabled: install apscheduler to enable activity log cleanup.")
        return None

    scheduler = BackgroundScheduler()
    scheduler.add_job(cleanup_old_logs, "cron", hour=2, minute=0)
    scheduler.start()
    print("Background scheduler started.")
    return scheduler
