# Users API

## GET /users

List all users (admin only).

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |
| `role` | string | Filter by role: `talent`, `casting_director`, `creator`, `admin` |
| `search` | string | Search by name or email |
| `subscriptionTier` | string | Filter by tier: `free`, `bronze`, `silver`, `gold` |
| `status` | string | Filter by status: `active`, `suspended`, `pending` |
| `sortBy` | string | Sort field (default: `createdAt`) |
| `sortOrder` | string | `asc` or `desc` (default: `desc`) |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "talent@example.com",
        "firstName": "Jane",
        "lastName": "Doe",
        "role": "talent",
        "subscriptionTier": "silver",
        "status": "active",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

## GET /users/:id

Get a specific user by ID.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "talent@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "talent",
    "profile": { ... },
    "subscriptionTier": "silver",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Access Control
- Anyone can view public profile fields
- Full profile visible to: self, admins, casting directors (for talent profiles)

---

## PUT /users/:id

Update a user (admin or self only).

### Request Body
Same fields as `PUT /auth/me`, plus:
- `role` — admin only
- `status` — admin only
- `subscriptionTier` — admin only

---

## DELETE /users/:id

Delete a user account (admin or self only).

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

### Notes
- Soft delete: user data is anonymized but retained for legal/compliance
- Associated contracts and earnings records are preserved
- AI-generated content remains with platform per Terms of Service

---

## GET /users/search

Advanced talent search (available to casting directors and admins).

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Free-text search query |
| `skills` | string[] | Filter by skills (comma-separated) |
| `location` | string | Filter by location |
| `unionStatus` | string | `SAG-AFTRA`, `AEA`, `non-union`, etc. |
| `ageMin` | integer | Minimum age |
| `ageMax` | integer | Maximum age |
| `gender` | string | Gender filter |
| `ethnicity` | string | Ethnicity filter |
| `hasReel` | boolean | Filter by reel availability |
| `hasHeadshots` | boolean | Filter by headshot availability |
| `available` | boolean | Filter by availability status |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Doe",
        "profile": {
          "stageName": "Jane Star",
          "skills": ["Acting", "Singing"],
          "location": "Los Angeles, CA",
          "unionStatus": "SAG-AFTRA",
          "headshots": ["url1"],
          "reelUrl": "https://vimeo.com/123456"
        },
        "matchScore": 0.92
      }
    ],
    "pagination": { ... }
  }
}
```

---

## POST /users/:id/suspend

Suspend a user account (admin only).

### Request
```json
{
  "reason": "Violation of community guidelines",
  "duration": "permanent"
}
```

---

## POST /users/:id/unsuspend

Reactivate a suspended account (admin only).
