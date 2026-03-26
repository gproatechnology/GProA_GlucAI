"""
GECRAI 1.2 - Calculation Cache Service (ARCH-002)
Redis-based caching for expensive electrical engineering calculations.

Strategy: Cache keyed on a hash of input parameters. TTL = 1 hour.
On cache miss: compute result and store. On cache hit: return immediately.
"""
import hashlib
import json
import logging
from typing import Any, Dict, Optional
from functools import wraps

import redis

from app.config import settings

logger = logging.getLogger(__name__)

CALC_CACHE_TTL = 3600       # 1 hour for calculation results
LOOKUP_CACHE_TTL = 86400    # 24 hours for static lookup tables
CACHE_KEY_PREFIX = "calc_cache"


def _get_redis_client() -> Optional[redis.Redis]:
    """Return a Redis client, or None if unavailable."""
    try:
        client = redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=2,
            socket_timeout=2,
            decode_responses=True,
        )
        client.ping()
        return client
    except Exception as e:
        logger.warning(f"Redis cache unavailable: {e}")
        return None


def _make_cache_key(calc_type: str, params: Dict[str, Any]) -> str:
    """
    Generate a deterministic, collision-resistant cache key from input parameters.
    Uses SHA-256 hash of a canonical JSON representation.
    """
    canonical = json.dumps(params, sort_keys=True, default=str)
    param_hash = hashlib.sha256(canonical.encode()).hexdigest()[:16]
    return f"{CACHE_KEY_PREFIX}:{calc_type}:{param_hash}"


def get_cached_result(calc_type: str, params: Dict[str, Any]) -> Optional[Dict]:
    """
    Try to retrieve a cached calculation result.

    Args:
        calc_type: Calculation type identifier (e.g., 'voltage_drop')
        params: Dictionary of input parameters

    Returns:
        Cached result dict if found, None on miss or error
    """
    client = _get_redis_client()
    if not client:
        return None

    try:
        key = _make_cache_key(calc_type, params)
        cached = client.get(key)
        if cached:
            logger.debug(f"Cache HIT: {key}")
            return json.loads(cached)
        logger.debug(f"Cache MISS: {key}")
        return None
    except Exception as e:
        logger.warning(f"Cache read error: {e}")
        return None


def set_cached_result(
    calc_type: str,
    params: Dict[str, Any],
    result: Dict[str, Any],
    ttl: int = CALC_CACHE_TTL
) -> bool:
    """
    Store a calculation result in the cache.

    Args:
        calc_type: Calculation type identifier
        params: Input parameters (used to build cache key)
        result: The result to cache
        ttl: Time-to-live in seconds

    Returns:
        True if stored successfully, False otherwise
    """
    client = _get_redis_client()
    if not client:
        return False

    try:
        key = _make_cache_key(calc_type, params)
        client.setex(key, ttl, json.dumps(result, default=str))
        logger.debug(f"Cache SET: {key} (TTL={ttl}s)")
        return True
    except Exception as e:
        logger.warning(f"Cache write error: {e}")
        return False


def invalidate_calc_cache(calc_type: Optional[str] = None) -> int:
    """
    Invalidate cache entries. If calc_type is None, invalidates all calc entries.

    Returns:
        Number of keys deleted
    """
    client = _get_redis_client()
    if not client:
        return 0

    try:
        if calc_type:
            pattern = f"{CACHE_KEY_PREFIX}:{calc_type}:*"
        else:
            pattern = f"{CACHE_KEY_PREFIX}:*"

        keys = client.keys(pattern)
        if keys:
            return client.delete(*keys)
        return 0
    except Exception as e:
        logger.warning(f"Cache invalidation error: {e}")
        return 0
