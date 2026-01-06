"""Application configuration using Pydantic Settings.

This module handles all environment-based configuration for the application.
Settings are loaded from environment variables and .env files.
"""

from typing import Optional
from pydantic import Field, field_validator, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "rappa.ai"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")

    # Database Configuration
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql://postgres:password@localhost:5432/rappa_db",
        description="PostgreSQL database connection URL"
    )
    DB_POOL_SIZE: int = Field(default=20, description="Database connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=10, description="Maximum overflow connections")
    DB_POOL_TIMEOUT: int = Field(default=30, description="Pool timeout in seconds")
    DB_POOL_RECYCLE: int = Field(default=3600, description="Recycle connections after seconds")
    DB_ECHO: bool = Field(default=False, description="Echo SQL queries (debug mode)")

    # Redis Configuration
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching and session storage"
    )
    REDIS_DECODE_RESPONSES: bool = True
    REDIS_MAX_CONNECTIONS: int = 50

    # JWT Authentication
    JWT_SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for JWT token signing - MUST be changed in production"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    JWT_EXPIRATION_HOURS: int = Field(default=24, description="JWT token expiration in hours")
    JWT_REFRESH_EXPIRATION_DAYS: int = Field(default=30, description="Refresh token expiration in days")

    # AWS S3 / Backblaze B2 Configuration
    AWS_ACCESS_KEY_ID: str = Field(default="", description="AWS/B2 access key ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="", description="AWS/B2 secret access key")
    AWS_BUCKET_NAME: str = Field(default="rappa-documents", description="S3 bucket name")
    AWS_REGION: str = Field(default="us-east-1", description="AWS region")
    S3_ENDPOINT_URL: Optional[str] = Field(
        default=None,
        description="Custom S3 endpoint (for Backblaze B2 or MinIO)"
    )
    S3_USE_SSL: bool = True
    S3_VERIFY_SSL: bool = True

    # CORS Configuration
    FRONTEND_URL: str = Field(
        default="http://localhost:5173",
        description="Frontend application URL for CORS"
    )
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://localhost:5175"],
        description="List of allowed CORS origins"
    )

    # Email Configuration (Gmail SMTP)
    SMTP_HOST: str = Field(default="smtp.gmail.com", description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USERNAME: str = Field(default="", description="SMTP username/email")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password/app password")
    SMTP_FROM_EMAIL: str = Field(default="noreply@rappa.ai", description="From email address")
    SMTP_FROM_NAME: str = Field(default="Rappa.AI", description="From name")
    SUPPORT_ADMIN_EMAILS: list[str] = Field(
        default=["support@rappa.ai"],
        description="Admin email addresses for support ticket notifications"
    )

    # Celery Configuration
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Celery message broker URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/0",
        description="Celery result backend URL"
    )
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 600  # 10 minutes

    # OCR Configuration
    TESSERACT_CMD: str = Field(
        default="/usr/bin/tesseract",
        description="Path to Tesseract OCR executable"
    )
    OCR_LANGUAGE: str = Field(default="eng", description="OCR language (eng for English)")
    OCR_DPI: int = Field(default=300, description="DPI for image processing")

    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = Field(
        default=52428800,  # 50 MB
        description="Maximum file upload size in bytes"
    )
    ALLOWED_EXTENSIONS: list[str] = Field(
        default=["pdf", "jpg", "jpeg", "png"],
        description="Allowed file extensions for upload"
    )
    UPLOAD_TEMP_DIR: str = Field(
        default="/tmp/rappa_uploads",
        description="Temporary directory for file uploads"
    )

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=100,
        description="API rate limit per minute per user"
    )
    RATE_LIMIT_PER_HOUR: int = Field(
        default=1000,
        description="API rate limit per hour per user"
    )

    # Credits System
    DEFAULT_CREDITS: int = Field(
        default=10,
        description="Default credits for new users"
    )
    CREDITS_PER_DOCUMENT: int = Field(
        default=1,
        description="Credits consumed per document processed"
    )

    # Security
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_DIGITS: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = False

    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    DOCS_URL: Optional[str] = "/docs"
    REDOC_URL: Optional[str] = "/redoc"
    OPENAPI_URL: Optional[str] = "/openapi.json"

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Performance
    ENABLE_QUERY_LOGGING: bool = False
    ENABLE_REQUEST_LOGGING: bool = True

    # ============ V1 Legacy OCR Configuration ============

    # Tesseract OCR
    TESSERACT_LANG: str = Field(default="eng+kan", description="Tesseract language (English + Kannada)")
    TESSERACT_OEM: int = Field(default=1, description="OCR Engine Mode (1 = Neural Net LSTM)")
    TESSERACT_PSM: int = Field(default=4, description="Page Segmentation Mode (4 = Single column)")

    # Poppler PDF Conversion
    POPPLER_PATH: Optional[str] = Field(
        default=None,
        description="Path to Poppler binaries (leave None for system PATH)"
    )
    POPPLER_DPI: int = Field(default=300, description="DPI for PDF to image conversion")
    TARGET_IMAGE_WIDTH: int = Field(default=2000, description="Target width for OCR images (Kannada optimization)")

    # OCR Processing
    USE_EMBEDDED_OCR: bool = Field(default=False, description="Use PyMuPDF embedded OCR instead of Tesseract")
    ENABLE_OCR_MULTIPROCESSING: bool = Field(default=True, description="Enable parallel page processing")
    OCR_PAGE_WORKERS: int = Field(default=1, description="Number of workers for page-level OCR")
    MAX_OCR_PAGES: int = Field(default=25, description="Maximum pages to process per PDF")

    # Vision API Limits
    MAX_VISION_IMAGES: int = Field(
        default=10,
        description="Maximum images to send to Gemini Vision API per request"
    )

    # LLM Backend
    LLM_BACKEND: str = Field(default="gemini", description="LLM backend: gemini, groq, ollama, llamacpp, vllm")
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash-exp", description="Gemini model name")
    GROQ_API_KEY: str = Field(default="", description="Groq API key")
    GROQ_MODEL: str = Field(default="llama-3.1-70b-versatile", description="Groq model name")

    # Validation Thresholds
    MIN_REGISTRATION_FEE: float = Field(default=4000.0, description="Minimum valid registration fee")
    MAX_MISC_FEE: float = Field(default=3000.0, description="Maximum miscellaneous fee for subtraction logic")

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        """Validate JWT secret key is changed in production."""
        if info.data.get("ENVIRONMENT") == "production":
            if v == "your-secret-key-change-in-production":
                raise ValueError(
                    "JWT_SECRET_KEY must be changed from default value in production!"
                )
            if len(v) < 32:
                raise ValueError(
                    "JWT_SECRET_KEY must be at least 32 characters in production!"
                )
        return v

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        """Parse ALLOWED_ORIGINS from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_extensions(cls, v):
        """Parse ALLOWED_EXTENSIONS from comma-separated string or list."""
        if isinstance(v, str):
            return [ext.strip().lower() for ext in v.split(",")]
        return v

    @property
    def database_url_sync(self) -> str:
        """Get synchronous database URL as string."""
        return str(self.DATABASE_URL)

    @property
    def database_url_async(self) -> str:
        """Get async database URL (replace postgresql:// with postgresql+asyncpg://)."""
        url = str(self.DATABASE_URL)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def jwt_expiration_seconds(self) -> int:
        """Get JWT expiration time in seconds."""
        return self.JWT_EXPIRATION_HOURS * 3600

    @property
    def jwt_refresh_expiration_seconds(self) -> int:
        """Get refresh token expiration time in seconds."""
        return self.JWT_REFRESH_EXPIRATION_DAYS * 86400

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # Ignore extra fields in .env
    )


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency function to get settings instance.

    This can be used with FastAPI's Depends() to inject settings
    into route handlers and other dependencies.

    Returns:
        Settings: The application settings instance
    """
    return settings
