from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "Products"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Pollinations
    POLLINATIONS_API_KEY: str
    
    # Gemini
    GEMINI_API_KEY: str
    

    # Lalamove
    LALAMOVE_API_KEY: str = ""
    LALAMOVE_SECRET: str = ""
    LALAMOVE_BASE_URL: str = "https://rest.sandbox.lalamove.com"
    LALAMOVE_SENDER_NAME: str = "Esting's Flowers"
    LALAMOVE_SENDER_PHONE: str = "+639123456789"
    LALAMOVE_PICKUP_ADDRESS: str = "Esting's Flowers, Laon-Laan Cor. Dos Castillas St., Sampaloc, Manila"
    LALAMOVE_PICKUP_LAT: str = "14.6126"
    LALAMOVE_PICKUP_LNG: str = "120.9920"
    LALAMOVE_SERVICE_TYPE: str = "MOTORCYCLE"

    # Geocoding
    GEOCODING_BASE_URL: str = "https://nominatim.openstreetmap.org"
    GEOCODING_USER_AGENT: str = "Bloomora/1.0 (delivery geocoding)"

    # PayMongo
    PAYMONGO_SECRET_KEY: str = ""
    PAYMONGO_BASE_URL: str = "https://api.paymongo.com"
    PAYMONGO_SUCCESS_URL: str = "bloomoramobile://payment/success"
    PAYMONGO_CANCEL_URL: str = "bloomoramobile://payment/cancel"
    PAYMONGO_WEBHOOK_SECRET: str = ""

    # Email
    RESEND_API_KEY: str | None = None

    # Currency exchange
    EXCHANGERATE_API_KEY: str = ""

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FACEBOOK_CLIENT_ID: str = ""
    FACEBOOK_CLIENT_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = ""
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth"
    CORS_ORIGINS: str = ""

    class Config:
        env_file = str(Path(__file__).resolve().parents[2] / ".env")
        extra = "ignore"


settings = Settings()
