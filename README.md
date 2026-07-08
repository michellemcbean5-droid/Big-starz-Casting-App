# Big Starz Casting Ecosystem

> The next-generation casting and creator platform powered by AI.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

## Overview

**Big Starz** is a comprehensive casting and creator ecosystem that bridges talent, casting directors, and creators through an AI-powered platform. It provides tools for casting calls, AI-generated content (scenes, reels, music videos, digital twins), subscription-based monetization, and full legal compliance.

## Features

### Core Platform
- **User Management** — Role-based accounts: Talent, Casting Director, Creator, Admin
- **Authentication** — JWT-based auth with refresh tokens, secure session management
- **Master Access Codes** — Admin-generated, time-limited codes required for registration
- **Subscription Tiers** — Free (code-required), Bronze, Silver, Gold with feature gating

### Casting Marketplace
- **Casting Call CRUD** — Directors post calls with requirements, budget, deadline
- **Talent Profiles** — Rich profiles with headshots, reels, skills, union status, location
- **Application System** — Talent applies to calls with custom messages
- **Search & Filter** — Advanced filtering by location, age range, skills, union status
- **Auto-Matching** — AI-powered talent-to-casting matching

### AI Studio (Creator Economy)
- **AI Scene Generator** — Generate custom scenes for auditions
- **AI Reel Generator** — Auto-compile highlight reels
- **AI Music Video Generator** — Create music video content
- **Digital Twin** — AI-generated digital likeness for virtual auditions
- **AI Watermarking** — All AI content watermarked automatically
- **AI Safety Filters** — Content moderation and safety checks

### Monetization
- **Stripe Subscriptions** — Bronze ($9.99/mo), Silver ($29.99/mo), Gold ($99.99/mo)
- **Earnings Tracking** — Revenue share for Gold-tier creators
- **Payout System** — Automated earnings distribution
- **Master Code Management** — Usage-limited access codes

### Legal & Compliance
- **Digital Contract Signing** — E-signatures for all agreements
- **DMCA Takedown System** — Automated copyright infringement handling
- **GDPR/CCPA Compliance** — Data export, deletion, and privacy controls
- **COPPA Protection** — Age verification and guardian consent for minors
- **AI Consent Agreements** — Explicit opt-in for AI processing and digital twins
- **SAG-AFTRA Tracking** — Union status management
- **Audit Logging** — Complete activity trail

### Admin Dashboard
- **User Management** — View, edit, suspend users
- **Master Code Generator** — Create and revoke access codes
- **Contract Management** — View and manage all signed contracts
- **DMCA Management** — Review and process takedown requests
- **Audit Logs** — Searchable activity logs

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile App | React Native (Expo) + TypeScript | Cross-platform mobile experience |
| Web App | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui | Responsive web application |
| Backend API | Node.js + Express + TypeScript | RESTful API server |
| Database | PostgreSQL + Prisma ORM | Relational data storage |
| AI | HuggingFace Inference API + Transformers.js | AI generation pipeline |
| Auth | JWT + bcrypt | Authentication & authorization |
| Storage | Local filesystem (dev) / S3-compatible (prod) | File uploads & AI outputs |
| Realtime | Socket.io | Real-time notifications & chat |
| Payments | Stripe | Subscription processing |
| Containerization | Docker + Docker Compose | Local development & deployment |
| Orchestration | Kubernetes | Production scaling |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Mobile App  │  │   Web App    │  │    Admin Dashboard   │   │
│  │  (Expo/RN)   │  │  (Next.js)   │  │     (Next.js)        │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          └─────────────────┼─────────────────────┘
                            │  HTTPS / REST / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer                 │
│                     (Nginx / Kubernetes Ingress)                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Backend API   │ │   AI Pipeline   │ │  Webhook Handlers│
│   (Express)     │ │   (Node.js)     │ │   (Stripe, etc) │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │  S3-Compatible  │ │   Redis (Cache) │
│   (Prisma ORM)  │ │    Storage      │ │   (Sessions)    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              HuggingFace Inference API (Free Tier)           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐  │
│  │   Text     │ │   Image    │ │   Video    │ │   Speech  │  │
│  │ Generation │ │ Generation │ │ Generation │ │  (STT/TTS)│  │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- Git

### 1. Clone & Configure
```bash
git clone <repo-url>
cd big-starz-casting-app
cp .env.example .env
# Edit .env with your actual values
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```
The API server will start at `http://localhost:3001`.

### 3. Web App Setup
```bash
cd web
npm install
npm run dev
```
The web app will start at `http://localhost:3000`.

### 4. Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with Expo Go (iOS/Android) or press `w` for web preview.

### 5. AI Pipeline Setup
```bash
cd ai
npm install
copy .env.example .env
# Add your HuggingFace API token to .env
```

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/bigstarz` |
| `JWT_SECRET` | Yes | JWT signing secret | `super-secret-key` |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token secret | `super-refresh-key` |
| `HUGGINGFACE_API_TOKEN` | Yes | HuggingFace API token | `hf_xxxxxxxx` |
| `HF_MODEL_TEXT` | No | Text generation model | `mistralai/Mistral-7B-Instruct-v0.2` |
| `HF_MODEL_IMAGE` | No | Image generation model | `stabilityai/stable-diffusion-xl-base-1.0` |
| `HF_MODEL_VIDEO` | No | Video generation model | `stabilityai/stable-video-diffusion-img2vid-xt` |
| `HF_MODEL_STT` | No | Speech-to-text model | `openai/whisper-large-v3` |
| `HF_MODEL_TTS` | No | Text-to-speech model | `microsoft/speecht5_tts` |
| `STRIPE_SECRET_KEY` | Yes (payments) | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes (payments) | Stripe webhook secret | `whsec_...` |
| `STRIPE_PRICE_BRONZE` | Yes (payments) | Bronze plan price ID | `price_...` |
| `STRIPE_PRICE_SILVER` | Yes (payments) | Silver plan price ID | `price_...` |
| `STRIPE_PRICE_GOLD` | Yes (payments) | Gold plan price ID | `price_...` |
| `S3_BUCKET` | Yes (prod) | S3 bucket name | `bigstarz-uploads` |
| `S3_REGION` | Yes (prod) | S3 region | `us-east-1` |
| `S3_ACCESS_KEY` | Yes (prod) | S3 access key | `AKIA...` |
| `S3_SECRET_KEY` | Yes (prod) | S3 secret key | `...` |
| `APP_URL` | Yes | Frontend app URL | `http://localhost:3000` |
| `API_URL` | Yes | Backend API URL | `http://localhost:3001` |
| `REDIS_URL` | No | Redis connection URL | `redis://localhost:6379` |
| `PORT` | No | API server port | `3001` |
| `NODE_ENV` | No | Environment mode | `development` |

## API Documentation

Full API documentation is available in the [`docs/api/`](docs/api/) directory:

- [Authentication](docs/api/AUTH.md) — Register, login, refresh, logout
- [Users](docs/api/USERS.md) — User CRUD, search, profiles
- [Casting](docs/api/CASTING.md) — Casting calls, applications, search
- [AI](docs/api/AI.md) — Generation endpoints, history, credits
- [Payments](docs/api/PAYMENTS.md) — Subscriptions, webhooks, earnings
- [Legal](docs/api/LEGAL.md) — Contracts, DMCA, consent
- [Database Schema](docs/api/DATABASE_SCHEMA.md) — ER diagram, tables, indexes

## Deployment

See the deployment guides for detailed instructions:

- [Docker Setup](docs/deployment/DOCKER.md)
- [Kubernetes Setup](docs/deployment/KUBERNETES.md)
- [Database Operations](docs/deployment/DATABASE.md)

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting pull requests.

Quick start:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Legal Documents

All legal documents are available in the [`docs/legal/`](docs/legal/) directory:

- [Terms of Service](docs/legal/TERMS_OF_SERVICE.md)
- [Privacy Policy](docs/legal/PRIVACY_POLICY.md)
- [Refund Policy](docs/legal/REFUND_POLICY.md)
- [Likeness Rights Agreement](docs/legal/LIKENESS_RIGHTS_AGREEMENT.md)
- [AI Consent Agreement](docs/legal/AI_CONSENT_AGREEMENT.md)
- [Talent Contract](docs/legal/TALENT_CONTRACT.md)
- [Casting Director Agreement](docs/legal/CASTING_DIRECTOR_AGREEMENT.md)
- [Advertiser Agreement](docs/legal/ADVERTISER_AGREEMENT.md)
- [Guardian Consent Form](docs/legal/GUARDIAN_CONSENT_FORM.md)
- [DMCA Policy](docs/legal/DMCA_POLICY.md)
- [Community Guidelines](docs/legal/COMMUNITY_GUIDELINES.md)

---

**Big Starz Casting** &copy; 2024. All rights reserved.
