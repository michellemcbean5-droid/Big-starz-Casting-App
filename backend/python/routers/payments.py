"""
Payments Router
Tasks 141-160: Marketplace & Stripe Connect
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Body
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from config import settings
from database.models import User
from database.connection import async_session_maker, get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.stripe_service import StripeService
from utils.jwt_utils import create_token_pair, verify_access_token
from utils.rbac import require_role, require_admin
from utils.oauth_utils import OAuth2PasswordFlow

logger = logging.getLogger("bigstarz.payments")

router = APIRouter(prefix="/payments", tags=["payments"])


# Initialize Stripe
StripeService.init_stripe()


# Task 142: Write Talent Express Account onboarding endpoint
@router.post("/express-account", summary="Create Express Account")
async def create_express_account(
    request: Request,
    country: str = Query(default="US", description="Country code"),
    business_type: str = Query(default="individual", description="Business type"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Create Stripe Express Account for Talent
    Task 142: Write Talent Express Account onboarding endpoint
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Create Express account
    result = StripeService.create_express_account(
        email=user.email,
        country=country,
        business_type=business_type,
        metadata={"user_id": str(user.id), "role": user.role},
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create Express account"),
        )
    
    # Store account ID in database
    user.stripe_account_id = result.get("account_id")
    await db.commit()
    
    # Create account link
    account_link = StripeService.create_account_link(
        account_id=result.get("account_id"),
        refresh_url=f"https://bigstarz.com/account/refresh?user_id={user.id}",
        return_url=f"https://bigstarz.com/account/success?user_id={user.id}",
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "account_id": result.get("account_id"),
            "onboarding_url": account_link.get("url"),
        },
    )


# Task 143: Write Dynamic Pricing setter endpoint
@router.post("/prices", summary="Create Price")
async def create_price(
    request: Request,
    product_name: str = Query(..., description="Product name"),
    amount: int = Query(..., description="Amount in cents"),
    currency: str = Query(default="USD", description="Currency"),
    interval: Optional[str] = Query(None, description="Recurring interval"),
) -> JSONResponse:
    """
    Create Dynamic Price
    Task 143: Write Dynamic Pricing setter endpoint
    """
    # Create price
    result = StripeService.create_price(
        product_name=product_name,
        amount=amount,
        currency=currency.lower(),
        interval=interval,
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create price"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "product_id": result.get("product_id"),
            "price_id": result.get("price_id"),
        },
    )


# Task 144: Implement Payment Intent creation
@router.post("/payment-intent", summary="Create Payment Intent")
async def create_payment_intent(
    request: Request,
    amount: int = Query(..., description="Amount in cents"),
    currency: str = Query(default="USD", description="Currency"),
    customer_id: Optional[str] = Query(None, description="Customer ID"),
    payment_method_id: Optional[str] = Query(None, description="Payment Method ID"),
    confirm: bool = Query(default=False, description="Confirm immediately"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Create Payment Intent
    Task 144: Implement Payment Intent creation
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Use user's Stripe customer ID if not provided
    if not customer_id and user.stripe_customer_id:
        customer_id = user.stripe_customer_id
    
    # Create payment intent
    result = StripeService.create_payment_intent(
        amount=amount,
        currency=currency.lower(),
        customer_id=customer_id,
        payment_method_id=payment_method_id,
        confirm=confirm,
        metadata={"user_id": str(user.id), "email": user.email},
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create payment intent"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "payment_intent_id": result.get("payment_intent_id"),
            "client_secret": result.get("client_secret"),
            "status": result.get("status"),
        },
    )


# Task 145: Write Smart-Contract Split Commission algorithm
@router.post("/commission/calculate", summary="Calculate Commission Split")
async def calculate_commission(
    amount: int = Query(..., description="Amount in cents"),
    platform_fee_percentage: Optional[float] = Query(None, description="Platform fee percentage"),
    platform_fee_fixed: Optional[int] = Query(None, description="Platform fee fixed"),
    creator_share: Optional[float] = Query(None, description="Creator share percentage"),
) -> JSONResponse:
    """
    Calculate Commission Split
    Task 145: Write Smart-Contract Split Commission algorithm
    """
    result = StripeService.calculate_commission(
        amount=amount,
        platform_fee_percentage=platform_fee_percentage,
        platform_fee_fixed=platform_fee_fixed,
        creator_share=creator_share,
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            **result,
        },
    )


# Task 146: Configure Platform Fee dynamic routing
@router.get("/platform-fee", summary="Get Platform Fee")
async def get_platform_fee(
    tier: str = Query(..., description="Subscription tier"),
    amount: int = Query(..., description="Amount in cents"),
) -> JSONResponse:
    """
    Get Platform Fee by Tier
    Task 146: Configure Platform Fee dynamic routing
    """
    result = StripeService.get_platform_fee(tier, amount)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            **result,
        },
    )


# Task 147: Write Stripe Webhook listener
@router.post("/webhook", summary="Stripe Webhook")
async def stripe_webhook(
    request: Request,
    payload: bytes = Body(..., embed=True),
    stripe_signature: str = Query(..., alias="Stripe-Signature", description="Stripe signature"),
) -> JSONResponse:
    """
    Stripe Webhook Listener
    Task 147: Write Stripe Webhook listener
    Tasks 148-149: Handle payment_intent.succeeded and transfer.created events
    Task 155: Handle Stripe chargebacks/disputes
    """
    result = await StripeService.handle_webhook(payload, stripe_signature)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Webhook processing failed"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Task 150: Build Escrow Hold logic for pending generations
@router.post("/escrow/hold", summary="Create Escrow Hold")
async def create_escrow_hold(
    request: Request,
    amount: int = Query(..., description="Amount in cents"),
    currency: str = Query(default="USD", description="Currency"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Create Escrow Hold
    Task 150: Build Escrow Hold logic for pending generations
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Create escrow hold
    result = StripeService.create_escrow_hold(
        amount=amount,
        currency=currency.lower(),
        customer_id=user.stripe_customer_id,
        metadata={"user_id": str(user.id), "purpose": "ai_generation"},
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create escrow hold"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "payment_intent_id": result.get("payment_intent_id"),
            "client_secret": result.get("client_secret"),
        },
    )


# Task 151: Build Escrow Release logic upon approval
@router.post("/escrow/release", summary="Release Escrow")
async def release_escrow(
    request: Request,
    payment_intent_id: str = Query(..., description="Payment Intent ID"),
    amount_to_capture: Optional[int] = Query(None, description="Amount to capture"),
) -> JSONResponse:
    """
    Release Escrow
    Task 151: Build Escrow Release logic upon approval
    """
    # Release escrow
    result = StripeService.release_escrow(
        payment_intent_id=payment_intent_id,
        amount_to_capture=amount_to_capture,
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to release escrow"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "payment_intent_id": result.get("payment_intent_id"),
            "amount_captured": result.get("amount_captured"),
        },
    )


# Task 152: Write B2B Ad Campaign budget deductor
@router.post("/campaigns/deduct", summary="Deduct Campaign Budget")
async def deduct_campaign_budget(
    request: Request,
    campaign_id: str = Query(..., description="Campaign ID"),
    amount: int = Query(..., description="Amount to deduct"),
) -> JSONResponse:
    """
    Deduct Campaign Budget
    Task 152: Write B2B Ad Campaign budget deductor
    """
    result = StripeService.deduct_campaign_budget(
        campaign_id=campaign_id,
        amount=amount,
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to deduct campaign budget"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Task 153: Implement Subscription (SaaS) billing for power users
@router.post("/subscriptions", summary="Create Subscription")
async def create_subscription(
    request: Request,
    price_id: str = Query(..., description="Price ID"),
    customer_id: Optional[str] = Query(None, description="Customer ID"),
    trial_days: Optional[int] = Query(None, description="Trial days"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Create Subscription
    Task 153: Implement Subscription (SaaS) billing for power users
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # Use user's Stripe customer ID if not provided
    if not customer_id and user.stripe_customer_id:
        customer_id = user.stripe_customer_id
    
    try:
        params = {
            "customer": customer_id,
            "items": [{"price": price_id}],
            "payment_behavior": "default_incomplete",
            "expand": ["latest_invoice.payment_intent"],
        }
        
        if trial_days:
            params["trial_period_days"] = trial_days
        
        subscription = stripe.Subscription.create(**params)
        
        logger.info(f"Created subscription: {subscription.id}")
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "payment_intent": subscription.latest_invoice.payment_intent.client_secret if subscription.latest_invoice else None,
            },
        )
    except stripe.error.StripeError as e:
        logger.error(f"Failed to create subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Task 154: Write Fremium-to-Paid conversion triggers
@router.post("/conversions/premium", summary="Trigger Premium Conversion")
async def trigger_premium_conversion(
    request: Request,
    tier: str = Query(..., description="Target tier"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Trigger Premium Conversion
    Task 154: Write Fremium-to-Paid conversion triggers
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    result = StripeService.trigger_premium_conversion(
        user_id=str(user.id),
        tier=tier,
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to trigger premium conversion"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Task 156: Write Payout/Earnings dashboard API
@router.get("/earnings/dashboard", summary="Get Earnings Dashboard")
async def get_earnings_dashboard(
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date"),
    end_date: Optional[str] = Query(None, description="End date"),
) -> JSONResponse:
    """
    Get Earnings Dashboard
    Task 156: Write Payout/Earnings dashboard API
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    result = StripeService.get_earnings_dashboard(
        user_id=str(user.id),
        start_date=start_date,
        end_date=end_date,
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Task 157: Build Instant Payout request endpoint
@router.post("/payouts/instant", summary="Request Instant Payout")
async def request_instant_payout(
    request: Request,
    amount: int = Query(..., description="Amount in cents"),
    currency: str = Query(default="USD", description="Currency"),
) -> JSONResponse:
    """
    Request Instant Payout
    Task 157: Build Instant Payout request endpoint
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    result = StripeService.request_instant_payout(
        user_id=str(user.id),
        amount=amount,
        currency=currency.lower(),
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to request instant payout"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Task 158: Write 1099 Tax export generator
@router.get("/tax/1099", summary="Generate 1099 Tax Export")
async def generate_1099_export(
    request: Request,
    year: int = Query(..., description="Tax year"),
) -> JSONResponse:
    """
    Generate 1099 Tax Export
    Task 158: Write 1099 Tax export generator
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    result = StripeService.generate_tax_export(
        year=year,
        user_id=str(user.id),
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to generate tax export"),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Task 159: Calculate Customer Acquisition Cost (CAC) metrics
@router.get("/metrics/cac", summary="Calculate CAC")
async def calculate_cac(
    start_date: str = Query(..., description="Start date"),
    end_date: str = Query(..., description="End date"),
) -> JSONResponse:
    """
    Calculate Customer Acquisition Cost
    Task 159: Calculate Customer Acquisition Cost (CAC) metrics
    """
    result = StripeService.calculate_cac(
        start_date=start_date,
        end_date=end_date,
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Task 160: Calculate Lifetime Value (LTV) metrics
@router.get("/metrics/ltv", summary="Calculate LTV")
async def calculate_ltv(
    request: Request,
    user_id: Optional[str] = Query(None, description="User ID"),
    start_date: Optional[str] = Query(None, description="Start date"),
    end_date: Optional[str] = Query(None, description="End date"),
) -> JSONResponse:
    """
    Calculate Lifetime Value
    Task 160: Calculate Lifetime Value (LTV) metrics
    """
    result = StripeService.calculate_ltv(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


# Export router
__all__ = ["router"]
