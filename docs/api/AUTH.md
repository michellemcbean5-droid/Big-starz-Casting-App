# Authentication API

## POST /auth/register

Register a new user account. Requires a valid master access code.

### Request
```json
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "talent@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "talent",
  "masterCode": "STARZ-2024-ABCD",
  "dateOfBirth": "1995-06-15",
  "agreeTerms": true,
  "agreePrivacy": true
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "talent@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "talent",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Errors
| Code | Description |
|------|-------------|
| `INVALID_MASTER_CODE` | Code is invalid, expired, or max uses reached |
| `EMAIL_EXISTS` | Email already registered |
| `VALIDATION_ERROR` | Missing or invalid fields |
| `UNDERAGE_NO_CONSENT` | Under 18 without guardian consent |

---

## POST /auth/login

Authenticate and receive JWT tokens.

### Request
```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "talent@example.com",
  "password": "SecurePass123!"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "talent@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "talent",
      "subscriptionTier": "bronze"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### Errors
| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password incorrect |
| `ACCOUNT_SUSPENDED` | Account has been suspended |
| `EMAIL_NOT_VERIFIED` | Email verification required |

---

## POST /auth/refresh

Obtain a new access token using a refresh token.

### Request
```json
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### Errors
| Code | Description |
|------|-------------|
| `INVALID_REFRESH_TOKEN` | Token is invalid or expired |
| `TOKEN_REVOKED` | Token has been revoked (logout) |

---

## POST /auth/logout

Invalidate the current refresh token.

### Request
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## GET /auth/me

Get the current authenticated user's profile.

### Request
```
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

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
    "subscriptionTier": "silver",
    "subscriptionExpiresAt": "2024-12-31T23:59:59Z",
    "profile": {
      "stageName": "Jane Star",
      "bio": "Award-winning actress...",
      "headshots": ["url1", "url2"],
      "skills": ["Acting", "Singing", "Dance"],
      "location": "Los Angeles, CA",
      "unionStatus": "SAG-AFTRA",
      "ageRange": "25-35"
    },
    "credits": {
      "aiGenerationsUsed": 42,
      "aiGenerationsLimit": 100,
      "creditsBalance": 150
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-06-20T14:30:00Z"
  }
}
```

---

## PUT /auth/me

Update the current user's profile.

### Request
```
PUT /api/v1/auth/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "profile": {
    "stageName": "Jane Star",
    "bio": "Updated bio...",
    "skills": ["Acting", "Singing", "Dance", "Voiceover"],
    "location": "New York, NY",
    "unionStatus": "SAG-AFTRA",
    "ageRange": "25-35",
    "reelUrl": "https://vimeo.com/123456"
  }
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "profile": { ...updated profile... },
    "updatedAt": "2024-06-21T09:00:00Z"
  }
}
```

### Restrictions
- `email` cannot be changed through this endpoint (use dedicated email change flow)
- `role` can only be changed by admin
- Certain fields require subscription tier verification
