from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import io
import time
from PIL import Image

from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import User, RoleEnum, BranchEnum
from app.api.v1.routes.auth import hash_password, generate_username 
from pydantic import BaseModel, EmailStr
from app.services.email_service import send_otp_email, send_staff_confirm_email
from app.core.supabase import supabase

router = APIRouter(tags=["Users"]) 

# 🛡️ Hard limits for profile picture uploads
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

# ── Helpers ──────────────────────────────────────────────────────────────────
def serialize_user(u: User) -> dict:
    is_staff_verified = getattr(u, 'is_staff_verified', True)
    
    if not getattr(u, 'is_active', False):
        staff_status = "inactive"
    elif getattr(u, 'is_verified', False) and is_staff_verified:
        staff_status = "active"
    else:
        staff_status = "pending"

    return {
        "id": str(u.id),
        "first_name": getattr(u, 'first_name', ''),
        "middle_name": getattr(u, 'middle_name', ''),
        "last_name": getattr(u, 'last_name', ''),
        "username": getattr(u, 'username', ''),
        "email": getattr(u, 'email', ''),
        "phone_number": getattr(u, 'phone_number', ''),
        "address": getattr(u, 'address', ''),
        "role": u.role.value if hasattr(u.role, "value") else u.role,
        "branch": getattr(u.branch, 'value', u.branch) if u.branch else None,
        "is_active": getattr(u, 'is_active', False),
        "is_verified": getattr(u, 'is_verified', False),
        "is_staff_verified": is_staff_verified,
        "staff_status": staff_status,
        "must_change_password": getattr(u, 'must_change_password', False),
        
        "profile_picture_url": getattr(u, 'profile_picture_url', None),
        
        "created_at": u.created_at.isoformat() if getattr(u, 'created_at', None) else None,
        "updated_at": u.updated_at.isoformat() if getattr(u, 'updated_at', None) else None,
    }

# ── Schemas ──────────────────────────────────────────────────────────────────
class UserListResponse(BaseModel):
    total: int
    users: List[dict]

class StaffCreateRequest(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    username: Optional[str] = None
    role: str  
    branch: Optional[str] = None
    email: EmailStr
    phone_number: Optional[str] = None

class StaffActivateRequest(BaseModel):
    token: str
    password: str

class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    branch: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    must_change_password: Optional[bool] = None
    

# ── Routes ───────────────────────────────────────────────────────────────────
@router.get("/", response_model=UserListResponse)
def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff), # 🚀 Fully delegates security to the dependency
):
    query = db.query(User)

    if role:
        try: query = query.filter(User.role == RoleEnum(role.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    if branch:
        try: query = query.filter(User.branch == BranchEnum(branch.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid branch: {branch}")

    if status:
        status_lower = status.lower()
        if status_lower == "active":
            query = query.filter(User.is_active == True)
        elif status_lower == "inactive":
            query = query.filter(User.is_active == False)
        elif status_lower == "unverified":
            query = query.filter(User.is_verified == False)
        elif status_lower == "verified":
            query = query.filter(User.is_verified == True)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
                User.username.ilike(search_term),
            )
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    return {"total": total, "users": [serialize_user(u) for u in users]}


@router.post("/", response_model=dict, status_code=201)
def create_staff(
    payload: StaffCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    # 🚀 FIX: Use dot notation with the exact schema property names
    phone_input = payload.phone_number
    email_input = payload.email
    
    """Create a new staff/admin/delivery account. Generates an invite link."""

    try: role_enum = RoleEnum(payload.role.lower())
    except ValueError: raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    if role_enum == RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Use customer registration for customer accounts.")
    
    # 🚀 This duplicate check will now work perfectly
    if phone_input:
        existing_phone = db.query(User).filter(User.phone_number == phone_input).first()
        if existing_phone:
            raise HTTPException(
                status_code=400, 
                detail="This phone number is already registered to another account."
            )
            
    branch_enum = None
    if payload.branch:
        try: branch_enum = BranchEnum(payload.branch.lower())
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid branch: {payload.branch}")

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    username = payload.username or generate_username(payload.email, db)
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    dummy_hash = hash_password(secrets.token_urlsafe(16))

    new_user = User(
        id=uuid.uuid4(),
        first_name=payload.first_name,
        middle_name=payload.middle_name,
        last_name=payload.last_name,
        username=username,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=dummy_hash, 
        role=role_enum,
        branch=branch_enum,
        is_active=True,
        is_verified=False, 
        is_staff_verified=False,
        staff_verification_token=token,
        staff_token_expires_at=expires_at,
    )

    # 1. Add the user to the session (but DON'T commit yet)
    db.add(new_user)
    
    # 2. Try to send the email FIRST
    verify_url = f"http://localhost:5173/activate-staff?token={token}"
    sent, error = send_staff_confirm_email(payload.email, payload.first_name, verify_url)
    
    if not sent:
        # 🚀 THE FIX: If the email fails, rollback the database so no duplicate is left behind!
        db.rollback() 
        raise HTTPException(status_code=400, detail=f"Failed to send invite email. Please check if the email address is valid.")

    # 3. Only if the email was sent successfully, permanently save to the database
    db.commit()
    db.refresh(new_user)

    return {"status": "success", "user_id": str(new_user.id), "message": "Staff invited successfully."}


@router.post("/{user_id}/resend-invite", response_model=dict)
def resend_staff_invite(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Resend the invite email with a fresh token."""

    try: user_uuid = uuid.UUID(user_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if getattr(user, 'is_staff_verified', False):
        raise HTTPException(status_code=400, detail="User is already verified and active.")

    new_token = secrets.token_urlsafe(32)
    user.staff_verification_token = new_token
    user.staff_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()

    verify_url = f"http://localhost:5173/activate-staff?token={new_token}"
    sent, error = send_staff_confirm_email(user.email, user.first_name, verify_url)
    
    if not sent:
        raise HTTPException(status_code=500, detail=f"Failed to resend confirmation email: {error}")

    return {"status": "success", "message": "Invitation email resent successfully."}


@router.post("/staff/activate")
def activate_staff_account(payload: StaffActivateRequest, db: Session = Depends(get_db)):
    """The endpoint the React frontend hits when the staff sets their new password."""
    
    user = db.query(User).filter(
        User.staff_verification_token == payload.token,
        User.staff_token_expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link. Please ask your administrator to resend the invite.")
    
    user.password_hash = hash_password(payload.password)
    user.is_verified = True
    user.is_staff_verified = True
    user.must_change_password = False
    
    user.staff_verification_token = None
    user.staff_token_expires_at = None
    user.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    return {"status": "success", "message": "Account activated successfully. You can now log in."}


@router.get("/{user_id}", response_model=dict)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # 👈 Kept get_current_user to allow self-access
):
    try: user_uuid = uuid.UUID(user_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # 🛡️ Explicit IDOR check: You can only see your own profile, unless you are staff
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if str(current_user.id) != user_id and role_val not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="You do not have permission to view this profile.")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    return serialize_user(user)


@router.patch("/me", response_model=dict)
def update_me(
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = current_user
    if payload.first_name is not None: user.first_name = payload.first_name
    if payload.middle_name is not None: user.middle_name = payload.middle_name
    if payload.last_name is not None: user.last_name = payload.last_name
    if payload.phone_number is not None: user.phone_number = payload.phone_number
    if payload.address is not None: user.address = payload.address

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return {"status": "success", "message": "Profile updated successfully.", "user": serialize_user(user)}


@router.post("/profile/upload-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        file_bytes = await file.read()
        
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported file extension. Use JPG, PNG, or WEBP.")

        try:
            img = Image.open(io.BytesIO(file_bytes))
            img.verify() 
        except Exception:
            raise HTTPException(status_code=400, detail="Malicious or corrupted file detected.")

        # 🚀 1. CLEANUP: Delete old avatars in this user's folder first
        try:
            old_files = supabase.storage.from_("avatars").list(str(current_user.id))
            if old_files:
                paths = [f"{current_user.id}/{f['name']}" for f in old_files]
                supabase.storage.from_("avatars").remove(paths)
        except Exception:
            pass # Ignore cleanup errors if folder is empty

        # 🚀 2. CACHE BUSTER: Add a timestamp to guarantee a unique URL
        timestamp = int(time.time())
        file_path = f"{current_user.id}/avatar_{timestamp}.{ext}"

        # Upload to Supabase Storage
        supabase.storage.from_("avatars").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": f"image/{ext}"}
        )

        public_url = supabase.storage.from_("avatars").get_public_url(file_path)

        current_user.profile_picture_url = public_url
        db.commit()

        return {"success": True, "message": "Profile picture updated", "url": public_url}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.delete("/profile/picture")
def remove_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Removes the user's profile picture from both the database and Supabase storage."""
    try:
        if not current_user.profile_picture_url:
            return {"success": True, "message": "No picture to remove"}

        try:
            files_to_remove = supabase.storage.from_("avatars").list(str(current_user.id))
            if files_to_remove:
                paths = [f"{current_user.id}/{f['name']}" for f in files_to_remove]
                supabase.storage.from_("avatars").remove(paths)
        except Exception as storage_e:
            print(f"Notice: Failed to delete from Supabase storage: {storage_e}")

        current_user.profile_picture_url = None
        current_user.updated_at = datetime.now(timezone.utc)

        db.commit()

        return {"success": True, "message": "Profile picture removed successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{user_id}", response_model=dict)
def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff), # 🚀 Fully delegates security
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found.")

    if payload.first_name is not None: user.first_name = payload.first_name
    if payload.middle_name is not None: user.middle_name = payload.middle_name
    if payload.last_name is not None: user.last_name = payload.last_name
    if payload.phone_number is not None: user.phone_number = payload.phone_number
    if payload.address is not None: user.address = payload.address
    if payload.is_active is not None: user.is_active = payload.is_active
    if payload.is_verified is not None: user.is_verified = payload.is_verified
    if payload.must_change_password is not None: user.must_change_password = payload.must_change_password
    if payload.role is not None:
        try: user.role = RoleEnum(payload.role.lower())
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")
    if payload.branch is not None:
        if payload.branch == "": user.branch = None
        else:
            try: user.branch = BranchEnum(payload.branch.lower())
            except ValueError: raise HTTPException(status_code=400, detail=f"Invalid branch: {payload.branch}")

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "User updated successfully.", "user": serialize_user(user)}