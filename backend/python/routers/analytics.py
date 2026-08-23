"""
Analytics Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from config import settings
from database.models import User, AiGeneration, Earning, Application, CastingCall
from database.connection import async_session_maker, get_db
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from utils.jwt_utils import verify_access_token
from utils.oauth_utils import OAuth2PasswordFlow

logger = logging.getLogger("bigstarz.analytics")

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", summary="Get Analytics Overview")
async def get_analytics_overview(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get Analytics Overview"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get user count
    user_count = await db.scalar(select(func.count(User.id)))
    
    # Get AI generation count
    ai_generation_count = await db.scalar(select(func.count(AiGeneration.id)))
    
    # Get total earnings
    total_earnings = await db.scalar(select(func.sum(Earning.amount)))
    
    # Get active casting calls
    active_casting_calls = await db.scalar(
        select(func.count(CastingCall.id)).where(CastingCall.status == "OPEN")
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "overview": {
                "user_count": user_count or 0,
                "ai_generation_count": ai_generation_count or 0,
                "total_earnings": float(total_earnings) if total_earnings else 0.0,
                "active_casting_calls": active_casting_calls or 0,
            },
        },
    )


@router.get("/user", summary="Get User Analytics")
async def get_user_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get User Analytics"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get user's AI generations
    ai_generations = await db.scalar(
        select(func.count(AiGeneration.id)).where(AiGeneration.user_id == user.id)
    )
    
    # Get user's earnings
    total_earnings = await db.scalar(
        select(func.sum(Earning.amount)).where(Earning.user_id == user.id)
    )
    
    # Get user's applications
    applications = await db.scalar(
        select(func.count(Application.id)).where(Application.talent_id == user.id)
    )
    
    # Get user's casting calls (if director)
    casting_calls = 0
    if user.role == "CASTING_DIRECTOR":
        casting_calls = await db.scalar(
            select(func.count(CastingCall.id)).where(CastingCall.director_id == user.id)
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "user_analytics": {
                "ai_generations": ai_generations or 0,
                "total_earnings": float(total_earnings) if total_earnings else 0.0,
                "applications": applications or 0,
                "casting_calls": casting_calls or 0,
            },
        },
    )


@router.get("/ai-usage", summary="Get AI Usage Analytics")
async def get_ai_usage_analytics(
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get AI Usage Analytics"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    query = select(AiGeneration).where(AiGeneration.user_id == user.id)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.where(AiGeneration.created_at >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.where(AiGeneration.created_at <= end_dt)
    
    result = await db.execute(query)
    generations = result.scalars().all()
    
    # Group by type
    type_counts = {}
    for gen in generations:
        type_counts[gen.type] = type_counts.get(gen.type, 0) + 1
    
    # Group by date
    date_counts = {}
    for gen in generations:
        date_str = gen.created_at.strftime("%Y-%m-%d")
        date_counts[date_str] = date_counts.get(date_str, 0) + 1
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "ai_usage": {
                "total_generations": len(generations),
                "by_type": type_counts,
                "by_date": date_counts,
            },
        },
    )


@router.get("/earnings", summary="Get Earnings Analytics")
async def get_earnings_analytics(
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get Earnings Analytics"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    query = select(Earning).where(Earning.user_id == user.id)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.where(Earning.created_at >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.where(Earning.created_at <= end_dt)
    
    result = await db.execute(query)
    earnings = result.scalars().all()
    
    # Group by source
    source_totals = {}
    for earning in earnings:
        source_totals[earning.source] = source_totals.get(earning.source, 0) + earning.amount
    
    # Group by date
    date_totals = {}
    for earning in earnings:
        date_str = earning.created_at.strftime("%Y-%m-%d")
        date_totals[date_str] = date_totals.get(date_str, 0) + earning.amount
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "earnings": {
                "total_earnings": sum(e.amount for e in earnings),
                "by_source": source_totals,
                "by_date": date_totals,
            },
        },
    )


# Export router
__all__ = ["router"]
