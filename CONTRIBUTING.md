#  Bloomora — Contributor Guide

Welcome to the team! This guide will help you set up your local development environment and follow our workflow as a contributor.

---

##  Prerequisites

Make sure you have these installed before starting:

- [Git](https://git-scm.com/download/win)
- [Python 3.11](https://www.python.org/downloads/release/python-3110/)
- [Node.js v18+](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/)
- [Expo Go](https://expo.dev/go) (on your phone, for mobile testing)

---

##  Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/Gabrrpr/bloomora.git
cd bloomora
```

### 2. Set up the Backend

```bash
cd apps/backend

# Create virtual environment
python -m venv venv

# Activate it (Git Bash on Windows)
source venv/Scripts/activate

# You should see (venv) in your terminal now

# Install all dependencies
pip install -r requirements.txt
```

### 3. Set up your `.env` file

```bash
# Copy the example file
cp .env.example .env
```

Then open `.env` and fill in the values. Ask the team lead for the actual credentials — **never share `.env` files publicly or commit them to GitHub.**

### 4. Run the backend

```bash
python -m uvicorn app.main:app --reload
```

If it starts successfully you'll see:
```
INFO: Uvicorn running on http://127.0.0.1:8000
INFO: Application startup complete.
```

Open `http://127.0.0.1:8000/docs` to see the API docs.

---

##  Branch Workflow

We follow a simple branching strategy. **Never push directly to `main`.**

```
main          ← protected, final production-ready code
└── dev       ← main working branch, merge your features here
    ├── feat/your-name-feature-name
    └── fix/your-name-bug-description
```

### Starting a new feature

```bash
# Always branch off from dev
git checkout dev
git pull origin dev

# Create your feature branch
git checkout -b feat/your-name-feature-name

# Example
git checkout -b feat/gabriel-auth
git checkout -b feat/forest-products
git checkout -b feat/julius-orders
git checkout -b feat/pauline-ui
```

### Committing your work

```bash
git add .
git commit -m "feat: add login endpoint with JWT"
git push origin feat/your-name-feature-name
```

### Opening a Pull Request

1. Go to the GitHub repo
2. Click **"Compare & pull request"**
3. Set base branch to **`dev`** (not `main`)
4. Add a short description of what you did
5. Request a review from the team lead
6. Wait for approval before merging

---

##  Commit Message Format

Use this format for all commits:

```
type: short description
```

| Type | When to use |
|---|---|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `update` | Updating existing code |
| `refactor` | Restructuring code without changing behavior |
| `docs` | Updating documentation |
| `test` | Adding or updating tests |

**Examples:**
```
feat: add product listing endpoint
fix: resolve inventory stock check bug
update: improve customization prompt builder
docs: update README setup instructions
```

---

##  Important Rules

- **Never commit `.env`** — it's in `.gitignore` for a reason
- **Never commit `node_modules/` or `venv/`** — these are auto-generated
- **Always activate venv** before running or installing anything in the backend
- **Always pull latest from `dev`** before starting a new feature
- **Never push directly to `main`** — always go through a Pull Request

---

##  Common Issues

**`(venv)` not showing after activation**
```bash
source venv/Scripts/activate   # Git Bash
venv/Scripts/activate          # PowerShell
```

**`ModuleNotFoundError` after pulling new code**
```bash
# Someone added a new package — reinstall requirements
pip install -r requirements.txt
```

**Port 8000 already in use**
```bash
# Kill the process using port 8000
npx kill-port 8000
# Then restart the server
python -m uvicorn app.main:app --reload
```

**Merge conflicts**
```bash
# Pull latest dev first, resolve conflicts, then push
git pull origin dev
# Fix conflicts in VS Code
git add .
git commit -m "fix: resolve merge conflict"
git push
```

---

##  Project Structure

```
bloomora/
├── apps/
│   ├── web/          # React.js — Customer & Admin web
│   ├── mobile/       # React Native — Customer & Rider mobile
│   └── backend/      # FastAPI — REST API
├── packages/         # Shared code
└── docs/             # Diagrams and documentation
```

---

## 📬 Questions?

Reach out to **Gabriel (Gabrrpr)** on GitHub or message the group chat.