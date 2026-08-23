"""
Error Handler Middleware
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging
from datetime import datetime, timezone

logger = logging.getLogger("bigstarz.middleware")


class ErrorHandler:
    """Error handler middleware"""
    
    @staticmethod
    async def handle_exception(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Handle exceptions and return consistent error responses"""
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "success": False,
                    "error": {
                        "code": exc.status_code,
                        "message": exc.detail,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                },
            )
        
        logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": 500,
                    "message": "Internal server error",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            },
        )


# Export all
__all__ = ["ErrorHandler"]
