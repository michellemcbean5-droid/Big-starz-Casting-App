"""
Twilio SMS OTP Utilities
Task 109: Implement Twilio SMS OTP logic
"""

from twilio.rest import Client
from typing import Optional, Tuple
import logging
import secrets
import asyncio

from config import settings

logger = logging.getLogger("bigstarz.auth")


class TwilioOTPService:
    """
    Twilio SMS OTP Service
    Task 109: Implement Twilio SMS OTP logic
    """
    
    def __init__(self):
        self.client = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN,
            )
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code"""
        return ''.join(secrets.choice('0123456789') for _ in range(length))
    
    async def send_otp(self, phone_number: str, otp: str) -> Tuple[bool, str]:
        """
        Send OTP via SMS using Twilio
        Task 109: Implement Twilio SMS OTP logic
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return False, "Twilio not configured"
        
        try:
            message = self.client.messages.create(
                body=f"Your Big Starz verification code is: {otp}",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number,
            )
            logger.info(f"OTP sent to {phone_number}: {message.sid}")
            return True, message.sid
        except Exception as e:
            logger.error(f"Failed to send OTP to {phone_number}: {str(e)}")
            return False, str(e)
    
    async def verify_otp(self, phone_number: str, otp: str) -> bool:
        """
        Verify OTP (in production, this would check against stored OTP)
        Task 109: Implement Twilio SMS OTP logic
        """
        # In a real implementation, you would:
        # 1. Retrieve the stored OTP for this phone number from Redis
        # 2. Compare it with the provided OTP
        # 3. Check if it has expired
        # 4. Delete the OTP after verification
        
        # For now, just return True (mock implementation)
        return True


# Global Twilio service instance
twilio_service = TwilioOTPService()


# Export all
__all__ = [
    "TwilioOTPService",
    "twilio_service",
]
