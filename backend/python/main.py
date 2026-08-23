"""
Big Starz Casting App - FastAPI Main Entry Point
Task 101: FastAPI main.py entry point

This is the primary FastAPI application entry point for the Big Starz Casting App.
It provides the core API infrastructure with OAuth 2.0, JWT authentication, and
comprehensive security features.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import logging
from logging.config import dictConfig
import os
from datetime import datetime
from typing import Optional

# Import configuration
from config import settings

# Import routers
from routers import (
    auth as auth_router,
    users as users_router,
    casting as casting_router,
    ai as ai_router,
    payments as payments_router,
    consent as consent_router,
    social as social_router,
    analytics as analytics_router,
)

# Import middleware
from middleware import (
    error_handler,
    audit_logger,
    rate_limiter,
    security_headers,
)

# Import database
from database import Base, engine, async_session_maker
from database.connection import init_db

# Import models to register them with SQLAlchemy
from models import (
    users as user_models,
    talent as talent_models,
    casting as casting_models,
    consent as consent_models,
    payments as payment_models,
    social as social_models,
)

# Configure logging
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s - %(name)s - %(message)s",
            "use_colors": None,
        },
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": "%(levelprefix)s %(asctime)s - %(client_addr)s - "
                   "%(request_line)s %(status_code)s",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "formatter": "default",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "encoding": "utf8",
        },
    },
    "loggers": {
        "bigstarz": {
            "handlers": ["default", "file"],
            "level": settings.LOG_LEVEL,
            "propagate": False,
        },
        "uvicorn": {
            "handlers": ["default", "access"],
            "level": settings.LOG_LEVEL,
            "propagate": False,
        },
        "uvicorn.error": {
            "level": settings.LOG_LEVEL,
            "handlers": ["default"],
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": ["access"],
            "level": settings.LOG_LEVEL,
            "propagate": False,
        },
    },
}

dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("bigstarz")


# Create FastAPI application
app = FastAPI(
    title="Big Starz Casting API",
    description="AI-powered casting ecosystem for TV networks to discover, manage, and monetize talent at scale.",
    version="2.0.0",
    docs_url="/api/v2/docs",
    redoc_url="/api/v2/redoc",
    openapi_url="/api/v2/openapi.json",
    servers=[
        {"url": "https://api.bigstarz.com/api/v2", "description": "Production"},
        {"url": "http://localhost:8000/api/v2", "description": "Development"},
    ],
    contact={
        "name": "Big Starz Support",
        "email": "support@bigstarz.com",
    },
    license_info={
        "name": "Proprietary",
        "url": "https://bigstarz.com/license",
    },
)


# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add security headers middleware
app.add_middleware(security_headers.SecurityHeadersMiddleware)

# Add rate limiting middleware
app.add_middleware(rate_limiter.RateLimitMiddleware)

# Add audit logging middleware
app.add_middleware(audit_logger.AuditLogMiddleware)

# Add error handling middleware
@app.middleware("http")
async def error_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        return await error_handler.handle_exception(request, e)


# Mount static files
if settings.UPLOAD_DIR:
    app.mount(
        "/static",
        StaticFiles(directory=settings.UPLOAD_DIR),
        name="static",
    )


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "environment": settings.ENVIRONMENT,
            "version": "2.0.0",
            "uptime": f"{datetime.utcnow() - datetime.fromtimestamp(os.getenv('START_TIME', 0))}",
        },
    )


# Readiness check endpoint
@app.get("/ready", tags=["health"])
async def readiness_check():
    """Readiness check endpoint for Kubernetes"""
    # Check database connection
    try:
        async with async_session_maker() as session:
            session.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return JSONResponse(
        status_code=200 if db_status == "healthy" else 503,
        content={
            "success": db_status == "healthy",
            "database": db_status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )


# Include routers
app.include_router(
    auth_router.router,
    prefix="/api/v2/auth",
    tags=["authentication"],
)

app.include_router(
    users_router.router,
    prefix="/api/v2/users",
    tags=["users"],
)

app.include_router(
    casting_router.router,
    prefix="/api/v2/casting",
    tags=["casting"],
)

app.include_router(
    ai_router.router,
    prefix="/api/v2/ai",
    tags=["ai"],
)

app.include_router(
    payments_router.router,
    prefix="/api/v2/payments",
    tags=["payments"],
)

app.include_router(
    consent_router.router,
    prefix="/api/v2/consent",
    tags=["consent"],
)

app.include_router(
    social_router.router,
    prefix="/api/v2/social",
    tags=["social"],
)

app.include_router(
    analytics_router.router,
    prefix="/api/v2/analytics",
    tags=["analytics"],
)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            },
        },
        headers=exc.headers,
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": "Internal server error",
                "timestamp": datetime.utcnow().isoformat() + "Z",
            },
        },
    )


# Event handlers
@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    # Initialize database
    await init_db()
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        # This will create all tables that don't exist
        # In production, use migrations instead
        if settings.ENVIRONMENT == "development":
            await conn.run_sync(Base.metadata.create_all)
    
    logger.info("✅ Application started successfully")
    logger.info(f"🌍 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🚀 Server running on http://{settings.HOST}:{settings.PORT}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("🛑 Application shutting down...")
    # Close database connections
    await engine.dispose()
    logger.info("✅ Application shutdown complete")


# Main entry point
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL,
        access_log=True,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
