# Post-OAuth New User Profile Setup
Status: Complete ✅

**Backend:** /auth/me returns is_profile_complete
**Frontend:** AuthContext redirects incomplete to "profile", Profile setup mode

**Missing:** App.jsx no "profile" case – add:
```
import Profile from "./pages/Profile"
... 
case "profile": return <Profile onNavigate={navigate} />
```

**OAuthCallback.jsx interferes:** Remove `onNavigate("home")` after loginWithToken.

**Test (new email):**
1. Backend restart: `cd apps/backend && uvicorn app.main:app --reload`
2. Frontend: `cd apps/web && npm run dev`
3. Google login → Profile (console: is_profile_complete false) → fill → Home.

Done! Check browser console / localStorage after OAuth.
