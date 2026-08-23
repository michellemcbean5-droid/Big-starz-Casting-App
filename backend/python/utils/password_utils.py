"""
Password Utilities
Task 106: Implement bcrypt password hashing
"""

from passlib.context import CryptContext
from passlib.hash import bcrypt
from typing import Optional
import logging

from config import settings

logger = logging.getLogger("bigstarz.auth")


# Create password context with bcrypt
# Task 106: Implement bcrypt password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated=["auto"],
    bcrypt__rounds=settings.BCRYPT_LOG_ROUNDS,
)


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt
    Task 106: Implement bcrypt password hashing
    """
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Failed to hash password: {str(e)}")
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash using bcrypt
    Task 106: Implement bcrypt password hashing
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Failed to verify password: {str(e)}")
        return False


def needs_rehash(hashed_password: str) -> bool:
    """
    Check if password needs rehashing
    """
    try:
        return pwd_context.needs_update(hashed_password)
    except Exception as e:
        logger.error(f"Failed to check if password needs rehash: {str(e)}")
        return False


# Export all
__all__ = [
    "pwd_context",
    "hash_password",
    "verify_password",
    "needs_rehash",
]
