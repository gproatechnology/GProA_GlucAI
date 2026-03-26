"""
GECRAI 1.2 - Rate Limiting Configuration
IP-based rate limiting with slowapi
"""
import logging

import redis
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """
    Extract client IP with TRUST_PROXY setting.
    Only trusts proxy headers if TRUST_PROXY is explicitly enabled.
    """
    if settings.TRUST_PROXY:
        # Check forwarded headers in order of priority
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip

        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # First IP is the client, rest are proxies
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-Ip")
        if real_ip:
            return real_ip

    # Default: direct connection
    return request.client.host if request.client else "127.0.0.1"


def check_redis_connection() -> bool:
    """Check if Redis is available for rate limiting."""
    try:
        r = redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=5,
            socket_timeout=5,
            health_check_interval=30,
        )
        r.ping()
        return True
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        return False


# Initialize limiter - use Redis in production, memory in development
if settings.ENVIRONMENT == "production":
    # Production: Must have Redis
    redis_available = check_redis_connection()
    if not redis_available:
        raise RuntimeError("Redis required for rate limiting in production")
    limiter = Limiter(
        key_func=get_client_ip,
        storage_uri=settings.REDIS_URL,
    )
    logger.info("Rate limiting: Using Redis storage")
else:
    # Development: Try Redis, fallback to memory
    if check_redis_connection():
        limiter = Limiter(
            key_func=get_client_ip,
            storage_uri=settings.REDIS_URL,
        )
        logger.info("Rate limiting: Using Redis storage")
    else:
        # Fallback to in-memory for local development without Docker
        limiter = Limiter(
            key_func=get_client_ip,
        )
        logger.info("Rate limiting: Using in-memory storage (development only)")


class RateLimitConfig:
    """Rate limit configurations."""
    LOGIN_IP = "10/minute"
    REGISTER_IP = "3/minute"
    REFRESH_IP = "20/minute"
    # Note: Email-based rate limiting will be implemented in FASE 1 (Hardening)
