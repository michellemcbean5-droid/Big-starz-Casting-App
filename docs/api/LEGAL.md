# Legal API

## Contract Endpoints

### GET /contracts
List contracts for the current user.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "contracts": [
      {
        "id": "uuid",
        "type": "ai_consent",
        "title": "AI Consent Agreement",
        "status": "signed",
        "signedAt": "2024-06-01T10:00:00Z",
        "expiresAt": null,
        "ipAddress": "192.168.1.1",
        "documentUrl": "https://cdn.bigstarz.com/contracts/uuid.pdf"
      }
    ]
  }
}
```

#### Contract Types
- `terms_of_service` — Platform Terms of Service
- `privacy_policy` — Privacy Policy acknowledgment
- `ai_consent` — AI Consent Agreement
- `likeness_rights` — Likeness Rights Agreement
- `talent_contract` — Talent Engagement Contract
- `casting_director_agreement` — Casting Director Agreement

---

### GET /contracts/:type
Get the latest version of a specific contract.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "type": "ai_consent",
    "version": "1.2.0",
    "effectiveDate": "2024-01-01",
    "content": "# AI Consent Agreement\n\n...",
    "required": true,
    "lastUpdated": "2024-03-15T00:00:00Z"
  }
}
```

---

### POST /contracts/:type/sign
Sign a contract.

#### Request
```json
{
  "agreed": true,
  "fullName": "Jane Doe",
  "signature": "data:image/png;base64,iVBORw0KGgo...",
  "date": "2024-06-21",
  "understanding": {
    "aiProcessing": true,
    "digitalTwin": true,
    "dataUsage": true,
    "revocationRights": true
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "contractId": "uuid",
    "status": "signed",
    "signedAt": "2024-06-21T10:30:00Z",
    "documentUrl": "https://cdn.bigstarz.com/contracts/uuid-signed.pdf"
  }
}
```

---

## DMCA Endpoints

### POST /dmca/report
Submit a DMCA takedown request.

#### Request
```json
{
  "contentUrl": "https://cdn.bigstarz.com/content/uuid",
  "copyrightOwner": {
    "name": "Example Studios",
    "email": "legal@example.com",
    "address": "123 Main St, Los Angeles, CA 90001",
    "phone": "+1-555-0100"
  },
  "originalWork": {
    "title": "Original Film Title",
    "description": "A scene from our copyrighted film...",
    "registrationNumber": "TXu-123-456"
  },
  "infringingContent": {
    "description": "Unauthorized use of our copyrighted scene",
    "location": "https://cdn.bigstarz.com/content/uuid"
  },
  "goodFaith": true,
  "accuracy": true,
  "authority": true,
  "signature": "John Smith",
  "electronicSignature": true
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "status": "received",
    "message": "DMCA report received. Content will be reviewed within 48 hours."
  }
}
```

---

### POST /dmca/counter-notice
Submit a DMCA counter-notification.

#### Request
```json
{
  "reportId": "uuid",
  "userStatement": "I have a good faith belief that the material was removed...",
  "consentToJurisdiction": true,
  "consentToService": true,
  "signature": "Jane Doe",
  "contactInfo": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "address": "456 Oak Ave, Los Angeles, CA 90002",
    "phone": "+1-555-0200"
  }
}
```

---

### GET /dmca/status/:reportId
Check the status of a DMCA report.

#### Status Values
- `received` — Report received, pending review
- `under_review` — Being evaluated by legal team
- `content_removed` — Content has been removed
- `content_restored` — Content restored (counter-notice accepted)
- `rejected` — Report rejected as invalid
- `resolved` — Matter resolved

---

## Consent Endpoints

### GET /consent/ai
Get AI consent status for the current user.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "hasConsented": true,
    "consentDate": "2024-06-01T10:00:00Z",
    "consentVersion": "1.2.0",
    "digitalTwinAllowed": true,
    "aiTrainingAllowed": false,
    "revokedAt": null,
    "revocable": true
  }
}
```

---

### POST /consent/ai/revoke
Revoke AI consent.

#### Request
```json
{
  "reason": "Personal decision",
  "revokeDigitalTwin": true,
  "revokeTraining": true,
  "effectiveDate": "immediately"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "AI consent revoked. Digital twin will be deleted within 30 days.",
    "revokedAt": "2024-06-21T11:00:00Z",
    "digitalTwinDeletionScheduled": "2024-07-21T11:00:00Z"
  }
}
```

#### Revocation Effects
- AI generation access immediately revoked
- Existing digital twin queued for deletion (30-day grace period)
- AI training data opt-out applied going forward
- Previously generated content may remain per Terms of Service
- Subscription tier may be affected if AI features were primary driver

---

## Guardian Consent

### POST /consent/guardian
Submit guardian consent for a minor user.

#### Request
```json
{
  "guardian": {
    "fullName": "Mary Doe",
    "relationship": "mother",
    "email": "mary@example.com",
    "phone": "+1-555-0300",
    "address": "456 Oak Ave, Los Angeles, CA 90002"
  },
  "minor": {
    "fullName": "Jenny Doe",
    "dateOfBirth": "2010-03-15"
  },
  "consents": {
    "platformUse": true,
    "aiGeneration": true,
    "castingApplications": true,
    "photographyVideo": true,
    "publicProfile": false
  },
  "emergencyContact": {
    "name": "Robert Doe",
    "relationship": "father",
    "phone": "+1-555-0400"
  },
  "medicalInfo": {
    "allergies": ["peanuts"],
    "medications": [],
    "specialNeeds": "None"
  },
  "signature": "Mary Doe",
  "date": "2024-06-21"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "consentId": "uuid",
    "status": "active",
    "validUntil": "2026-06-21",
    "minorAccountStatus": "active_with_guardian"
  }
}
```
