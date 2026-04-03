"""Redis connection and configuration management.

Provides centralized Redis client management with connection pooling,
failover support, and health checking.
"""

import os
import logging
from typing import Optional
from dataclasses import dataclass

import redis
from redis.connection import ConnectionPool
from redis.exceptions import ConnectionError, RedisError

logger = logging.getLogger(__name__)


@dataclass
class RedisSettings:
    """Redis connection settings."""

    host: str = os.getenv("REDIS_HOST", "localhost")
    port: int = int(os.getenv("REDIS_PORT", "6379"))
    password: Optional[str] = os.getenv("REDIS_PASSWORD")
    db: int = int(os.getenv("REDIS_DB", "0"))
    max_connections: int = int(os.getenv("REDIS_MAX_CONNECTIONS", "50"))
    socket_timeout: int = int(os.getenv("REDIS_SOCKET_TIMEOUT", "5"))
    socket_connect_timeout: int = int(os.getenv("REDIS_SOCKET_CONNECT_TIMEOUT", "5"))
    socket_keepalive: bool = os.getenv("REDIS_SOCKET_KEEPALIVE", "1") == "1"
    health_check_interval: int = int(os.getenv("REDIS_HEALTH_CHECK_INTERVAL", "30"))
    enable_clustering: bool = os.getenv("REDIS_ENABLE_CLUSTERING", "0") == "1"

    def to_dict(self) -> dict:
        """Convert settings to Redis connection kwargs."""
        return {
            "host": self.host,
            "port": self.port,
            "password": self.password,
            "db": self.db,
            "socket_timeout": self.socket_timeout,
            "socket_connect_timeout": self.socket_connect_timeout,
            "socket_keepalive": self.socket_keepalive,
            "decode_responses": True,
            "health_check_interval": self.health_check_interval,
        }


class RedisClient:
    """Singleton Redis client with connection pooling and health checks."""

    _instance: Optional["RedisClient"] = None
    _client: Optional[redis.Redis] = None
    _pool: Optional[ConnectionPool] = None
    _is_healthy: bool = False

    def __new__(cls):
        """Ensure singleton pattern."""
        if not isinstance(cls._instance, cls):
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize Redis client if not already initialized."""
        # Defer connection creation until first access to avoid import-time failures.
        if self._client is None:
            self._is_healthy = False

    def _initialize(self) -> None:
        """Initialize Redis connection pool and client."""
        settings = RedisSettings()

        try:
            self._pool = ConnectionPool(
                max_connections=settings.max_connections,
                **settings.to_dict(),
            )
            self._client = redis.Redis(connection_pool=self._pool)

            # Test connection
            self._client.ping()
            self._is_healthy = True
            logger.info(
                f"Redis client initialized successfully: {settings.host}:{settings.port}"
            )

        except ConnectionError as e:
            logger.warning(f"Failed to connect to Redis: {e}. Falling back to in-memory fakeredis.")
            try:
                import fakeredis

                self._client = fakeredis.FakeStrictRedis(decode_responses=True)
                self._is_healthy = True
                logger.info("Using fakeredis fallback (in-memory, non-persistent)")
            except ImportError:
                logger.error("fakeredis not installed and Redis is unavailable")
                self._client = None
                self._is_healthy = False

    def _ensure_initialized(self) -> bool:
        """Ensure client is initialized, returning False when unavailable."""
        if self._client is None:
            self._initialize()
        return self._client is not None

    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance."""
        if self._client is None:
            self._initialize()
        if self._client is None:
            raise ConnectionError("Redis client is not available")
        return self._client

    @property
    def is_healthy(self) -> bool:
        """Check if Redis connection is healthy."""
        if not self._ensure_initialized():
            return False

        try:
            self._client.ping()
            return True
        except (ConnectionError, RedisError):
            self._is_healthy = False
            return False

    def health_check(self) -> dict:
        """Perform comprehensive health check."""
        result = {
            "connected": False,
            "latency_ms": None,
            "info": None,
            "memory_mb": None,
            "connected_clients": None,
            "used_memory_percent": 0,
        }

        try:
            if not self._ensure_initialized():
                result["error"] = "Redis client is not available"
                return result

            import time

            start = time.time()
            self._client.ping()
            latency_ms = (time.time() - start) * 1000

            result["connected"] = True
            result["latency_ms"] = round(latency_ms, 2)

            # Get Redis info
            info = self._client.info("memory")
            result["info"] = info
            result["memory_mb"] = info.get("used_memory", 0) / (1024 * 1024)

            # Get connected clients
            server_info = self._client.info("clients")
            result["connected_clients"] = server_info.get("connected_clients", 0)

            # Calculate memory usage percent
            if "maxmemory" in info and info["maxmemory"] > 0:
                result["used_memory_percent"] = round(
                    (info.get("used_memory", 0) / info["maxmemory"]) * 100, 2
                )

            self._is_healthy = True

        except (ConnectionError, RedisError) as e:
            logger.warning(f"Redis health check failed: {e}")
            self._is_healthy = False
            result["error"] = str(e)

        return result

    def close(self) -> None:
        """Close Redis connection."""
        if self._client is not None:
            self._client.close()
            self._client = None
        if self._pool is not None:
            self._pool.disconnect()
            self._pool = None
        logger.info("Redis client closed")

    def flushdb(self) -> None:
        """Flush all data in current database. Use with caution!"""
        self._client.flushdb()
        logger.warning("Redis database flushed")


# Singleton instance (lazy initialization)
redis_client = RedisClient()
