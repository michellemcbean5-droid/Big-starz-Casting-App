"""
JWT Token Utilities
Task 103: Write JWT Access Token generator (AES-256)
Task 104: Write JWT Refresh Token logic
"""

from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import logging
from pydantic import BaseModel

from config import settings

logger = logging.getLogger("bigstarz.auth")


class TokenPayload(BaseModel):
    """Token payload model"""
    user_id: str
    email: str
    role: str
    iat: Optional[datetime] = None
    exp: Optional[datetime] = None
    jti: Optional[str] = None  # JWT ID for blacklisting


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


def create_jwt_token(
    user_id: str,
    email: str,
    role: str,
    token_type: str = "access",
    expires_delta: Optional[timedelta] = None,
    jti: Optional[str] = None,
) -> str:
    """
    Create JWT token with AES-256 equivalent (HS256 algorithm)
    Task 103: JWT Access Token generator
    """
    if expires_delta is None:
        if token_type == "access":
            expires_delta = timedelta(seconds=settings.JWT_ACCESS_EXPIRATION)
        else:
            expires_delta = timedelta(seconds=settings.JWT_REFRESH_EXPIRATION)
    
    # Get secret key based on token type
    secret_key = (
        settings.JWT_REFRESH_SECRET if token_type == "refresh"
        else settings.JWT_SECRET
    )
    
    # Create payload
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + expires_delta,
        "type": token_type,
    }
    
    # Add JWT ID for blacklisting
    if jti:
        payload["jti"] = jti
    
    # Generate token
    token = jwt.encode(
        payload,
        secret_key,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return token


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    jti: Optional[str] = None,
) -> str:
    """Create access token"""
    return create_jwt_token(
        user_id=user_id,
        email=email,
        role=role,
        token_type="access",
        jti=jti,
    )


def create_refresh_token(
    user_id: str,
    email: str,
    role: str,
    jti: Optional[str] = None,
) -> str:
    """
    Create refresh token
    Task 104: JWT Refresh Token logic
    """
    return create_jwt_token(
        user_id=user_id,
        email=email,
        role=role,
        token_type="refresh",
        jti=jti,
    )


def create_token_pair(
    user_id: str,
    email: str,
    role: str,
) -> TokenResponse:
    """
    Create access and refresh token pair
    """
    import uuid
    
    # Generate JWT IDs for blacklisting
    access_jti = str(uuid.uuid4())
    refresh_jti = str(uuid.uuid4())
    
    access_token = create_access_token(
        user_id=user_id,
        email=email,
        role=role,
        jti=access_jti,
    )
    
    refresh_token = create_refresh_token(
        user_id=user_id,
        email=email,
        role=role,
        jti=refresh_jti,
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_EXPIRATION,
    )


def verify_jwt_token(
    token: str,
    token_type: str = "access",
) -> Optional[TokenPayload]:
    """
    Verify JWT token
    """
    # Get secret key based on token type
    secret_key = (
        settings.JWT_REFRESH_SECRET if token_type == "refresh"
        else settings.JWT_SECRET
    )
    
    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[settings.JWT_ALGORITHM],
        )
        
        # Convert payload to TokenPayload
        return TokenPayload(
            user_id=payload.get("sub"),
            email=payload.get("email"),
            role=payload.get("role"),
            iat=datetime.fromtimestamp(payload.get("iat"), tz=timezone.utc),
            exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc),
            jti=payload.get("jti"),
        )
    except JWTError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        return None


def verify_access_token(token: str) -> Optional[TokenPayload]:
    """Verify access token"""
    return verify_jwt_token(token, token_type="access")


def verify_refresh_token(token: str) -> Optional[TokenPayload]:
    """
    Verify refresh token
    Task 104: JWT Refresh Token logic
    """
    return verify_jwt_token(token, token_type="refresh")


async def blacklist_token(jti: str, token_type: str = "access") -> bool:
    """
    Blacklist a token (add to Redis)
    Task 105: Configure Redis token blacklisting
    """
    import aioredis
    
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"{settings.REDIS_TOKEN_BLACKLIST_PREFIX}{token_type}:{jti}"
        
        # Set with TTL
        ttl = settings.REDIS_TOKEN_BLACKLIST_TTL
        await redis.setex(key, ttl, "blacklisted")
        await redis.close()
        return True
    except Exception as e:
        logger.error(f"Failed to blacklist token: {str(e)}")
        return False


async def is_token_blacklisted(jti: str, token_type: str = "access") -> bool:
    """
    Check if token is blacklisted
    Task 105: Configure Redis token blacklisting
    """
    import aioredis
    
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"{settings.REDIS_TOKEN_BLACKLIST_PREFIX}{token_type}:{jti}"
        
        exists = await redis.exists(key)
        await redis.close()
        return exists == 1
    except Exception as e:
        logger.error(f"Failed to check token blacklist: {str(e)}")
        return False


# Export all
__all__ = [
    "TokenPayload",
    "TokenResponse",
    "create_jwt_token",
    "create_access_token",
    "create_refresh_token",
    "create_token_pair",
    "verify_jwt_token",
    "verify_access_token",
    "verify_refresh_token",
    "blacklist_token",
    "is_token_blacklisted",
]
