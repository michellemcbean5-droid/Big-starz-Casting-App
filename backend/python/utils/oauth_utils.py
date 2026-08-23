"""
OAuth 2.0 Utilities
Task 102: Implement OAuth 2.0 Password Flow
Task 110: Write Google OAuth social login
Task 111: Write Apple OAuth social login
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, Dict, Any
import logging
import httpx
from urllib.parse import urlencode

from config import settings
from .jwt_utils import verify_access_token
from .password_utils import verify_password
from database.models import User
from database.connection import async_session_maker
from sqlalchemy import select

logger = logging.getLogger("bigstarz.auth")


# OAuth2 scheme for password flow
# Task 102: Implement OAuth 2.0 Password Flow
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v2/auth/token",
    scopes={},
)


class OAuth2PasswordFlow:
    """
    OAuth 2.0 Password Flow Implementation
    Task 102: Implement OAuth 2.0 Password Flow
    """
    
    @staticmethod
    async def authenticate_user(
        email: str,
        password: str,
    ) -> Optional[User]:
        """Authenticate user with email and password"""
        async with async_session_maker() as db:
            result = await db.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            if user and verify_password(password, user.password_hash):
                return user
        
        return None


class GoogleOAuth:
    """
    Google OAuth 2.0 Implementation
    Task 110: Write Google OAuth social login
    """
    
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Get Google OAuth authorization URL"""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GoogleOAuth.GOOGLE_TOKEN_URL,
                data=data,
            )
            
            if response.status_code != 200:
                logger.error(f"Google OAuth token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token",
                )
            
            return response.json()
    
    @staticmethod
    async def get_user_info(access_token: str) -> Dict[str, Any]:
        """Get user info from Google"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GoogleOAuth.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if response.status_code != 200:
                logger.error(f"Google OAuth user info failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info",
                )
            
            return response.json()


class AppleOAuth:
    """
    Apple OAuth 2.0 Implementation
    Task 111: Write Apple OAuth social login
    """
    
    APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Get Apple OAuth authorization URL"""
        params = {
            "client_id": settings.APPLE_CLIENT_ID,
            "redirect_uri": settings.APPLE_REDIRECT_URI,
            "response_type": "code id_token",
            "scope": "name email",
            "response_mode": "form_post",
            "state": state,
        }
        return f"https://appleid.apple.com/auth/authorize?{urlencode(params)}"


# Export all
__all__ = [
    "oauth2_scheme",
    "OAuth2PasswordFlow",
    "GoogleOAuth",
    "AppleOAuth",
]
