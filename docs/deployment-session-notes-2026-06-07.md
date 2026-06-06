# Bloomora Deployment Session Notes

**Date:** 2026-06-07  
**Purpose:** Midterm/progress-check deployment for the Bloomora capstone project  
**Status:** Frontend and backend were deployed; final frontend connection depends on a successful Hostinger rebuild of the latest commit.

## Deployment Map

| Layer | Platform | URL / Target | Status |
| --- | --- | --- | --- |
| Frontend | Hostinger | `https://blueviolet-otter-621683.hostingersite.com` | Deployed, may roll back if latest build fails |
| Backend API | Render | `https://bloomora-api.onrender.com` | Live |
| Database | Supabase/Postgres | Connected through Render env vars | Working |
| Storage | Supabase Storage | Used by backend services | Configured through backend env vars |

```text
Hostinger frontend
        |
        v
Render FastAPI backend
        |
        v
Supabase/Postgres database
```

## Current Setup

### Hostinger Frontend

| Setting | Value |
| --- | --- |
| Framework preset | `Vite` |
| Branch | `main` |
| Node version | `22.x` |
| Root directory | `./` |
| Build command | `npm run build` |
| Package manager | `npm` |
| Output directory | `apps/web/dist` |

Hostinger environment variables:

```text
VITE_API_BASE_URL=https://bloomora-api.onrender.com/api/v1
VITE_WS_BASE_URL=wss://bloomora-api.onrender.com/api/v1
```

The repo root `package.json` now supports Hostinger's root build:

```json
{
  "scripts": {
    "build": "npm --prefix apps/web install && npm --prefix apps/web run build"
  }
}
```

### Render Backend

| Setting | Value |
| --- | --- |
| Service type | `Web Service` |
| Language | `Python 3` |
| Region | `Singapore` |
| Root directory | `apps/backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/health` |
| Instance type | `Free` |

Important Render env vars:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_KEY
SUPABASE_SERVICE_KEY
SECRET_KEY
GEMINI_API_KEY
POLLINATIONS_API_KEY
MAIL_*
PAYMONGO_*
PYTHON_VERSION=3.11.11
CORS_ORIGINS=https://blueviolet-otter-621683.hostingersite.com
```

## What Was Fixed

### 1. Repo Sync Without Losing Work

Local uncommitted backend/mobile/payment work was preserved before syncing from GitHub.

- Stashed local changes
- Fast-forwarded `main` to the latest GitHub commits
- Reapplied the stash
- Confirmed no conflict markers remained

### 2. Hostinger Monorepo Build

Problem:

```text
Hostinger builds from repo root, but the frontend app is in apps/web.
```

Fix:

```text
Root build script delegates to apps/web.
```

### 3. Linux Asset Casing

Problem:

```text
Imported: ../assets/estings.svg
Actual:   ../assets/Estings.svg
```

This worked locally on Windows but failed on Linux/Hostinger.

Fix:

```text
Updated imports to use Estings.svg exactly.
```

### 4. Render Python Runtime

Problem:

```text
Render used Python 3.14.
pydantic-core tried to compile from source and failed.
```

Fixes:

```text
apps/backend/.python-version -> 3.11.11
Render env var PYTHON_VERSION=3.11.11
```

### 5. Missing Backend Dependencies

Added/fixed backend requirements:

```text
slowapi
pydantic-settings==2.6.1
google-genai
```

Reason:

```python
from google.genai import Client, types
```

requires `google-genai`, not `google-generativeai`.

### 6. Missing FastAPI Entrypoint

Problem:

```text
Render could not import app.main.
```

Cause:

```text
apps/backend/.gitignore ignored main.py.
apps/backend/app/main.py was not deployed.
```

Fix:

```text
Removed the main.py ignore rule.
Tracked apps/backend/app/main.py.
```

### 7. Frontend API/WS Configuration

Added:

```text
apps/web/src/config/api.js
```

It reads:

```text
VITE_API_BASE_URL
VITE_WS_BASE_URL
```

with local development fallbacks:

```text
http://localhost:8000/api/v1
ws://localhost:8000/api/v1
```

This means local development still works without a local frontend `.env`.

### 8. Backend CORS

Backend now allows the Hostinger temporary domain:

```text
https://blueviolet-otter-621683.hostingersite.com
```

Extra origins can be configured through:

```text
CORS_ORIGINS
```

## Verification

### Local Checks

```powershell
npm run build
```

Expected:

```text
Vite build succeeds.
```

```powershell
cd apps/backend
python -c "import app.main; print('IMPORT_OK')"
```

Expected:

```text
IMPORT_OK
```

### Remote Backend Checks

```text
https://bloomora-api.onrender.com/health
```

Expected:

```json
{"status":"healthy"}
```

```text
https://bloomora-api.onrender.com/api/v1/products/
```

Expected:

```text
HTTP 200 with product data
```

## Current Caveats

- Hostinger may roll back to the previous stable deployment if the newest build fails.
- If products/login do not work, check whether the live JS bundle still contains `localhost:8000`.
- Hostinger env var changes require a rebuild/redeploy because Vite bakes env vars into the build.
- Render Free can sleep after inactivity, so the first API request may be slow.
- Google/Facebook OAuth still needs production callback URLs if social login will be demoed.
- The Gmail app password was visible during setup; rotate it before public/final deployment.

## Troubleshooting Checklist

If Hostinger frontend does not call Render:

- Confirm latest Hostinger deployment is on commit `747e1f65` or newer.
- Confirm Hostinger build completed successfully.
- Confirm Hostinger env vars are applied.
- Confirm deployed JS no longer contains `localhost:8000`.
- Confirm `VITE_API_BASE_URL` is exactly:

```text
https://bloomora-api.onrender.com/api/v1
```

If Render backend fails:

- Check `/health`.
- Check logs for missing Python packages.
- Confirm `PYTHON_VERSION=3.11.11`.
- Confirm `Root Directory=apps/backend`.
- Confirm start command:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Useful Commands

Check git state:

```powershell
git status --short --branch
```

Build frontend like Hostinger:

```powershell
npm run build
```

Test backend import locally:

```powershell
cd apps/backend
python -c "import app.main; print('IMPORT_OK')"
```

Commit only deployment docs:

```powershell
git add docs/deployment-session-notes-2026-06-07.md
git commit -m "Document deployment setup notes"
git push origin main
```

## Files Changed During Deployment Work

| Area | Files |
| --- | --- |
| Hostinger build | `package.json`, `package-lock.json` |
| Frontend API config | `apps/web/src/config/api.js`, frontend API/auth/chat/profile files |
| Backend CORS/config | `apps/backend/app/main.py`, `apps/backend/app/core/config.py` |
| Render runtime | `apps/backend/.python-version`, `apps/backend/requirements.txt` |
| Git tracking fix | `apps/backend/.gitignore`, `apps/backend/app/main.py` |

