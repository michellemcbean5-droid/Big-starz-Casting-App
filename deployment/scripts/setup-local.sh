#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────
# setup-local.sh — Local Development Environment Setup
# Checks prerequisites, creates .env files, starts services
# ───────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()  { echo -e "${BLUE}[STEP]${NC}  $*"; }

cd "$REPO_ROOT"

# ═══════════════════════════════════════════════════════════
# 1. Check Prerequisites
# ═══════════════════════════════════════════════════════════
log_step "Checking prerequisites..."

MISSING=()

# Node.js
check_node() {
    if command -v node >/dev/null 2>&1; then
        NODE_VER=$(node --version 2>/dev/null | sed 's/v//')
        MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
        if [[ "$MAJOR" -ge 18 ]]; then
            log_info "Node.js $NODE_VER ✓"
        else
            log_warn "Node.js $NODE_VER (≥18 recommended)"
        fi
    else
        MISSING+=("Node.js (≥18) — https://nodejs.org")
    fi
}

# Docker
check_docker() {
    if command -v docker >/dev/null 2>&1; then
        DOCKER_VER=$(docker --version | awk '{print $3}' | tr -d ',')
        log_info "Docker $DOCKER_VER ✓"
    else
        MISSING+=("Docker — https://docs.docker.com/get-docker")
    fi

    if command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1; then
        log_info "Docker Compose ✓"
    else
        MISSING+=("Docker Compose — included with Docker Desktop")
    fi
}

# Git
check_git() {
    if command -v git >/dev/null 2>&1; then
        log_info "Git $(git --version | awk '{print $3}') ✓"
    else
        MISSING+=("Git — https://git-scm.com")
    fi
}

# npm
check_npm() {
    if command -v npm >/dev/null 2>&1; then
        log_info "npm $(npm --version) ✓"
    else
        MISSING+=("npm — included with Node.js")
    fi
}

check_node
check_docker
check_git
check_npm

if [[ ${#MISSING[@]} -gt 0 ]]; then
    log_error "Missing prerequisites:"
    for item in "${MISSING[@]}"; do
        echo "  - $item"
    done
    exit 1
fi

# ═══════════════════════════════════════════════════════════
# 2. Create .env Files from Templates
# ═══════════════════════════════════════════════════════════
log_step "Setting up environment files..."

# Root .env for docker-compose
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        log_info "Created .env from .env.example"
    else
        cat > .env <<'EOF'
# Database
DB_USER=bigstarz
DB_PASSWORD=devpassword123
DB_NAME=bigstarz

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=dev-jwt-secret-change-me-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-me-in-production

# Redis (auto-configured by docker-compose)
# REDIS_URL=redis://redis:6379

# HuggingFace (free tier — get token at https://huggingface.co/settings/tokens)
HUGGINGFACE_API_TOKEN=hf_your_token_here

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_secret

# S3 (local dev — configure for production)
S3_BUCKET=bigstarz-dev-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY=minio-dev
S3_SECRET_KEY=minio-dev-secret

# URLs
API_URL=http://localhost:3001
APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node
NODE_ENV=development
EOF
        log_info "Created .env with default dev values"
    fi
else
    log_warn ".env already exists — skipping"
fi

# Backend .env
if [[ ! -f "backend/.env" ]]; then
    if [[ -f "backend/.env.example" ]]; then
        cp backend/.env.example backend/.env
        log_info "Created backend/.env from backend/.env.example"
    fi
else
    log_warn "backend/.env already exists — skipping"
fi

# AI .env
if [[ ! -f "ai/.env" ]]; then
    if [[ -f "ai/.env.example" ]]; then
        cp ai/.env.example ai/.env
        log_info "Created ai/.env from ai/.env.example"
    fi
else
    log_warn "ai/.env already exists — skipping"
fi

# ═══════════════════════════════════════════════════════════
# 3. Start Docker Compose
# ═══════════════════════════════════════════════════════════
log_step "Starting Docker Compose services..."

if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD up -d --build

log_info "Waiting for services to initialize..."
sleep 10

# ═══════════════════════════════════════════════════════════
# 4. Seed Database
# ═══════════════════════════════════════════════════════════
log_step "Seeding database..."

if docker compose ps | grep -q "backend"; then
    $COMPOSE_CMD exec -T backend npx prisma migrate deploy || log_warn "Migration may have already been applied"
    $COMPOSE_CMD exec -T backend npx prisma seed || log_warn "Seed script may not exist yet"
else
    log_warn "Backend container not running — skipping seed"
fi

# ═══════════════════════════════════════════════════════════
# 5. Print Summary
# ═══════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Big Starz Casting App — Local Environment Ready${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Web App:        http://localhost:3000"
echo "  API Server:     http://localhost:3001"
echo "  API Docs:       http://localhost:3001/api/v1"
echo "  Health Check:   http://localhost:3001/health"
echo "  Nginx Proxy:    http://localhost (routes /api and /)"
echo ""
echo "  PostgreSQL:     localhost:5432"
echo "    User:         $(grep '^DB_USER=' .env | cut -d= -f2)"
echo "    Password:     $(grep '^DB_PASSWORD=' .env | cut -d= -f2)"
echo "    Database:     $(grep '^DB_NAME=' .env | cut -d= -f2)"
echo ""
echo "  Redis:          localhost:6379"
echo ""
echo "  Useful Commands:"
echo "    $COMPOSE_CMD logs -f        # View all logs"
echo "    $COMPOSE_CMD logs -f backend # View backend logs"
echo "    $COMPOSE_CMD down            # Stop all services"
echo "    $COMPOSE_CMD down -v         # Stop and remove volumes"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
