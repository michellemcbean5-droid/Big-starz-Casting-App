# Changelog

All notable changes to the Big Starz Casting Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2024-06-21

### Added
- **Core Platform** — Initial release of the Big Starz Casting Ecosystem
- **User Management** — Role-based authentication with support for Talent, Casting Director, Creator, and Admin roles
- **Authentication** — JWT-based auth with access tokens (15 min expiry) and refresh tokens (7 days expiry)
- **Master Access Code System** — Admin-generated, time-limited and usage-limited registration codes
- **Talent Profiles** — Rich profiles with headshots, reels, skills, union status, location, and age range
- **Casting Marketplace** — Full CRUD for casting calls with search, filter, and application system
- **AI Studio** — HuggingFace-powered AI generation for scenes, reels, music videos, headshots, and digital twins
- **Digital Twin Creation** — AI-generated digital likeness from photos and videos
- **AI Watermarking** — Automatic watermarking on all AI-generated content
- **AI Safety Filters** — Content moderation and automated safety checks
- **Subscription Tiers** — Free, Bronze ($9.99/mo), Silver ($29.99/mo), and Gold ($99.99/mo) with feature gating
- **Stripe Integration** — Subscription management, payment processing, and webhook handling
- **Earnings Tracking** — Revenue share for Gold-tier creators with analytics dashboard
- **Payout System** — Automated earnings distribution via Stripe Connect
- **Digital Contract Signing** — E-signature support for all legal agreements
- **DMCA Takedown System** — Automated copyright infringement handling with counter-notification support
- **GDPR/CCPA Compliance** — Data export, deletion, and privacy controls
- **COPPA Protection** — Age verification and guardian consent system for minors
- **SAG-AFTRA Tracking** — Union status management in talent profiles
- **Admin Dashboard** — User management, master code generation, contract management, audit logs
- **Web Application** — Next.js 14 frontend with Tailwind CSS and shadcn/ui components
- **Mobile Application** — Expo React Native app for iOS and Android
- **Real-time Notifications** — Socket.io-based notification system
- **Search & Auto-Matching** — AI-powered talent-to-casting matching algorithm
- **Complete API** — RESTful API with comprehensive documentation
- **Legal Documents** — Full Terms of Service, Privacy Policy, AI Consent, Likeness Rights, and more
- **Deployment Docs** — Docker, Kubernetes, and database operations guides

### Security
- Bcrypt password hashing
- Rate limiting on all API endpoints
- Input validation and sanitization
- CSRF protection
- Secure cookie handling
- Role-based access control (RBAC)
- Audit logging for all sensitive operations

### Documentation
- Comprehensive README with setup instructions
- Full API documentation (Auth, Users, Casting, AI, Payments, Legal)
- Database schema documentation with ER diagram
- Contributing guidelines
- Environment configuration templates

---

## Release Notes Template

For future releases, use this format:

```
## [X.Y.Z] — YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

---

[1.0.0]: https://github.com/bigstarz/casting-app/releases/tag/v1.0.0
