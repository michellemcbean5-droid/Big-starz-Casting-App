"""
Database Connection Configuration
Task 121: Configure SQLAlchemy 2.0 AsyncPG
Task 122: Set up Alembic migrations
Task 134: Set up database connection pooling
Task 137: Write SQL queries for MRR calculation
Task 138: Write SQL queries for Creator earnings
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, DeclarativeMeta
from sqlalchemy import text
from typing import AsyncGenerator
import logging

from config import settings

logger = logging.getLogger("bigstarz.database")


# Create async engine with connection pooling
# Task 134: Database connection pooling configuration
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_recycle=settings.DATABASE_POOL_RECYCLE,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    future=True,  # Enable SQLAlchemy 2.0 style
)


# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Base class for models
Base: DeclarativeMeta = declarative_base()


async def init_db():
    """
    Initialize database connection
    Task 121-122: Database initialization and migrations
    """
    try:
        # Test connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection established")
        
        # In development, create all tables
        if settings.ENVIRONMENT == "development":
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Database tables created (development mode)")
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()


# MRR (Monthly Recurring Revenue) Calculation Query
# Task 137: SQL queries for MRR calculation
async def calculate_mrr(db_session: AsyncSession) -> float:
    """
    Calculate Monthly Recurring Revenue
    """
    query = text("""
        SELECT COALESCE(SUM(price), 0) as mrr
        FROM subscriptions 
        WHERE status = 'ACTIVE' 
          AND tier != 'FREE'
          AND (end_date IS NULL OR end_date > NOW())
    """)
    
    result = await db_session.execute(query)
    row = result.fetchone()
    return float(row[0]) if row else 0.0


# Creator Earnings Calculation Query
# Task 138: SQL queries for Creator earnings
async def calculate_creator_earnings(
    db_session: AsyncSession,
    creator_id: str,
) -> float:
    """
    Calculate total earnings for a creator
    """
    query = text("""
        SELECT COALESCE(SUM(amount), 0) as total_earnings
        FROM earnings 
        WHERE user_id = :creator_id 
          AND status = 'PAID'
    """)
    
    result = await db_session.execute(query, {"creator_id": creator_id})
    row = result.fetchone()
    return float(row[0]) if row else 0.0


# Task 135: Database seed scripts for dev
async def seed_database(db_session: AsyncSession):
    """
    Seed database with initial data for development
    """
    logger.info("🌱 Seeding database...")
    
    # Check if already seeded by checking if users table has data
    result = await db_session.execute(
        text("SELECT COUNT(*) FROM users")
    )
    count = result.scalar()
    if count > 0:
        logger.info("✅ Database already has data, skipping seed")
        return
    
    # Import models after Base is available
    from models.users import User
    from models.profiles import Profile
    from models.talent import TalentProfile
    from models.casting import CastingCall
    from models.subscriptions import Subscription
    from models.consent import Consent
    from models.ai import AiGeneration
    from models.payments import Earning
    from models.contracts import Contract
    from models.audit import AuditLog
    from models.dmca import DMCATakedown, DMCACounterNotification
    from models.sponsorship import SponsorshipCampaign, BrandAgency
    from models.transactions import Transaction
    from models.pricing import PricingTier
    from models.generated_media import GeneratedMedia
    from datetime import datetime, timedelta
    import uuid
    from sqlalchemy import select
    
    # Create admin user
    admin = User(
        id=str(uuid.uuid4()),
        email="admin@bigstarz.com",
        password_hash="$2b$12$hashed_password_here",  # Replace with actual hash
        role="ADMIN",
        email_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(admin)
    
    # Create test users for each role
    roles = ["FAN", "CREATOR", "ACTOR", "BRAND"]
    for role in roles:
        user = User(
            id=str(uuid.uuid4()),
            email=f"{role.lower()}@bigstarz.com",
            password_hash="$2b$12$hashed_password_here",
            role=role,
            email_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(user)
    
    await db_session.flush()
    
    # Create profiles for users
    users = await db_session.execute(select(User))
    user_list = users.scalars().all()
    
    for user in user_list:
        profile = Profile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            first_name=f"User_{user.id[:8]}",
            last_name="Test",
            display_name=f"{user.role} User",
            bio=f"Test {user.role} profile",
            location="Los Angeles, CA",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(profile)
    
    await db_session.flush()
    
    # Create casting calls
    for i in range(5):
        casting_call = CastingCall(
            id=str(uuid.uuid4()),
            title=f"Casting Call {i+1}",
            description=f"Description for casting call {i+1}",
            director_id=admin.id,
            status="OPEN",
            type="FILM",
            location="Los Angeles, CA",
            remote_ok=True,
            budget=10000.0,
            compensation="$10,000",
            deadline=datetime.utcnow() + timedelta(days=30),
            requirements={"age": "25-35", "experience": "2+ years"},
            roles=[{"name": "Lead Actor", "description": "Main role"}],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(casting_call)
    
    await db_session.commit()
    logger.info("✅ Database seeded successfully")


# Task 136: Configure Read/Write Replica routing
class DatabaseRouter:
    """
    Database router for read/write replica routing
    """
    
    def __init__(self, primary_url: str, read_replicas: list = None):
        self.primary_url = primary_url
        self.read_replicas = read_replicas or []
        self.current_replica_index = 0
    
    def get_read_connection(self):
        """Get a read replica connection"""
        if self.read_replicas:
            replica_url = self.read_replicas[self.current_replica_index]
            self.current_replica_index = (self.current_replica_index + 1) % len(self.read_replicas)
            return replica_url
        return self.primary_url
    
    def get_write_connection(self):
        """Get the primary write connection"""
        return self.primary_url


# Export all
__all__ = [
    "engine",
    "async_session_maker",
    "Base",
    "init_db",
    "get_db",
    "calculate_mrr",
    "calculate_creator_earnings",
    "seed_database",
    "DatabaseRouter",
]
