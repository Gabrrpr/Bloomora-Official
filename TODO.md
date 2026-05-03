# Post-OAuth New User Profile Setup

Status: Approved ✅

**Logic:** Social login new users lack phone/address → auto-redirect to Profile for setup before home.

## TODO Steps:
1. [✅] Updated apps/backend/app/api/v1/routes/auth.py: /me adds `"is_profile_complete": bool(current_user.phone_number and current_user.address)`
2. [✅] Updated apps/web/src/context/AuthContext.jsx: Saves is_profile_complete, redirects to /profile if false after OAuth/restore
3. [✅] Updated apps/web/src/pages/Profile.jsx: setupMode = !user.is_profile_complete, auto-edit, disabled back, banner, auto-home after save
4. [ ] Update App.jsx router: Protected routes check user?.is_profile_complete or redirect Profile
5. [ ] Test OAuth → Profile → complete → Home

**Next:** Backend /auth/me update.
- Install? No.
- Test: Backend dev server restart, frontend dev.
