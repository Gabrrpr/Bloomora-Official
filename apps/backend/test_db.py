from app.core.database import SessionLocal, engine
from app.models.user import User, RoleEnum
from sqlalchemy import text
import bcrypt
import uuid

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

print("Testing DB connection...")
try:
    with engine.connect() as conn:
        print("Engine connect OK")
        conn.execute(text("SELECT 1"))
        print("DB ping OK")
except Exception as e:
    print(f"DB connect fail: {e}")

print("\nTesting query User...")
try:
    db = SessionLocal()
    user = db.query(User).first()
    print("Query User OK, first user:", user.email if user else "no users")
    db.close()
except Exception as e:
    print(f"Query User fail: {e}")

print("\nCreating test user if not exists...")
try:
    db = SessionLocal()
    user = db.query(User).filter(User.email == 'gabriel@bloomora.com').first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            first_name='Gabriel',
            last_name='Test',
            username='gabrieltest',
            email='gabriel@bloomora.com',
            password_hash=hash_password('secret123'),
            is_verified=True,
            is_active=True,
            role=RoleEnum.customer
        )
        db.add(user)
        db.commit()
        print("Test user created")
    else:
        print("Test user exists")
        print("Password hash OK:", bcrypt.checkpw('secret123'.encode(), user.password_hash.encode()))
    db.close()
except Exception as e:
    print(f"Create user fail: {e}")

print("Test complete.")
