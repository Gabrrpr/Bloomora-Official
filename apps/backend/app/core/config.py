from pydantic_settings import BaseSettings


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
    LALAMOVE_BASE_URL: str = "https://rest.lalamove.com"

    # PayMongo
    PAYMONGO_SECRET_KEY: str = ""
    PAYMONGO_BASE_URL: str = "https://api.paymongo.com"
    PAYMONGO_SUCCESS_URL: str = "bloomoramobile://payment/success"
    PAYMONGO_CANCEL_URL: str = "bloomoramobile://payment/cancel"
    PAYMONGO_WEBHOOK_SECRET: str = ""

    # Email
    MAIL_USERNAME="estingsflowerintl@gmail.com"
    MAIL_PASSWORD="bniw btjn bdfu vvgu"
    MAIL_FROM="estingsflowerintl@gmail.com"
    MAIL_SERVER="smtp.gmail.com"
    MAIL_PORT=587
    MAIL_PORT: int = 587

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FACEBOOK_CLIENT_ID: str = ""
    FACEBOOK_CLIENT_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = ""
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth"
    CORS_ORIGINS: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
