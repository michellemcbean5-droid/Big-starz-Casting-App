# Database Schema

This document describes the complete database schema for the Big Starz Casting Platform.

---

## Entity-Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│      User       │       │  TalentProfile   │       │   CastingCall   │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)          │       │ id (PK)         │
│ email           │  │    │ userId (FK)      │◄──────┤ directorId (FK) │
│ passwordHash    │  │    │ stageName        │       │ title           │
│ firstName       │  │    │ bio              │       │ description     │
│ lastName        │  │    │ headshots[]      │       │ status          │
│ role            │  │    │ reelUrl          │       │ requirements    │
│ status          │  │    │ skills[]         │       │ budget          │
│ createdAt       │  │    │ location         │       │ location        │
│ updatedAt       │  │    │ ageRange         │       │ deadline        │
└─────────────────┘  │    │ unionStatus      │       │ createdAt       │
       │             │    │ createdAt        │       │ updatedAt       │
       │             │    │ updatedAt        │       └─────────────────┘
       │             │    └──────────────────┘              ▲
       │             │                                    │
       │             └────────────────────────────────────┤
       │                                                  │
       ▼                                                  │
┌─────────────────┐       ┌──────────────────┐           │
│  Subscription   │       │   Application    │───────────┘
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ id (PK)          │
│ userId (FK)     │       │ talentId (FK)    │◄── User
│ tier            │       │ castingCallId(FK)│◄── CastingCall
│ status          │       │ status           │
│ startDate       │       │ message          │
│ endDate         │       │ attachments[]    │
│ stripeSubId     │       │ submittedAt      │
│ createdAt       │       │ updatedAt        │
└─────────────────┘       └──────────────────┘

┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  DigitalTwin    │       │  AiGeneration    │       │    Contract     │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)          │       │ id (PK)         │
│ talentId (FK)   │◄──────┤ userId (FK)      │       │ talentId (FK)   │
│ modelUrl        │       │ type             │       │ type            │
│ consentSigned   │       │ input            │       │ content         │
│ generatedAt     │       │ outputUrl        │       │ signedAt        │
│ status          │       │ status           │       │ ipAddress       │
└─────────────────┘       │ cost             │       │ version         │
                          │ createdAt        │       │ createdAt       │
                          └──────────────────┘       └─────────────────┘

┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    Earning      │       │   MasterCode     │       │   AuditLog      │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)          │       │ id (PK)         │
│ userId (FK)     │       │ code             │       │ userId (FK)     │
│ amount          │       │ tier             │       │ action          │
│ source          │       │ maxUses          │       │ entityType      │
│ status          │       │ usedCount        │       │ entityId        │
│ createdAt       │       │ expiresAt        │       │ details         │
│ paidAt          │       │ revoked          │       │ ipAddress       │
└─────────────────┘       │ createdBy (FK)   │       │ createdAt       │
                          │ createdAt        │       └─────────────────┘
                          └──────────────────┘

┌─────────────────┐       ┌──────────────────┐
│  DmcaReport     │       │  GuardianConsent │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ id (PK)          │
│ reporterId (FK) │       │ minorId (FK)     │◄── User
│ contentUrl      │       │ guardianName     │
│ status          │       │ guardianEmail    │
│ originalWork    │       │ guardianPhone    │
│ createdAt       │       │ guardianAddress  │
│ resolvedAt      │       │ consents (JSON)  │
│ resolution      │       │ status           │
└─────────────────┘       │ validUntil       │
                          │ createdAt        │
                          └──────────────────┘
```

---

## Table Descriptions

### User
The core user table for all platform accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default gen_random_uuid() | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `passwordHash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `firstName` | VARCHAR(100) | NOT NULL | First name |
| `lastName` | VARCHAR(100) | NOT NULL | Last name |
| `role` | ENUM | NOT NULL, DEFAULT 'talent' | talent, casting_director, creator, admin |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, suspended, pending, deleted |
| `emailVerified` | BOOLEAN | NOT NULL, DEFAULT false | Email verification status |
| `dateOfBirth` | DATE | | For age verification |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Account creation timestamp |
| `updatedAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`email`)
- INDEX (`role`)
- INDEX (`status`)
- INDEX (`createdAt`)

---

### TalentProfile
Extended profile information for talent users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | UUID | FK -> User.id, UNIQUE, ON DELETE CASCADE | Link to user |
| `stageName` | VARCHAR(150) | | Professional name |
| `bio` | TEXT | | Biography |
| `headshots` | TEXT[] | DEFAULT '{}' | Array of image URLs |
| `reelUrl` | VARCHAR(500) | | Video reel URL |
| `skills` | TEXT[] | DEFAULT '{}' | Array of skills |
| `location` | VARCHAR(200) | | City, state |
| `ageRange` | VARCHAR(20) | | Display age range |
| `unionStatus` | VARCHAR(50) | | SAG-AFTRA, AEA, etc. |
| `gender` | VARCHAR(50) | | Gender identity |
| `ethnicity` | VARCHAR(100) | | Ethnicity |
| `height` | VARCHAR(20) | | Height |
| `availability` | ENUM | DEFAULT 'available' | available, unavailable, limited |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`userId`)
- GIN INDEX (`skills`) — for skill-based search
- INDEX (`location`)
- INDEX (`unionStatus`)
- INDEX (`availability`)

---

### CastingCall
Casting opportunity postings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `title` | VARCHAR(300) | NOT NULL | Casting call title |
| `description` | TEXT | NOT NULL | Detailed description |
| `directorId` | UUID | FK -> User.id, ON DELETE CASCADE | Posting director |
| `status` | ENUM | NOT NULL, DEFAULT 'draft' | draft, open, closed, archived |
| `requirements` | JSONB | | Structured requirements |
| `compensation` | JSONB | | Compensation details |
| `budget` | DECIMAL(12,2) | | Project budget |
| `location` | VARCHAR(200) | | Shoot location |
| `category` | VARCHAR(100) | | Film, TV, Theater, etc. |
| `deadline` | TIMESTAMPTZ | | Application deadline |
| `auditionType` | VARCHAR(50) | | in-person, virtual, self-tape |
| `projectDetails` | JSONB | | Project metadata |
| `viewCount` | INTEGER | NOT NULL, DEFAULT 0 | View counter |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`directorId`)
- INDEX (`status`)
- INDEX (`category`)
- INDEX (`location`)
- INDEX (`deadline`)
- GIN INDEX (`requirements`) — for JSON search
- INDEX (`createdAt` DESC)

---

### Application
Talent applications to casting calls.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `talentId` | UUID | FK -> User.id, ON DELETE CASCADE | Applicant |
| `castingCallId` | UUID | FK -> CastingCall.id, ON DELETE CASCADE | Target casting call |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | pending, under_review, shortlisted, rejected, callback, offered, accepted, declined |
| `message` | TEXT | | Application message |
| `attachments` | TEXT[] | DEFAULT '{}' | File URLs |
| `availability` | JSONB | | Availability details |
| `submittedAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Submission time |
| `updatedAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`talentId`, `castingCallId`)
- INDEX (`talentId`)
- INDEX (`castingCallId`)
- INDEX (`status`)
- INDEX (`submittedAt` DESC)

---

### DigitalTwin
AI-generated digital representations of talent.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `talentId` | UUID | FK -> User.id, ON DELETE CASCADE | Owner |
| `modelUrl` | VARCHAR(500) | | Model file URL |
| `consentSigned` | BOOLEAN | NOT NULL, DEFAULT false | Consent status |
| `consentVersion` | VARCHAR(20) | | Consent agreement version |
| `trainingData` | JSONB | | Training metadata |
| `status` | ENUM | NOT NULL, DEFAULT 'training' | training, active, failed, deleted |
| `generatedAt` | TIMESTAMPTZ | | Completion timestamp |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`talentId`)
- INDEX (`status`)

---

### AiGeneration
AI content generation history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | UUID | FK -> User.id, ON DELETE SET NULL | Requester |
| `type` | VARCHAR(50) | NOT NULL | scene, reel, music_video, headshot, digital_twin |
| `input` | JSONB | NOT NULL | Generation parameters |
| `outputUrl` | VARCHAR(500) | | Result file URL |
| `thumbnailUrl` | VARCHAR(500) | | Preview image URL |
| `status` | ENUM | NOT NULL, DEFAULT 'processing' | processing, completed, failed, cancelled |
| `cost` | INTEGER | NOT NULL, DEFAULT 1 | Credit cost |
| `errorMessage` | TEXT | | Failure reason |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Request time |
| `completedAt` | TIMESTAMPTZ | | Completion time |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`userId`)
- INDEX (`type`)
- INDEX (`status`)
- INDEX (`createdAt` DESC)

---

### Subscription
User subscription records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | UUID | FK -> User.id, ON DELETE CASCADE | Subscriber |
| `tier` | ENUM | NOT NULL | free, bronze, silver, gold |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, canceled, past_due, unpaid |
| `startDate` | TIMESTAMPTZ | NOT NULL | Subscription start |
| `endDate` | TIMESTAMPTZ | | Subscription end |
| `stripeSubscriptionId` | VARCHAR(100) | | Stripe subscription ID |
| `stripeCustomerId` | VARCHAR(100) | | Stripe customer ID |
| `cancelAtPeriodEnd` | BOOLEAN | NOT NULL, DEFAULT false | Cancellation flag |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`userId`)
- INDEX (`tier`)
- INDEX (`status`)

---

### Contract
Signed legal agreements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `talentId` | UUID | FK -> User.id, ON DELETE CASCADE | Signatory |
| `type` | VARCHAR(50) | NOT NULL | terms_of_service, privacy_policy, ai_consent, likeness_rights, talent_contract, etc. |
| `content` | TEXT | NOT NULL | Contract text |
| `version` | VARCHAR(20) | NOT NULL | Document version |
| `signedAt` | TIMESTAMPTZ | NOT NULL | Signature timestamp |
| `ipAddress` | INET | | Signing IP address |
| `userAgent` | TEXT | | Browser/client info |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`talentId`)
- INDEX (`type`)
- UNIQUE (`talentId`, `type`, `version`)

---

### MasterCode
Access code management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Access code string |
| `tier` | ENUM | NOT NULL, DEFAULT 'free' | free, bronze, silver, gold |
| `maxUses` | INTEGER | NOT NULL, DEFAULT 1 | Maximum redemptions |
| `usedCount` | INTEGER | NOT NULL, DEFAULT 0 | Current redemptions |
| `expiresAt` | TIMESTAMPTZ | | Expiration timestamp |
| `revoked` | BOOLEAN | NOT NULL, DEFAULT false | Revocation status |
| `createdBy` | UUID | FK -> User.id | Admin who created it |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`code`)
- INDEX (`tier`)
- INDEX (`revoked`)

---

### Earning
Creator earnings records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | UUID | FK -> User.id, ON DELETE CASCADE | Earner |
| `amount` | DECIMAL(12,2) | NOT NULL | Earnings amount |
| `currency` | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency code |
| `source` | VARCHAR(50) | NOT NULL | ai_content, referral, casting_bonus |
| `description` | VARCHAR(500) | | Earning description |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | pending, paid, cancelled |
| `payoutId` | VARCHAR(100) | | Associated payout ID |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Earning date |
| `paidAt` | TIMESTAMPTZ | | Payment date |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`userId`)
- INDEX (`status`)
- INDEX (`createdAt` DESC)

---

### DmcaReport
Copyright infringement reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `reporterId` | UUID | FK -> User.id, ON DELETE SET NULL | Reporter |
| `contentUrl` | VARCHAR(500) | NOT NULL | Infringing content URL |
| `originalWork` | JSONB | NOT NULL | Copyrighted work details |
| `infringingContent` | JSONB | NOT NULL | Infringement details |
| `status` | ENUM | NOT NULL, DEFAULT 'received' | received, under_review, content_removed, content_restored, rejected, resolved |
| `counterNotice` | JSONB | | Counter-notification data |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Report date |
| `resolvedAt` | TIMESTAMPTZ | | Resolution date |
| `resolution` | TEXT | | Resolution notes |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`status`)
- INDEX (`createdAt` DESC)

---

### GuardianConsent
Guardian consent records for minors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `minorId` | UUID | FK -> User.id, ON DELETE CASCADE | Minor user |
| `guardianName` | VARCHAR(200) | NOT NULL | Guardian full name |
| `guardianEmail` | VARCHAR(255) | NOT NULL | Guardian email |
| `guardianPhone` | VARCHAR(50) | | Guardian phone |
| `guardianAddress` | TEXT | | Guardian address |
| `relationship` | VARCHAR(50) | NOT NULL | Relationship to minor |
| `consents` | JSONB | NOT NULL | Consent flags |
| `emergencyContact` | JSONB | | Emergency contact info |
| `medicalInfo` | JSONB | | Medical information |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, revoked, expired |
| `validUntil` | TIMESTAMPTZ | | Consent expiration |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`minorId`)
- INDEX (`status`)

---

### AuditLog
System audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | UUID | FK -> User.id, ON DELETE SET NULL | Acting user |
| `action` | VARCHAR(100) | NOT NULL | Action performed |
| `entityType` | VARCHAR(50) | | Affected entity type |
| `entityId` | UUID | | Affected entity ID |
| `details` | JSONB | | Additional context |
| `ipAddress` | INET | | Request IP |
| `userAgent` | TEXT | | Client info |
| `createdAt` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Event timestamp |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`userId`)
- INDEX (`entityType`, `entityId`)
- INDEX (`action`)
- INDEX (`createdAt` DESC)

---

## Indexing Strategy

### Primary Indexes
Every table has a primary key index on `id`.

### Foreign Key Indexes
All foreign key columns are indexed for JOIN performance.

### Search Indexes
- **TalentProfile.skills:** GIN index for array containment queries
- **CastingCall.requirements:** GIN index on JSONB for flexible filtering
- **User.email:** UNIQUE index for fast lookups

### Time-Series Indexes
- **AiGeneration.createdAt:** DESC index for recent-first queries
- **Application.submittedAt:** DESC index for recent applications
- **AuditLog.createdAt:** DESC index for recent activity

### Composite Indexes
- **Contract (talentId, type, version):** UNIQUE for contract versioning
- **Application (talentId, castingCallId):** UNIQUE to prevent duplicate applications

### Full-Text Search
Consider adding PostgreSQL full-text search indexes on:
- `CastingCall.title` + `CastingCall.description`
- `TalentProfile.bio`

```sql
-- Example: Full-text search index
CREATE INDEX idx_casting_search ON "CastingCall" 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

---

## Migration Guide

### Initial Migration
```bash
# Run Prisma init migration
npx prisma migrate dev --name init
```

### Adding New Tables
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Review generated migration file
4. Apply with `npx prisma migrate deploy` (production)

### Schema Changes Best Practices
- **Never** drop columns with production data without backup
- **Add** new columns as nullable first, then backfill, then add NOT NULL
- **Rename** columns in two steps: add new, migrate data, drop old
- **Index** new columns before marking as required for large tables

### Data Migrations
For large data migrations, use separate scripts:
```typescript
// migrations/data/20240621_backfill_tier.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
  await prisma.$executeRaw`
    UPDATE "User" 
    SET tier = 'free' 
    WHERE tier IS NULL
  `;
}

migrate().catch(console.error);
```
