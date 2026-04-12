from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import bcrypt
import uuid

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, RoleEnum
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str
    middle_name: Optional[str] = None
    phone_number: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Helpers ───────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ── Routes ────────────────────────────────────────────────────────────────
@router.post("/register", status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")

    user = User(
        id=uuid.uuid4(),
        first_name=payload.first_name,
        middle_name=payload.middle_name,
        last_name=payload.last_name,
        username=payload.username,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
        role=RoleEnum.customer,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User registered successfully.", "user_id": str(user.id)}


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user.")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)