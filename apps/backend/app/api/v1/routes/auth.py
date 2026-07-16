from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import uuid
import os
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

load_dotenv()

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.services.email_service import generate_otp, send_otp_email
from app.core.dependencies import get_current_user
from pydantic import BaseModel, EmailStr, field_validator 
from typing import Optional
from authlib.integrations.starlette_client import OAuth
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token


from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])


FRONTEND_URL = os.getenv("FRONTEND_URL", "https://estings.shop")
BACKEND_URL = os.getenv("BACKEND_URL", "https://api.estings.shop")


FRONTEND_URL = FRONTEND_URL.rstrip("/")
BACKEND_URL = BACKEND_URL.rstrip("/")

GOOGLE_REDIRECT_URI  = f"{BACKEND_URL}/api/v1/auth/google/callback"
FACEBOOK_REDIRECT_URI = f"{BACKEND_URL}/api/v1/auth/facebook/callback"
LOCAL_FRONTEND_URLS = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
}
ALLOWED_FRONTEND_URLS = {
    FRONTEND_URL,
    "https://estings.shop",
    "https://www.estings.shop",
    *LOCAL_FRONTEND_URLS,
    *{
        origin.strip().rstrip("/")
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    },
}

DISPOSABLE_EMAIL_DOMAINS = {
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "minitts.net",
    "tempmail.com",
    "temp-mail.org",
    "throwawaymail.com",
    "yopmail.com",
    "solarnyx.com",
}
DISPOSABLE_EMAIL_KEYWORDS = (
    "10minute",
    "disposable",
    "guerrilla",
    "minit",
    "throwaway",
    "temp",
    "yopmail",
)

TEMP_EMAIL_MESSAGE = "Temporary or disposable email addresses are not supported. Please use a personal email address you can access."

def is_disposable_email(email: str) -> bool:
    domain = email.split("@")[-1].strip().lower()
    return domain in DISPOSABLE_EMAIL_DOMAINS or any(keyword in domain for keyword in DISPOSABLE_EMAIL_KEYWORDS)

def allow_dev_otp_fallback() -> bool:
    app_env = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()
    return app_env not in {"production", "prod"}


def _safe_email_delivery_log(error: str | None) -> str:
    text = str(error or "")
    if "not owned by user" in text or "sender address rejected" in text or "5.7.1" in text or "553" in text:
        return "SMTP sender is not verified or not allowed by the email provider."
    return text or "Unknown email delivery error."

def normalize_frontend_url(value: str | None) -> str:
    if not value:
        return FRONTEND_URL

    normalized = value.strip().rstrip("/")
    return normalized if normalized in ALLOWED_FRONTEND_URLS else FRONTEND_URL

def oauth_frontend_url(request: Request) -> str:
    return normalize_frontend_url(request.session.pop("oauth_frontend_url", FRONTEND_URL))


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
    preferred_currency: Optional[str] = "PHP"
    
    @field_validator('password')
    @classmethod
    def password_must_be_reasonable_length(cls, v):
        if len(v) > 72:
            raise ValueError('Password is too long (max 72 characters)')
        return v

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str # 🚀 Added support for full token lifecycle responses
    token_type: str = "bearer"
    user: dict

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Secure OAuth Token Exchange ───────────────────────────────────────────────
oauth_exchange_serializer = URLSafeTimedSerializer(
    settings.SECRET_KEY,
    salt="oauth-token-exchange",
)
OAUTH_EXCHANGE_MAX_AGE_SECONDS = 120

def store_oauth_tokens(access_token: str, refresh_token: str, role: str) -> str:
    """Return a short-lived signed code safe for frontend redirects."""
    return oauth_exchange_serializer.dumps({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": role,
    })

@router.get("/oauth/exchange")
def exchange_oauth_code(code: str):
    """Frontend calls this immediately after redirect."""
    try:
        data = oauth_exchange_serializer.loads(
            code,
            max_age=OAUTH_EXCHANGE_MAX_AGE_SECONDS,
        )
    except SignatureExpired:
        raise HTTPException(status_code=400, detail="OAuth login expired. Please try again.")
    except BadSignature:
        raise HTTPException(status_code=400, detail="Invalid OAuth login code.")

    return {
        "access_token": data["access_token"], 
        "refresh_token": data["refresh_token"], 
        "role": data["role"], 
        "token_type": "bearer"
    }


# ── Helpers ───────────────────────────────────────────────────────────────────
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
    if is_disposable_email(payload.email):
        raise HTTPException(status_code=400, detail=TEMP_EMAIL_MESSAGE)

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
        print(f"Registration OTP email delivery failed for {payload.email}: {_safe_email_delivery_log(error)}")
        if allow_dev_otp_fallback():
            print(f"[DEV OTP FALLBACK] Email delivery failed, but OTP remains valid for {payload.email}: {otp}")
            return {
                "status": "success",
                "message": "Verification code generated. Email delivery is unavailable in local development; use the OTP printed in the backend terminal.",
                "delivery": "dev_fallback",
            }
        raise HTTPException(
            status_code=500,
            detail="We couldn't send the verification code right now. Please try again later or use another email address.",
        )

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
    if len(payload.password) > 72:
        raise HTTPException(status_code=400, detail="Password is too long (max 72 characters).")

    try:
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
        
        # Username logic
        if payload.username:
            if db.query(User).filter(User.username == payload.username).first():
                raise HTTPException(status_code=400, detail="Username already taken.")
            user.username = payload.username
        else:
            user.username = generate_username(payload.email, db)
        
        # Hashing now uses the pure bcrypt implementation
        user.password_hash = hash_password(payload.password)
        user.phone_number = payload.phone_number
        user.address = payload.address
        user.preferred_currency = payload.preferred_currency or "PHP"
        user.is_verified = True
        user.is_active = True
        user.role = RoleEnum.customer
        
        db.commit()
        db.refresh(user)
        return {"status": "success", "message": "Account created successfully.", "user_id": str(user.id)}

    except IntegrityError as e:
        db.rollback() 
        raise HTTPException(status_code=400, detail="Email or Username conflict.")
    except HTTPException:
        db.rollback()
        raise
        
    except Exception as e:
        db.rollback()
        print(f"CRITICAL REGISTRATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during registration.")

# ── Forgot Password ───────────────────────────────────────────────────────────
@router.post("/forgot-password/send-otp")
@limiter.limit("3/minute")
def forgot_password_send_otp(request: Request, payload: SendOTPRequest, db: Session = Depends(get_db)):
    if is_disposable_email(payload.email):
        raise HTTPException(status_code=400, detail=TEMP_EMAIL_MESSAGE)

    user = db.query(User).filter(User.email == payload.email).first()
    generic_response = {
        "status": "success",
        "message": "If an account exists for this email, a reset code has been sent.",
    }

    if not user or not user.is_verified:
        return generic_response

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    user.otp_code = otp
    user.otp_expires_at = expires_at
    db.commit()

    sent, error = send_otp_email(payload.email, otp, first_name=user.first_name)
    if not sent:
        print(f"Password reset OTP email delivery failed for {payload.email}: {_safe_email_delivery_log(error)}")
        if allow_dev_otp_fallback():
            print(f"[DEV OTP FALLBACK] Email delivery failed, but reset OTP remains valid for {payload.email}: {otp}")
            return {
                **generic_response,
                "delivery": "dev_fallback",
            }
        raise HTTPException(
            status_code=500,
            detail="We couldn't send the reset code right now. Please try again later or use another email address.",
        )

    return generic_response


@router.post("/forgot-password/reset")
def forgot_password_reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    if not user.otp_expires_at or user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
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
    
    if not user:
        print(f"DEBUG: No user found for: {payload.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    
    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        print(f"DEBUG: Password mismatch for user: {user.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user.")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email first.")

    # 🚀 Tokens generated ONLY if all checks pass
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "username": user.username,
            "phone_number": user.phone_number,
            "address": user.address,
            "branch": user.branch.value if hasattr(user.branch, 'value') else user.branch,
            "rider_is_available": bool(getattr(user, "rider_is_available", True)),
            "profile_picture_url": getattr(user, 'profile_picture_url', None)
        }
    }


# ── Refresh Token ─────────────────────────────────────────────────────────────
@router.post("/refresh")
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    token_payload = decode_token(payload.refresh_token, expected_type="refresh")

    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user_id = token_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user = db.query(User).filter(User.id == user_uuid).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first.")

    return {
        "access_token": create_access_token(data={"sub": str(user.id)}),
        "refresh_token": create_refresh_token(data={"sub": str(user.id)}),
        "token_type": "bearer",
    }


# ── Google OAuth ──────────────────────────────────────────────────────────────
@router.get("/google")
async def google_login(request: Request):
    request.session["oauth_frontend_url"] = normalize_frontend_url(
        request.query_params.get("frontend_url")
    )
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URI)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    frontend_url = oauth_frontend_url(request)
    login_url = f"{frontend_url}/login"
    oauth_callback_url = f"{frontend_url}/oauth/callback"

    error = request.query_params.get("error")
    if error:
        return RedirectResponse(url=f"{login_url}?error=google_auth_failed")

    try:
        # 🚀 SECURITY FIX: Use Authlib wrapper to securely enforce and check state CSRF parameter
        token_data = await oauth.google.authorize_access_token(request)
        resp = await oauth.google.get("https://www.googleapis.com/oauth2/v2/userinfo", token=token_data)
        user_info = resp.json()

        email = user_info.get("email")
        if not email:
            return RedirectResponse(url=f"{frontend_url}/?error=no_email")

        first_name = user_info.get("given_name", "")
        last_name = user_info.get("family_name", "User")

        user = find_or_create_oauth_user(email, first_name, last_name, db)
        
        # 🚀 FIX: Generate token pairs using unified security module
        jwt_access = create_access_token(data={"sub": str(user.id)})
        jwt_refresh = create_refresh_token(data={"sub": str(user.id)})
        
        role = user.role.value if hasattr(user.role, 'value') else user.role

        exchange_code = store_oauth_tokens(jwt_access, jwt_refresh, role)
        return RedirectResponse(url=f"{oauth_callback_url}?code={exchange_code}")

    except Exception as e:
        print("Google OAuth error:", e)
        return RedirectResponse(url=f"{login_url}?error=google_auth_failed")


# ── Facebook OAuth ────────────────────────────────────────────────────────────
@router.get("/facebook")
async def facebook_login(request: Request):
    request.session["oauth_frontend_url"] = normalize_frontend_url(
        request.query_params.get("frontend_url")
    )
    return await oauth.facebook.authorize_redirect(request, FACEBOOK_REDIRECT_URI)


@router.get("/facebook/callback")
async def facebook_callback(request: Request, db: Session = Depends(get_db)):
    frontend_url = oauth_frontend_url(request)
    login_url = f"{frontend_url}/login"
    oauth_callback_url = f"{frontend_url}/oauth/callback"

    error = request.query_params.get("error")
    if error:
        return RedirectResponse(url=f"{login_url}?error=facebook_auth_failed")

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
        

        jwt_access = create_access_token(data={"sub": str(user.id)})
        jwt_refresh = create_refresh_token(data={"sub": str(user.id)})
        
        role = user.role.value if hasattr(user.role, 'value') else user.role

        exchange_code = store_oauth_tokens(jwt_access, jwt_refresh, role)
        return RedirectResponse(url=f"{oauth_callback_url}?code={exchange_code}")

    except HTTPException as e:
        print("Facebook OAuth error:", e.detail)
        return RedirectResponse(url=f"{login_url}?error=facebook_email_required")
    except Exception as e:
        print("Facebook OAuth error:", e)
        return RedirectResponse(url=f"{login_url}?error=facebook_auth_failed")


# ── Me ────────────────────────────────────────────────────────────────────────
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "profile_picture_url": getattr(current_user, 'profile_picture_url', None),
        "preferred_currency": getattr(current_user, 'preferred_currency', "PHP"),
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "username": current_user.username,
        "phone_number": current_user.phone_number,
        "address": current_user.address,
        "branch": current_user.branch.value if hasattr(current_user.branch, 'value') else current_user.branch,
        "rider_is_available": bool(getattr(current_user, "rider_is_available", True)),
    }
