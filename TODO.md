# Social Login Implementation (Google/Facebook)

## Status: In Progress

### 1. Backend Changes [x]
   - Add google_id, facebook_id to models/user.py [x]
   - Update core/config.py with OAuth settings (placeholders) [x]
   - Add authlib to backend/requirements.txt [x]
   - Implement OAuth routes in api/v1/routes/auth.py [x]

### 2. Frontend Changes [x]
   - Update services/auth.js with social login functions [x]
   - Add googleLogin/facebookLogin to AuthContext.jsx [x]
   - Wire buttons in pages/Login.jsx [x]

### 3. Database Migration [ ]
   - Generate alembic revision
   - Run upgrade

### 4. Testing [ ]
   - Backend restart
   - Frontend dev server
   - Test flows

### 5. User Config [ ]
   - Add real OAuth keys to .env
