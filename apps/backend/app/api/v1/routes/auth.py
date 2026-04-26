from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
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
from authlib.integrations.starlette_client import OAuth

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── OAuth Setup ───────────────────────────────────────────────────────────
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)
oauth.register(
    name='facebook',
    client_id=settings.FACEBOOK_CLIENT_ID,
    client_secret=settings.FACEBOOK_CLIENT_SECRET,
    access_token_url='https://graph.facebook.com/v20.0/oauth/access_token',
    authorize_url='https://www.facebook.com/v20.0/dialog/oauth',
    api_base_url='https://graph.facebook.com/v20.0/',
    client_kwargs={'scope': 'email public_profile'},
)


# ── Schemas ───────────────────────────────────────────────────────────────

# Add this schema at the top with the others
class LoginRequest(BaseModel):
    email: str
    password: str
    
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

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


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

    sent, error = send_otp_email(payload.email, otp)
    if not sent:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {error}")

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


@router.post("/forgot-password/send-otp")
def forgot_password_send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found.")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified. Please register first.")

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    user.otp_code = otp
    user.otp_expires_at = expires_at
    db.commit()

    sent, error = send_otp_email(payload.email, otp, first_name=user.first_name)
    if not sent:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {error}")

    return {"status": "success", "message": "OTP sent to email."}


@router.post("/forgot-password/reset")
def forgot_password_reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found.")
    if user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
    if user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired.")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user.password_hash = hash_password(payload.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    return {"status": "success", "message": "Password reset successfully."}


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    import json
    content_type = request.headers.get("content-type", "")
    body_bytes = await request.body()
    data = {}

    try:
        if "application/json" in content_type:
            data = json.loads(body_bytes.decode())
        else:
            # form-encoded (OAuth2 password flow from Swagger UI)
            from urllib.parse import parse_qs
            parsed = parse_qs(body_bytes.decode())
            data = {k: v[0] if v else "" for k, v in parsed.items()}
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid request body.")

    # Support both JSON keys (email/password) and OAuth2 form keys (username/password)
    email = data.get("email") or data.get("username")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=422, detail="Email/username and password are required.")

    user = db.query(User).filter(
        (User.username == email) | (User.email == email)
    ).first()
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user.")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email first.")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


# ── Google OAuth ──────────────────────────────────────────────────────────

@router.get("/google")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(
        request, 
        "http://localhost:8000/api/v1/auth/google/callback"
    )

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
    except Exception:
        code = request.query_params.get("code")
        token = await oauth.google.fetch_token(
            "https://oauth2.googleapis.com/token",
            code=code,
            redirect_uri="http://localhost:8000/api/v1/auth/google/callback",
        )
        resp = await oauth.google.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            token=token
        )
        user_info = resp.json()

    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to fetch Google user info.")

    email = user_info.get("email")
    first_name = user_info.get("given_name", "")
    last_name = user_info.get("family_name", "User")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email.")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            id=uuid.uuid4(),
            username=generate_username(email, db),
            email=email,
            first_name=first_name,
            last_name=last_name,
            password_hash="",
            is_verified=True,
            is_active=True,
            role=RoleEnum.customer,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(str(user.id))
    role = user.role.value if hasattr(user.role, 'value') else user.role
    frontend_url = f"http://localhost:5173/?token={access_token}&role={role}"
    return RedirectResponse(url=frontend_url)


# ── Facebook OAuth ────────────────────────────────────────────────────────

@router.get("/facebook")
async def facebook_login(request: Request):
    redirect_uri = settings.OAUTH_REDIRECT_URI + "/facebook"
    return await oauth.facebook.authorize_redirect(request, redirect_uri)

@router.get("/facebook/callback")
async def facebook_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.facebook.authorize_access_token(request)
    resp = await oauth.facebook.get("me?fields=id,name,email", token=token)
    user_info = resp.json()

    email = user_info.get("email")
    name_parts = user_info.get("name", "").split()
    first_name = name_parts[0] if name_parts else ""
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "User"

    if not email:
        raise HTTPException(status_code=400, detail="Facebook email permission not granted.")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            id=uuid.uuid4(),
            username=generate_username(email, db),
            email=email,
            first_name=first_name,
            last_name=last_name,
            password_hash="",
            is_verified=True,
            is_active=True,
            role=RoleEnum.customer,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(str(user.id))
    role = user.role.value if hasattr(user.role, 'value') else user.role
    return {"status": "success", "access_token": access_token, "role": role}

from app.core.dependencies import get_current_user

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "username": current_user.username,
        "phone_number": current_user.phone_number,
        "address": current_user.address,
    }
