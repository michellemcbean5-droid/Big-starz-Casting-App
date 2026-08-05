# ⭐ Big Starz Casting App

**AI-powered casting ecosystem for TV networks to discover, manage, and monetize talent at scale.**

> Production-ready MVP seeking $500K in seed funding to scale with Starz Network.

---

## 🎬 What It Is

Big Starz is a full-stack casting platform that transforms how TV networks discover and manage talent. It combines AI-powered scene generation, digital twin creation, auto-matching algorithms, and a complete legal compliance framework — all in one white-label ready platform.

**Built for Starz Network to transition their entire TV lineup onto a modern, AI-enhanced digital channel.**

---

## 🚀 Live Demo Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Web Dashboard │     │   AI Studio     │
│  (React Native) │     │   (Next.js 14)  │     │  (HuggingFace)  │
│  iOS & Android  │     │  Admin + Talent │     │  FREE Models    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Express API (Node)    │
                    │   JWT Auth, RBAC, Audit   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      PostgreSQL + Prisma  │
                    │   16 Models, Full Schema  │
                    └───────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Node.js 20, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16, Redis 7 |
| **Web App** | Next.js 14, Tailwind CSS, shadcn/ui |
| **Mobile** | Expo React Native, TypeScript |
| **AI / ML** | HuggingFace Inference API (100% free open-source models) |
| **Auth** | JWT + bcrypt, Role-based access control |
| **Payments** | Stripe (Subscriptions, webhooks, payouts) |
| **Deploy** | Docker, Kubernetes, GitHub Actions CI/CD |
| **Proxy** | Nginx (rate limiting, gzip, security headers) |

---

## ✨ Key Features

### 🤖 AI Studio
- **AI Scene Generator** — Create acting scenes with scripts & imagery using Mistral-7B + Stable Diffusion XL
- **AI Reel Generator** — Auto-compile casting reels with TTS narration & subtitles
- **AI Music Video** — Generate beat-synced videos from audio
- **AI Digital Twin** — Create consistent likeness variations (poses, expressions, outfits)
- **Auto-Enhancement** — Color correction, sharpening, noise reduction
- **AI Watermarking** — Visible + invisible EXIF metadata protection
- **Safety Filters** — NSFW, hate speech, violence, copyright detection

### 🎯 Talent Discovery
- **Auto-Matching Algorithm** — AI ranks talent against casting requirements (skills 40%, location 20%, union 15%, experience 15%, availability 10%)
- **Smart Search** — Unified search across casting calls & talent profiles
- **Recommendations** — Personalized casting call suggestions for each talent

### 💰 Monetization (4 Tiers)
| Tier | Price | AI Credits | Features |
|------|-------|-----------|----------|
| **Free** | $0 | 3/month | Master code required, basic profile |
| **Bronze** | $9.99/mo | 25/month | Priority listing, basic analytics |
| **Silver** | $29.99/mo | 100/month | Featured profile, digital twin, advanced analytics |
| **Gold** | $99.99/mo | Unlimited | Premium placement, direct director contact, revenue share |

### ⚖️ Legal Compliance (Built-In)
- **SAG-AFTRA** — Union status tracking & compliance
- **Likeness Rights** — Full digital rights management
- **AI Consent** — Explicit opt-in for digital twin & AI generation
- **COPPA** — Age verification & guardian consent for minors
- **DMCA** — Full takedown request system with counter-notification
- **GDPR/CCPA** — Data export & deletion endpoints
- **Digital Contracts** — Built-in e-signature with audit trail

### 🔐 Master Access Code System
- Invite-only onboarding for talent
- Time-limited & usage-limited codes
- Admin generation & auto-revocation

### 📊 Admin Dashboard
- User management & role assignment
- Master code generation
- Contract & consent oversight
- Full audit logs
- DMCA management
- Earnings & payout tracking

---

## 📁 Repository Structure

```
big-starz-casting-app/
├── backend/                 # Express API (71 files, 10,000+ lines)
│   ├── prisma/             # Database schema, migrations, seeds
│   ├── src/routes/         # 15 API route modules (100+ endpoints)
│   ├── src/controllers/    # Business logic controllers
│   ├── src/services/       # Database services & algorithms
│   ├── src/middleware/     # Auth, RBAC, rate limit, audit log
│   └── tests/              # Unit tests (auth, casting, AI, legal)
├── web/                    # Next.js 14 Dashboard (69 files)
│   ├── src/app/            # Pages: auth, dashboard, casting, studio, admin
│   ├── src/components/     # shadcn/ui + custom components
│   ├── src/context/        # Auth context with JWT auto-refresh
│   └── src/lib/            # API client, utilities
├── mobile/                 # Expo React Native (73 files)
│   ├── src/app/            # Screens: auth, tabs, casting, studio, profile
│   ├── src/components/     # UI kit, casting cards, AI tools
│   ├── src/services/       # API, auth, casting, AI
│   └── src/hooks/          # Custom React hooks
├── ai/                     # AI Pipeline Scripts (20 files)
│   ├── pipelines/          # 8 AI generation scripts
│   ├── utils/              # HuggingFace client, video/image utils
│   └── worker.js           # Redis job queue processor
├── database/               # Prisma schema & migrations
├── docs/                   # API docs + 11 legal documents
│   ├── api/                # Endpoint documentation
│   ├── legal/              # ToS, Privacy, Contracts, DMCA, etc.
│   └── deployment/         # Docker, K8s, database guides
├── deployment/             # Production deployment configs
│   ├── docker/             # Dockerfiles, nginx, compose
│   ├── k8s/                # 15 Kubernetes manifests
│   └── scripts/            # deploy.sh, setup-local.sh, backup.sh
├── tests/                  # E2E & integration tests
├── docker-compose.yml      # One-command local stack
├── Makefile                # 17 build/deploy targets
├── .env.example            # Environment template
└── README.md               # You are here
```

---

## 🏁 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### One-Command Setup
```bash
# Clone the repo
git clone https://github.com/michellemcbean5-droid/big-starz-casting-app.git
cd big-starz-casting-app

# Copy environment template
cp .env.example .env
# Edit .env with your values

# Start everything (PostgreSQL, Redis, Backend, Web, AI Worker, Nginx)
make setup
# OR manually:
docker-compose up -d

# Seed the database
cd backend && npx prisma migrate dev && npx prisma db seed

# The stack is now running:
# Web App:    http://localhost:3000
# API:        http://localhost:3001
# API Docs:   http://localhost:3001/api/v1
```

### Development (without Docker)
```bash
# Terminal 1 — Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 2 — Web
cd web
npm install
npm run dev

# Terminal 3 — Mobile
cd mobile
npm install
npx expo start

# Terminal 4 — AI Worker
cd ai
npm install
npm run worker
```

---

## 📡 API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/register` | Register with master code |
| `POST /api/v1/auth/login` | Login, receive JWT |
| `GET /api/v1/casting-calls` | List open casting calls |
| `POST /api/v1/applications` | Apply to a casting call |
| `POST /api/v1/ai/generate/scene` | Generate AI acting scene |
| `POST /api/v1/ai/generate/digital-twin` | Create digital twin |
| `GET /api/v1/talent` | Search talent profiles |
| `POST /api/v1/match` | Auto-match talent to roles |
| `GET /api/v1/subscriptions/plans` | List monetization tiers |
| `POST /api/v1/master-codes` | Generate invite code (admin) |
| `POST /api/v1/dmca` | Submit takedown request |
| `GET /api/v1/audit` | View audit logs (admin) |

**Full API docs:** See `docs/api/` directory

---

## 🎨 Design System

- **Primary:** `#D4AF37` (Gold)
- **Secondary:** `#1A1A2E` (Dark Navy)
- **Accent:** `#C0A062` (Light Gold)
- **Background:** `#0F0F1A` (Near Black)
- **Surface:** `#1E1E2F` (Dark Surface)

Dark mode by default. Responsive across all devices.

---

## 🐳 Deployment

### Docker Compose (Local / Staging)
```bash
make dev        # Start all services
docker-compose up -d
```

### Kubernetes (Production)
```bash
make deploy     # Deploy to K8s cluster
make backup     # Database + file backup
```

See `docs/deployment/` for detailed guides.

---

## 📜 Legal Documents (Included)

All legal documents are in `docs/legal/`:

| Document | Purpose |
|----------|---------|
| `TERMS_OF_SERVICE.md` | Platform terms |
| `PRIVACY_POLICY.md` | GDPR, CCPA, COPPA compliant |
| `AI_CONSENT_AGREEMENT.md` | Explicit AI processing consent |
| `LIKENESS_RIGHTS_AGREEMENT.md` | Digital likeness rights |
| `TALENT_CONTRACT.md` | Standard talent engagement |
| `CASTING_DIRECTOR_AGREEMENT.md` | Director platform terms |
| `GUARDIAN_CONSENT_FORM.md` | Minor protection (COPPA) |
| `DMCA_POLICY.md` | Copyright takedown process |
| `COMMUNITY_GUIDELINES.md` | Content standards |
| `REFUND_POLICY.md` | Subscription refunds |
| `ADVERTISER_AGREEMENT.md` | Ad placement terms |

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend && npm test

# Web build check
cd web && npm run build

# Mobile compilation
cd mobile && npx tsc --noEmit
```

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| ✅ v1.0 | Core platform (auth, casting, AI, legal) | **DONE** |
| 🔜 v1.1 | Real-time chat (talent ↔ director) | Planned |
| 🔜 v1.2 | Live streaming auditions | Planned |
| 🔜 v1.3 | Analytics dashboard v2 | Planned |
| 🔜 v1.4 | White-label customization | Planned |
| 🔜 v1.5 | Multi-language support | Planned |

---

## 👥 Team

Built with 9 parallel AI agents orchestrated by a master architect agent.

---

## 📄 License

This project is private and confidential. All rights reserved.

---

## 🤝 Contact

For partnership inquiries:
- **GitHub:** [@michellemcbean5-droid](https://github.com/michellemcbean5-droid)
- **Project:** [Big Starz Casting App](https://github.com/michellemcbean5-droid/big-starz-casting-app)

---

> *"This is the future of casting. AI-powered. Legally compliant. Monetized. Ready for Starz."*
