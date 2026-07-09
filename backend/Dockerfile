# ───────────────────────────────────────────────────────────
# Big Starz Backend — Production Dockerfile
# Multi-stage build for optimized production image
# ───────────────────────────────────────────────────────────

# ─── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (if needed)
RUN apk add --no-cache python3 make g++ openssl

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# ─── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install runtime dependencies only (for Prisma binaries)
RUN apk add --no-cache openssl curl

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Ensure uploads directory exists
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose API port
EXPOSE 3001

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the API server
CMD ["node", "dist/server.js"]
