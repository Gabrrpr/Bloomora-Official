from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token
from app.core.database import get_db
from app.models.user import User, RoleEnum  
from sqlalchemy.orm import Session

bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    
    # Safely decode the token (it automatically checks for type="access" now)
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🛡️ SECURITY FIX: Drop token access immediately if an account is disabled
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="User account is deactivated"
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# 🚀 THIS IS THE MISSING FUNCTION FastAPI IS LOOKING FOR:
def require_staff(current_user: User = Depends(get_current_user)) -> User:
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Staff or Admin privileges required")
    return current_user