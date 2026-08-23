"""
Rate Limiter Middleware
"""

from fastapi import Request
from typing import Callable, Awaitable, Optional
import logging
import time

from config import settings

logger = logging.getLogger("bigstarz.middleware")


class RateLimitMiddleware:
    """Rate limiting middleware"""
    
    def __init__(self, app):
        self.app = app
        self.request_counts = {}
        self.last_request_times = {}
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Skip rate limiting for health checks
        path = request.url.path
        if path in ["/health", "/ready"]:
            await self.app(scope, receive, send)
            return
        
        # Get client IP
        client_ip = str(request.client.host)
        current_time = time.time()
        
        # Initialize request tracking for this IP
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = 0
            self.last_request_times[client_ip] = current_time
        
        # Check if window has expired
        if current_time - self.last_request_times[client_ip] > settings.RATE_LIMIT_WINDOW:
            self.request_counts[client_ip] = 0
            self.last_request_times[client_ip] = current_time
        
        # Check rate limit
        if self.request_counts[client_ip] >= settings.RATE_LIMIT_REQUESTS:
            from fastapi.responses import JSONResponse
            from datetime import datetime, timezone
            
            response = JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": 429,
                        "message": "Too many requests",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                },
            )
            await response(scope, receive, send)
            return
        
        # Increment request count
        self.request_counts[client_ip] += 1
        
        await self.app(scope, receive, send)


# Export all
__all__ = ["RateLimitMiddleware"]
