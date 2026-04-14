from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str

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
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587

    class Config:
        env_file = ".env"


settings = Settings()
