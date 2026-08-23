"""
Casting Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Body
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timedelta

from config import settings
from database.models import CastingCall, Application, User
from database.connection import async_session_maker, get_db
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from utils.jwt_utils import create_token_pair, verify_access_token
from utils.rbac import require_role, require_admin
from utils.oauth_utils import OAuth2PasswordFlow

logger = logging.getLogger("bigstarz.casting")

router = APIRouter(prefix="/casting", tags=["casting"])


@router.post("/calls", summary="Create Casting Call")
async def create_casting_call(
    request: Request,
    title: str = Query(..., description="Casting call title"),
    description: str = Query(..., description="Casting call description"),
    type: str = Query(default="FILM", description="Casting call type"),
    location: Optional[str] = Query(None, description="Location"),
    remote_ok: bool = Query(default=False, description="Remote work allowed"),
    budget: Optional[float] = Query(None, description="Budget"),
    compensation: Optional[str] = Query(None, description="Compensation"),
    deadline: Optional[str] = Query(None, description="Deadline (ISO format)"),
    requirements: Optional[str] = Query(None, description="Requirements (JSON)"),
    roles: Optional[str] = Query(None, description="Roles (JSON)"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Create Casting Call"""
    # Get current user (director)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a casting director
    if user.role not in ["CASTING_DIRECTOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only casting directors can create casting calls",
        )
    
    # Parse JSON fields
    import json
    requirements_dict = json.loads(requirements) if requirements else {}
    roles_list = json.loads(roles) if roles else []
    deadline_dt = datetime.fromisoformat(deadline) if deadline else None
    
    # Create casting call
    casting_call = CastingCall(
        title=title,
        description=description,
        director_id=str(user.id),
        status="OPEN",
        type=type,
        location=location,
        remote_ok=remote_ok,
        budget=budget,
        compensation=compensation,
        deadline=deadline_dt,
        requirements=requirements_dict,
        roles=roles_list,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(casting_call)
    await db.commit()
    await db.refresh(casting_call)
    
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "casting_call": {
                "id": str(casting_call.id),
                "title": casting_call.title,
                "description": casting_call.description,
                "status": casting_call.status,
                "type": casting_call.type,
                "director_id": str(casting_call.director_id),
                "created_at": casting_call.created_at.isoformat(),
            },
        },
    )


@router.get("/calls", summary="List Casting Calls")
async def list_casting_calls(
    request: Request,
    status: Optional[str] = Query(None, description="Filter by status"),
    type: Optional[str] = Query(None, description="Filter by type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(default=1, description="Page number"),
    limit: int = Query(default=20, description="Results per page"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """List Casting Calls"""
    query = select(CastingCall).options(
        joinedload(CastingCall.director)
    )
    
    if status:
        query = query.where(CastingCall.status == status)
    
    if type:
        query = query.where(CastingCall.type == type)
    
    if location:
        query = query.where(CastingCall.location.ilike(f"%{location}%"))
    
    if search:
        query = query.where(
            or_(
                CastingCall.title.ilike(f"%{search}%"),
                CastingCall.description.ilike(f"%{search}%"),
            )
        )
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    casting_calls = result.scalars().all()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "casting_calls": [
                {
                    "id": str(cc.id),
                    "title": cc.title,
                    "description": cc.description,
                    "status": cc.status,
                    "type": cc.type,
                    "location": cc.location,
                    "remote_ok": cc.remote_ok,
                    "budget": cc.budget,
                    "compensation": cc.compensation,
                    "deadline": cc.deadline.isoformat() if cc.deadline else None,
                    "director": {
                        "id": str(cc.director.id),
                        "email": cc.director.email,
                    },
                    "created_at": cc.created_at.isoformat(),
                }
                for cc in casting_calls
            ],
            "page": page,
            "limit": limit,
            "total": len(casting_calls),
        },
    )


@router.get("/calls/{casting_call_id}", summary="Get Casting Call by ID")
async def get_casting_call(
    casting_call_id: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get Casting Call by ID"""
    result = await db.execute(
        select(CastingCall)
        .where(CastingCall.id == casting_call_id)
        .options(
            joinedload(CastingCall.director),
            joinedload(CastingCall.applications),
        )
    )
    casting_call = result.scalar_one_or_none()
    
    if not casting_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Casting call not found",
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "casting_call": {
                "id": str(casting_call.id),
                "title": casting_call.title,
                "description": casting_call.description,
                "status": casting_call.status,
                "type": casting_call.type,
                "location": casting_call.location,
                "remote_ok": casting_call.remote_ok,
                "budget": casting_call.budget,
                "compensation": casting_call.compensation,
                "deadline": casting_call.deadline.isoformat() if casting_call.deadline else None,
                "requirements": casting_call.requirements,
                "roles": casting_call.roles,
                "director": {
                    "id": str(casting_call.director.id),
                    "email": casting_call.director.email,
                },
                "applications_count": len(casting_call.applications),
                "created_at": casting_call.created_at.isoformat(),
            },
        },
    )


@router.post("/calls/{casting_call_id}/apply", summary="Apply to Casting Call")
async def apply_to_casting_call(
    request: Request,
    casting_call_id: str,
    cover_letter: Optional[str] = Query(None, description="Cover letter"),
    video_url: Optional[str] = Query(None, description="Video URL"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Apply to Casting Call"""
    # Get current user (talent)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a talent
    if user.role != "ACTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only talents can apply to casting calls",
        )
    
    # Get casting call
    result = await db.execute(
        select(CastingCall).where(CastingCall.id == casting_call_id)
    )
    casting_call = result.scalar_one_or_none()
    
    if not casting_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Casting call not found",
        )
    
    # Check if already applied
    result = await db.execute(
        select(Application).where(
            and_(
                Application.talent_id == user.id,
                Application.casting_call_id == casting_call_id,
            )
        )
    )
    existing_application = result.scalar_one_or_none()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this casting call",
        )
    
    # Create application
    application = Application(
        talent_id=str(user.id),
        casting_call_id=str(casting_call_id),
        status="PENDING",
        cover_letter=cover_letter,
        video_url=video_url,
        submitted_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(application)
    await db.commit()
    await db.refresh(application)
    
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "application": {
                "id": str(application.id),
                "talent_id": str(application.talent_id),
                "casting_call_id": str(application.casting_call_id),
                "status": application.status,
                "submitted_at": application.submitted_at.isoformat(),
            },
        },
    )


@router.get("/applications", summary="List Applications")
async def list_applications(
    request: Request,
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(default=1, description="Page number"),
    limit: int = Query(default=20, description="Results per page"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """List Applications"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Build query based on user role
    if user.role == "ACTOR":
        # Talent can only see their own applications
        query = select(Application).where(Application.talent_id == user.id)
    elif user.role == "CASTING_DIRECTOR":
        # Director can see applications for their casting calls
        query = select(Application).join(
            CastingCall, Application.casting_call_id == CastingCall.id
        ).where(CastingCall.director_id == user.id)
    elif user.role == "ADMIN":
        # Admin can see all applications
        query = select(Application)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view applications",
        )
    
    if status:
        query = query.where(Application.status == status)
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    applications = result.scalars().all()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "applications": [
                {
                    "id": str(a.id),
                    "talent_id": str(a.talent_id),
                    "casting_call_id": str(a.casting_call_id),
                    "status": a.status,
                    "cover_letter": a.cover_letter,
                    "video_url": a.video_url,
                    "submitted_at": a.submitted_at.isoformat(),
                }
                for a in applications
            ],
            "page": page,
            "limit": limit,
            "total": len(applications),
        },
    )


@router.put("/applications/{application_id}/status", summary="Update Application Status")
async def update_application_status(
    request: Request,
    application_id: str,
    status: str = Query(..., description="New status"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Update Application Status"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a casting director or admin
    if user.role not in ["CASTING_DIRECTOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only casting directors can update application status",
        )
    
    # Get application
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    
    # Check if director owns the casting call
    if user.role == "CASTING_DIRECTOR":
        casting_call_result = await db.execute(
            select(CastingCall).where(CastingCall.id == application.casting_call_id)
        )
        casting_call = casting_call_result.scalar_one_or_none()
        
        if not casting_call or str(casting_call.director_id) != str(user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this casting call",
            )
    
    # Update status
    application.status = status
    application.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "application_id": str(application.id),
            "status": application.status,
        },
    )


# Export router
__all__ = ["router"]
