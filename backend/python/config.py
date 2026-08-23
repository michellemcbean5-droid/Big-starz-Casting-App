"""
Big Starz Casting App - Configuration
Task 101-104: JWT, OAuth2, Token Configuration
"""

from pydantic import BaseSettings, Field, AnyHttpUrl
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Big Starz Casting API"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/bigstarz",
        env="DATABASE_URL"
    )
    DATABASE_POOL_SIZE: int = Field(default=20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=10, env="DATABASE_MAX_OVERFLOW")
    DATABASE_POOL_TIMEOUT: int = Field(default=30, env="DATABASE_POOL_TIMEOUT")
    DATABASE_POOL_RECYCLE: int = Field(default=3600, env="DATABASE_POOL_RECYCLE")
    
    # JWT Configuration (Task 103-104)
    JWT_SECRET: str = Field(
        default="change-this-to-a-strong-secret-key",
        env="JWT_SECRET"
    )
    JWT_REFRESH_SECRET: str = Field(
        default="change-this-to-a-strong-refresh-secret",
        env="JWT_REFRESH_SECRET"
    )
    JWT_ALGORITHM: str = "HS256"  # AES-256 equivalent for JWT
    JWT_ACCESS_EXPIRATION: int = Field(default=900, env="JWT_ACCESS_EXPIRATION")  # 15 minutes
    JWT_REFRESH_EXPIRATION: int = Field(default=604800, env="JWT_REFRESH_EXPIRATION")  # 7 days
    
    # OAuth2 Configuration (Task 102)
    OAUTH2_TOKEN_EXPIRE_MINUTES: int = 30
    OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Redis Configuration (Task 105)
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    REDIS_TOKEN_BLACKLIST_PREFIX: str = "blacklist:"
    REDIS_TOKEN_BLACKLIST_TTL: int = 604800  # 7 days
    
    # Password Configuration (Task 106)
    BCRYPT_LOG_ROUNDS: int = Field(default=12, env="BCRYPT_LOG_ROUNDS")
    
    # Security
    SECRET_KEY: str = Field(
        default="change-this-to-a-strong-secret",
        env="SECRET_KEY"
    )
    
    # Cookie Configuration (Task 118)
    COOKIE_SECRET: str = Field(
        default="cookie-secret-key",
        env="COOKIE_SECRET"
    )
    COOKIE_SECURE: bool = Field(default=True, env="COOKIE_SECURE")
    COOKIE_HTTP_ONLY: bool = Field(default=True, env="COOKIE_HTTP_ONLY")
    COOKIE_SAMESITE: str = Field(default="lax", env="COOKIE_SAMESITE")
    COOKIE_DOMAIN: Optional[str] = Field(default=None, env="COOKIE_DOMAIN")
    
    # CORS Configuration
    CORS_ORIGINS: List[AnyHttpUrl] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:19006",
            "https://bigstarz.com",
            "https://*.bigstarz.com",
        ],
        env="CORS_ORIGINS"
    )
    
    # File Upload
    UPLOAD_DIR: str = Field(
        default="./uploads",
        env="UPLOAD_DIR"
    )
    MAX_UPLOAD_SIZE: int = Field(default=100 * 1024 * 1024, env="MAX_UPLOAD_SIZE")  # 100MB
    ALLOWED_EXTENSIONS: List[str] = Field(
        default=[
            ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".mp4", ".mov", ".avi", ".webm",
            ".pdf", ".doc", ".docx",
        ],
        env="ALLOWED_EXTENSIONS"
    )
    
    # Logging
    LOG_LEVEL: str = Field(default="debug", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=15 * 60, env="RATE_LIMIT_WINDOW")  # 15 minutes
    AUTH_RATE_LIMIT_REQUESTS: int = Field(default=5, env="AUTH_RATE_LIMIT_REQUESTS")
    AUTH_RATE_LIMIT_WINDOW: int = Field(default=15 * 60, env="AUTH_RATE_LIMIT_WINDOW")
    
    # Twilio Configuration (Task 109)
    TWILIO_ACCOUNT_SID: str = Field(
        default="",
        env="TWILIO_ACCOUNT_SID"
    )
    TWILIO_AUTH_TOKEN: str = Field(
        default="",
        env="TWILIO_AUTH_TOKEN"
    )
    TWILIO_PHONE_NUMBER: str = Field(
        default="",
        env="TWILIO_PHONE_NUMBER"
    )
    TWILIO_VERIFY_SERVICE_SID: str = Field(
        default="",
        env="TWILIO_VERIFY_SERVICE_SID"
    )
    
    # Google OAuth Configuration (Task 110)
    GOOGLE_CLIENT_ID: str = Field(
        default="",
        env="GOOGLE_CLIENT_ID"
    )
    GOOGLE_CLIENT_SECRET: str = Field(
        default="",
        env="GOOGLE_CLIENT_SECRET"
    )
    GOOGLE_REDIRECT_URI: str = Field(
        default="http://localhost:8000/api/v2/auth/google/callback",
        env="GOOGLE_REDIRECT_URI"
    )
    
    # Apple OAuth Configuration (Task 111)
    APPLE_CLIENT_ID: str = Field(
        default="",
        env="APPLE_CLIENT_ID"
    )
    APPLE_CLIENT_SECRET: str = Field(
        default="",
        env="APPLE_CLIENT_SECRET"
    )
    APPLE_REDIRECT_URI: str = Field(
        default="http://localhost:8000/api/v2/auth/apple/callback",
        env="APPLE_REDIRECT_URI"
    )
    APPLE_TEAM_ID: str = Field(
        default="",
        env="APPLE_TEAM_ID"
    )
    APPLE_KEY_ID: str = Field(
        default="",
        env="APPLE_KEY_ID"
    )
    APPLE_PRIVATE_KEY: str = Field(
        default="",
        env="APPLE_PRIVATE_KEY"
    )
    
    # SendGrid Configuration (Task 113-114)
    SENDGRID_API_KEY: str = Field(
        default="",
        env="SENDGRID_API_KEY"
    )
    SENDGRID_FROM_EMAIL: str = Field(
        default="noreply@bigstarz.com",
        env="SENDGRID_FROM_EMAIL"
    )
    SENDGRID_FROM_NAME: str = Field(
        default="Big Starz Casting",
        env="SENDGRID_FROM_NAME"
    )
    SENDGRID_WEBHOOK_SECRET: str = Field(
        default="",
        env="SENDGRID_WEBHOOK_SECRET"
    )
    
    # AWS SES Configuration (Alternative to SendGrid)
    AWS_SES_REGION: str = Field(
        default="us-east-1",
        env="AWS_SES_REGION"
    )
    AWS_SES_ACCESS_KEY: str = Field(
        default="",
        env="AWS_SES_ACCESS_KEY"
    )
    AWS_SES_SECRET_KEY: str = Field(
        default="",
        env="AWS_SES_SECRET_KEY"
    )
    AWS_SES_FROM_EMAIL: str = Field(
        default="noreply@bigstarz.com",
        env="AWS_SES_FROM_EMAIL"
    )
    
    # Stripe Configuration (Tasks 141-160)
    STRIPE_SECRET_KEY: str = Field(
        default="",
        env="STRIPE_SECRET_KEY"
    )
    STRIPE_PUBLISHABLE_KEY: str = Field(
        default="",
        env="STRIPE_PUBLISHABLE_KEY"
    )
    STRIPE_WEBHOOK_SECRET: str = Field(
        default="",
        env="STRIPE_WEBHOOK_SECRET"
    )
    STRIPE_PLATFORM_FEE_PERCENTAGE: float = Field(
        default=10.0,
        env="STRIPE_PLATFORM_FEE_PERCENTAGE"
    )
    STRIPE_PLATFORM_FEE_FIXED: int = Field(
        default=0,
        env="STRIPE_PLATFORM_FEE_FIXED"
    )
    
    # API Key Configuration (Task 112)
    API_KEY_LENGTH: int = Field(default=32, env="API_KEY_LENGTH")
    API_KEY_PREFIX: str = Field(default="sk_live_", env="API_KEY_PREFIX")
    
    # Magic Link Configuration (Task 115)
    MAGIC_LINK_EXPIRATION: int = Field(default=3600, env="MAGIC_LINK_EXPIRATION")  # 1 hour
    MAGIC_LINK_SECRET: str = Field(
        default="magic-link-secret",
        env="MAGIC_LINK_SECRET"
    )
    
    # Brute Force Protection (Task 117)
    BRUTE_FORCE_MAX_ATTEMPTS: int = Field(default=5, env="BRUTE_FORCE_MAX_ATTEMPTS")
    BRUTE_FORCE_LOCKOUT_TIME: int = Field(default=900, env="BRUTE_FORCE_LOCKOUT_TIME")  # 15 minutes
    BRUTE_FORCE_WINDOW: int = Field(default=900, env="BRUTE_FORCE_WINDOW")  # 15 minutes
    
    # Device Fingerprinting (Task 120)
    DEVICE_FINGERPRINT_COOKIE: str = Field(
        default="device_fingerprint",
        env="DEVICE_FINGERPRINT_COOKIE"
    )
    DEVICE_FINGERPRINT_TTL: int = Field(
        default=31536000,  # 1 year
        env="DEVICE_FINGERPRINT_TTL"
    )
    
    # Roles Configuration (Task 107-108)
    ROLES: List[str] = ["FAN", "CREATOR", "ACTOR", "BRAND", "ADMIN"]
    
    # Role permissions
    ROLE_PERMISSIONS: dict = {
        "FAN": ["read:content", "create:application", "read:profile"],
        "CREATOR": ["read:content", "create:content", "create:application", "read:profile", "write:profile"],
        "ACTOR": ["read:content", "create:application", "read:profile", "write:profile", "read:casting"],
        "BRAND": ["read:content", "create:campaign", "read:talent", "create:contract"],
        "ADMIN": ["*"],
    }
    
    # Application paths
    BASE_DIR: Path = Path(__file__).parent.parent
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create settings instance
settings = Settings()


# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


if __name__ == "__main__":
    print("Configuration loaded successfully:")
    print(f"  Environment: {settings.ENVIRONMENT}")
    print(f"  Debug: {settings.DEBUG}")
    print(f"  Host: {settings.HOST}")
    print(f"  Port: {settings.PORT}")
    print(f"  Database URL: {settings.DATABASE_URL}")
    print(f"  Redis URL: {settings.REDIS_URL}")
