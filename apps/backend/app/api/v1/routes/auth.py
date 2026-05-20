from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
import uuid
import httpx
import secrets

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.services.email_service import generate_otp, send_otp_email
from app.core.dependencies import get_current_user
from pydantic import BaseModel, EmailStr
from typing import Optional
from authlib.integrations.starlette_client import OAuth

# Import the limiter from your main app instance
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_REDIRECT_URI  = "http://localhost:8000/api/v1/auth/google/callback"
FACEBOOK_REDIRECT_URI = "http://localhost:8000/api/v1/auth/facebook/callback"
FRONTEND_URL = "http://localhost:5173"

# ── OAuth Setup ───────────────────────────────────────────────────────────────
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


# ── Schemas ───────────────────────────────────────────────────────────────────
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
    address: Optional[str] = None
    username: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


# ── Secure OAuth Token Exchange ───────────────────────────────────────────────
# In-memory store (Consider Redis for production)
_oauth_codes: dict[str, dict] = {}

def store_oauth_token(jwt_token: str, role: str) -> str:
    """Store token server-side, return a one-time code safe for URL."""
    code = secrets.token_urlsafe(32)
    _oauth_codes[code] = {"token": jwt_token, "role": role}
    return code

@router.get("/oauth/exchange")
def exchange_oauth_code(code: str):
    """Frontend calls this immediately after redirect to get the real token."""
    data = _oauth_codes.pop(code, None)   # one-time use
    if not data:
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    return {"access_token": data["token"], "role": data["role"], "token_type": "bearer"}


# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Added "type": "access" for strict token validation
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def generate_username(email: str, db: Session) -> str:
    base = email.split('@')[0]
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}{counter}"
        counter += 1
    return username

def find_or_create_oauth_user(email: str, first_name: str, last_name: str, db: Session) -> User:
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
    else:
        # Don't override is_active — admin may have deactivated this account
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled.")
            
        user.is_verified = True
        if not user.first_name:
            user.first_name = first_name
        if not user.last_name:
            user.last_name = last_name
        db.commit()
        db.refresh(user)
    return user


# ── OTP Routes ────────────────────────────────────────────────────────────────
@router.post("/send-otp")
@limiter.limit("3/minute")
def send_otp(request: Request, payload: SendOTPRequest, db: Session = Depends(get_db)):
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


# ── Register ──────────────────────────────────────────────────────────────────
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
    if payload.username:
        if db.query(User).filter(User.username == payload.username).first():
            raise HTTPException(status_code=400, detail="Username already taken.")
        user.username = payload.username
    else:
        user.username = generate_username(payload.email, db)
    user.password_hash = hash_password(payload.password)
    user.phone_number = payload.phone_number
    user.address = payload.address
    user.is_verified = True
    user.is_active = True
    user.role = RoleEnum.customer
    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "Account created successfully.", "user_id": str(user.id)}


# ── Forgot Password ───────────────────────────────────────────────────────────
@router.post("/forgot-password/send-otp")
@limiter.limit("3/minute")
def forgot_password_send_otp(request: Request, payload: SendOTPRequest, db: Session = Depends(get_db)):
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


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == payload.email) | (User.email == payload.email)
    ).first()
    
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user.")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email first.")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


# ── Google OAuth ──────────────────────────────────────────────────────────────
@router.get("/google")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URI)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    error = request.query_params.get("error")
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=google_auth_failed")

    code = request.query_params.get("code")
    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=no_code")

    try:
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                }
            )
            token_data = token_res.json()

            if "error" in token_data:
                print("Token exchange error:", token_data)
                return RedirectResponse(url=f"{FRONTEND_URL}/?error=token_exchange_failed")

            access_token = token_data.get("access_token")

            profile_res = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = profile_res.json()

        email = user_info.get("email")
        if not email:
            return RedirectResponse(url=f"{FRONTEND_URL}/?error=no_email")

        first_name = user_info.get("given_name", "")
        last_name = user_info.get("family_name", "User")

        user = find_or_create_oauth_user(email, first_name, last_name, db)
        jwt_token = create_access_token(str(user.id))
        role = user.role.value if hasattr(user.role, 'value') else user.role

        # Store token securely and redirect with one-time code
        exchange_code = store_oauth_token(jwt_token, role)
        return RedirectResponse(url=f"{FRONTEND_URL}/oauth/callback?code={exchange_code}")

    except Exception as e:
        print("Google OAuth error:", e)
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=google_auth_failed")


# ── Facebook OAuth ────────────────────────────────────────────────────────────
@router.get("/facebook")
async def facebook_login(request: Request):
    return await oauth.facebook.authorize_redirect(request, FACEBOOK_REDIRECT_URI)


@router.get("/facebook/callback")
async def facebook_callback(request: Request, db: Session = Depends(get_db)):
    error = request.query_params.get("error")
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=facebook_auth_failed")

    try:
        token = await oauth.facebook.authorize_access_token(request)
        resp = await oauth.facebook.get("me?fields=id,name,email", token=token)
        user_info = resp.json()

        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Facebook email permission not granted.")

        name_parts = user_info.get("name", "").split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "User"

        user = find_or_create_oauth_user(email, first_name, last_name, db)
        jwt_token = create_access_token(str(user.id))
        role = user.role.value if hasattr(user.role, 'value') else user.role

        # Store token securely and redirect with one-time code
        exchange_code = store_oauth_token(jwt_token, role)
        return RedirectResponse(url=f"{FRONTEND_URL}/oauth/callback?code={exchange_code}")

    except HTTPException:
        raise
    except Exception as e:
        print("Facebook OAuth error:", e)
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=facebook_auth_failed")


# ── Me ────────────────────────────────────────────────────────────────────────
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "profile_picture_url": getattr(current_user, 'profile_picture_url', None),
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "username": current_user.username,
        "phone_number": current_user.phone_number,
        "address": current_user.address,

    }