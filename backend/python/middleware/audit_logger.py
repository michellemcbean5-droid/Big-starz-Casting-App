"""
Audit Logger Middleware
"""

from fastapi import Request
from typing import Callable, Awaitable
import logging
from datetime import datetime, timezone
import json

from config import settings
from database.models import AuditLog
from database.connection import async_session_maker

logger = logging.getLogger("bigstarz.audit")


class AuditLogMiddleware:
    """Audit log middleware for tracking all requests"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Skip audit logging for health checks and static files
        path = request.url.path
        if path in ["/health", "/ready", "/docs", "/openapi.json", "/static"]:
            await self.app(scope, receive, send)
            return
        
        # Process request
        start_time = datetime.now(timezone.utc)
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Log audit
                await self._log_audit(request, message, start_time)
            await send(message)
        
        await self.app(scope, receive, send_wrapper)
    
    async def _log_audit(
        self,
        request: Request,
        response_message: dict,
        start_time: datetime,
    ):
        """Log audit entry"""
        try:
            # Get user from request
            user_id = None
            user = getattr(request.state, "user", None)
            if user:
                user_id = str(user.id)
            
            # Get response status
            status_code = response_message.get("status", 200)
            
            # Create audit log entry
            audit_log = AuditLog(
                user_id=user_id,
                action=request.method,
                entity_type=request.url.path,
                entity_id=str(request.url),
                metadata={
                    "method": request.method,
                    "path": request.url.path,
                    "query_params": dict(request.query_params),
                    "status_code": status_code,
                    "response_time_ms": (datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
                    "user_agent": str(request.headers.get("user-agent")),
                    "ip_address": str(request.client.host),
                },
                ip_address=str(request.client.host),
                user_agent=str(request.headers.get("user-agent")),
                created_at=datetime.now(timezone.utc),
            )
            
            async with async_session_maker() as db:
                db.add(audit_log)
                await db.commit()
        except Exception as e:
            logger.error(f"Failed to log audit: {str(e)}")


# Export all
__all__ = ["AuditLogMiddleware"]
