"""
GECRAI 1.2 - Token Blacklist Service
Redis-based token blacklist for storing revoked tokens
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

import redis
from redis import Redis

from app.config import settings

logger = logging.getLogger(__name__)

# Redis key prefix
BLACKLIST_PREFIX = "token_blacklist"


def get_redis_client() -> Optional[Redis]:
    """
    Get Redis client for token blacklist.
    Returns None if Redis is not available.
    """
    try:
        client = redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=5,
            socket_timeout=5,
            decode_responses=True,
        )
        client.ping()
        return client
    except Exception as e:
        logger.warning(f"Redis not available for token blacklist: {e}")
        return None


class TokenBlacklist:
    """
    Token blacklist service using Redis.
    
    Stores JTIs of revoked tokens to prevent their reuse.
    Keys expire automatically based on token expiration time.
    """
    
    def __init__(self, redis_client: Optional[Redis] = None):
        """
        Initialize blacklist service.
        
        Args:
            redis_client: Optional Redis client. If not provided,
                         will attempt to connect to configured Redis URL.
        """
        self._client = redis_client
    
    @property
    def client(self) -> Optional[Redis]:
        """Lazy load Redis client."""
        if self._client is None:
            self._client = get_redis_client()
        return self._client
    
    def _get_key(self, jti: uuid.UUID) -> str:
        """Generate Redis key for JTI."""
        return f"{BLACKLIST_PREFIX}:{str(jti)}"
    
    def add_to_blacklist(
        self,
        jti: uuid.UUID,
        expires_at: datetime
    ) -> bool:
        """
        Add a token JTI to the blacklist.
        
        Args:
            jti: The JWT ID to blacklist
            expires_at: When the token expires (used for TTL)
            
        Returns:
            True if added successfully, False otherwise
        """
        if self.client is None:
            logger.warning("Redis not available, cannot add to blacklist")
            return False
        
        try:
            # Calculate TTL based on expiration time
            now = datetime.now(timezone.utc)
            if expires_at > now:
                ttl = int((expires_at - now).total_seconds())
            else:
                # Already expired, use minimal TTL
                ttl = 60
            
            key = self._get_key(jti)
            self.client.setex(key, ttl, "revoked")
            
            logger.debug(f"Added token {jti} to blacklist with TTL {ttl}s")
            return True
            
        except Exception as e:
            logger.error(f"Error adding token to blacklist: {e}")
            return False
    
    def is_blacklisted(self, jti: uuid.UUID) -> bool:
        """
        Check if a token JTI is blacklisted.
        
        Args:
            jti: The JWT ID to check
            
        Returns:
            True if blacklisted, False otherwise
        """
        if self.client is None:
            # If Redis unavailable, assume not blacklisted
            return False
        
        try:
            key = self._get_key(jti)
            result = self.client.exists(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error checking token blacklist: {e}")
            return False
    
    def remove_from_blacklist(self, jti: uuid.UUID) -> bool:
        """
        Remove a token JTI from the blacklist.
        Usually not needed as TTL handles expiration.
        
        Args:
            jti: The JWT ID to remove
            
        Returns:
            True if removed successfully, False otherwise
        """
        if self.client is None:
            return False
        
        try:
            key = self._get_key(jti)
            self.client.delete(key)
            return True
            
        except Exception as e:
            logger.error(f"Error removing token from blacklist: {e}")
            return False
    
    def revoke_token(
        self,
        jti: uuid.UUID,
        expires_at: datetime
    ) -> bool:
        """
        Convenience method to revoke a token.
        Alias for add_to_blacklist.
        
        Args:
            jti: The JWT ID to revoke
            expires_at: When the token expires
            
        Returns:
            True if revoked successfully
        """
        return self.add_to_blacklist(jti, expires_at)


# Global instance for easy importing
token_blacklist = TokenBlacklist()
