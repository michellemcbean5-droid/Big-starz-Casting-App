# AI API

## Generation Endpoints

All AI generation endpoints require an active subscription and consume generation credits.

### POST /ai/generate/scene
Generate an AI scene for audition practice.

#### Request
```json
{
  "prompt": "A dramatic monologue in a rain-soaked alley at night",
  "style": "film_noir",
  "duration": 30,
  "character": {
    "name": "Detective Morgan",
    "age": 40,
    "gender": "male",
    "traits": ["gritty", "world-weary", "determined"]
  },
  "settings": {
    "lighting": "low-key",
    "mood": "tense",
    "genre": "thriller"
  }
}
```

#### Response (202 Accepted)
```json
{
  "success": true,
  "data": {
    "generationId": "uuid",
    "status": "processing",
    "estimatedTime": 45,
    "creditsDeducted": 1,
    "creditsRemaining": 24
  }
}
```

---

### POST /ai/generate/reel
Generate an AI-highlight reel from uploaded clips.

#### Request
```json
{
  "title": "Jane Star — Dramatic Reel 2024",
  "clips": ["clip-id-1", "clip-id-2", "clip-id-3"],
  "style": "dramatic",
  "music": "emotional_orchestral",
  "transitions": "smooth",
  "maxDuration": 120,
  "includeTitleCard": true,
  "watermark": true
}
```

---

### POST /ai/generate/music-video
Generate an AI music video.

#### Request
```json
{
  "song": {
    "title": "Midnight Dreams",
    "audioUrl": "https://.../song.mp3",
    "duration": 210
  },
  "visualStyle": "cinematic",
  "theme": "urban_nightlife",
  "scenes": [
    { "timestamp": 0, "description": "Opening cityscape at dusk" },
    { "timestamp": 45, "description": "Performance in neon-lit street" }
  ],
  "talentAppearance": {
    "useDigitalTwin": true,
    "outfit": "casual_stylish",
    "lighting": "neon_and_shadow"
  }
}
```

---

### POST /ai/generate/digital-twin
Create a digital twin from photos and video.

#### Request
```json
{
  "photos": ["photo-id-1", "photo-id-2", "photo-id-3", "photo-id-4"],
  "videoClip": "video-id-1",
  "consentSigned": true,
  "trainingOptions": {
    "quality": "high",
    "expressions": ["neutral", "happy", "sad", "angry", "surprised"],
    "angles": ["front", "profile", "three-quarter"]
  }
}
```

#### Requirements
- User must have signed the [AI Consent Agreement](../legal/AI_CONSENT_AGREEMENT.md)
- User must have signed the [Likeness Rights Agreement](../legal/LIKENESS_RIGHTS_AGREEMENT.md)
- Minimum Silver subscription tier
- At least 4 high-quality photos required
- Video clip optional but recommended for better results

---

### POST /ai/generate/headshot
Generate AI headshots from a base photo.

#### Request
```json
{
  "basePhoto": "photo-id-1",
  "variations": [
    { "style": "professional", "background": "studio_gray" },
    { "style": "dramatic", "background": "dark_gradient" },
    { "style": "natural", "background": "outdoor_soft" }
  ],
  "lighting": "flattering",
  "retouchLevel": "subtle"
}
```

---

## History Endpoints

### GET /ai/history
Get generation history for the current user.

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by generation type |
| `status` | string | `processing`, `completed`, `failed` |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "generations": [
      {
        "id": "uuid",
        "type": "scene",
        "status": "completed",
        "input": { "prompt": "..." },
        "outputUrl": "https://cdn.bigstarz.com/generations/uuid.mp4",
        "thumbnailUrl": "https://cdn.bigstarz.com/generations/uuid.jpg",
        "cost": 1,
        "createdAt": "2024-06-20T14:00:00Z",
        "completedAt": "2024-06-20T14:02:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /ai/history/:id
Get details of a specific generation.

---

### DELETE /ai/history/:id
Delete a generation and its output files.

---

## Credit Balance

### GET /ai/credits
Get current AI generation credits.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "tier": "silver",
    "totalCredits": 100,
    "usedCredits": 42,
    "remainingCredits": 58,
    "resetsAt": "2024-07-01T00:00:00Z",
    "bonusCredits": 10,
    "lifetimeGenerations": 156
  }
}
```

---

## Webhook Callback

The AI pipeline calls back to the API when generation completes:

```
POST /ai/webhooks/completion
```

#### Payload
```json
{
  "generationId": "uuid",
  "status": "completed",
  "outputUrl": "https://cdn.bigstarz.com/...",
  "thumbnailUrl": "https://cdn.bigstarz.com/...",
  "metadata": { ... }
}
```
