from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta, timezone
from app.models import ActivityLog

# IMPORTANT: Make sure this import points to your actual database session!
# If your get_db or SessionLocal is somewhere else, update this line.
from app.core.database import SessionLocal

def cleanup_old_logs():
    """Finds and deletes activity logs older than 90 days."""
    db = SessionLocal()
    try:
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
        
        # Execute the delete query
        deleted_count = db.query(ActivityLog).filter(ActivityLog.created_at < ninety_days_ago).delete()
        db.commit()
        
        if deleted_count > 0:
            print(f"🧹 Successfully cleaned up {deleted_count} old activity logs.")
            
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error cleaning activity logs: {e}")
    finally:
        db.close()

def start_scheduler():
    """Initializes the background scheduler."""
    scheduler = BackgroundScheduler()
    
    # Schedule the cleanup job to run every day at 2:00 AM
    scheduler.add_job(cleanup_old_logs, 'cron', hour=2, minute=0)
    
    scheduler.start()
    print("⏰ Background scheduler started.")