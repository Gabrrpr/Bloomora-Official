from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.api.v1.routes import auth, products, customization, chats, orders
from app.core.dependencies import get_current_user

app = FastAPI(
    title="Bloomora API",
    description="Backend API for Bloomora — Floral E-Commerce Platform for Esting's Flowers International Inc.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(customization.router, prefix="/api/v1", tags=["customization"])
app.include_router(chats.router, prefix="/api/v1", tags=["chats"])
app.include_router(orders.router, prefix="/api/v1", tags=["orders"])

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Bloomora API is running"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}