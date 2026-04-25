import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE arrangements
        ALTER COLUMN generated_image_url TYPE TEXT;
    """))
    conn.execute(text("""
        ALTER TABLE ai_usage_logs
        ALTER COLUMN image_url TYPE TEXT;
    """))
    conn.commit()
    print("Migration complete: arrangements.generated_image_url and ai_usage_logs.image_url are now TEXT")
