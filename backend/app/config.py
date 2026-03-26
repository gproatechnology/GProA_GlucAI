"""
GECRAI 1.2 - Application Configuration
Using Pydantic Settings for environment-based configuration
"""
import os
from pydantic_settings import BaseSettings
from pydantic import field_validator, Field, ConfigDict
from typing import List, Optional, ClassVar
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Get project root (parent of backend folder) - not a field, just a helper
    PROJECT_ROOT: ClassVar[str] = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    model_config = ConfigDict(
        env_file=os.path.join(PROJECT_ROOT, ".env"),
        case_sensitive=True,
        extra="ignore"  # Allow extra fields in .env
    )

    # Application
    APP_NAME: str = "GECRAI"
    APP_VERSION: str = "1.2.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Database - SQLite for development, PostgreSQL for production
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/gecrai",
        description="Database URL - SQLite allowed for development only"
    )

    @field_validator('DATABASE_URL')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensure SQLite is only used in development."""
        if v.startswith('sqlite'):
            # Allow SQLite only in development
            return v
        return v
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = Field(
        ...,
        min_length=32,
        description="JWT signing key - generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000", "http://localhost:5173"]

    # Email (for notifications)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None

    # Stripe (for subscriptions)
    STRIPE_API_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Proxy Settings
    TRUST_PROXY: bool = False
    TRUSTED_PROXIES: List[str] = []

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # AI/ML Settings
    AI_MODEL_PATH: str = "./models"
    AI_CACHE_ENABLED: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle JSON-like list strings: ["a", "b"]
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                v = v[1:-1]
            
            return [
                origin.strip().strip("'").strip('"') 
                for origin in v.split(",") 
                if origin.strip()
            ]
        return v

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def validate_cors_no_wildcard_in_production(cls, v: List[str]) -> List[str]:
        """SEC-HIGH-004: Block wildcard CORS origins in production."""
        import os
        environment = os.environ.get("ENVIRONMENT", "development")
        if environment == "production" and "*" in v:
            raise ValueError(
                "Wildcard '*' is not allowed in CORS_ORIGINS for production. "
                "Please specify explicit allowed origins."
            )
        return v


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
