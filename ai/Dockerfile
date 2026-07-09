# ───────────────────────────────────────────────────────────
# Big Starz AI Worker — Production Dockerfile
# Background job processor with ffmpeg + imagemagick
# ───────────────────────────────────────────────────────────

FROM node:20-alpine

WORKDIR /app

# Install system dependencies for video/image processing
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    imagemagick-libs \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S aiw && \
    adduser -S aiw -u 1001

# Copy dependency manifests
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy all pipeline scripts and utilities
COPY pipelines ./pipelines
COPY utils ./utils
COPY worker.js ./worker.js

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R aiw:aiw /app

USER aiw

# No exposed port — internal worker
# Health check via process or Redis connectivity
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('redis').createClient({url:process.env.REDIS_URL||'redis://redis:6379'}).connect().then(c=>c.quit()).then(()=>process.exit(0)).catch(()=>process.exit(1))" || exit 1

# Entry point: worker loop that polls Redis for jobs
CMD ["node", "worker.js"]
