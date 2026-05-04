from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, BranchEnum
from app.api.v1.routes.auth import hash_password, generate_username
from pydantic import BaseModel, EmailStr


router = APIRouter(tags=["Users"])


# ── Helpers ──────────────────────────────────────────────────────────────────
def require_admin_or_staff(current_user: User):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required.")

def serialize_user(u: User) -> dict:
    return {
        "id": str(u.id),
        "first_name": u.first_name,
        "middle_name": u.middle_name,
        "last_name": u.last_name,
        "username": u.username,
        "email": u.email,
        "phone_number": u.phone_number,
        "address": u.address,
        "role": u.role.value if hasattr(u.role, "value") else u.role,
        "branch": u.branch.value if u.branch and hasattr(u.branch, "value") else u.branch,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "must_change_password": u.must_change_password,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "updated_at": u.updated_at.isoformat() if u.updated_at else None,
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
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"status": "success", "user_id": str(new_user.id), "message": "Staff account created successfully."}


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

