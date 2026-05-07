from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str = ""

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Pollinations
    POLLINATIONS_API_URL: str = "https://image.pollinations.ai/prompt"

    # Supabase Storage
    SUPABASE_BUCKET: str = "arrangements"

    # Lalamove
    LALAMOVE_API_KEY: str = ""
    LALAMOVE_SECRET: str = ""
    LALAMOVE_BASE_URL: str = "https://rest.lalamove.com"

    # Email
    MAIL_USERNAME: str = "johngbatac@gmail.com"
    MAIL_PASSWORD: str = "avwp fsqs okgn qowy"
    MAIL_FROM: str = "johngbatac@gmail.com"
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FACEBOOK_CLIENT_ID: str = ""
    FACEBOOK_CLIENT_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = ""
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
