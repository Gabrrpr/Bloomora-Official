# OAuth New User Username/Password Setup

## Steps

### 1. Create TODO.md [✅]

### 2. Backend: Edit users.py /users/me PATCH
- Add `username: Optional[str]`, `password: Optional[str]` to UserUpdateRequest
- In update_me: 
  - if username: check unique, set
  - if password: hash_password(set)

### 3. Backend: Edit auth.py /me response
- ` "is_profile_complete": bool(current_user.phone_number and current_user
