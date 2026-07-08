# Docker Deployment Guide

This guide covers containerized deployment of the Big Starz Casting Platform using Docker and Docker Compose.

---

## Prerequisites

- Docker Engine 24.0+
- Docker Compose v2.20+
- 4GB+ RAM available for containers
- 20GB+ free disk space

---

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd big-starz-casting-app

# Copy environment file
cp .env.example .env
# Edit .env with your actual values

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

---

## Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: bigstarz-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-bigstarz}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
      POSTGRES_DB: ${DB_NAME:-bigstarz}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-bigstarz}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: bigstarz-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bigstarz-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER:-bigstarz}:${DB_PASSWORD:-changeme}@postgres:5432/${DB_NAME:-bigstarz}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      REDIS_URL: redis://redis:6379
      HUGGINGFACE_API_TOKEN: ${HUGGINGFACE_API_TOKEN}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      S3_BUCKET: ${S3_BUCKET}
      S3_REGION: ${S3_REGION}
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      API_URL: ${API_URL}
      APP_URL: ${APP_URL}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Web App
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: bigstarz-web
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXT_PUBLIC_APP_URL: ${APP_URL}
    ports:
      - "3000:3000"
    depends_on:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: bigstarz-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./deployment/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - web

volumes:
  postgres_data:
  redis_data:
  uploads:
```

---

## Service-Specific Dockerfiles

### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Web Dockerfile
```dockerfile
# web/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_USER=bigstarz
DB_PASSWORD=your-secure-password
DB_NAME=bigstarz

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# AI
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxx

# Payments
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# Storage
S3_BUCKET=bigstarz-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY=AKIAxxxxxxxxxxxxxxxx
S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URLs
API_URL=https://api.bigstarz.com
APP_URL=https://app.bigstarz.com
```

---

## Useful Commands

```bash
# Build all services
docker compose build

# Start with rebuild
docker compose up -d --build

# View specific service logs
docker compose logs -f backend

# Execute commands in containers
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma studio

# Database backup
docker compose exec postgres pg_dump -U bigstarz bigstarz > backup.sql

# Database restore
docker compose exec -T postgres psql -U bigstarz bigstarz < backup.sql

# Clean up
docker compose down -v  # Removes volumes too
docker system prune      # Clean unused images
```

---

## Production Considerations

- Use Docker Swarm or Kubernetes for production orchestration
- Configure SSL/TLS certificates (Let's Encrypt recommended)
- Set up log aggregation (ELK stack or similar)
- Enable container resource limits
- Use secrets management (Docker Secrets or external vault)
- Configure health checks and auto-restart policies
- Set up monitoring and alerting
