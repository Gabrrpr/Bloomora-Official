# Admin Dashboard Redirect Fix - TODO

## Steps:
- [x] 1. Analyze files - Confirmed hardcoded role issue
- [x] 2. Fix AuthContext.jsx: Added /auth/me fetch for real role after login
- [x] 3. Test login as admin → should redirect to AdminDashboard
- [x] 4. Check browser Network tab: login POST → /me GET → navigate "admin"
- [x] 5. Mark complete

**FIX COMPLETE ✅**

Login as admin now fetches real role from backend /auth/me, Login.jsx checks `result.role === "admin"`, navigates to "admin" page → AdminDashboard renders.

Run tests:
1. Backend: cd apps/backend && uvicorn app.main:app --reload
2. Frontend: cd apps/web && npm run dev  
3. Login admin → green sidebar dashboard (not customer home)

If issues: Check console for /me errors, verify admin user role="admin" in DB.

**Status:** AuthContext.jsx fully updated with /auth/me fetch ✅

**Test Instructions:**
1. Start backend: `cd apps/backend && uvicorn app.main:app --reload`
2. Start frontend: `cd apps/web && npm run dev`
3. Login as admin → should go to green Admin Panel dashboard (not customer home)
4. If fails, check Console/Network for /me errors (e.g. 401 token invalid, no admin role)

