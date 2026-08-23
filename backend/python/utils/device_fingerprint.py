"""
Device Fingerprinting Utilities
Task 120: Implement device fingerprinting tracker
"""

from typing import Optional, Dict, Any
import logging
import hashlib
import json
from datetime import datetime, timedelta

from config import settings

logger = logging.getLogger("bigstarz.security")


class DeviceFingerprint:
    """
    Device Fingerprinting Service
    Task 120: Implement device fingerprinting tracker
    """
    
    @staticmethod
    def create_fingerprint(
        user_agent: str,
        ip_address: str,
        accept_language: Optional[str] = None,
        screen_resolution: Optional[str] = None,
        timezone: Optional[str] = None,
        platform: Optional[str] = None,
        do_not_track: Optional[bool] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Create a device fingerprint hash
        Task 120: Implement device fingerprinting tracker
        """
        # Collect all fingerprint components
        components = {
            "user_agent": user_agent or "",
            "ip_address": ip_address or "",
            "accept_language": accept_language or "",
            "screen_resolution": screen_resolution or "",
            "timezone": timezone or "",
            "platform": platform or "",
            "do_not_track": str(do_not_track) if do_not_track is not None else "",
            "extra": json.dumps(extra) if extra else "",
        }
        
        # Create a sorted string of all components
        fingerprint_string = "|".join(
            f"{k}={v}" for k, v in sorted(components.items())
        )
        
        # Hash the fingerprint string
        fingerprint_hash = hashlib.sha256(fingerprint_string.encode()).hexdigest()
        
        return fingerprint_hash
    
    @staticmethod
    async def store_fingerprint(
        user_id: str,
        fingerprint: str,
        metadata: Dict[str, Any],
    ) -> bool:
        """
        Store device fingerprint in Redis
        Task 120: Implement device fingerprinting tracker
        """
        import aioredis
        
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            key = f"device_fingerprint:{user_id}:{fingerprint}"
            
            # Store fingerprint with metadata and TTL
            metadata["created_at"] = datetime.utcnow().isoformat()
            metadata["last_seen"] = datetime.utcnow().isoformat()
            
            await redis.setex(
                key,
                settings.DEVICE_FINGERPRINT_TTL,
                json.dumps(metadata),
            )
            
            # Also store in user's fingerprint set
            user_key = f"user_fingerprints:{user_id}"
            await redis.sadd(user_key, fingerprint)
            await redis.expire(user_key, settings.DEVICE_FINGERPRINT_TTL)
            
            await redis.close()
            return True
        except Exception as e:
            logger.error(f"Failed to store device fingerprint: {str(e)}")
            return False
    
    @staticmethod
    async def get_fingerprint_metadata(
        user_id: str,
        fingerprint: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get device fingerprint metadata from Redis
        """
        import aioredis
        
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            key = f"device_fingerprint:{user_id}:{fingerprint}"
            
            data = await redis.get(key)
            await redis.close()
            
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to get device fingerprint: {str(e)}")
            return None
    
    @staticmethod
    async def update_fingerprint_last_seen(
        user_id: str,
        fingerprint: str,
    ) -> bool:
        """
        Update last seen timestamp for a fingerprint
        """
        import aioredis
        
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            key = f"device_fingerprint:{user_id}:{fingerprint}"
            
            # Get existing metadata
            data = await redis.get(key)
            if data:
                metadata = json.loads(data)
                metadata["last_seen"] = datetime.utcnow().isoformat()
                
                await redis.setex(
                    key,
                    settings.DEVICE_FINGERPRINT_TTL,
                    json.dumps(metadata),
                )
            
            await redis.close()
            return True
        except Exception as e:
            logger.error(f"Failed to update device fingerprint: {str(e)}")
            return False
    
    @staticmethod
    async def get_user_fingerprints(
        user_id: str,
    ) -> list:
        """
        Get all fingerprints for a user
        """
        import aioredis
        
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            user_key = f"user_fingerprints:{user_id}"
            
            fingerprints = await redis.smembers(user_key)
            await redis.close()
            
            return list(fingerprints) if fingerprints else []
        except Exception as e:
            logger.error(f"Failed to get user fingerprints: {str(e)}")
            return []
    
    @staticmethod
    async def is_new_device(
        user_id: str,
        fingerprint: str,
    ) -> bool:
        """
        Check if this is a new device for the user
        """
        fingerprints = await DeviceFingerprint.get_user_fingerprints(user_id)
        return fingerprint not in fingerprints


# Export all
__all__ = [
    "DeviceFingerprint",
]
