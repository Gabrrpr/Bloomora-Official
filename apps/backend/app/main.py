from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Bloomora API",
    description="Backend API for Bloomora — Floral E-Commerce Platform for Esting's Flowers International Inc.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow web and mobile frontends to talk to this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # React web (Vite)
        "http://localhost:8081",   # React Native (Expo)
        "http://localhost:19006",  # Expo web
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Bloomora API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}