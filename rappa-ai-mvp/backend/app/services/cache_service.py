"""Redis caching service for API optimization.

Provides cache-aside pattern for faster API responses.
"""

import json
import logging
from typing import Any, Optional, Callable
from functools import wraps

logger = logging.getLogger(__name__)

# Try to import redis, but gracefully handle if not installed
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not installed. Caching will be disabled. Install with: pip install redis")


class CacheService:
    """Service for Redis caching with graceful fallback."""

    def __init__(self):
        """Initialize cache service."""
        self.redis = None
        self.enabled = False

        if REDIS_AVAILABLE:
            try:
                from app.config import settings

                # Try to connect to Redis
                self.redis = redis.Redis(
                    host=getattr(settings, 'REDIS_HOST', 'localhost'),
                    port=getattr(settings, 'REDIS_PORT', 6379),
                    db=0,
                    decode_responses=True,
                    socket_keepalive=True,
                    socket_connect_timeout=2,
                    max_connections=50
                )

                # Test connection
                self.redis.ping()
                self.enabled = True
                logger.info("Redis cache enabled")

            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Caching disabled.")
                self.redis = None
                self.enabled = False
        else:
            logger.info("Redis not available. Caching disabled.")

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        if not self.enabled:
            return None

        try:
            value = self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: 1 hour)
        """
        if not self.enabled:
            return

        try:
            self.redis.setex(key, ttl, json.dumps(value))
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {e}")

    def delete(self, key: str):
        """Delete value from cache.

        Args:
            key: Cache key
        """
        if not self.enabled:
            return

        try:
            self.redis.delete(key)
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {e}")

    def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern.

        Args:
            pattern: Pattern to match (e.g., "user:123:*")
        """
        if not self.enabled:
            return

        try:
            for key in self.redis.scan_iter(match=pattern):
                self.redis.delete(key)
            logger.info(f"Invalidated cache pattern: {pattern}")
        except Exception as e:
            logger.warning(f"Cache invalidate error for pattern {pattern}: {e}")

    def get_or_set(self, key: str, fetch_fn: Callable, ttl: int = 3600) -> Any:
        """Cache-aside pattern - get from cache or fetch and cache.

        Args:
            key: Cache key
            fetch_fn: Function to call if cache miss
            ttl: Time to live in seconds

        Returns:
            Cached or freshly fetched value
        """
        # Try cache first
        cached = self.get(key)
        if cached is not None:
            logger.debug(f"Cache HIT: {key}")
            return cached

        # Cache miss - fetch data
        logger.debug(f"Cache MISS: {key}")
        value = fetch_fn()

        # Cache the result
        self.set(key, value, ttl)

        return value


# Singleton instance
_cache_service = None


def get_cache_service() -> CacheService:
    """Get singleton cache service instance.

    Returns:
        CacheService instance
    """
    global _cache_service

    if _cache_service is None:
        _cache_service = CacheService()

    return _cache_service


# Convenience instance
cache = get_cache_service()


def cached(ttl: int = 3600, key_prefix: str = ""):
    """Decorator for caching function results.

    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key

    Example:
        @cached(ttl=300, key_prefix="user")
        def get_user(user_id: int):
            return db.query(User).filter(User.id == user_id).first()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try cache first
            result = cache.get(cache_key)
            if result is not None:
                return result

            # Cache miss - call function
            result = func(*args, **kwargs)

            # Cache the result
            cache.set(cache_key, result, ttl)

            return result

        return wrapper
    return decorator
