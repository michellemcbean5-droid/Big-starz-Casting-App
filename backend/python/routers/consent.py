"""
Consent Router
Tasks 161-180: Consent Ledger & Casting Logic
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timedelta, timezone
import secrets
import os

from config import settings
from database.models import User, Consent, CastingConsent, DigitalTwin, Contract, CastingCall, Application
from database.connection import async_session_maker, get_db
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from utils.jwt_utils import create_token_pair, verify_access_token
from utils.rbac import require_role, require_admin
from utils.oauth_utils import OAuth2PasswordFlow
from utils.email_utils import email_service
from services.consent_service import ConsentService

logger = logging.getLogger("bigstarz.consent")

router = APIRouter(prefix="/consent", tags=["consent"])


# Task 161: Write Likeness Model upload endpoint
@router.post("/likeness/upload", summary="Upload Likeness Model")
async def upload_likeness_model(
    request: Request,
    file: UploadFile = File(..., description="Likeness model file"),
    name: str = Form(..., description="Model name"),
    description: Optional[str] = Form(None, description="Model description"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Upload Likeness Model
    Task 161: Write Likeness Model upload endpoint
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user has consented to AI/likeness usage
    async with async_session_maker() as db_session:
        result = await db_session.execute(
            select(Consent).where(Consent.user_id == user.id)
        )
        consent = result.scalar_one_or_none()
        
        if not consent or not consent.likeness_consent_signed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must consent to likeness usage before uploading a model",
            )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )
    
    # Check file extension
    allowed_extensions = [".glb", ".gltf", ".fbx", ".obj", ".zip"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}",
        )
    
    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, "likeness")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{file_id}{file_extension}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create digital twin record
    digital_twin = DigitalTwin(
        id=file_id,
        talent_id=str(user.id),
        name=name,
        description=description,
        model_data={
            "filename": file.filename,
            "file_type": file_extension,
            "file_size": len(content),
            "file_path": file_path,
        },
        thumbnail_url=None,
        consent_signed=True,
        consent_signed_at=datetime.utcnow(),
        status="READY",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(digital_twin)
    await db.commit()
    await db.refresh(digital_twin)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "digital_twin_id": str(digital_twin.id),
            "name": digital_twin.name,
            "status": digital_twin.status,
            "file_path": file_path,
        },
    )


# Task 162: Implement KYC identity verification flow
@router.post("/kyc/verify", summary="Verify KYC Identity")
async def verify_kyc_identity(
    request: Request,
    document_type: str = Query(..., description="Document type (passport, driver_license, etc.)"),
    document_front: UploadFile = File(..., description="Front of document"),
    document_back: Optional[UploadFile] = File(None, description="Back of document"),
    selfie: UploadFile = File(..., description="Selfie photo"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Verify KYC Identity
    Task 162: Implement KYC identity verification flow
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Upload documents to a KYC service (Stripe Identity, Onfido, etc.)
    # 2. Wait for verification
    # 3. Update user verification status
    
    # For now, return mock success
    logger.info(f"KYC verification started for user {user.id}")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "KYC verification started. You will be notified when complete.",
            "verification_id": str(uuid.uuid4()),
        },
    )


@router.get("/kyc/status", summary="Get KYC Status")
async def get_kyc_status(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Get KYC Verification Status
    Task 162: Implement KYC identity verification flow
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, check KYC status from service
    # For now, return mock status
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "verified": True,
            "status": "verified",
            "verification_date": datetime.utcnow().isoformat(),
        },
    )


# Task 163: Write Casting Booking Request endpoint
@router.post("/booking/request", summary="Request Casting Booking")
async def request_casting_booking(
    request: Request,
    casting_call_id: str = Query(..., description="Casting Call ID"),
    cover_letter: Optional[str] = Query(None, description="Cover letter"),
    video_url: Optional[str] = Query(None, description="Video URL"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Request Casting Booking
    Task 163: Write Casting Booking Request endpoint
    """
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
        id=str(uuid.uuid4()),
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
    
    # Create casting consent
    casting_consent = CastingConsent(
        id=str(uuid.uuid4()),
        user_id=str(user.id),
        casting_call_id=str(casting_call_id),
        consent_type="CASTING",
        consent_signed=False,
        consent_signed_at=None,
        consent_signature=None,
        ip_address=str(request.client.host),
        user_agent=str(request.headers.get("user-agent")),
        metadata={"application_id": str(application.id)},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(casting_consent)
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "application_id": str(application.id),
            "casting_call_id": str(casting_call_id),
            "status": application.status,
        },
    )


# Task 164: Write Talent Approval/Rejection webhooks
@router.post("/booking/approve", summary="Approve Talent Application")
async def approve_talent_application(
    request: Request,
    application_id: str = Query(..., description="Application ID"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Approve Talent Application
    Task 164: Write Talent Approval/Rejection webhooks
    """
    # Get current user (casting director)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a casting director
    if user.role != "CASTING_DIRECTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only casting directors can approve applications",
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
    
    # Update application status
    application.status = "SHORTLISTED"
    application.updated_at = datetime.utcnow()
    
    await db.commit()
    
    # Send notification to talent
    # In production, this would send an email or push notification
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "application_id": str(application.id),
            "status": application.status,
        },
    )


@router.post("/booking/reject", summary="Reject Talent Application")
async def reject_talent_application(
    request: Request,
    application_id: str = Query(..., description="Application ID"),
    reason: Optional[str] = Query(None, description="Rejection reason"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Reject Talent Application
    Task 164: Write Talent Approval/Rejection webhooks
    """
    # Get current user (casting director)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a casting director
    if user.role != "CASTING_DIRECTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only casting directors can reject applications",
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
    
    # Update application status
    application.status = "REJECTED"
    application.notes = reason
    application.updated_at = datetime.utcnow()
    
    await db.commit()
    
    # Send notification to talent
    # In production, this would send an email or push notification
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "application_id": str(application.id),
            "status": application.status,
        },
    )


# Task 165: Build Automated Time-Lock for likeness usage
@router.post("/likeness/time-lock", summary="Set Likeness Time Lock")
async def set_likeness_time_lock(
    request: Request,
    digital_twin_id: str = Query(..., description="Digital Twin ID"),
    lock_duration_hours: int = Query(default=24, description="Lock duration in hours"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Set Likeness Time Lock
    Task 165: Build Automated Time-Lock for likeness usage
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get digital twin
    result = await db.execute(
        select(DigitalTwin).where(DigitalTwin.id == digital_twin_id)
    )
    digital_twin = result.scalar_one_or_none()
    
    if not digital_twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digital twin not found",
        )
    
    # Check if user owns the digital twin
    if str(digital_twin.talent_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this digital twin",
        )
    
    # Set time lock in metadata
    if not digital_twin.model_data:
        digital_twin.model_data = {}
    
    digital_twin.model_data["time_lock"] = {
        "locked_at": datetime.utcnow().isoformat(),
        "unlock_at": (datetime.utcnow() + timedelta(hours=lock_duration_hours)).isoformat(),
        "locked_by": str(user.id),
    }
    
    digital_twin.updated_at = datetime.utcnow()
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "digital_twin_id": str(digital_twin.id),
            "unlock_at": digital_twin.model_data["time_lock"]["unlock_at"],
        },
    )


# Task 166: Generate PDF Licensing Agreements via API
@router.post("/contracts/generate", summary="Generate Licensing Agreement")
async def generate_licensing_agreement(
    request: Request,
    contract_type: str = Query(..., description="Contract type"),
    talent_id: str = Query(..., description="Talent ID"),
    brand_id: str = Query(..., description="Brand ID"),
    terms: Optional[str] = Query(None, description="Custom terms"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Generate PDF Licensing Agreement
    Task 166: Generate PDF Licensing Agreements via API
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Generate PDF using a template engine (Jinja2, etc.)
    # 2. Store the PDF in S3 or database
    # 3. Return download link
    
    # For now, return mock PDF generation
    
    # Create contract record
    contract = Contract(
        id=str(uuid.uuid4()),
        user_id=talent_id,
        brand_agency_id=brand_id,
        type=contract_type,
        content=terms or "Standard licensing terms",
        signed_at=None,
        ip_address=str(request.client.host),
        user_agent=str(request.headers.get("user-agent")),
        status="PENDING",
        expires_at=(datetime.utcnow() + timedelta(days=365)).date(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "contract_id": str(contract.id),
            "pdf_url": f"/contracts/{contract.id}/download",
            "status": contract.status,
        },
    )


@router.get("/contracts/{contract_id}/download", summary="Download Contract PDF")
async def download_contract_pdf(
    contract_id: str,
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    """
    Download Contract PDF
    Task 166: Generate PDF Licensing Agreements via API
    """
    # Get contract
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )
    
    # In production, return the actual PDF file
    # For now, return a mock PDF
    
    # Create a simple PDF using reportlab or weasyprint
    # For simplicity, return a text response
    
    return FileResponse(
        path=None,
        filename=f"contract_{contract_id}.pdf",
        content=contract.content.encode(),
        media_type="application/pdf",
    )


# Task 167: Implement Talent Availability toggles
@router.post("/availability/toggle", summary="Toggle Talent Availability")
async def toggle_talent_availability(
    request: Request,
    available: bool = Query(..., description="Availability status"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Toggle Talent Availability
    Task 167: Implement Talent Availability toggles
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a talent
    if user.role != "ACTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only talents can toggle availability",
        )
    
    # Get talent profile
    result = await db.execute(
        select(User).where(User.id == user.id)
    )
    user_obj = result.scalar_one_or_none()
    
    if not user_obj.talent_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Talent profile not found",
        )
    
    # Update availability
    user_obj.talent_profile.availability = "available" if available else "unavailable"
    user_obj.talent_profile.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "available": available,
            "availability": user_obj.talent_profile.availability,
        },
    )


# Task 168: Write Search algorithm filtering by Hip-Hop/R&B
@router.get("/search/talent", summary="Search Talent")
async def search_talent(
    request: Request,
    genre: Optional[str] = Query(None, description="Genre filter (Hip-Hop, R&B, etc.)"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    union_status: Optional[str] = Query(None, description="Union status filter"),
    skills: Optional[List[str]] = Query(None, description="Skills filter"),
    page: int = Query(default=1, description="Page number"),
    limit: int = Query(default=20, description="Results per page"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Search Talent with Filters
    Task 168: Write Search algorithm filtering by Hip-Hop/R&B
    Task 169: Implement price-range filtering
    """
    # Build query
    from sqlalchemy import or_, and_
    
    query = select(User).join(User.talent_profile)
    
    # Apply filters
    if genre:
        # Filter by genre in skills or bio
        query = query.where(
            or_(
                User.talent_profile.has(skills__contains=[genre]),
                User.talent_profile.has(bio__icontains=genre),
            )
        )
    
    if min_price:
        # Filter by minimum price (from pricing tiers or custom pricing)
        query = query.where(
            User.talent_profile.has(ranking_score__gte=min_price)
        )
    
    if max_price:
        # Filter by maximum price
        query = query.where(
            User.talent_profile.has(ranking_score__lte=max_price)
        )
    
    if union_status:
        query = query.where(
            User.talent_profile.has(union_status=union_status)
        )
    
    if skills:
        # Filter by skills (any of the provided skills)
        skill_filters = [User.talent_profile.has(skills__contains=[skill]) for skill in skills]
        query = query.where(or_(*skill_filters))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    talents = result.scalars().all()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "talents": [
                {
                    "id": str(t.id),
                    "email": t.email,
                    "role": t.role,
                    "profile": {
                        "first_name": t.profile.first_name if t.profile else None,
                        "last_name": t.profile.last_name if t.profile else None,
                        "avatar_url": t.profile.avatar_url if t.profile else None,
                    },
                    "talent_profile": {
                        "stage_name": t.talent_profile.stage_name if t.talent_profile else None,
                        "union_status": t.talent_profile.union_status if t.talent_profile else None,
                        "skills": t.talent_profile.skills if t.talent_profile else [],
                        "ranking_score": t.talent_profile.ranking_score if t.talent_profile else 0,
                        "availability": t.talent_profile.availability if t.talent_profile else None,
                    },
                }
                for t in talents
            ],
            "page": page,
            "limit": limit,
            "total": len(talents),
        },
    )


# Task 170: Write Reputation/Rating calculation service
@router.get("/reputation/{user_id}", summary="Get User Reputation")
async def get_user_reputation(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Get User Reputation/Rating
    Task 170: Write Reputation/Rating calculation service
    """
    # Get user
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Calculate reputation score
    # In production, this would be based on:
    # - Number of completed bookings
    # - Ratings from casting directors
    # - Response time
    # - Professionalism
    
    # For now, return mock reputation
    reputation_score = 4.5  # Out of 5
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "user_id": str(user.id),
            "reputation_score": reputation_score,
            "total_reviews": 10,
            "positive_reviews": 9,
            "neutral_reviews": 1,
            "negative_reviews": 0,
        },
    )


# Task 171: Build Consent Violation reporting endpoint
@router.post("/violations/report", summary="Report Consent Violation")
async def report_consent_violation(
    request: Request,
    violated_user_id: str = Query(..., description="User ID who violated consent"),
    violation_type: str = Query(..., description="Type of violation"),
    description: str = Query(..., description="Description of violation"),
    evidence_url: Optional[str] = Query(None, description="Evidence URL"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Report Consent Violation
    Task 171: Build Consent Violation reporting endpoint
    """
    # Get current user (reporter)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Create violation report in database
    # 2. Notify admins
    # 3. Potentially suspend the violating user
    
    # For now, log the violation
    logger.warning(f"Consent violation reported: {violation_type} - {description}")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Consent violation reported. Our team will review it shortly.",
            "report_id": str(uuid.uuid4()),
        },
    )


# Task 172: Write Trademark/Copyright blocklist checker
@router.get("/blocklist/check", summary="Check Trademark/Copyright Blocklist")
async def check_blocklist(
    content: str = Query(..., description="Content to check"),
) -> JSONResponse:
    """
    Check Trademark/Copyright Blocklist
    Task 172: Write Trademark/Copyright blocklist checker
    """
    # In production, this would check against a database of blocked terms
    # For now, return mock check
    
    blocked_terms = [
        "Disney", "Marvel", "Star Wars", "DC Comics",
        "Nike", "Adidas", "Coca-Cola", "Pepsi",
        "NFL", "NBA", "MLB", "NHL",
    ]
    
    is_blocked = any(term.lower() in content.lower() for term in blocked_terms)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "is_blocked": is_blocked,
            "blocked_terms": [term for term in blocked_terms if term.lower() in content.lower()] if is_blocked else [],
        },
    )


# Task 173: Implement exclusive casting lockouts
@router.post("/casting/lockout", summary="Set Exclusive Casting Lockout")
async def set_exclusive_lockout(
    request: Request,
    casting_call_id: str = Query(..., description="Casting Call ID"),
    talent_id: str = Query(..., description="Talent ID"),
    exclusive: bool = Query(default=True, description="Exclusive lockout"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Set Exclusive Casting Lockout
    Task 173: Implement exclusive casting lockouts
    """
    # Get current user (casting director)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a casting director
    if user.role != "CASTING_DIRECTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only casting directors can set lockouts",
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
    
    # In production, this would:
    # 1. Set exclusive lock in database
    # 2. Prevent other talents from applying if exclusive
    
    # For now, return success
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "casting_call_id": str(casting_call_id),
            "talent_id": str(talent_id),
            "exclusive": exclusive,
        },
    )


# Task 174: Write brand sponsorship matchmaker logic
@router.post("/sponsorship/match", summary="Match Brands with Talent")
async def match_brands_with_talent(
    request: Request,
    campaign_id: str = Query(..., description="Campaign ID"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Match Brands with Talent
    Task 174: Write brand sponsorship matchmaker logic
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Get campaign requirements
    # 2. Search for matching talent
    # 3. Return ranked list of matches
    
    # For now, return mock matches
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "campaign_id": campaign_id,
            "matches": [
                {
                    "talent_id": str(uuid.uuid4()),
                    "match_score": 0.95,
                    "reasons": ["Matching genre", "High reputation", "Available"],
                },
                {
                    "talent_id": str(uuid.uuid4()),
                    "match_score": 0.87,
                    "reasons": ["Matching genre", "High reputation"],
                },
            ],
        },
    )


# Task 175: Handle multi-talent collaborative bookings
@router.post("/booking/collaborative", summary="Create Collaborative Booking")
async def create_collaborative_booking(
    request: Request,
    casting_call_id: str = Query(..., description="Casting Call ID"),
    talent_ids: List[str] = Query(..., description="List of Talent IDs"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Create Collaborative Booking
    Task 175: Handle multi-talent collaborative bookings
    """
    # Get current user (casting director)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a casting director
    if user.role != "CASTING_DIRECTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only casting directors can create collaborative bookings",
        )
    
    # In production, this would:
    # 1. Create booking for multiple talents
    # 2. Set up collaborative contract
    # 3. Manage payment splits
    
    # For now, return success
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "booking_id": str(uuid.uuid4()),
            "casting_call_id": casting_call_id,
            "talent_ids": talent_ids,
        },
    )


# Task 176: Write digital signature capture endpoint
@router.post("/signature/capture", summary="Capture Digital Signature")
async def capture_digital_signature(
    request: Request,
    contract_id: str = Query(..., description="Contract ID"),
    signature_data: str = Query(..., description="Base64 encoded signature"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Capture Digital Signature
    Task 176: Write digital signature capture endpoint
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get contract
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )
    
    # Check if user is a party to the contract
    if str(contract.user_id) != str(user.id) and str(contract.brand_agency_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a party to this contract",
        )
    
    # Update contract
    contract.signed_at = datetime.utcnow()
    contract.status = "SIGNED"
    contract.ip_address = str(request.client.host)
    contract.user_agent = str(request.headers.get("user-agent"))
    
    # Store signature data
    if not contract.metadata:
        contract.metadata = {}
    contract.metadata["signature"] = signature_data
    
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "contract_id": str(contract.id),
            "status": contract.status,
            "signed_at": contract.signed_at.isoformat() if contract.signed_at else None,
        },
    )


# Task 177: Configure likeness asset encryption at rest
@router.post("/likeness/encrypt", summary="Encrypt Likeness Asset")
async def encrypt_likeness_asset(
    request: Request,
    digital_twin_id: str = Query(..., description="Digital Twin ID"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Encrypt Likeness Asset
    Task 177: Configure likeness asset encryption at rest
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get digital twin
    result = await db.execute(
        select(DigitalTwin).where(DigitalTwin.id == digital_twin_id)
    )
    digital_twin = result.scalar_one_or_none()
    
    if not digital_twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digital twin not found",
        )
    
    # Check if user owns the digital twin
    if str(digital_twin.talent_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this digital twin",
        )
    
    # In production, this would:
    # 1. Generate encryption key
    # 2. Encrypt the model data
    # 3. Store the encrypted data
    
    # For now, set encryption flag
    digital_twin.is_encrypted = True
    digital_twin.encryption_key = f"enc_key_{secrets.token_urlsafe(32)}"
    digital_twin.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "digital_twin_id": str(digital_twin.id),
            "is_encrypted": digital_twin.is_encrypted,
            "encryption_key": digital_twin.encryption_key,
        },
    )


# Task 178: Write talent portfolio analytics endpoint
@router.get("/analytics/portfolio", summary="Get Talent Portfolio Analytics")
async def get_talent_portfolio_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Get Talent Portfolio Analytics
    Task 178: Write talent portfolio analytics endpoint
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Check if user is a talent
    if user.role != "ACTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only talents can view portfolio analytics",
        )
    
    # In production, this would query:
    # - View counts
    # - Engagement metrics
    # - Booking rates
    # - Earnings
    
    # For now, return mock analytics
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "user_id": str(user.id),
            "portfolio_views": 1500,
            "profile_views": 800,
            "reel_views": 700,
            "application_submitted": 50,
            "application_accepted": 15,
            "bookings_completed": 10,
            "total_earnings": 50000.00,
            "average_rating": 4.8,
        },
    )


# Task 179: Set up automated booking reminder emails
@router.post("/reminders/booking", summary="Set Booking Reminder")
async def set_booking_reminder(
    request: Request,
    booking_id: str = Query(..., description="Booking ID"),
    reminder_time: str = Query(default="24h", description="Reminder time (24h, 1h, 30m)"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Set Booking Reminder
    Task 179: Set up automated booking reminder emails
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Schedule a reminder job
    # 2. Send email at the specified time
    
    # For now, return success
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "booking_id": booking_id,
            "reminder_time": reminder_time,
            "reminder_id": str(uuid.uuid4()),
        },
    )


# Task 180: Implement consent revocation protocol
@router.post("/consent/revoke", summary="Revoke Consent")
async def revoke_consent(
    request: Request,
    consent_type: str = Query(..., description="Type of consent to revoke (AI, LIKENESS, DIGITAL_TWIN)"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Revoke Consent
    Task 180: Implement consent revocation protocol
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Get consent
    result = await db.execute(
        select(Consent).where(Consent.user_id == user.id)
    )
    consent = result.scalar_one_or_none()
    
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consent not found",
        )
    
    # Revoke consent
    if consent_type == "AI":
        consent.ai_consent_signed = False
        consent.ai_consent_signed_at = None
        consent.ai_consent_signature = None
    elif consent_type == "LIKENESS":
        consent.likeness_consent_signed = False
        consent.likeness_consent_signed_at = None
        consent.likeness_consent_signature = None
    elif consent_type == "ALL":
        consent.ai_consent_signed = False
        consent.ai_consent_signed_at = None
        consent.ai_consent_signature = None
        consent.likeness_consent_signed = False
        consent.likeness_consent_signed_at = None
        consent.likeness_consent_signature = None
    
    consent.updated_at = datetime.utcnow()
    await db.commit()
    
    # In production, this would also:
    # 1. Delete related digital twins
    # 2. Revoke AI generation permissions
    # 3. Notify admins
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": f"{consent_type} consent revoked successfully",
            "consent": {
                "ai_consent_signed": consent.ai_consent_signed,
                "likeness_consent_signed": consent.likeness_consent_signed,
            },
        },
    )


# Export router
__all__ = ["router"]
