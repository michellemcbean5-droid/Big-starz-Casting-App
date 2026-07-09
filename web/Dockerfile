# ───────────────────────────────────────────────────────────
# Big Starz Web App — Production Dockerfile
# Multi-stage build for optimized Next.js production image
# ───────────────────────────────────────────────────────────

# ─── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js (output: standalone is configured in next.config)
RUN npm run build

# ─── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nextjs && \
    adduser -S nextjs -u 1001

# Copy standalone Next.js output
# Requires output: 'standalone' in next.config.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set ownership
RUN chown -R nextjs:nextjs /app

USER nextjs

# Expose web port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

# Start Next.js server
CMD ["node", "server.js"]
