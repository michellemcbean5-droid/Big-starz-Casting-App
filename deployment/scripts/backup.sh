#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────
# backup.sh — Database & Files Backup Script
# Backs up PostgreSQL, uploads, compresses, and uploads to S3
# ───────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/tmp/bigstarz-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-bigstarz-backups}"
S3_PREFIX="${S3_PREFIX:-backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="bigstarz_backup_${DATE}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --db-only            Backup only PostgreSQL database
  --files-only         Backup only uploaded files
  --no-s3              Skip S3 upload (keep local only)
  --s3-bucket BUCKET   S3 bucket name
  --retention DAYS     Local retention days [default: 30]
  -h, --help           Show this help

Environment Variables:
  DATABASE_URL         PostgreSQL connection string
  S3_BUCKET            S3 bucket for uploads
  AWS_ACCESS_KEY_ID    AWS credentials
  AWS_SECRET_ACCESS_KEY
  AWS_DEFAULT_REGION
EOF
}

DB_ONLY=false
FILES_ONLY=false
NO_S3=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --db-only) DB_ONLY=true; shift ;;
        --files-only) FILES_ONLY=true; shift ;;
        --no-s3) NO_S3=true; shift ;;
        --s3-bucket) S3_BUCKET="$2"; shift 2 ;;
        --retention) RETENTION_DAYS="$2"; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) log_error "Unknown option: $1"; usage; exit 1 ;;
    esac
done

mkdir -p "$BACKUP_DIR"
ARCHIVE_PATH="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"

# ═══════════════════════════════════════════════════════════
# 1. PostgreSQL Backup
# ═══════════════════════════════════════════════════════════
if [[ "$FILES_ONLY" == false ]]; then
    log_info "Backing up PostgreSQL database..."

    DB_BACKUP="$BACKUP_DIR/${BACKUP_NAME}_db.sql"

    if [[ -n "${DATABASE_URL:-}" ]]; then
        pg_dump "$DATABASE_URL" > "$DB_BACKUP" || {
            log_error "pg_dump failed — falling back to docker compose"
            if command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1; then
                docker compose exec -T postgres pg_dump -U bigstarz bigstarz > "$DB_BACKUP"
            else
                log_error "Cannot connect to PostgreSQL"
                exit 1
            fi
        }
    else
        log_info "DATABASE_URL not set — trying docker compose..."
        docker compose exec -T postgres pg_dump -U bigstarz bigstarz > "$DB_BACKUP" || {
            log_error "Failed to dump database via docker compose"
            exit 1
        }
    fi

    # Compress database dump
    gzip -f "$DB_BACKUP"
    DB_BACKUP="${DB_BACKUP}.gz"
    log_info "Database backup: $DB_BACKUP ($(du -h "$DB_BACKUP" | cut -f1))"
else
    DB_BACKUP=""
fi

# ═══════════════════════════════════════════════════════════
# 2. Uploads Backup
# ═══════════════════════════════════════════════════════════
if [[ "$DB_ONLY" == false ]]; then
    log_info "Backing up uploaded files..."

    FILES_BACKUP="$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz"
    UPLOADS_DIR=""

    # Try to find uploads directory
    if [[ -d "$REPO_ROOT/uploads" ]]; then
        UPLOADS_DIR="$REPO_ROOT/uploads"
    elif docker compose ps | grep -q backend; then
        # Extract from docker volume
        docker run --rm \
            -v bigstarz-uploads:/uploads \
            -v "$BACKUP_DIR:/backup" \
            alpine:latest \
            tar czf "/backup/$(basename "$FILES_BACKUP")" -C /uploads .
        log_info "Uploads backup from Docker volume: $FILES_BACKUP"
    else
        log_warn "No uploads directory found — skipping files backup"
    fi

    if [[ -n "$UPLOADS_DIR" ]]; then
        tar czf "$FILES_BACKUP" -C "$UPLOADS_DIR" .
        log_info "Uploads backup: $FILES_BACKUP ($(du -h "$FILES_BACKUP" | cut -f1))"
    fi
else
    FILES_BACKUP=""
fi

# ═══════════════════════════════════════════════════════════
# 3. Create Combined Archive
# ═══════════════════════════════════════════════════════════
if [[ -n "$DB_BACKUP" && -n "${FILES_BACKUP:-}" ]]; then
    tar czf "$ARCHIVE_PATH" -C "$BACKUP_DIR" "$(basename "$DB_BACKUP")" "$(basename "$FILES_BACKUP")"
    rm -f "$DB_BACKUP" "$FILES_BACKUP"
    log_info "Combined archive: $ARCHIVE_PATH ($(du -h "$ARCHIVE_PATH" | cut -f1))"
elif [[ -n "$DB_BACKUP" ]]; then
    mv "$DB_BACKUP" "$ARCHIVE_PATH"
    log_info "Database-only archive: $ARCHIVE_PATH ($(du -h "$ARCHIVE_PATH" | cut -f1))"
elif [[ -n "${FILES_BACKUP:-}" ]]; then
    mv "$FILES_BACKUP" "$ARCHIVE_PATH"
    log_info "Files-only archive: $ARCHIVE_PATH ($(du -h "$ARCHIVE_PATH" | cut -f1))"
fi

# ═══════════════════════════════════════════════════════════
# 4. Upload to S3
# ═══════════════════════════════════════════════════════════
if [[ "$NO_S3" == false && -f "$ARCHIVE_PATH" ]]; then
    if command -v aws >/dev/null 2>&1; then
        log_info "Uploading to S3 ($S3_BUCKET/$S3_PREFIX)..."
        aws s3 cp "$ARCHIVE_PATH" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "$ARCHIVE_PATH")"
        log_info "S3 upload complete"
    else
        log_warn "AWS CLI not installed — skipping S3 upload"
        log_info "Backup kept locally at: $ARCHIVE_PATH"
    fi
else
    log_info "Backup kept locally at: $ARCHIVE_PATH"
fi

# ═══════════════════════════════════════════════════════════
# 5. Cleanup Old Backups
# ═══════════════════════════════════════════════════════════
log_info "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "bigstarz_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
log_info "Cleanup complete"

# ═══════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════
echo ""
log_info "Backup complete: $(basename "$ARCHIVE_PATH")"
log_info "Size: $(du -h "$ARCHIVE_PATH" | cut -f1)"
log_info "Location: $BACKUP_DIR"
