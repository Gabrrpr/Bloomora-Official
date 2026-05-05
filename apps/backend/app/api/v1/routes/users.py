from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, BranchEnum
from app.api.v1.routes.auth import hash_password, generate_username 
from pydantic import BaseModel, EmailStr
from app.services.email_service import send_otp_email, send_staff_confirm_email

router = APIRouter(tags=["Users"])

# ── Helpers ──────────────────────────────────────────────────────────────────
def require_admin_or_staff(current_user: User):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required.")

def serialize_user(u: User) -> dict:
    is_staff_verified = getattr(u, 'is_staff_verified', True)
    
    # Cleaned up staff status logic for better readability
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
        # Using cleaner Python ternary operators
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
    role: str  # admin, staff, delivery
    branch: Optional[str] = None
    email: EmailStr
    phone_number: Optional[str] = None
    password: str
    force_password_change: bool = True

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
    
@router.get("/", response_model=UserListResponse)
def list_users(
    role: Optional[str] = Query(None, description="Filter by role: customer, staff, admin, delivery"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    status: Optional[str] = Query(None, description="Filter by status: active, inactive, unverified"),
    search: Optional[str] = Query(None, description="Search by name, email, or username"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List users with filters. Admin/Staff only."""
    require_admin_or_staff(current_user)

    query = db.query(User)

    if role:
        try:
            query = query.filter(User.role == RoleEnum(role.lower()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    if branch:
        try:
            query = query.filter(User.branch == BranchEnum(branch.lower()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid branch: {branch}")

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
    current_user: User = Depends(get_current_user),
):
    """Create a new staff/admin/delivery account. Admin/Staff only."""
    require_admin_or_staff(current_user)

    # Validate role
    try:
        role_enum = RoleEnum(payload.role.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    if role_enum == RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Use customer registration for customer accounts.")

    # Validate branch if provided
    branch_enum = None
    if payload.branch:
        try:
            branch_enum = BranchEnum(payload.branch.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid branch: {payload.branch}")

    # Check email uniqueness
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Check username uniqueness
    username = payload.username
    if not username:
        username = generate_username(payload.email, db)
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")

    # Staff confirmation setup
    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    new_user = User(
        id=uuid.uuid4(),
        first_name=payload.first_name,
        middle_name=payload.middle_name,
        last_name=payload.last_name,
        username=username,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
        role=role_enum,
        branch=branch_enum,
        is_active=True,
        is_verified=True,
        must_change_password=payload.force_password_change,
        is_staff_verified=False,
        staff_verification_token=token,
        staff_token_expires_at=expires_at,
    )

    # Send confirmation email
    verify_url = f"http://localhost:8000/api/v1/users/staff/verify?token={token}"
    sent, error = send_staff_confirm_email(payload.email, payload.first_name, verify_url)
    if not sent:
        raise HTTPException(status_code=500, detail=f"Failed to send confirmation email: {error}")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"status": "success", "user_id": str(new_user.id), "message": "Staff account created successfully. Confirmation email sent."}

@router.get("/staff/verify")
def staff_verify(token: str = Query(..., description="Staff verification token"), db: Session = Depends(get_db)):
    """Verify staff account via email token."""
    user = db.query(User).filter(
        User.staff_verification_token == token,
        User.staff_token_expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")
    
    user.is_staff_verified = True
    user.staff_verification_token = None
    user.staff_token_expires_at = None
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"status": "success", "message": "Staff account verified successfully. You can now login."}


@router.get("/{user_id}", response_model=dict)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Security fix: Requires auth
):
    """Get user by ID. Requires auth. Users can only view themselves unless Admin/Staff."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Security check: Make sure standard users can't pull other people's PII
    if str(current_user.id) != user_id and current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="You do not have permission to view this profile.")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return serialize_user(user)


@router.patch("/me", response_model=dict)
def update_me(
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's own profile."""
    user = current_user

    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.middle_name is not None:
        user.middle_name = payload.middle_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    if payload.address is not None:
        user.address = payload.address

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "Profile updated successfully.", "user": serialize_user(user)}


@router.patch("/{user_id}", response_model=dict)
def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user. Admin/Staff only."""
    require_admin_or_staff(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.middle_name is not None:
        user.middle_name = payload.middle_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    if payload.address is not None:
        user.address = payload.address
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified
    if payload.must_change_password is not None:
        user.must_change_password = payload.must_change_password
    if payload.role is not None:
        try:
            user.role = RoleEnum(payload.role.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")
    if payload.branch is not None:
        if payload.branch == "":
            user.branch = None
        else:
            try:
                user.branch = BranchEnum(payload.branch.lower())
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid branch: {payload.branch}")

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "User updated successfully.", "user": serialize_user(user)}

