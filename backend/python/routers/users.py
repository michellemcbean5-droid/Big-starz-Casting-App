"""
Users Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from config import settings
from database.models import User, Profile, TalentProfile, CastingDirectorProfile
from database.connection import async_session_maker, get_db
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from utils.jwt_utils import create_token_pair, verify_access_token
from utils.password_utils import hash_password, verify_password
from utils.rbac import require_role, require_admin
from utils.oauth_utils import OAuth2PasswordFlow

logger = logging.getLogger("bigstarz.users")

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", summary="Register new user")
async def register_user(
    email: str = Query(..., description="Email address"),
    password: str = Query(..., description="Password"),
    first_name: str = Query(..., description="First name"),
    last_name: str = Query(..., description="Last name"),
    role: str = Query(default="ACTOR", description="User role"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Register new user"""
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Hash password
    password_hash = hash_password(password)
    
    # Create user
    user = User(
        email=email,
        password_hash=password_hash,
        role=role,
        email_verified=False,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create profile
    profile = Profile(
        user_id=str(user.id),
        first_name=first_name,
        last_name=last_name,
        display_name=f"{first_name} {last_name}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(profile)
    await db.commit()
    
    # Create role-specific profile
    if role == "ACTOR":
        talent_profile = TalentProfile(
            profile_id=str(profile.id),
            stage_name=None,
            union_status="NON_UNION",
            skills=[],
            experience_years=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(talent_profile)
        await db.commit()
    elif role == "CASTING_DIRECTOR":
        director_profile = CastingDirectorProfile(
            profile_id=str(profile.id),
            company_name=None,
            company_website=None,
            credits=[],
            verified=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(director_profile)
        await db.commit()
    
    # Create token pair
    tokens = create_token_pair(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
    )
    
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
            },
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": tokens.token_type,
            "expires_in": tokens.expires_in,
        },
    )


@router.get("/me", summary="Get current user")
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get current user profile"""
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get full user with profile
    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(
            joinedload(User.profile),
            joinedload(User.talent_profile),
            joinedload(User.casting_director_profile),
        )
    )
    full_user = result.scalar_one_or_none()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "id": str(full_user.id),
            "email": full_user.email,
            "role": full_user.role,
            "email_verified": full_user.email_verified,
            "created_at": full_user.created_at.isoformat(),
            "profile": {
                "first_name": full_user.profile.first_name if full_user.profile else None,
                "last_name": full_user.profile.last_name if full_user.profile else None,
                "display_name": full_user.profile.display_name if full_user.profile else None,
                "avatar_url": full_user.profile.avatar_url if full_user.profile else None,
                "bio": full_user.profile.bio if full_user.profile else None,
                "location": full_user.profile.location if full_user.profile else None,
            } if full_user.profile else None,
            "talent_profile": {
                "stage_name": full_user.talent_profile.stage_name if full_user.talent_profile else None,
                "union_status": full_user.talent_profile.union_status if full_user.talent_profile else None,
                "skills": full_user.talent_profile.skills if full_user.talent_profile else [],
                "experience_years": full_user.talent_profile.experience_years if full_user.talent_profile else None,
                "ranking_score": full_user.talent_profile.ranking_score if full_user.talent_profile else 0,
            } if full_user.talent_profile else None,
        },
    )


@router.put("/me", summary="Update current user")
async def update_current_user(
    request: Request,
    first_name: Optional[str] = Query(None, description="First name"),
    last_name: Optional[str] = Query(None, description="Last name"),
    display_name: Optional[str] = Query(None, description="Display name"),
    bio: Optional[str] = Query(None, description="Bio"),
    location: Optional[str] = Query(None, description="Location"),
    avatar_url: Optional[str] = Query(None, description="Avatar URL"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Update current user profile"""
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get user with profile
    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(joinedload(User.profile))
    )
    full_user = result.scalar_one_or_none()
    
    # Update profile
    if full_user.profile:
        if first_name:
            full_user.profile.first_name = first_name
        if last_name:
            full_user.profile.last_name = last_name
        if display_name:
            full_user.profile.display_name = display_name
        if bio:
            full_user.profile.bio = bio
        if location:
            full_user.profile.location = location
        if avatar_url:
            full_user.profile.avatar_url = avatar_url
        
        full_user.profile.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Profile updated successfully",
        },
    )


@router.get("/{user_id}", summary="Get user by ID")
async def get_user_by_id(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get user by ID"""
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(
            joinedload(User.profile),
            joinedload(User.talent_profile),
            joinedload(User.casting_director_profile),
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "profile": {
                "first_name": user.profile.first_name if user.profile else None,
                "last_name": user.profile.last_name if user.profile else None,
                "display_name": user.profile.display_name if user.profile else None,
            } if user.profile else None,
        },
    )


@router.get("/", summary="List users")
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(default=1, description="Page number"),
    limit: int = Query(default=20, description="Results per page"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """List users with pagination and filtering"""
    query = select(User).options(joinedload(User.profile))
    
    if role:
        query = query.where(User.role == role)
    
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                Profile.first_name.ilike(f"%{search}%"),
                Profile.last_name.ilike(f"%{search}%"),
                Profile.display_name.ilike(f"%{search}%"),
            )
        )
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "users": [
                {
                    "id": str(u.id),
                    "email": u.email,
                    "role": u.role,
                    "profile": {
                        "first_name": u.profile.first_name if u.profile else None,
                        "last_name": u.profile.last_name if u.profile else None,
                        "display_name": u.profile.display_name if u.profile else None,
                    } if u.profile else None,
                }
                for u in users
            ],
            "page": page,
            "limit": limit,
            "total": len(users),
        },
    )


# Export router
__all__ = ["router"]
