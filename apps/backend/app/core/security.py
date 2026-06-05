import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.core.config import settings

def hash_password(password: str) -> str:
    # 1. Encode to bytes, truncate to 72 bytes to respect bcrypt limits
    pwd_bytes = password.encode('utf-8')[:72]
    # 2. Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    # 3. Decode back to string for storage
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # 1. Encode passwords to bytes
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        # 2. Check the password
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        # If hash is malformed or verification fails, return False safely
        return False

# ── JWT Operations ────────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["type"] = "access"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=7)
    payload["type"] = "refresh"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_token(token: str, expected_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != expected_type:
            return None
        return payload
    except JWTError:
        return None
