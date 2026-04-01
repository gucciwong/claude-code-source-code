"""FastAPI middleware for automatic metrics collection.

Tracks request/response metrics, latency, errors, and system health
automatically for all endpoints.
"""

import time
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .prometheus import MetricsTracker

logger = logging.getLogger(__name__)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to track request metrics across all endpoints."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and collect metrics."""
        start_time = time.time()
        
        # Extract request info
        method = request.method
        path = request.url.path
        
        try:
            # Call the next middleware/route
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            status_code = response.status_code
            
            # Record metrics
            MetricsTracker.record_request(
                method=method,
                endpoint=path,
                status=status_code,
                duration=duration,
            )
            
            logger.debug(
                f"{method} {path} - {status_code} ({duration:.3f}s)"
            )
            
            # Add response headers for tracing
            response.headers["X-Process-Time"] = str(duration)
            
            return response
            
        except Exception as e:
            # Calculate duration
            duration = time.time() - start_time
            
            # Record error
            MetricsTracker.record_error(
                error_type=type(e).__name__,
                endpoint=path,
            )
            
            logger.error(
                f"{method} {path} - Error: {e} ({duration:.3f}s)"
            )
            
            raise


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Simplified middleware for request timing."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Track request timing."""
        start = time.time()
        response = await call_next(request)
        process_time = time.time() - start
        response.headers["X-Process-Time"] = str(process_time)
        return response


def attach_metrics_middleware(app):
    """Attach metrics middleware to FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(MetricsMiddleware)
    app.add_middleware(RequestTimingMiddleware)
    logger.info("Metrics middleware attached to FastAPI app")
