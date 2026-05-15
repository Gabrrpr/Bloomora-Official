# Bloomora

> Web and Mobile E-Commerce Platform with Two-Way Customization for Floral Ordering Using Flux Generative AI Model — built for **Esting's Flowers International Inc.**

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20React%20Native%20%7C%20FastAPI%20%7C%20PostgreSQL-blue)
![License](https://img.shields.io/badge/license-academic-lightgrey)

---

## Overview

Bloomora is a full-stack monorepo capstone project that provides Esting's Flowers International Inc. with a centralized digital platform for:

- Floral product catalog browsing and ordering
- **Two-Way Customization** — customers can either manually mix-and-match arrangement materials, or describe their vision in text and let the Flux AI generate a preview via Pollinations.ai
- Delivery scheduling and real-time tracking via Lalamove API
- Inventory management, sales reporting, and staff operations via an admin/staff web dashboard
- Rider delivery management via a dedicated mobile interface

---

## Team

| Name | Role |
|---|---|
| Batac, John Gabriel R. | Developer |
| Ibarrientos, Forest Red R. | Developer |
| De Leon, Julius Francis G. | Developer |
| Mapoy, Pauline Erika M. | Developer |

**Adviser:** Mr. Joseph Quismundo Calleja
**Institution:** FEU Institute of Technology — BS Information Technology (Web and Mobile Applications)

---

## Monorepo Structure

```
bloomora/
├── apps/
│   ├── web/          # React.js — Customer & Admin/Staff web platform
│   ├── mobile/       # React Native (Expo) — Customer & Rider mobile app
│   └── backend/      # FastAPI — REST API + PostgreSQL via Supabase
├── packages/
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-constants/   # Shared enums and constants
│   └── shared-utils/       # Shared utility functions
└── docs/             # Diagrams, API reference, research paper
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | React.js + Vite + Tailwind CSS |
| Mobile Frontend | React Native + Expo |
| Backend | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| AI Image Generation | Pollinations.ai (Flux Model) |
| Delivery Integration | Lalamove API |
| Auth | JWT + bcrypt |
| ORM | SQLAlchemy + Alembic |
| Package Manager | npm workspaces |

---

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- Git
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account and project

---

### 1. Clone the repository

```bash
git clone https://github.com/Gabrrpr/bloomora.git
cd bloomora
```

---

### 2. Backend Setup

```bash
cd apps/backend

# Create and activate virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

API will be running at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

---

### 3. Web Frontend Setup

```bash
cd apps/web

npm install
cp .env.example .env
# Fill in VITE_API_URL and other values

npm run dev
```

Web app will be running at `http://localhost:5173`

---

### 4. Mobile Setup

```bash
cd apps/mobile

npm install
cp .env.example .env

npx expo start
```

Scan the QR code with Expo Go or run on an emulator.

---

## Environment Variables

Each app has its own `.env` file. Copy from the `.env.example` in each directory.

### `apps/backend/.env`

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=sb_publishable_xxxx
SECRET_KEY=your-jwt-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
POLLINATIONS_API_URL=https://image.pollinations.ai/prompt
LALAMOVE_API_KEY=
LALAMOVE_SECRET=
LALAMOVE_BASE_URL=https://rest.lalamove.com
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

> ⚠️ **Never commit your `.env` file.** It is listed in `.gitignore`. Only `.env.example` files are committed.

---

## 🗄️ Database Tables

| Table | Description |
|---|---|
| `users` | All platform users (admin, staff, customer, rider) |
| `roles` | Role-based access control |
| `products` | Flower catalog and sellable items |
| `inventory` | Stock levels and reorder tracking |
| `orders` | Customer purchase records |
| `transactions` | Payment records per order |
| `deliveries` | Rider assignments and delivery status |
| `arrangements` | Custom bouquet blueprints (two-way customization) |
| `flowers` | Flower material details |
| `vases` | Vase material details |
| `wrappings` | Wrapping material details |
| `accessories` | Accessory material details |
| `reviews` | Customer ratings and comments |
| `chats` | Customer-staff support messages |
| `activity_logs` | Audit trail of all staff/admin actions |

---

## User Roles

| Role | Platform Access |
|---|---|
| Customer | Web + Mobile — browse, customize, order, track |
| Staff | Web only — orders, inventory, payments, support |
| Admin | Web only — full access including reports, role management |
| Delivery Rider | Mobile only — view and update assigned deliveries |

---

## API Endpoints (v1)

| Module | Base Path |
|---|---|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Products | `/api/v1/products` |
| Orders | `/api/v1/orders` |
| Inventory | `/api/v1/inventory` |
| Delivery | `/api/v1/delivery` |
| Customization | `/api/v1/customization` |
| Reports | `/api/v1/reports` |

Full API documentation available at `/docs` when the backend is running.

---

## 🚀 Deployment

| App | Platform |
|---|---|
| Backend | Hostinger (Node.js / Python hosting) |
| Web | Hostinger Business |
| Mobile | Expo EAS Build → Google Play / App Store |
| Database | Supabase (cloud PostgreSQL) |

---

## 📄 License

This project is an academic capstone submission for FEU Institute of Technology.
© 2026 Batac, Ibarrientos, De Leon, Mapoy. All rights reserved.

> FEU Institute of Technology is granted permission to reproduce and distribute the contents of this project in whole or in part.