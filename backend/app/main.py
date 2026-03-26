"""
GECRAI 1.2 - FastAPI Main Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
import redis.asyncio as redis
from prometheus_client import multiprocess

from app.config import settings
from app.api.v1.router import api_router
from app.db.session import init_db
from app.core.rate_limit import limiter, check_redis_connection
from app.core.observability import (
    ObservabilityMiddleware,
    HealthCheckMiddleware,
    CacheManager,
    configure_observability,
    init_prometheus_metrics
)


# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting GECRAI 1.2 Backend...")
    await init_db()
    logger.info("Database initialized")

    # Check Redis for rate limiting
    redis_available = check_redis_connection()
    if settings.ENVIRONMENT == "production":
        # Production: Redis is mandatory
        if not redis_available:
            logger.error("CRITICAL: Redis not available for rate limiting")
            raise RuntimeError(
                "Redis required for rate limiting in production")
        logger.info("Redis connected for rate limiting")
    else:
        # Development: Redis is optional (fallback to memory)
        if redis_available:
            logger.info("Redis connected for rate limiting")
        else:
            logger.warning(
                "Redis not available - using in-memory storage for development")

    # Configure observability
    configure_observability()
    init_prometheus_metrics()
    logger.info("Observability configured with OpenTelemetry")

    # Initialize cache manager
    cache_manager = CacheManager(redis.from_url(settings.REDIS_URL))
    logger.info("Cache manager initialized")

    yield

    # Shutdown
    logger.info("Shutting down GECRAI 1.2 Backend...")
    # Cleanup resources if needed
    logger.info("Shutdown completed")

    # Shutdown
    logger.info("Shutting down GECRAI 1.2 Backend...")


# Create FastAPI application
app = FastAPI(
    title="GECRAI API",
    description="SaaS Platform for Electrical Engineering Calculations",
    version="1.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Add observability middleware
app.add_middleware(ObservabilityMiddleware)

# Add health check middleware
app.add_middleware(
    HealthCheckMiddleware,
    db_session=init_db,
    redis_client=redis.from_url(settings.REDIS_URL)
)

# Add rate limiter to app
app.state.limiter = limiter

# Rate limit exceeded handler


@app.exception_handler(429)
async def rate_limit_handler(request: Request, exc):
    """Handle rate limit exceeded with proper headers."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"},
        headers={"Retry-After": str(getattr(exc, 'retry_after', 60))}
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HSTS Header middleware (production only)
# Note: HTTPS redirect is handled by the proxy (nginx/traefik)
# Backend only adds HSTS headers for downgrade protection
@app.middleware("http")
async def add_hsts_header(request: Request, call_next):
    response = await call_next(request)
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = \
            "max-age=31536000; includeSubDomains"
    return response


# Security headers middleware (CSP + additional headers)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Content Security Policy
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none'"
    )
    response.headers["Content-Security-Policy"] = csp_policy
    
    # X-Frame-Options - prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # X-Content-Type-Options - prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # X-XSS-Protection (legacy but still useful)
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Referrer-Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions-Policy - disable risky browser features
    response.headers["Permissions-Policy"] = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(), "
        "payment=(), "
        "usb=()"
    )
    
    return response


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Health check endpoint
@app.get("/health/live", tags=["Health"])
async def health_live():
    """Liveness probe for Kubernetes"""
    return {
        "status": "healthy",
        "service": "gecrai-backend",
        "timestamp": time.time()
    }

@app.get("/health/ready", tags=["Health"])
async def health_ready():
    """Readiness probe for Kubernetes"""
    return {
        "status": "healthy",
        "service": "gecrai-backend",
        "timestamp": time.time()
    }

@app.get("/health/metrics", tags=["Health"])
async def health_metrics():
    """Metrics endpoint for monitoring"""
    from prometheus_client import generate_latest
    
    metrics = generate_latest()
    return Response(content=metrics, media_type="text/plain")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "GECRAI API",
        "version": "1.2.0",
        "description": "SaaS Platform for Electrical Engineering Calculations",
        "docs": "/api/docs",
        "health": "/health/live",
        "metrics": "/health/metrics"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
