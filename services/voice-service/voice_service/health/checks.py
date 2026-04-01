"""Health check endpoints for monitoring service and dependency health."""

import logging
import socket
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException

from voice_service.config.redis_config import redis_client
from voice_service.cache import session_store, model_cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


def get_system_info() -> Dict[str, Any]:
    """Get basic system information."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "hostname": socket.gethostname(),
        "status": "healthy",
    }


@router.get("/", tags=["health"])
async def health_check() -> Dict[str, Any]:
    """Basic health check - returns 200 if service is running."""
    return {
        **get_system_info(),
        "service": "voice_service",
        "check_type": "basic",
    }


@router.get("/ready", tags=["health"])
async def readiness_check() -> Dict[str, Any]:
    """Readiness check - returns 200 only if all dependencies are ready."""
    redis_health = redis_client.health_check()

    if not redis_health.get("connected"):
        logger.error("Readiness check failed: Redis not connected")
        raise HTTPException(status_code=503, detail="Redis not available")

    return {
        **get_system_info(),
        "service": "voice_service",
        "check_type": "readiness",
        "dependencies": {
            "redis": redis_health,
        },
    }


@router.get("/live", tags=["health"])
async def liveness_check() -> Dict[str, Any]:
    """Liveness check - indicates if service should be restarted."""
    try:
        if not redis_client.is_healthy:
            logger.error("Liveness check failed: Redis unhealthy")
            raise HTTPException(status_code=503, detail="Service unhealthy")

        return {
            **get_system_info(),
            "service": "voice_service",
            "check_type": "liveness",
            "redis_ok": True,
        }
    except Exception as e:
        logger.error(f"Liveness check error: {e}")
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/detailed", tags=["health"])
async def detailed_health() -> Dict[str, Any]:
    """Detailed health report including all metrics."""
    redis_health = redis_client.health_check()
    sessions_stats = session_store.get_session_stats()
    cache_stats = model_cache.get_cache_stats()

    # Check for critical issues
    critical_issues = []

    if not redis_health.get("connected"):
        critical_issues.append("Redis not connected")

    if redis_health.get("used_memory_percent", 0) > 90:
        critical_issues.append("Redis memory usage above 90%")

    status = "critical" if critical_issues else "healthy"

    return {
        **get_system_info(),
        "service": "voice_service",
        "check_type": "detailed",
        "status": status,
        "redis": redis_health,
        "sessions": sessions_stats,
        "model_cache": cache_stats,
        "critical_issues": critical_issues,
    }


@router.get("/dependencies", tags=["health"])
async def dependency_status() -> Dict[str, Any]:
    """Check status of all external dependencies."""
    results = {
        **get_system_info(),
        "check_type": "dependencies",
        "dependencies": {},
    }

    # Redis check
    redis_health = redis_client.health_check()
    results["dependencies"]["redis"] = {
        "name": "Redis Cache/Session Store",
        "status": "up" if redis_health.get("connected") else "down",
        "details": redis_health,
    }

    # Overall status
    all_up = all(
        dep.get("status") == "up"
        for dep in results["dependencies"].values()
    )
    results["overall_status"] = "healthy" if all_up else "degraded"

    return results
