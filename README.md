# Bloomora / Esting's Flowers

Bloomora is a full-stack floral e-commerce platform for Esting's Flower International Inc. It includes a customer storefront, flower customization tools, checkout and delivery workflows, customer support chat, and an administration dashboard.

> **Demo notice:** This project is configured for demonstration and testing. Do not use real payment details or treat test orders as real purchases.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, GSAP, MapLibre GL
- **Backend:** FastAPI, SQLAlchemy, Alembic, PostgreSQL/Supabase
- **Authentication:** JWT and OAuth integrations
- **Payments and delivery:** PayMongo and Lalamove integrations
- **Realtime features:** WebSockets for support and notifications

## Repository structure

```text
apps/
├── backend/        FastAPI API, database models, migrations, and tests
└── web/            React/Vite customer storefront and admin dashboard
docs/               Deployment and integration guides
.github/            GitHub Actions and repository configuration
```

## Requirements

- Node.js 20 or newer
- npm
- Python 3.11 or newer
- PostgreSQL or a Supabase project

The backend dependencies are listed in [`apps/backend/requirements.txt`](apps/backend/requirements.txt). The frontend dependencies are managed by [`apps/web/package.json`](apps/web/package.json).

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/Gabrrpr/bloomora-official.git
cd bloomora-official
```

### 2. Configure the backend

Create `apps/backend/.env` with the required database, Supabase, security, and integration settings. At minimum:

```dotenv
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
SECRET_KEY=replace-with-a-long-random-secret
POLLINATIONS_API_KEY=your-key
GEMINI_API_KEY=your-key
```

For local development, optional frontend and integration settings may include:

```dotenv
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
PAYMONGO_SECRET_KEY=
LALAMOVE_API_KEY=
LALAMOVE_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Never commit `.env` files or API keys.

### 3. Install and run the backend

```bash
cd apps/backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
# source .venv/bin/activate

python -m pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`. Health checks:

- `GET /` — API status
- `GET /health` — health status

### 4. Install and run the frontend

In a second terminal:

```bash
cd apps/web
npm install
npm run dev
```

The frontend expects the API at `http://127.0.0.1:8000/api/v1` by default. To override it, create `apps/web/.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_WS_BASE_URL=ws://127.0.0.1:8000/api/v1
VITE_WEB_URL=http://localhost:5173
```

## Available commands

From the repository root:

```bash
npm run build
```

This installs frontend dependencies and creates a production build.

From `apps/web`:

```bash
npm run dev       # Start the Vite development server
npm run build     # Build the frontend
npm run preview   # Preview the production build locally
```

From `apps/backend` with the virtual environment active:

```bash
python -m pytest -q                         # Run backend tests
python -m compileall -q app                 # Compile-check Python files
alembic upgrade head                        # Apply database migrations
```

## Deployment

Deployment-specific instructions are available in:

- [`docs/coolify-deployment-guide.md`](docs/coolify-deployment-guide.md) — recommended Coolify deployment
- [`docs/vps-deployment-guide.md`](docs/vps-deployment-guide.md) — VPS deployment with Nginx and systemd
- [`docs/paymongo-mobile-payment-integration.md`](docs/paymongo-mobile-payment-integration.md) — payment integration notes

The production deployment uses separate frontend and backend services:

```text
Frontend: https://estings.shop
Backend:  https://api.estings.shop
```

The frontend must be built with:

```dotenv
VITE_API_BASE_URL=https://api.estings.shop/api/v1
VITE_WS_BASE_URL=wss://api.estings.shop/api/v1
VITE_WEB_URL=https://estings.shop
```

## Security notes

- Keep all secrets in environment variables or the deployment provider's secret manager.
- Do not commit Supabase service keys, JWT secrets, OAuth secrets, payment keys, or delivery-provider credentials.
- Use test credentials and sandbox payment environments during development.
- Run database migrations before starting a production backend.

## Current validation

The frontend production build is available through `npm run build`. Backend tests require the Python dependencies from `apps/backend/requirements.txt` to be installed in the active environment.

## License

This project is proprietary software for Esting's Flower International Inc. See the repository owner for licensing and usage permissions.
