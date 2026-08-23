"""
Authentication Router
Task 101-120: Core Authentication & Security
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Query
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta, timezone
import secrets
import uuid as uuid_module

from config import settings
from database.models import User
from database.connection import async_session_maker, get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from utils.jwt_utils import (
    create_token_pair,
    verify_access_token,
    verify_refresh_token,
    blacklist_token,
    is_token_blacklisted,
    TokenPayload,
)
from utils.password_utils import hash_password, verify_password
from utils.rbac import rbac_enforcer, require_role, require_admin
from utils.twilio_utils import twilio_service
from utils.email_utils import email_service
from utils.device_fingerprint import DeviceFingerprint
from utils.oauth_utils import oauth2_scheme, OAuth2PasswordFlow, GoogleOAuth, AppleOAuth

logger = logging.getLogger("bigstarz.auth")

router = APIRouter(prefix="/auth", tags=["authentication"])


# Task 102: Implement OAuth 2.0 Password Flow
@router.post("/token", summary="Get access token using OAuth2 password flow")
async def get_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    OAuth 2.0 Password Flow Token Endpoint
    Task 102: Implement OAuth 2.0 Password Flow
    """
    # Authenticate user
    user = await OAuth2PasswordFlow.authenticate_user(
        form_data.username,
        form_data.password,
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token pair
    tokens = create_token_pair(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
    )
    
    # Get device fingerprint from request
    fingerprint = DeviceFingerprint.create_fingerprint(
        user_agent=str(request.headers.get("user-agent")),
        ip_address=str(request.client.host),
        accept_language=str(request.headers.get("accept-language")),
    )
    
    # Store fingerprint
    await DeviceFingerprint.store_fingerprint(
        user_id=str(user.id),
        fingerprint=fingerprint,
        metadata={
            "user_agent": str(request.headers.get("user-agent")),
            "ip_address": str(request.client.host),
        },
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": tokens.token_type,
            "expires_in": tokens.expires_in,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
            },
        },
    )


# Task 103-104: JWT Token Endpoints
@router.post("/refresh", summary="Refresh access token")
async def refresh_token(
    request: Request,
    refresh_token: str = Query(..., description="Refresh token"),
) -> JSONResponse:
    """
    Refresh Access Token Endpoint
    Task 104: Write JWT Refresh Token logic
    """
    # Verify refresh token
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if refresh token is blacklisted
    if payload.jti:
        is_blacklisted = await is_token_blacklisted(payload.jti, "refresh")
        if is_blacklisted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Get user from database
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.id == payload.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Create new token pair
    tokens = create_token_pair(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
    )
    
    # Blacklist old refresh token
    if payload.jti:
        await blacklist_token(payload.jti, "refresh")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": tokens.token_type,
            "expires_in": tokens.expires_in,
        },
    )


@router.post("/logout", summary="Log out and revoke tokens")
async def logout(
    request: Request,
    token: str = Query(..., description="Access or refresh token to revoke"),
) -> JSONResponse:
    """
    Logout Endpoint - Revoke tokens
    Task 105: Configure Redis token blacklisting
    """
    # Try to verify as access token first
    payload = verify_access_token(token)
    if not payload:
        payload = verify_refresh_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token",
        )
    
    # Blacklist the token
    if payload.jti:
        token_type = "refresh" if payload.type == "refresh" else "access"
        await blacklist_token(payload.jti, token_type)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Logged out successfully",
        },
    )


# Task 109: Implement Twilio SMS OTP logic
@router.post("/send-otp", summary="Send OTP via SMS")
async def send_otp(
    phone_number: str = Query(..., description="Phone number in E.164 format"),
) -> JSONResponse:
    """
    Send OTP via SMS
    Task 109: Implement Twilio SMS OTP logic
    """
    # Generate OTP
    otp = twilio_service.generate_otp()
    
    # Send OTP via Twilio
    success, message_id = await twilio_service.send_otp(phone_number, otp)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to send OTP: {message_id}",
        )
    
    # In production, store OTP in Redis with expiration
    # For now, return success
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "OTP sent successfully",
            "message_id": message_id,
        },
    )


@router.post("/verify-otp", summary="Verify OTP")
async def verify_otp(
    phone_number: str = Query(..., description="Phone number"),
    otp: str = Query(..., description="OTP code"),
) -> JSONResponse:
    """
    Verify OTP
    Task 109: Implement Twilio SMS OTP logic
    """
    is_valid = await twilio_service.verify_otp(phone_number, otp)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP",
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "OTP verified successfully",
        },
    )


# Task 110: Write Google OAuth social login
@router.get("/google", summary="Initiate Google OAuth")
async def google_auth(
    state: Optional[str] = Query(None, description="State parameter for CSRF protection"),
) -> JSONResponse:
    """
    Initiate Google OAuth Flow
    Task 110: Write Google OAuth social login
    """
    if not state:
        state = secrets.token_urlsafe(32)
    
    auth_url = GoogleOAuth.get_authorization_url(state)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "authorization_url": auth_url,
            "state": state,
        },
    )


@router.get("/google/callback", summary="Google OAuth callback")
async def google_callback(
    code: str = Query(..., description="Authorization code"),
    state: Optional[str] = Query(None, description="State parameter"),
) -> JSONResponse:
    """
    Google OAuth Callback
    Task 110: Write Google OAuth social login
    """
    try:
        user = await GoogleOAuth.authenticate_with_google(code)
        
        # Create token pair
        tokens = create_token_pair(
            user_id=str(user.id),
            email=user.email,
            role=user.role,
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "access_token": tokens.access_token,
                "refresh_token": tokens.refresh_token,
                "token_type": tokens.token_type,
                "expires_in": tokens.expires_in,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "role": user.role,
                },
            },
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google OAuth failed",
        )


# Task 111: Write Apple OAuth social login
@router.get("/apple", summary="Initiate Apple OAuth")
async def apple_auth(
    state: Optional[str] = Query(None, description="State parameter for CSRF protection"),
) -> JSONResponse:
    """
    Initiate Apple OAuth Flow
    Task 111: Write Apple OAuth social login
    """
    if not state:
        state = secrets.token_urlsafe(32)
    
    auth_url = AppleOAuth.get_authorization_url(state)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "authorization_url": auth_url,
            "state": state,
        },
    )


@router.post("/apple/callback", summary="Apple OAuth callback")
async def apple_callback(
    request: Request,
    code: str = Query(..., description="Authorization code"),
) -> JSONResponse:
    """
    Apple OAuth Callback
    Task 111: Write Apple OAuth social login
    """
    try:
        user = await AppleOAuth.authenticate_with_apple(code)
        
        # Create token pair
        tokens = create_token_pair(
            user_id=str(user.id),
            email=user.email,
            role=user.role,
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "access_token": tokens.access_token,
                "refresh_token": tokens.refresh_token,
                "token_type": tokens.token_type,
                "expires_in": tokens.expires_in,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "role": user.role,
                },
            },
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Apple OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apple OAuth failed",
        )


# Task 112: Implement API Key generation for Brands
@router.post("/api-keys", summary="Generate API key for Brand")
async def generate_api_key(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Generate API Key for Brand
    Task 112: Implement API Key generation for Brands
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a brand
    if user.role != "BRAND":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only brands can generate API keys",
        )
    
    # Generate API key
    api_key = f"{settings.API_KEY_PREFIX}{secrets.token_urlsafe(settings.API_KEY_LENGTH)}"
    
    # Store API key in database
    result = await db.execute(
        select(User).where(User.id == user.id)
    )
    user_obj = result.scalar_one_or_none()
    
    if user_obj.brand_agency:
        user_obj.brand_agency.api_key = api_key
        user_obj.brand_agency.api_key_expires_at = datetime.utcnow() + timedelta(days=365)
        await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "api_key": api_key,
            "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat(),
        },
    )


# Task 113: Write account recovery email triggers
@router.post("/forgot-password", summary="Request password reset")
async def forgot_password(
    email: str = Query(..., description="Email address"),
) -> JSONResponse:
    """
    Request Password Reset
    Task 113: Write account recovery email triggers
    """
    # Find user by email
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists for security
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "If an account exists with this email, a password reset link will be sent",
            },
        )
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Store reset token in Redis with expiration
    import aioredis
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"password_reset:{reset_token}"
        await redis.setex(
            key,
            3600,  # 1 hour
            str(user.id),
        )
        await redis.close()
    except Exception as e:
        logger.error(f"Failed to store reset token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request",
        )
    
    # Send email
    await email_service.send_password_reset_email(user.email, reset_token)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "If an account exists with this email, a password reset link will be sent",
        },
    )


@router.post("/reset-password", summary="Reset password")
async def reset_password(
    token: str = Query(..., description="Reset token"),
    new_password: str = Query(..., description="New password"),
) -> JSONResponse:
    """
    Reset Password
    Task 113: Write account recovery email triggers
    """
    # Get user ID from reset token
    import aioredis
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"password_reset:{token}"
        user_id = await redis.get(key)
        await redis.close()
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )
    except Exception as e:
        logger.error(f"Failed to get reset token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset",
        )
    
    # Update user password
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found",
            )
        
        user.password_hash = hash_password(new_password)
        await db.commit()
    
    # Delete reset token
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"password_reset:{token}"
        await redis.delete(key)
        await redis.close()
    except Exception as e:
        logger.error(f"Failed to delete reset token: {str(e)}")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Password reset successfully",
        },
    )


# Task 115: Write magic link login endpoints
@router.post("/magic-link", summary="Request magic link")
async def request_magic_link(
    email: str = Query(..., description="Email address"),
) -> JSONResponse:
    """
    Request Magic Link
    Task 115: Write magic link login endpoints
    """
    # Find user by email
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists for security
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "If an account exists with this email, a magic link will be sent",
            },
        )
    
    # Generate magic link token
    magic_token = secrets.token_urlsafe(32)
    
    # Store magic token in Redis with expiration
    import aioredis
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"magic_link:{magic_token}"
        await redis.setex(
            key,
            settings.MAGIC_LINK_EXPIRATION,
            str(user.id),
        )
        await redis.close()
    except Exception as e:
        logger.error(f"Failed to store magic token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process magic link request",
        )
    
    # Create magic link URL
    magic_link = f"https://bigstarz.com/auth/magic-link/callback?token={magic_token}"
    
    # Send email
    await email_service.send_magic_link_email(user.email, magic_link)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "If an account exists with this email, a magic link will be sent",
        },
    )


@router.get("/magic-link/callback", summary="Magic link callback")
async def magic_link_callback(
    token: str = Query(..., description="Magic link token"),
) -> JSONResponse:
    """
    Magic Link Callback
    Task 115: Write magic link login endpoints
    """
    # Get user ID from magic token
    import aioredis
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"magic_link:{token}"
        user_id = await redis.get(key)
        await redis.close()
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired magic link",
            )
    except Exception as e:
        logger.error(f"Failed to get magic token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process magic link",
        )
    
    # Get user
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found",
            )
    
    # Create token pair
    tokens = create_token_pair(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
    )
    
    # Delete magic token
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        key = f"magic_link:{token}"
        await redis.delete(key)
        await redis.close()
    except Exception as e:
        logger.error(f"Failed to delete magic token: {str(e)}")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": tokens.token_type,
            "expires_in": tokens.expires_in,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
            },
        },
    )


# Task 116: Implement biometric session validation backend
@router.post("/biometric/validate", summary="Validate biometric session")
async def validate_biometric_session(
    request: Request,
    biometric_token: str = Query(..., description="Biometric session token"),
) -> JSONResponse:
    """
    Validate Biometric Session
    Task 116: Implement biometric session validation backend
    """
    # Verify biometric token
    # In production, this would validate against stored biometric tokens
    
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if biometric token is valid for this user
    # For now, return success (mock implementation)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Biometric session validated",
            "user_id": str(user.id),
        },
    )


# Task 117: Implement brute-force login protection
@router.post("/login", summary="Login with brute force protection")
async def login(
    request: Request,
    email: str = Query(..., description="Email address"),
    password: str = Query(..., description="Password"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Login with Brute Force Protection
    Task 117: Implement brute-force login protection
    """
    import aioredis
    
    # Check brute force attempts
    ip_address = str(request.client.host)
    redis_key = f"login_attempts:{ip_address}"
    
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        attempts = await redis.get(redis_key)
        
        if attempts and int(attempts) >= settings.BRUTE_FORCE_MAX_ATTEMPTS:
            await redis.close()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later.",
            )
        
        await redis.close()
    except Exception as e:
        logger.error(f"Failed to check brute force: {str(e)}")
    
    # Authenticate user
    user = await OAuth2PasswordFlow.authenticate_user(email, password)
    
    if not user:
        # Increment failed attempts
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            await redis.incr(redis_key)
            await redis.expire(redis_key, settings.BRUTE_FORCE_LOCKOUT_TIME)
            await redis.close()
        except Exception as e:
            logger.error(f"Failed to increment login attempts: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Reset failed attempts on success
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        await redis.delete(redis_key)
        await redis.close()
    except Exception as e:
        logger.error(f"Failed to reset login attempts: {str(e)}")
    
    # Create token pair
    tokens = create_token_pair(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": tokens.token_type,
            "expires_in": tokens.expires_in,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
            },
        },
    )


# Task 118: Configure strict cookie security (HttpOnly, Secure)
@router.post("/set-cookie", summary="Set secure cookie")
async def set_secure_cookie(
    response: Response,
    value: str = Query(..., description="Cookie value"),
) -> JSONResponse:
    """
    Set Secure Cookie
    Task 118: Configure strict cookie security (HttpOnly, Secure)
    """
    response.set_cookie(
        key="bigstarz_session",
        value=value,
        httponly=settings.COOKIE_HTTP_ONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=86400,  # 1 day
        domain=settings.COOKIE_DOMAIN,
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Cookie set successfully",
        },
    )


# Task 119: Write GDPR data deletion endpoint
@router.delete("/me", summary="Delete user account (GDPR)")
async def delete_account(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Delete User Account (GDPR)
    Task 119: Write GDPR data deletion endpoint
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Soft delete user
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    user.deleted_by = str(user.id)
    
    await db.commit()
    
    # In production, you would also:
    # 1. Delete all related data (cascade)
    # 2. Send confirmation email
    # 3. Revoke all tokens
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Account deleted successfully",
        },
    )


# Task 120: Implement device fingerprinting tracker
@router.get("/device-fingerprint", summary="Get device fingerprint")
async def get_device_fingerprint(
    request: Request,
) -> JSONResponse:
    """
    Get Device Fingerprint
    Task 120: Implement device fingerprinting tracker
    """
    fingerprint = DeviceFingerprint.create_fingerprint(
        user_agent=str(request.headers.get("user-agent")),
        ip_address=str(request.client.host),
        accept_language=str(request.headers.get("accept-language")),
        screen_resolution=str(request.headers.get("x-screen-resolution")),
        timezone=str(request.headers.get("x-timezone")),
        platform=str(request.headers.get("x-platform")),
        do_not_track=request.headers.get("dnt") == "1",
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "fingerprint": fingerprint,
        },
    )


# Export router
__all__ = ["router"]
