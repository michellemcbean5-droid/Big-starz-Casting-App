# Casting API

## Casting Calls

### GET /casting-calls
List all active casting calls.

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | string | `open`, `closed`, `draft`, `archived` |
| `location` | string | Filter by location |
| `category` | string | Film, TV, Theater, Commercial, etc. |
| `budgetMin` | number | Minimum budget |
| `budgetMax` | number | Maximum budget |
| `deadlineAfter` | date | Deadline must be after this date |
| `search` | string | Search in title and description |
| `sortBy` | string | `createdAt`, `deadline`, `budget` |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "castingCalls": [
      {
        "id": "uuid",
        "title": "Lead Role — Sci-Fi Feature Film",
        "description": "Seeking a strong female lead...",
        "director": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Smith",
          "company": "Stellar Productions"
        },
        "status": "open",
        "location": "Los Angeles, CA",
        "category": "Feature Film",
        "budget": 50000,
        "deadline": "2024-07-15T23:59:59Z",
        "requirements": {
          "ageRange": "25-35",
          "gender": "Female",
          "skills": ["Acting", "Stunt work"],
          "unionStatus": "SAG-AFTRA preferred"
        },
        "applicationCount": 42,
        "createdAt": "2024-06-01T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### POST /casting-calls
Create a new casting call (casting_director only).

#### Request
```json
{
  "title": "Lead Role — Sci-Fi Feature Film",
  "description": "Seeking a strong female lead for an independent sci-fi feature...",
  "location": "Los Angeles, CA",
  "category": "Feature Film",
  "budget": 50000,
  "deadline": "2024-07-15T23:59:59Z",
  "requirements": {
    "ageRange": "25-35",
    "gender": "Female",
    "skills": ["Acting", "Stunt work"],
    "unionStatus": "SAG-AFTRA preferred",
    "ethnicity": "Any",
    "heightRange": "5'4" - 5'8"",
    "language": "English",
    "experience": "3+ years"
  },
  "compensation": {
    "type": "fixed",
    "amount": 50000,
    "currency": "USD",
    "perks": ["Meals provided", "IMDb credit", "Travel covered"]
  },
  "auditionType": "in-person",
  "auditionLocation": "Los Angeles, CA",
  "auditionDates": ["2024-07-20", "2024-07-21"],
  "projectDetails": {
    "title": "Starbound",
    "type": "Feature Film",
    "duration": "90 minutes",
    "shootDates": "2024-08-01 to 2024-09-15",
    "director": "John Smith",
    "producer": "Stellar Productions"
  }
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lead Role — Sci-Fi Feature Film",
    "status": "open",
    "createdAt": "2024-06-21T10:00:00Z"
  }
}
```

---

### GET /casting-calls/:id
Get a single casting call with full details.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lead Role — Sci-Fi Feature Film",
    "description": "...",
    "director": { ... },
    "status": "open",
    "location": "Los Angeles, CA",
    "category": "Feature Film",
    "budget": 50000,
    "deadline": "2024-07-15T23:59:59Z",
    "requirements": { ... },
    "compensation": { ... },
    "projectDetails": { ... },
    "applicationCount": 42,
    "viewCount": 1250,
    "isBookmarked": false,
    "createdAt": "2024-06-01T10:00:00Z",
    "updatedAt": "2024-06-10T14:00:00Z"
  }
}
```

---

### PUT /casting-calls/:id
Update a casting call (director who created it or admin).

---

### DELETE /casting-calls/:id
Delete/archived a casting call (director who created it or admin).

---

## Applications

### POST /casting-calls/:id/apply
Apply to a casting call (talent only).

#### Request
```json
{
  "message": "I am very interested in this role. My recent work includes...",
  "attachments": ["resume.pdf", "cover-letter.pdf"],
  "availability": {
    "auditionDates": ["2024-07-20", "2024-07-21"],
    "shootDates": "2024-08-01 to 2024-09-15"
  },
  "expectedCompensation": 45000,
  "questions": {
    "willingToTravel": true,
    "hasPassport": true,
    "comfortableWithNudity": false
  }
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "submittedAt": "2024-06-21T10:30:00Z",
    "message": "Application submitted successfully"
  }
}
```

---

### GET /casting-calls/:id/applications
List applications for a casting call (director who owns it or admin).

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "talent": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Doe",
          "profile": {
            "stageName": "Jane Star",
            "headshots": ["url1"],
            "skills": ["Acting", "Singing"]
          }
        },
        "status": "pending",
        "message": "I am very interested...",
        "submittedAt": "2024-06-21T10:30:00Z",
        "matchScore": 0.88
      }
    ],
    "pagination": { ... }
  }
}
```

---

### PUT /applications/:id/status
Update application status (director who owns the casting call).

#### Request
```json
{
  "status": "shortlisted",
  "note": "Great reel, let's bring her in for audition"
}
```

#### Status Values
- `pending` — Initial submission
- `under_review` — Being evaluated
- `shortlisted` — Selected for next round
- `rejected` — Not selected
- `callback` — Invited for callback
- `offered` — Role offered
- `accepted` — Offer accepted
- `declined` — Offer declined

---

## Search

### GET /casting-calls/search
Search casting calls with filters.

#### Query Parameters
Same as `GET /casting-calls` plus:
- `recommended` — boolean, show AI-recommended calls for current user

#### AI Matching
When `recommended=true`, the API uses the talent's profile (skills, location, experience) to score and rank casting calls by relevance.
