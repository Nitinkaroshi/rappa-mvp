"""FastAPI application entry point.

This module initializes the FastAPI application with all middleware,
routers, error handlers, and lifecycle events.
"""

import logging
import sys
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.core.database import init_db, close_db, check_database_health, create_tables

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events.

    This handles:
    - Database connection initialization
    - Resource cleanup on shutdown
    """
    # Startup
    logger.info("Starting up rappa.ai application...")
    try:
        # Initialize database
        init_db()
        create_tables()
        logger.info("Database initialized and tables created")

        # You can add other startup tasks here:
        # - Initialize Redis connection
        # - Start background tasks
        # - Load ML models
        # - etc.

        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        raise

    yield  # Application is running

    # Shutdown
    logger.info("Shutting down rappa.ai application...")
    try:
        # Close database connections
        close_db()
        logger.info("Database connections closed")

        # Add other cleanup tasks here:
        # - Close Redis connection
        # - Stop background tasks
        # - etc.

        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Document Processing platform for Indian Sales Deed documents",
    docs_url=settings.DOCS_URL if settings.ENVIRONMENT != "production" else None,
    redoc_url=settings.REDOC_URL if settings.ENVIRONMENT != "production" else None,
    openapi_url=settings.OPENAPI_URL if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)


# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# CORS Middleware - Enable Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Per-Page"],
)

# GZip Middleware - Compress responses
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Only compress responses larger than 1KB
)

# Trusted Host Middleware - Prevent Host header attacks (production only)
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["rappa.ai", "*.rappa.ai", settings.FRONTEND_URL],
    )


# ============================================================================
# REQUEST LOGGING MIDDLEWARE
# ============================================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing information."""
    if settings.ENABLE_REQUEST_LOGGING:
        import time
        start_time = time.time()

        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")

        # Process request
        response = await call_next(request)

        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Duration: {process_time:.3f}s"
        )
        response.headers["X-Process-Time"] = str(process_time)
        return response
    else:
        return await call_next(request)


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

# Import and register comprehensive exception handlers
from app.core.exceptions import register_exception_handlers

register_exception_handlers(app)


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, Any]:
    """Basic health check endpoint.

    Returns:
        dict: Health status
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health/db", tags=["Health"])
async def database_health_check() -> dict[str, Any]:
    """Database health check endpoint.

    Returns:
        dict: Database health status
    """
    is_healthy = check_database_health()
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "database": "connected" if is_healthy else "disconnected",
    }


@app.get("/health/ready", tags=["Health"])
async def readiness_check() -> dict[str, Any]:
    """Kubernetes readiness probe endpoint.

    Returns:
        dict: Readiness status
    """
    db_healthy = check_database_health()

    if not db_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "database": "disconnected",
            },
        )

    return {
        "status": "ready",
        "database": "connected",
    }


@app.get("/health/live", tags=["Health"])
async def liveness_check() -> dict[str, Any]:
    """Kubernetes liveness probe endpoint.

    Returns:
        dict: Liveness status
    """
    return {
        "status": "alive",
    }


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """Root endpoint with API information.

    Returns:
        dict: API information
    """
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.DOCS_URL}" if settings.DOCS_URL else "Disabled in production",
        "health": "/health",
    }


# ============================================================================
# API ROUTERS
# ============================================================================

# Import routers
from app.api import auth, upload, processing, templates, fields, export, dashboard, contact, custom_fields, tickets, custom_templates, batches, validation, accounting_export

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(upload.router, prefix=f"{settings.API_V1_PREFIX}/upload", tags=["Upload"])
app.include_router(processing.router, prefix=f"{settings.API_V1_PREFIX}/processing", tags=["Processing"])
app.include_router(templates.router, prefix=f"{settings.API_V1_PREFIX}/templates", tags=["Templates"])
app.include_router(fields.router, prefix=f"{settings.API_V1_PREFIX}/fields", tags=["Fields"])
app.include_router(export.router, prefix=f"{settings.API_V1_PREFIX}/export", tags=["Export"])
app.include_router(validation.router, prefix=f"{settings.API_V1_PREFIX}/validation", tags=["Validation"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["Dashboard"])
app.include_router(contact.router, prefix=f"{settings.API_V1_PREFIX}", tags=["Contact"])
app.include_router(custom_fields.router, prefix=f"{settings.API_V1_PREFIX}/custom-fields", tags=["Custom Fields"])
app.include_router(tickets.router, prefix=f"{settings.API_V1_PREFIX}/tickets", tags=["Tickets"])
app.include_router(custom_templates.router, prefix=f"{settings.API_V1_PREFIX}/custom-templates", tags=["Custom Templates"])
app.include_router(batches.router, prefix=f"{settings.API_V1_PREFIX}/batches", tags=["Batches"])
app.include_router(accounting_export.router, prefix=f"{settings.API_V1_PREFIX}/accounting-export", tags=["Accounting Export"])

# Uncomment as other routers are implemented:
# from app.api import fields, export, demo, dashboard
# app.include_router(fields.router, prefix=f"{settings.API_V1_PREFIX}/fields", tags=["Fields"])
# app.include_router(export.router, prefix=f"{settings.API_V1_PREFIX}/export", tags=["Export"])
# app.include_router(demo.router, prefix=f"{settings.API_V1_PREFIX}/demo", tags=["Demo"])
# app.include_router(dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["Dashboard"])


# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
