# Big Starz Casting App — Agent Coordination Spec

## Global Objective
Build the entire Big Starz Casting Ecosystem from the ground up inside the existing repo.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo) + TypeScript |
| Web App | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend API | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| AI | HuggingFace Inference API (free tier) + Transformers.js |
| Auth | JWT + bcrypt |
| Storage | Local file system (dev) / S3-compatible (prod) |
| Realtime | Socket.io |

## Repo Structure
```
big-starz-casting-app/
  mobile/          # React Native (Expo)
  web/             # Next.js 14
  backend/         # Express API
  database/        # Prisma schema + migrations
  ai/              # AI pipeline scripts
  docs/            # Documentation + legal docs
  tests/           # Test suites
  deployment/      # Docker + K8s configs
```

## Critical Shared Contracts

### 1. API Base URL
- Development: `http://localhost:3001/api/v1`
- All routes prefixed with `/api/v1`

### 2. Authentication
- JWT tokens in `Authorization: Bearer <token>` header
- Access token expires in 15 min, refresh token in 7 days
- Role-based: `talent`, `casting_director`, `creator`, `admin`

### 3. Database Schema (Prisma)
Key entities:
- `User` (id, email, passwordHash, role, profile, createdAt)
- `TalentProfile` (userId, stageName, bio, headshots, reelUrl, skills, location, ageRange, unionStatus)
- `CastingCall` (id, title, description, directorId, status, requirements, budget, location, deadline)
- `Application` (id, talentId, castingCallId, status, message, submittedAt)
- `DigitalTwin` (id, talentId, modelUrl, consentSigned, generatedAt)
- `Subscription` (userId, tier, startDate, endDate, status)
- `MasterCode` (code, tier, maxUses, usedCount, expiresAt, revoked)
- `Contract` (id, talentId, type, content, signedAt, ipAddress)
- `Earning` (id, userId, amount, source, status, createdAt)
- `AiGeneration` (id, userId, type, input, outputUrl, status, cost)

### 4. AI Pipeline Strategy (Free Open Source)
All AI uses HuggingFace Inference API free tier:
- Text Generation: `mistralai/Mistral-7B-Instruct-v0.2`
- Image Generation: `stabilityai/stable-diffusion-xl-base-1.0`
- Image-to-Video: `stabilityai/stable-video-diffusion-img2vid-xt`
- Speech-to-Text: `openai/whisper-large-v3`
- Text-to-Speech: `microsoft/speecht5_tts`
- Face Analysis: `facebook/dinov2-large`
- Text Embedding: `sentence-transformers/all-MiniLM-L6-v2`

### 5. Monetization Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Requires master code, 3 AI gens/month, basic profile |
| Bronze | $9.99/mo | 25 AI gens/month, priority listing, basic analytics |
| Silver | $29.99/mo | 100 AI gens/month, featured profile, advanced analytics, digital twin |
| Gold | $99.99/mo | Unlimited AI, premium placement, direct casting director contact, revenue share |

### 6. Master Access Code System
- Admin generates time-limited, usage-limited codes
- Code unlocks Free tier (requires code to even register)
- Codes tracked in `MasterCode` table
- Auto-revocation after max uses or expiry

### 7. Legal Compliance
- All talent must sign digital contracts before AI generation
- COPPA: age verification for under-18
- SAG-AFTRA: union status tracking
- DMCA: takedown request endpoint + process
- GDPR/CCPA: data export/deletion endpoints
- AI Consent: explicit opt-in for digital twin + AI generation
- Watermarking: all AI-generated content watermarked

### 8. File Naming Conventions
- Components: PascalCase (`TalentProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- API routes: kebab-case (`casting-calls.ts`)
- Database: snake_case in schema, camelCase in code

### 9. Environment Variables (shared across all layers)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
HUGGINGFACE_API_TOKEN=...
HF_MODEL_TEXT=mistralai/Mistral-7B-Instruct-v0.2
HF_MODEL_IMAGE=stabilityai/stable-diffusion-xl-base-1.0
HF_MODEL_VIDEO=stabilityai/stable-video-diffusion-img2vid-xt
HF_MODEL_STT=openai/whisper-large-v3
HF_MODEL_TTS=microsoft/speecht5_tts
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

## Task Slices & Worker Assignments

### Worker 1: Backend Core — Auth, Users, Database
**Scope:**
- Prisma schema (full database)
- Express server setup
- Authentication (register, login, JWT, refresh)
- User CRUD + role management
- Middleware (auth, error handling, rate limiting)
- Database seed script

**Allowed paths:** `backend/`, `database/`

### Worker 2: Backend — Casting & Talent Marketplace
**Scope:**
- Casting call CRUD
- Talent profile CRUD
- Application system
- Search & filtering
- Auto-matching algorithm
- Casting director tools

**Allowed paths:** `backend/src/routes/casting*`, `backend/src/controllers/casting*`, `backend/src/services/casting*`
**Depends on:** Worker 1 (User model, auth middleware)

### Worker 3: Backend — AI Pipeline Endpoints
**Scope:**
- HuggingFace integration service
- AI generation endpoints (scene, music video, reel, digital twin)
- AI auto-editing
- AI watermarking
- AI safety filters
- Generation history tracking

**Allowed paths:** `backend/src/ai/`, `backend/src/routes/ai*`
**Depends on:** Worker 1 (User model, auth)

### Worker 4: Backend — Monetization & Legal
**Scope:**
- Subscription management (Stripe integration)
- Master access code system
- Earnings tracking
- Payout system
- Legal document generation
- Contract signing (digital signatures)
- DMCA takedown system
- Audit logging

**Allowed paths:** `backend/src/routes/payments*`, `backend/src/routes/legal*`, `backend/src/services/monetization*`
**Depends on:** Worker 1 (User model)

### Worker 5: Web App — Scaffold + Auth + Dashboard
**Scope:**
- Next.js 14 setup with shadcn/ui
- Authentication pages (login, register, forgot password)
- Layout with navigation
- Dashboard home page
- Profile management
- Settings

**Allowed paths:** `web/`

### Worker 6: Web App — Casting Marketplace + Talent Pages
**Scope:**
- Casting call listing page
- Casting call detail page
- Talent profile pages
- Search & filter
- Application flow
- Casting director dashboard

**Allowed paths:** `web/src/app/casting*/`, `web/src/app/talent*/`, `web/src/components/casting*/`

### Worker 7: Web App — Creator Economy + AI Studio
**Scope:**
- Creator dashboard with earnings
- AI Studio (scene generator, reel generator, music video)
- Digital twin management
- Content library
- Analytics

**Allowed paths:** `web/src/app/studio*/`, `web/src/app/creator*/`, `web/src/components/ai*/`

### Worker 8: Web App — Admin + Legal Dashboard
**Scope:**
- Admin dashboard
- User management
- Master code generation
- Legal document viewer
- Contract management
- Audit logs viewer
- DMCA management

**Allowed paths:** `web/src/app/admin*/`

### Worker 9: Mobile App — Scaffold + Auth + Core Screens
**Scope:**
- Expo React Native setup
- Auth screens (login, register)
- Bottom tab navigation
- Home feed
- Profile screen
- Settings

**Allowed paths:** `mobile/`

### Worker 10: Mobile App — Casting + AI Features
**Scope:**
- Casting call list & detail
- Apply to casting
- AI Scene Generator screen
- AI Reel Generator screen
- Digital twin viewer
- Notifications

**Allowed paths:** `mobile/src/screens/casting*/`, `mobile/src/screens/ai*/`

### Worker 11: AI Pipeline Scripts
**Scope:**
- Standalone AI pipeline scripts
- Scene generation script
- Reel compilation script
- Music video generation
- Digital twin training
- Watermarking script
- Safety filter script

**Allowed paths:** `ai/`

### Worker 12: Documentation & Legal Docs
**Scope:**
- API documentation
- Legal documents (ToS, Privacy, Contracts, DMCA, etc.)
- Deployment docs
- README with setup instructions
- Environment templates

**Allowed paths:** `docs/`, `README.md`, `.env.example`

## Merge Order
1. Worker 1 (Backend Core + Database) — MUST merge first
2. Workers 2, 3, 4 (Backend features) — can parallel after Worker 1
3. Worker 5 (Web scaffold) — can parallel with Worker 1
4. Workers 6, 7, 8 (Web pages) — after Worker 5
5. Worker 9 (Mobile scaffold) — can parallel with Worker 5
6. Worker 10 (Mobile features) — after Worker 9
7. Worker 11 (AI scripts) — can parallel anytime
8. Worker 12 (Docs) — can parallel anytime

## Validation Requirements
- Backend: `npm run build` succeeds, `npm run dev` starts
- Web: `npm run build` succeeds
- Mobile: `npx expo start` works
- All layers must have `.env.example` files

## Forbidden Actions
- Do NOT change the repo structure defined above
- Do NOT modify another worker's files without approval
- Do NOT use paid-only APIs (must use free HuggingFace tier)
- Do NOT commit secrets or real API keys
- Do NOT restart the repo
