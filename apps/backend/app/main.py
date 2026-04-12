from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import customization
from app.api.v1.routes import auth

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

app.include_router(auth.router, prefix="/api/v1")
app.include_router(customization.router, prefix="/api/v1")

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Bloomora API is running 🌸"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}