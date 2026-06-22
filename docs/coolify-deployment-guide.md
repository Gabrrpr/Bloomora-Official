# Bloomora Coolify Deployment Guide

This guide deploys the existing monorepo to a Hostinger KVM 1 server. Coolify
hosts only the Vite frontend and FastAPI backend. PostgreSQL and object storage
remain on Supabase.

## Deployment map

| Service | Address | Repository directory |
| --- | --- | --- |
| Frontend | `https://estings.shop` | `/apps/web` |
| Backend and WebSocket | `https://api.estings.shop` | `/apps/backend` |

Email and mobile deployment are outside this setup.

## 1. Prepare the VPS

Use Ubuntu 24.04 LTS. In Hostinger's firewall, allow inbound TCP ports 22, 80,
and 443. Install Coolify using the current command from the official
[Coolify installation guide](https://coolify.io/docs/get-started/installation).

KVM 1 has limited build capacity. Configure 2 GB of swap before the first
application build:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Do not install a separate Nginx, Certbot, PostgreSQL, or application systemd
service. Coolify manages routing, HTTPS, containers, and restarts.

## 2. Configure DNS

Point these DNS records to the VPS public IPv4 address:

| Type | Name | Target |
| --- | --- | --- |
| A | `@` | VPS IPv4 |
| A | `www` | VPS IPv4 |
| A | `api` | VPS IPv4 |

Keep the existing Hostinger frontend and Render backend active until both
Coolify applications pass verification.

## 3. Connect GitHub to Coolify

Create a Coolify GitHub App and grant it access to
`Gabrrpr/bloomora-official`. Create one Coolify project with separate
production applications for the frontend and backend.

Disable Coolify's direct automatic deployment after the initial manual
deployment. Production deployments will later be triggered by GitHub Actions
only after both validation jobs pass.

## 4. Frontend application

Use these application settings:

| Setting | Value |
| --- | --- |
| Repository | `Gabrrpr/bloomora-official` |
| Branch | `main` |
| Base directory | `/apps/web` |
| Build pack | Nixpacks |
| Static site | Enabled |
| Build command | `npm ci && npm run build` |
| Publish directory | `/dist` |
| Domain | `https://estings.shop` |

Set these build-time environment variables:

```dotenv
VITE_API_BASE_URL=https://api.estings.shop/api/v1
VITE_WS_BASE_URL=wss://api.estings.shop/api/v1
VITE_WEB_URL=https://estings.shop
```

Add `https://www.estings.shop` only if it will redirect to the canonical root
domain. Vite embeds these values during the build, so changing one requires a
new deployment.

## 5. Backend application

Use these application settings:

| Setting | Value |
| --- | --- |
| Repository | `Gabrrpr/bloomora-official` |
| Branch | `main` |
| Base directory | `/apps/backend` |
| Build pack | Nixpacks |
| Port | `8000` |
| Health check path | `/health` |
| Domain | `https://api.estings.shop` |

Use this start command so database migrations finish before the API starts:

```bash
sh -c 'alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1'
```

Keep one worker. The current WebSocket connection manager and APScheduler job
use process-local state.

Copy the backend's production variables from Render into Coolify. At minimum,
configure:

```dotenv
DATABASE_URL=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
SUPABASE_BUCKET=Products
SECRET_KEY=
POLLINATIONS_API_KEY=
GEMINI_API_KEY=
FRONTEND_URL=https://estings.shop
BACKEND_URL=https://api.estings.shop
CORS_ORIGINS=https://estings.shop,https://www.estings.shop
```

Also copy any PayMongo, Lalamove, OAuth, exchange-rate, or other integration
variables required for the Capstone demonstration. Do not commit their values.

For Supabase, use the direct database URL when the VPS has working IPv6.
Otherwise use the Supabase session-pooler URL on port 5432. SQLAlchemy requires
the URL to start with `postgresql://`.

## 6. First manual deployment

Deploy the backend first and confirm:

```text
https://api.estings.shop/health
```

Expected response:

```json
{"status":"healthy"}
```

Then deploy the frontend. Verify:

- the home page and nested React routes load after a browser refresh;
- products load from the new API;
- login and registration work;
- Supabase uploads work;
- admin pages load;
- chat connects through `wss://api.estings.shop/api/v1/chats/ws/...`.

Do not enable webhook deployment until these checks pass.

## 7. Enable GitHub deployment

In each Coolify application, copy its deployment webhook URL. Add them as
GitHub Actions repository secrets:

```text
COOLIFY_BACKEND_DEPLOY_WEBHOOK
COOLIFY_FRONTEND_DEPLOY_WEBHOOK
```

The workflow in `.github/workflows/deploy.yml` validates pull requests. On a
push to `main`, it:

1. validates the frontend and backend;
2. triggers the backend deployment;
3. waits for the backend health endpoint;
4. triggers the frontend deployment;
5. waits for the frontend to respond.

Application credentials remain in Coolify. Only deployment webhook URLs are
stored in GitHub.

## 8. Rollback

If verification fails, keep or restore the previous DNS targets for Hostinger
and Render. Coolify also retains prior deployments that can be redeployed from
its dashboard.

After the KVM deployment remains stable for several days, the old services can
be disabled.
