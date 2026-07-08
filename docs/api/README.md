# Big Starz API Documentation

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3001/api/v1` |
| Staging | `https://api-staging.bigstarz.com/api/v1` |
| Production | `https://api.bigstarz.com/api/v1` |

All endpoints are prefixed with `/api/v1`.

## Authentication

The API uses **Bearer token** authentication via the `Authorization` header.

```
Authorization: Bearer <access_token>
```

### Token Flow
1. **Register** or **Login** to receive an `accessToken` and `refreshToken`
2. Include the `accessToken` in every authenticated request
3. When the access token expires (15 minutes), use the `refreshToken` to obtain a new pair
4. Call **Logout** to invalidate the refresh token

### Roles
- `talent` — Can apply to casting calls, use AI studio, manage profile
- `casting_director` — Can post casting calls, review applications, contact talent
- `creator` — Can generate AI content, monetize, access analytics
- `admin` — Full platform access, user management, code generation

## Error Response Format

All errors follow this consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of the error",
    "details": { ... },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body or parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `PAYMENT_REQUIRED` | 402 | Subscription tier required |
| `CONFLICT` | 409 | Resource already exists |

## Rate Limits

Rate limits are applied per user and per IP address.

| Tier | Requests / Minute | AI Generations / Month |
|------|-------------------|------------------------|
| Free | 30 | 3 |
| Bronze | 60 | 25 |
| Silver | 120 | 100 |
| Gold | 300 | Unlimited |

When rate limited, the API returns `429 Too Many Requests` with a `Retry-After` header.

## API Sections

- [Authentication](AUTH.md) — Register, login, refresh, logout
- [Users](USERS.md) — User management, profiles, search
- [Casting](CASTING.md) — Casting calls, applications, matching
- [AI](AI.md) — AI generation, history, credits
- [Payments](PAYMENTS.md) — Subscriptions, webhooks, earnings
- [Legal](LEGAL.md) — Contracts, DMCA, consent agreements
- [Database Schema](DATABASE_SCHEMA.md) — Data model reference
