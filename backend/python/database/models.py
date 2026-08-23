"""
SQLAlchemy Models for Big Starz Casting App
Task 123-140: PostgreSQL Schemas and ORM Models
"""

from sqlalchemy import Column, String, DateTime, Float, Boolean, Integer, JSON, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import datetime
import uuid

# Base class for models
Base = declarative_base()


# Task 108: Define roles: Fan, Creator, Actor, Brand
class UserRole(str):
    FAN = "FAN"
    CREATOR = "CREATOR"
    ACTOR = "ACTOR"
    BRAND = "BRAND"
    ADMIN = "ADMIN"


class User(Base):
    """
    Task 123: Write Users table schema (UUID)
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ACTOR, nullable=False, index=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)  # Task 139
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    
    # Relations
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    talent_profile = relationship("TalentProfile", back_populates="user", uselist=False)
    casting_director_profile = relationship("CastingDirectorProfile", back_populates="user", uselist=False)
    brand_agency = relationship("BrandAgency", back_populates="user", uselist=False)
    
    applications = relationship("Application", back_populates="talent")
    casting_calls = relationship("CastingCall", back_populates="director")
    digital_twins = relationship("DigitalTwin", back_populates="talent")
    subscriptions = relationship("Subscription", back_populates="user")
    contracts = relationship("Contract", back_populates="user")
    earnings = relationship("Earning", back_populates="user")
    ai_generations = relationship("AiGeneration", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    master_codes_created = relationship("MasterCode", back_populates="creator")
    consent = relationship("Consent", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    generated_media = relationship("GeneratedMedia", back_populates="user")
    campaign_applications = relationship("CampaignApplication", back_populates="talent")
    withdrawals = relationship("Withdrawal", back_populates="user")


class Profile(Base):
    """
    User Profile Model
    """
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    is_minor = Column(Boolean, default=False, nullable=False)
    guardian_name = Column(String(100), nullable=True)
    guardian_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="profile")
    talent_profile = relationship("TalentProfile", back_populates="profile", uselist=False)
    casting_director_profile = relationship("CastingDirectorProfile", back_populates="profile", uselist=False)


class TalentProfile(Base):
    """
    Task 124: Write Talent_Profiles schema (bio, metrics)
    """
    __tablename__ = "talent_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    stage_name = Column(String(100), nullable=True)
    union_status = Column(String(50), nullable=True)  # SAG_AFTRA, NON_UNION, EQUITY, AFTRA, OTHER
    skills = Column(ARRAY(String), default=[], nullable=False)
    experience_years = Column(Integer, nullable=True)
    height = Column(String(20), nullable=True)
    weight = Column(String(20), nullable=True)
    ethnicity = Column(String(100), nullable=True)
    languages = Column(ARRAY(String), default=[], nullable=False)
    reel_url = Column(Text, nullable=True)
    portfolio_urls = Column(ARRAY(Text), default=[], nullable=False)
    availability = Column(Text, nullable=True)  # JSON string or text
    is_featured = Column(Boolean, default=False, nullable=False)
    ranking_score = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    profile = relationship("Profile", back_populates="talent_profile")
    user = relationship("User", viewonly=True)


class CastingDirectorProfile(Base):
    """
    Casting Director Profile Model
    """
    __tablename__ = "casting_director_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(200), nullable=True)
    company_website = Column(Text, nullable=True)
    credits = Column(ARRAY(String), default=[], nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    profile = relationship("Profile", back_populates="casting_director_profile")
    user = relationship("User", viewonly=True)


# Task 125: Write Casting_Consents ledger schema
class CastingConsent(Base):
    """
    Consent Ledger for Casting
    """
    __tablename__ = "casting_consents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    casting_call_id = Column(UUID(as_uuid=True), ForeignKey("casting_calls.id", ondelete="CASCADE"), nullable=False)
    consent_type = Column(String(50), nullable=False)  # AI, LIKENESS, DIGITAL_TWIN, etc.
    consent_signed = Column(Boolean, default=False, nullable=False)
    consent_signed_at = Column(DateTime, nullable=True)
    consent_signature = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    metadata = Column(JSONB, default={}, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", backref="casting_consents")
    casting_call = relationship("CastingCall", backref="consents")
    
    __table_args__ = (
        # Task 132: Create composite indexes for consent lookups
    )


# Task 126: Write Pricing_Tiers schema
class PricingTier(Base):
    """
    Pricing Tiers Model
    """
    __tablename__ = "pricing_tiers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    ai_credits = Column(Integer, default=0, nullable=False)
    features = Column(ARRAY(String), default=[], nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


# Task 127: Write Transactions table schema
class Transaction(Base):
    """
    Transactions Model
    """
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # PAYMENT, REFUND, WITHDRAWAL, etc.
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, COMPLETED, FAILED, REFUNDED
    stripe_payment_intent_id = Column(String(255), nullable=True)
    stripe_charge_id = Column(String(255), nullable=True)
    metadata = Column(JSONB, default={}, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="transactions")


# Task 128: Write Generated_Media schema
class GeneratedMedia(Base):
    """
    Generated Media Model
    """
    __tablename__ = "generated_media"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ai_generation_id = Column(UUID(as_uuid=True), ForeignKey("ai_generations.id", ondelete="CASCADE"), nullable=True)
    type = Column(String(50), nullable=False)  # SCENE, REEL, MUSIC_VIDEO, DIGITAL_TWIN, etc.
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    file_size = Column(Integer, nullable=True)  # bytes
    file_type = Column(String(50), nullable=True)
    duration = Column(Float, nullable=True)  # seconds
    resolution = Column(String(50), nullable=True)
    metadata = Column(JSONB, default={}, nullable=False)
    is_watermarked = Column(Boolean, default=True, nullable=False)
    watermark_type = Column(String(50), nullable=True)  # VISIBLE, INVISIBLE, BOTH
    encryption_key = Column(String(255), nullable=True)  # Task 177: likeness asset encryption at rest
    is_encrypted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", backref="generated_media")
    ai_generation = relationship("AiGeneration", back_populates="generated_media")


# Task 129: Write Sponsorship_Campaigns schema
class SponsorshipCampaign(Base):
    """
    Sponsorship Campaigns Model
    """
    __tablename__ = "sponsorship_campaigns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brand_agencies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    budget = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    target_audience = Column(Text, nullable=True)
    requirements = Column(JSONB, default={}, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, ACTIVE, COMPLETED, CANCELLED
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    brand = relationship("BrandAgency", back_populates="campaigns")
    applications = relationship("CampaignApplication", back_populates="campaign")


# Task 130: Write Brand_Agencies schema
class BrandAgency(Base):
    """
    Brand Agencies Model
    """
    __tablename__ = "brand_agencies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    company_website = Column(Text, nullable=True)
    company_email = Column(String(255), nullable=True)
    company_phone = Column(String(50), nullable=True)
    industry = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    api_key = Column(String(255), nullable=True)  # Task 112: API Key generation for Brands
    api_key_expires_at = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="brand_agency")
    campaigns = relationship("SponsorshipCampaign", back_populates="brand")
    contracts = relationship("Contract", backref="brand_agency")


class CastingCall(Base):
    """
    Casting Call Model
    """
    __tablename__ = "casting_calls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    director_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, OPEN, CLOSED, FILLED
    type = Column(String(50), nullable=True)  # FILM, TV, COMMERCIAL, MUSIC_VIDEO, THEATER, DIGITAL
    location = Column(String(200), nullable=True)
    remote_ok = Column(Boolean, default=False, nullable=False)
    budget = Column(Float, nullable=True)
    compensation = Column(String(100), nullable=True)
    deadline = Column(DateTime, nullable=True)
    requirements = Column(JSONB, default={}, nullable=False)
    roles = Column(JSONB, default=[], nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    director = relationship("User", back_populates="casting_calls")
    applications = relationship("Application", back_populates="casting_call")


class Application(Base):
    """
    Application Model
    """
    __tablename__ = "applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    casting_call_id = Column(UUID(as_uuid=True), ForeignKey("casting_calls.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, REVIEWING, SHORTLISTED, REJECTED, HIRED
    cover_letter = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    talent = relationship("User", back_populates="applications")
    casting_call = relationship("CastingCall", back_populates="applications")
    
    __table_args__ = (
        # Unique constraint: one application per talent per casting call
    )


class DigitalTwin(Base):
    """
    Digital Twin Model
    """
    __tablename__ = "digital_twins"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    model_data = Column(JSONB, default={}, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    consent_signed = Column(Boolean, default=False, nullable=False)
    consent_signed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="TRAINING", nullable=False)  # TRAINING, READY, ERROR
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    talent = relationship("User", back_populates="digital_twins")


class Subscription(Base):
    """
    Subscription Model
    """
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tier = Column(String(50), default="FREE", nullable=False)  # FREE, BRONZE, SILVER, GOLD
    price = Column(Float, default=0.0, nullable=False)
    start_date = Column(DateTime, server_default=func.now(), nullable=False)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, CANCELLED, EXPIRED
    stripe_subscription_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="subscriptions")


class MasterCode(Base):
    """
    Master Code Model
    """
    __tablename__ = "master_codes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    tier = Column(String(50), default="FREE", nullable=False)  # FREE, BRONZE, SILVER, GOLD
    max_uses = Column(Integer, default=1, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relations
    creator = relationship("User", back_populates="master_codes_created")


class Contract(Base):
    """
    Contract Model
    """
    __tablename__ = "contracts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    brand_agency_id = Column(UUID(as_uuid=True), ForeignKey("brand_agencies.id", ondelete="CASCADE"), nullable=True)
    type = Column(String(50), nullable=False)  # TALENT, AI_CONSENT, DIGITAL_TWIN, CASTING_DIRECTOR, ADVERTISER
    content = Column(Text, nullable=True)
    signed_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, SIGNED, EXPIRED, REVOKED
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="contracts")


class Consent(Base):
    """
    Consent Model
    """
    __tablename__ = "consents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    ai_consent_signed = Column(Boolean, default=False, nullable=False)
    ai_consent_signed_at = Column(DateTime, nullable=True)
    ai_consent_signature = Column(Text, nullable=True)
    likeness_consent_signed = Column(Boolean, default=False, nullable=False)
    likeness_consent_signed_at = Column(DateTime, nullable=True)
    likeness_consent_signature = Column(Text, nullable=True)
    guardian_consent_signed = Column(Boolean, default=False, nullable=False)
    guardian_consent_signed_at = Column(DateTime, nullable=True)
    guardian_name = Column(String(100), nullable=True)
    guardian_email = Column(String(255), nullable=True)
    guardian_phone = Column(String(50), nullable=True)
    relationship = Column(String(100), nullable=True)
    guardian_signature = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="consent")


class Earning(Base):
    """
    Earning Model
    """
    __tablename__ = "earnings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    source = Column(String(50), nullable=False)  # AD_REVENUE, ENGAGEMENT, REFERRAL, CASTING_FEE
    description = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, PAID, FAILED
    paid_at = Column(DateTime, nullable=True)
    stripe_transfer_id = Column(String(255), nullable=True)
    metadata = Column(JSONB, default={}, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="earnings")


class AiGeneration(Base):
    """
    AI Generation Model
    """
    __tablename__ = "ai_generations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # SCENE, REEL, MUSIC_VIDEO, DIGITAL_TWIN, ENHANCEMENT
    input_data = Column(JSONB, default={}, nullable=False)
    output_url = Column(Text, nullable=True)
    cost_credits = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="ai_generations")
    generated_media = relationship("GeneratedMedia", back_populates="ai_generation")


class AuditLog(Base):
    """
    Audit Log Model
    """
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(255), nullable=True)
    metadata = Column(JSONB, default={}, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", back_populates="audit_logs")


class DMCATakedown(Base):
    """
    DMCA Takedown Model
    """
    __tablename__ = "dmca_takedowns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_email = Column(String(255), nullable=False)
    infringing_url = Column(Text, nullable=False)
    original_work_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, REVIEWING, REMOVED, REJECTED
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime, nullable=True)


class DMCACounterNotification(Base):
    """
    DMCA Counter Notification Model
    """
    __tablename__ = "dmca_counter_notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dmca_takedown_id = Column(UUID(as_uuid=True), ForeignKey("dmca_takedowns.id", ondelete="CASCADE"), nullable=False)
    submitter_email = Column(String(255), nullable=False)
    submitter_name = Column(String(200), nullable=True)
    statement = Column(Text, nullable=True)
    consent_to_jurisdiction = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    dmca_takedown = relationship("DMCATakedown", backref="counter_notifications")


class Withdrawal(Base):
    """
    Withdrawal Model
    """
    __tablename__ = "withdrawals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    payment_method = Column(String(50), nullable=False)  # PAYPAL, BANK_TRANSFER, STRIPE
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, COMPLETED, FAILED, CANCELLED
    processed_at = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)
    stripe_transfer_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    user = relationship("User", backref="withdrawals")


class CampaignApplication(Base):
    """
    Campaign Application Model
    """
    __tablename__ = "campaign_applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("sponsorship_campaigns.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)
    cover_letter = Column(Text, nullable=True)
    portfolio_url = Column(Text, nullable=True)
    applied_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    talent = relationship("User", backref="campaign_applications")
    campaign = relationship("SponsorshipCampaign", back_populates="applications")


# Export all models
__all__ = [
    "Base",
    "User",
    "Profile",
    "TalentProfile",
    "CastingDirectorProfile",
    "CastingConsent",
    "PricingTier",
    "Transaction",
    "GeneratedMedia",
    "SponsorshipCampaign",
    "BrandAgency",
    "CastingCall",
    "Application",
    "DigitalTwin",
    "Subscription",
    "MasterCode",
    "Contract",
    "Consent",
    "Earning",
    "AiGeneration",
    "AuditLog",
    "DMCATakedown",
    "DMCACounterNotification",
    "Withdrawal",
    "CampaignApplication",
]
