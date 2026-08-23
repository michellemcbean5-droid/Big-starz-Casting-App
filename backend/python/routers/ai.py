"""
AI Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime
import json
import uuid

from config import settings
from database.models import AiGeneration, User, DigitalTwin
from database.connection import async_session_maker, get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from utils.jwt_utils import create_token_pair, verify_access_token
from utils.oauth_utils import OAuth2PasswordFlow

logger = logging.getLogger("bigstarz.ai")

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate/scene", summary="Generate AI Scene")
async def generate_ai_scene(
    request: Request,
    prompt: str = Form(..., description="Scene generation prompt"),
    style: Optional[str] = Form(None, description="Scene style"),
    characters: Optional[str] = Form(None, description="Characters (JSON)"),
    setting: Optional[str] = Form(None, description="Setting description"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Generate AI Acting Scene"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Parse JSON fields
    characters_list = json.loads(characters) if characters else []
    
    # Create AI generation record
    generation = AiGeneration(
        user_id=str(user.id),
        type="SCENE",
        input_data={
            "prompt": prompt,
            "style": style,
            "characters": characters_list,
            "setting": setting,
        },
        output_url=None,
        cost_credits=5,  # Scene generation costs 5 credits
        status="PENDING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(generation)
    await db.commit()
    await db.refresh(generation)
    
    # In production, this would:
    # 1. Queue the generation job
    # 2. Call HuggingFace API
    # 3. Update status when complete
    
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "success": True,
            "generation_id": str(generation.id),
            "status": generation.status,
            "message": "Scene generation queued",
        },
    )


@router.post("/generate/reel", summary="Generate AI Reel")
async def generate_ai_reel(
    request: Request,
    scene_ids: List[str] = Form(..., description="Scene IDs to include in reel"),
    title: str = Form(..., description="Reel title"),
    music_url: Optional[str] = Form(None, description="Background music URL"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Generate AI Casting Reel"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Create AI generation record
    generation = AiGeneration(
        user_id=str(user.id),
        type="REEL",
        input_data={
            "scene_ids": scene_ids,
            "title": title,
            "music_url": music_url,
        },
        output_url=None,
        cost_credits=10,  # Reel generation costs 10 credits
        status="PENDING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(generation)
    await db.commit()
    await db.refresh(generation)
    
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "success": True,
            "generation_id": str(generation.id),
            "status": generation.status,
            "message": "Reel generation queued",
        },
    )


@router.post("/generate/music-video", summary="Generate AI Music Video")
async def generate_ai_music_video(
    request: Request,
    audio_url: str = Form(..., description="Audio file URL"),
    style: Optional[str] = Form(None, description="Video style"),
    theme: Optional[str] = Form(None, description="Theme"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Generate AI Music Video"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Create AI generation record
    generation = AiGeneration(
        user_id=str(user.id),
        type="MUSIC_VIDEO",
        input_data={
            "audio_url": audio_url,
            "style": style,
            "theme": theme,
        },
        output_url=None,
        cost_credits=15,  # Music video generation costs 15 credits
        status="PENDING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(generation)
    await db.commit()
    await db.refresh(generation)
    
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "success": True,
            "generation_id": str(generation.id),
            "status": generation.status,
            "message": "Music video generation queued",
        },
    )


@router.post("/generate/digital-twin", summary="Create Digital Twin")
async def create_digital_twin(
    request: Request,
    name: str = Form(..., description="Digital twin name"),
    description: Optional[str] = Form(None, description="Description"),
    reference_images: List[UploadFile] = File(..., description="Reference images"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Create Digital Twin"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user has consented to AI/likeness usage
    result = await db.execute(
        select(User).where(User.id == user.id)
    )
    user_obj = result.scalar_one_or_none()
    
    # In production, check consent
    # For now, assume consent is given
    
    # Save reference images
    upload_dir = f"{settings.UPLOAD_DIR}/digital-twins/{user.id}"
    import os
    os.makedirs(upload_dir, exist_ok=True)
    
    image_urls = []
    for image in reference_images:
        image_id = str(uuid.uuid4())
        image_extension = os.path.splitext(image.filename)[1].lower()
        image_path = os.path.join(upload_dir, f"{image_id}{image_extension}")
        
        with open(image_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        image_urls.append(f"/static/digital-twins/{user.id}/{image_id}{image_extension}")
    
    # Create digital twin record
    digital_twin = DigitalTwin(
        talent_id=str(user.id),
        name=name,
        description=description,
        model_data={
            "reference_images": image_urls,
            "training_status": "pending",
        },
        thumbnail_url=None,
        consent_signed=True,
        consent_signed_at=datetime.utcnow(),
        status="TRAINING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(digital_twin)
    await db.commit()
    await db.refresh(digital_twin)
    
    # Create AI generation record
    generation = AiGeneration(
        user_id=str(user.id),
        type="DIGITAL_TWIN",
        input_data={
            "digital_twin_id": str(digital_twin.id),
            "reference_images": image_urls,
        },
        output_url=None,
        cost_credits=25,  # Digital twin creation costs 25 credits
        status="PROCESSING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(generation)
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "success": True,
            "digital_twin_id": str(digital_twin.id),
            "generation_id": str(generation.id),
            "status": digital_twin.status,
            "message": "Digital twin training started",
        },
    )


@router.get("/generations", summary="List AI Generations")
async def list_ai_generations(
    request: Request,
    type: Optional[str] = Query(None, description="Filter by type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(default=1, description="Page number"),
    limit: int = Query(default=20, description="Results per page"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """List AI Generations"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    query = select(AiGeneration).where(AiGeneration.user_id == user.id)
    
    if type:
        query = query.where(AiGeneration.type == type)
    
    if status:
        query = query.where(AiGeneration.status == status)
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    generations = result.scalars().all()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "generations": [
                {
                    "id": str(g.id),
                    "type": g.type,
                    "input_data": g.input_data,
                    "output_url": g.output_url,
                    "cost_credits": g.cost_credits,
                    "status": g.status,
                    "created_at": g.created_at.isoformat(),
                }
                for g in generations
            ],
            "page": page,
            "limit": limit,
            "total": len(generations),
        },
    )


@router.get("/generations/{generation_id}", summary="Get AI Generation")
async def get_ai_generation(
    generation_id: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Get AI Generation by ID"""
    result = await db.execute(
        select(AiGeneration).where(AiGeneration.id == generation_id)
    )
    generation = result.scalar_one_or_none()
    
    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI generation not found",
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "generation": {
                "id": str(generation.id),
                "user_id": str(generation.user_id),
                "type": generation.type,
                "input_data": generation.input_data,
                "output_url": generation.output_url,
                "cost_credits": generation.cost_credits,
                "status": generation.status,
                "error_message": generation.error_message,
                "created_at": generation.created_at.isoformat(),
                "updated_at": generation.updated_at.isoformat() if generation.updated_at else None,
            },
        },
    )


@router.get("/digital-twins", summary="List Digital Twins")
async def list_digital_twins(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """List Digital Twins"""
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    result = await db.execute(
        select(DigitalTwin).where(DigitalTwin.talent_id == user.id)
    )
    digital_twins = result.scalars().all()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "digital_twins": [
                {
                    "id": str(dt.id),
                    "name": dt.name,
                    "description": dt.description,
                    "status": dt.status,
                    "consent_signed": dt.consent_signed,
                    "created_at": dt.created_at.isoformat(),
                }
                for dt in digital_twins
            ],
        },
    )


# Export router
__all__ = ["router"]
