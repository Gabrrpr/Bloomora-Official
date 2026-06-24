from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

import os
import traceback
from app.services.currencyService import get_latest_rates

# 🚀 1. NEW: Import your scheduler
from app.utils.scheduler import start_scheduler

from app.api.v1.routes import (
    addresses,
    auth,
    cart,
    campaigns,
    commerce,
    mobile_feed,
    mobile_content,
    chats,
    customization,
    dashboard,
    orders,
    payments,
    products,
    reviews,
    site_customization,
    users,
    vases,
    upload,
    recommendations,
    webhooks
)

# Debug: confirm cart router loaded correctly
print("[DEBUG] cart router loaded:", getattr(cart, "router", None))
try:
    print("[DEBUG] cart router prefix:", getattr(cart.router, "prefix", None))
except Exception as _e:
    print("[DEBUG] cart router prefix read failed:", _e)

from app.core.config import settings
from app.core.limiter import limiter

LOCAL_ORIGINS = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:8081",
    "http://localhost:19006",
}

DEPLOYED_ORIGINS = {
    "https://estings.shop",
}

CONFIGURED_ORIGINS = {
    origin.strip().rstrip("/")
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
}

ALLOWED_ORIGINS = LOCAL_ORIGINS | DEPLOYED_ORIGINS | CONFIGURED_ORIGINS

app = FastAPI(
    title="Bloomora API",
    description="Backend API for Bloomora - Floral E-Commerce Platform for Esting's Flowers International Inc.",
    version="1.0.0",
    redirect_slashes=False,
)

# 🚀 2. NEW: Add the startup event to boot up the scheduler
@app.on_event("startup")
def on_startup():
    start_scheduler()
    # Debug: dump registered /api/v1 routes to verify cart inclusion at runtime
    try:
        route_paths = sorted({r.path for r in app.routes if hasattr(r, "path")})
        api_v1_paths = [p for p in route_paths if p.startswith("/api/v1")]
        print("[DEBUG] registered /api/v1 paths:", api_v1_paths)
    except Exception as e:
        print("[DEBUG] route dump failed:", e)


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# SessionMiddleware must be added before CORSMiddleware so CORS wraps all responses.
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback_str = traceback.format_exc()
    print(f"Unhandled exception: {traceback_str}")

    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )


# Serve uploaded chat images statically.
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(customization.router, prefix="/api/v1", tags=["customization"])
app.include_router(chats.router, prefix="/api/v1", tags=["chats"])
app.include_router(orders.router, prefix="/api/v1", tags=["orders"])
app.include_router(payments.router, prefix="/api/v1", tags=["payments"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(site_customization.router, prefix="/api/v1", tags=["site-customization"])
app.include_router(addresses.router, prefix="/api/v1", tags=["addresses"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["cart"])
app.include_router(reviews.router, prefix="/api/v1", tags=["Reviews"])
app.include_router(vases.router, prefix="/api/v1/vases", tags=["Vases"])
app.include_router(campaigns.router, prefix="/api/v1", tags=["campaigns"])
app.include_router(commerce.router, prefix="/api/v1")
app.include_router(mobile_feed.router, prefix="/api/v1")
app.include_router(mobile_content.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(webhooks.router, prefix="/api/v1")


# 🚀 2. NEW LIVE EXCHANGE RATE ENDPOINT ADDED HERE
@app.get("/api/v1/config/exchange-rates", tags=["Configuration"])
async def exchange_rates():
    rates = await get_latest_rates()
    return {"success": True, "rates": rates}


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Bloomora API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
