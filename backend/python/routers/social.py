"""
Social Router
Tasks 181-200: Real-Time Social & NoSQL
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime
import json
import uuid

from config import settings
from database.models import User
from database.connection import async_session_maker, get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from utils.jwt_utils import verify_access_token
from utils.oauth_utils import OAuth2PasswordFlow
from services.social_service import SocialService

logger = logging.getLogger("bigstarz.social")

router = APIRouter(prefix="/social", tags=["social"])


# Task 181: Configure Motor async MongoDB connection
# Task 182-184: MongoDB schemas for Chat_Threads, Chat_Messages, Social_Comments
# These would be defined in a separate MongoDB models file


# Task 185: Configure WebSockets protocol server
# Task 186: Write Socket.io event emitters
# For FastAPI, we use WebSockets directly

class ConnectionManager:
    """WebSocket connection manager"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected")
    
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)
    
    async def broadcast(self, message: str, sender_id: str):
        for user_id, connections in self.active_connections.items():
            if user_id != sender_id:
                for connection in connections:
                    await connection.send_text(message)


manager = ConnectionManager()


# Task 185: Configure WebSockets protocol server
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="Access token"),
):
    """
    WebSocket Endpoint
    Task 185: Configure WebSockets protocol server
    """
    # Verify token
    payload = verify_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    user_id = payload.user_id
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # Parse message
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                # Task 186: Write Socket.io event emitters
                # Task 188: Write message read-receipt logic
                # Task 189: Handle typing indicator socket events
                
                if message_type == "chat_message":
                    # Broadcast message to recipient
                    recipient_id = message.get("recipient_id")
                    if recipient_id in manager.active_connections:
                        for connection in manager.active_connections[recipient_id]:
                            await connection.send_text(json.dumps({
                                "type": "chat_message",
                                "sender_id": user_id,
                                "message": message.get("message"),
                                "timestamp": datetime.utcnow().isoformat(),
                            }))
                    
                    # Store message in MongoDB
                    # Task 182-183: Write Chat_Messages MongoDB schema
                    await SocialService.save_chat_message(
                        sender_id=user_id,
                        recipient_id=recipient_id,
                        message=message.get("message"),
                    )
                
                elif message_type == "typing":
                    # Task 189: Handle typing indicator socket events
                    recipient_id = message.get("recipient_id")
                    if recipient_id in manager.active_connections:
                        for connection in manager.active_connections[recipient_id]:
                            await connection.send_text(json.dumps({
                                "type": "typing",
                                "sender_id": user_id,
                                "is_typing": message.get("is_typing", True),
                            }))
                
                elif message_type == "read_receipt":
                    # Task 188: Write message read-receipt logic
                    message_id = message.get("message_id")
                    recipient_id = message.get("recipient_id")
                    
                    # Mark message as read in MongoDB
                    await SocialService.mark_message_as_read(
                        message_id=message_id,
                        reader_id=user_id,
                    )
                    
                    # Send read receipt to sender
                    if recipient_id in manager.active_connections:
                        for connection in manager.active_connections[recipient_id]:
                            await connection.send_text(json.dumps({
                                "type": "read_receipt",
                                "message_id": message_id,
                                "reader_id": user_id,
                                "timestamp": datetime.utcnow().isoformat(),
                            }))
                
            except json.JSONDecodeError:
                logger.error("Invalid JSON message")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid message format",
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# Task 187: Implement Redis Pub/Sub for chat scaling
@router.post("/chat/publish", summary="Publish chat message to Redis")
async def publish_chat_message(
    request: Request,
    channel: str = Query(..., description="Redis channel"),
    message: str = Query(..., description="Message to publish"),
) -> JSONResponse:
    """
    Publish Chat Message to Redis
    Task 187: Implement Redis Pub/Sub for chat scaling
    """
    import aioredis
    
    try:
        redis = aioredis.from_url(settings.REDIS_URL)
        await redis.publish(channel, message)
        await redis.close()
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "channel": channel,
                "message": message,
            },
        )
    except Exception as e:
        logger.error(f"Failed to publish to Redis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish message",
        )


# Task 190: Write feed pagination cursor logic
@router.get("/feed", summary="Get Social Feed with Pagination")
async def get_social_feed(
    request: Request,
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    limit: int = Query(default=20, description="Results per page"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Get Social Feed with Pagination
    Task 190: Write feed pagination cursor logic
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would query MongoDB for social posts
    # For now, return mock feed
    
    # Generate mock posts
    posts = []
    for i in range(limit):
        posts.append({
            "id": str(uuid.uuid4()),
            "user_id": str(uuid.uuid4()),
            "content": f"This is post {i + 1}",
            "created_at": datetime.utcnow().isoformat(),
            "likes": i * 10,
            "comments": i * 2,
            "shares": i,
        })
    
    # Generate next cursor
    next_cursor = str(uuid.uuid4()) if len(posts) == limit else None
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "posts": posts,
            "cursor": next_cursor,
            "has_more": next_cursor is not None,
        },
    )


# Task 191: Implement "Like/Star" counter atomic updates
@router.post("/posts/{post_id}/like", summary="Like a Post")
async def like_post(
    request: Request,
    post_id: str = Query(..., description="Post ID"),
    action: str = Query(default="like", description="Action (like, unlike)"),
) -> JSONResponse:
    """
    Like/Unlike a Post
    Task 191: Implement "Like/Star" counter atomic updates
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would use MongoDB atomic update
    # For now, return success
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "post_id": post_id,
            "action": action,
            "like_count": 42,  # Mock count
        },
    )


# Task 192: Write Trending Reels ranking algorithm
@router.get("/reels/trending", summary="Get Trending Reels")
async def get_trending_reels(
    request: Request,
    limit: int = Query(default=20, description="Results per page"),
) -> JSONResponse:
    """
    Get Trending Reels
    Task 192: Write Trending Reels ranking algorithm
    """
    # In production, this would:
    # 1. Query reels from MongoDB
    # 2. Apply ranking algorithm (views, likes, shares, recency)
    # 3. Return sorted results
    
    # For now, return mock trending reels
    
    reels = []
    for i in range(limit):
        reels.append({
            "id": str(uuid.uuid4()),
            "user_id": str(uuid.uuid4()),
            "title": f"Trending Reel {i + 1}",
            "url": f"https://bigstarz.com/reels/{uuid.uuid4()}",
            "views": (limit - i) * 1000,
            "likes": (limit - i) * 100,
            "shares": (limit - i) * 10,
            "score": (limit - i) * 1000 + (limit - i) * 100 + (limit - i) * 10,
        })
    
    # Sort by score (descending)
    reels.sort(key=lambda x: x["score"], reverse=True)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "reels": reels,
        },
    )


# Task 193: Build Follower/Following graph backend
@router.post("/follow", summary="Follow a User")
async def follow_user(
    request: Request,
    user_id_to_follow: str = Query(..., description="User ID to follow"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Follow a User
    Task 193: Build Follower/Following graph backend
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Create follow relationship in MongoDB
    # 2. Update follower/following counts
    # 3. Send notification
    
    # For now, return success
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "follower_id": str(user.id),
            "following_id": user_id_to_follow,
        },
    )


@router.post("/unfollow", summary="Unfollow a User")
async def unfollow_user(
    request: Request,
    user_id_to_unfollow: str = Query(..., description="User ID to unfollow"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Unfollow a User
    Task 193: Build Follower/Following graph backend
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would remove the follow relationship
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "follower_id": str(user.id),
            "following_id": user_id_to_unfollow,
        },
    )


@router.get("/followers/{user_id}", summary="Get User Followers")
async def get_followers(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Get User Followers
    Task 193: Build Follower/Following graph backend
    """
    # In production, this would query MongoDB for followers
    
    # For now, return mock followers
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "user_id": user_id,
            "followers": [
                {
                    "id": str(uuid.uuid4()),
                    "email": f"follower{i}@bigstarz.com",
                    "profile": {
                        "first_name": f"Follower{i}",
                        "last_name": "Test",
                        "avatar_url": None,
                    },
                }
                for i in range(10)
            ],
            "total": 10,
        },
    )


@router.get("/following/{user_id}", summary="Get Users Following")
async def get_following(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Get Users Following
    Task 193: Build Follower/Following graph backend
    """
    # In production, this would query MongoDB for following
    
    # For now, return mock following
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "user_id": user_id,
            "following": [
                {
                    "id": str(uuid.uuid4()),
                    "email": f"following{i}@bigstarz.com",
                    "profile": {
                        "first_name": f"Following{i}",
                        "last_name": "Test",
                        "avatar_url": None,
                    },
                }
                for i in range(5)
            ],
            "total": 5,
        },
    )


# Task 194: Write Push Notification payload generator
@router.post("/notifications/send", summary="Send Push Notification")
async def send_push_notification(
    request: Request,
    user_id: str = Query(..., description="Recipient User ID"),
    title: str = Query(..., description="Notification title"),
    body: str = Query(..., description="Notification body"),
    data: Optional[Dict[str, Any]] = Query(None, description="Notification data"),
) -> JSONResponse:
    """
    Send Push Notification
    Task 194: Write Push Notification payload generator
    """
    # Get current user (sender)
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Generate payload
    # 2. Send via Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
    
    # Generate payload
    payload = {
        "to": f"user_{user_id}",
        "notification": {
            "title": title,
            "body": body,
            "sound": "default",
        },
        "data": data or {},
    }
    
    # Send to WebSocket if connected
    if user_id in manager.active_connections:
        for connection in manager.active_connections[user_id]:
            await connection.send_text(json.dumps({
                "type": "notification",
                "title": title,
                "body": body,
                "data": data or {},
            }))
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "payload": payload,
        },
    )


# Task 195: Implement Kafka event producers for feed activity
@router.post("/kafka/produce", summary="Produce Kafka Event")
async def produce_kafka_event(
    request: Request,
    topic: str = Query(..., description="Kafka topic"),
    event: Dict[str, Any] = Query(..., description="Event data"),
) -> JSONResponse:
    """
    Produce Kafka Event
    Task 195: Implement Kafka event producers for feed activity
    """
    # In production, this would produce to Kafka
    # For now, log the event
    
    logger.info(f"Kafka event produced to {topic}: {event}")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "topic": topic,
            "event": event,
        },
    )


# Task 196: Write Dead Letter Queue (DLQ) consumers
@router.post("/dlq/process", summary="Process DLQ Message")
async def process_dlq_message(
    request: Request,
    message: Dict[str, Any] = Query(..., description="DLQ message"),
) -> JSONResponse:
    """
    Process Dead Letter Queue Message
    Task 196: Write Dead Letter Queue (DLQ) consumers
    """
    # In production, this would:
    # 1. Retrieve failed message
    # 2. Attempt to reprocess
    # 3. Log or alert if still failing
    
    logger.warning(f"Processing DLQ message: {message}")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": message,
        },
    )


# Task 197: Build user block/mute backend logic
@router.post("/users/block", summary="Block a User")
async def block_user(
    request: Request,
    user_id_to_block: str = Query(..., description="User ID to block"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Block a User
    Task 197: Build user block/mute backend logic
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Create block relationship in MongoDB
    # 2. Prevent interactions
    # 3. Hide content
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "blocker_id": str(user.id),
            "blocked_id": user_id_to_block,
        },
    )


@router.post("/users/mute", summary="Mute a User")
async def mute_user(
    request: Request,
    user_id_to_mute: str = Query(..., description="User ID to mute"),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Mute a User
    Task 197: Build user block/mute backend logic
    """
    # Get current user
    user = await OAuth2PasswordFlow.get_current_user(
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    
    # In production, this would:
    # 1. Create mute relationship in MongoDB
    # 2. Hide notifications
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "muter_id": str(user.id),
            "muted_id": user_id_to_mute,
        },
    )


# Task 198: Write online status presence tracker
@router.get("/presence/{user_id}", summary="Get User Online Status")
async def get_user_presence(
    user_id: str,
) -> JSONResponse:
    """
    Get User Online Status
    Task 198: Write online status presence tracker
    """
    # Check if user is connected via WebSocket
    is_online = user_id in manager.active_connections
    last_seen = datetime.utcnow().isoformat() if is_online else None
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": last_seen,
        },
    )


# Task 199: Configure MongoDB text search indexes
@router.post("/search/index", summary="Create MongoDB Text Index")
async def create_text_index(
    request: Request,
    collection: str = Query(..., description="MongoDB collection"),
    fields: List[str] = Query(..., description="Fields to index"),
) -> JSONResponse:
    """
    Create MongoDB Text Index
    Task 199: Configure MongoDB text search indexes
    """
    # In production, this would create a text index in MongoDB
    
    logger.info(f"Creating text index on {collection} for fields: {fields}")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "collection": collection,
            "fields": fields,
        },
    )


# Task 200: Implement database sharding strategy for chat
@router.post("/chat/shard", summary="Configure Chat Sharding")
async def configure_chat_sharding(
    request: Request,
    shard_key: str = Query(..., description="Shard key"),
    num_shards: int = Query(default=4, description="Number of shards"),
) -> JSONResponse:
    """
    Configure Chat Sharding
    Task 200: Implement database sharding strategy for chat
    """
    # In production, this would configure sharding in MongoDB
    
    logger.info(f"Configuring chat sharding with key {shard_key} and {num_shards} shards")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "shard_key": shard_key,
            "num_shards": num_shards,
        },
    )


# Export router
__all__ = ["router", "manager"]
