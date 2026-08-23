"""
Email Utilities
Task 113: Write account recovery email triggers
Task 114: Configure SendGrid/AWS SES webhooks
"""

from typing import Optional, Dict, Any
import logging
import httpx
from datetime import datetime, timedelta
import secrets

from config import settings

logger = logging.getLogger("bigstarz.email")


class EmailService:
    """
    Email Service for SendGrid and AWS SES
    Task 113-114: Email sending and webhook configuration
    """
    
    def __init__(self):
        self.sendgrid_client = None
        if settings.SENDGRID_API_KEY:
            import sendgrid
            from sendgrid.helpers.mail import Mail, From, To, HtmlContent, Subject
            self.sendgrid_client = sendgrid.SendGridAPIClient(settings.SENDGRID_API_KEY)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> bool:
        """
        Send email using SendGrid
        Task 113: Write account recovery email triggers
        """
        if not self.sendgrid_client:
            logger.error("SendGrid client not initialized")
            return False
        
        try:
            from sendgrid.helpers.mail import Mail, Email, To, Content, Subject
            
            from_addr = Email(from_email or settings.SENDGRID_FROM_EMAIL)
            if from_name:
                from_addr.name = from_name or settings.SENDGRID_FROM_NAME
            
            to_addr = To(to_email)
            content = Content("text/html", html_content)
            if text_content:
                content = Content("text/plain", text_content)
            
            mail = Mail(from_addr, to_addr, Subject(subject), content)
            
            response = self.sendgrid_client.client.mail.send.post(request_body=mail.get())
            
            if response.status_code in [200, 202]:
                logger.info(f"Email sent to {to_email}: {subject}")
                return True
            else:
                logger.error(f"Email send failed: {response.status_code} - {response.body}")
                return False
        except Exception as e:
            logger.error(f"Email send error: {str(e)}")
            return False
    
    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
    ) -> bool:
        """
        Send password reset email
        Task 113: Write account recovery email triggers
        """
        reset_url = f"https://bigstarz.com/reset-password?token={reset_token}"
        
        subject = "Password Reset Request - Big Starz Casting"
        html_content = f"""
        <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your Big Starz Casting account.</p>
                <p>Click the link below to reset your password:</p>
                <p><a href="{reset_url}">Reset Password</a></p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
            </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            from_name="Big Starz Casting Support",
        )
    
    async def send_welcome_email(
        self,
        to_email: str,
        user_name: str,
    ) -> bool:
        """
        Send welcome email to new user
        Task 113: Write account recovery email triggers
        """
        subject = "Welcome to Big Starz Casting!"
        html_content = f"""
        <html>
            <body>
                <h2>Welcome, {user_name}!</h2>
                <p>Thank you for joining Big Starz Casting.</p>
                <p>You can now start discovering talent, creating casting calls, and using our AI-powered tools.</p>
            </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            from_name="Big Starz Casting",
        )
    
    async def send_magic_link_email(
        self,
        to_email: str,
        magic_link: str,
    ) -> bool:
        """
        Send magic link login email
        Task 115: Write magic link login endpoints
        """
        subject = "Your Magic Link to Log In - Big Starz Casting"
        html_content = f"""
        <html>
            <body>
                <h2>Magic Link Login</h2>
                <p>Click the link below to log in to your Big Starz Casting account:</p>
                <p><a href="{magic_link}">Log In</a></p>
                <p>This link will expire in 1 hour.</p>
            </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            from_name="Big Starz Casting",
        )


class SendGridWebhook:
    """
    SendGrid Webhook Handler
    Task 114: Configure SendGrid/AWS SES webhooks
    """
    
    @staticmethod
    async def verify_webhook_signature(
        payload: bytes,
        signature: str,
    ) -> bool:
        """Verify SendGrid webhook signature"""
        import hmac
        import hashlib
        
        if not settings.SENDGRID_WEBHOOK_SECRET:
            return False
        
        try:
            # SendGrid sends signature as hex digest
            expected_signature = hmac.new(
                settings.SENDGRID_WEBHOOK_SECRET.encode(),
                payload,
                hashlib.sha256,
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            return False
    
    @staticmethod
    async def handle_inbound_email(event: Dict[str, Any]) -> bool:
        """Handle inbound email webhook"""
        # Process inbound email
        logger.info(f"Received inbound email: {event}")
        return True
    
    @staticmethod
    async def handle_bounce(event: Dict[str, Any]) -> bool:
        """Handle bounce webhook"""
        # Process bounce
        logger.info(f"Received bounce: {event}")
        return True
    
    @staticmethod
    async def handle_delivery(event: Dict[str, Any]) -> bool:
        """Handle delivery webhook"""
        # Process delivery confirmation
        logger.info(f"Received delivery confirmation: {event}")
        return True


# Global email service instance
email_service = EmailService()


# Export all
__all__ = [
    "EmailService",
    "SendGridWebhook",
    "email_service",
]
