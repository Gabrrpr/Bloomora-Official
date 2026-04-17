from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
import uuid

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.services.email_service import generate_otp, send_otp_email
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────
class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class RegisterRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
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
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def generate_username(email: str, db: Session) -> str:
    base = email.split('@')[0]
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}{counter}"
        counter += 1
    return username


# ── Routes ────────────────────────────────────────────────────────────────

@router.post("/send-otp")
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()

    if existing and existing.is_verified:
        raise HTTPException(status_code=400, detail="Email already registered.")

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    if existing:
        existing.otp_code = otp
        existing.otp_expires_at = expires_at
        db.commit()
    else:
        placeholder = User(
            id=uuid.uuid4(),
            email=payload.email,
            first_name="",
            last_name="",
            username=generate_username(payload.email, db),
            password_hash="",
            otp_code=otp,
            otp_expires_at=expires_at,
            is_verified=False,
            is_active=False,
            role=RoleEnum.customer,
        )
        db.add(placeholder)
        db.commit()

    sent = send_otp_email(payload.email, otp)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email.")

    return {"status": "success", "message": "OTP sent to email."}


@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found.")
    if user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
    if user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired.")

    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    return {"status": "success", "message": "OTP verified."}


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Please verify your email first.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already registered.")
    if user.otp_code is not None:
        raise HTTPException(status_code=400, detail="Please verify your OTP first.")

    user.first_name = payload.first_name
    user.middle_name = payload.middle_name
    user.last_name = payload.last_name
    user.username = generate_username(payload.email, db)
    user.password_hash = hash_password(payload.password)
    user.phone_number = payload.phone_number
    user.is_verified = True
    user.is_active = True
    user.role = RoleEnum.customer
    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "Account created successfully.", "user_id": str(user.id)}


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user.")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email first.")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)