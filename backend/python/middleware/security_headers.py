"""
Security Headers Middleware
Task 118: Configure strict cookie security (HttpOnly, Secure)
"""

from fastapi import Request
from typing import Callable, Awaitable
import logging

logger = logging.getLogger("bigstarz.middleware")


class SecurityHeadersMiddleware:
    """Security headers middleware"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Add security headers
                headers = message.get("headers", [])
                
                # Convert headers to mutable list
                headers_list = list(headers)
                
                # Add security headers
                security_headers = [
                    (b"x-frame-options", b"DENY"),
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-xss-protection", b"1; mode=block"),
                    (b"strict-transport-security", b"max-age=31536000; includeSubDomains; preload"),
                    (b"referrer-policy", b"strict-origin-when-cross-origin"),
                    (b"permissions-policy", b"camera=(), microphone=(), geolocation=()"),
                    (b"content-security-policy", b"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"),
                ]
                
                # Add security headers to response
                for header, value in security_headers:
                    headers_list.append((header, value))
                
                # Update message headers
                message["headers"] = headers_list
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)


# Export all
__all__ = ["SecurityHeadersMiddleware"]
