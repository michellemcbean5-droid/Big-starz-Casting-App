#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────
# deploy.sh — Production Deployment Script
# Builds images, pushes to registry, deploys to K8s, runs migrations
# ───────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REGISTRY="${REGISTRY:-ghcr.io/bestarz}"
NAMESPACE="big-starz"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ROLLBACK_TAG="rollback-${TIMESTAMP}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  -e, --env ENV        Deployment environment (staging|production) [default: staging]
  -t, --tag TAG        Image tag to deploy [default: latest]
  --skip-build         Skip Docker build step
  --skip-push          Skip Docker push step
  --skip-migrate       Skip database migration
  --rollback           Rollback to previous deployment
  -h, --help           Show this help

Examples:
  ./deploy.sh --env production --tag v1.2.3
  ./deploy.sh --env staging --skip-build
  ./deploy.sh --rollback
EOF
}

# Defaults
ENV="staging"
TAG="latest"
SKIP_BUILD=false
SKIP_PUSH=false
SKIP_MIGRATE=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env) ENV="$2"; shift 2 ;;
        -t|--tag) TAG="$2"; shift 2 ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-push) SKIP_PUSH=true; shift ;;
        --skip-migrate) SKIP_MIGRATE=true; shift ;;
        --rollback) ROLLBACK=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) log_error "Unknown option: $1"; usage; exit 1 ;;
    esac
done

if [[ "$ROLLBACK" == true ]]; then
    log_info "Rolling back to previous deployment..."
    kubectl rollout undo deployment/backend -n "$NAMESPACE"
    kubectl rollout undo deployment/web -n "$NAMESPACE"
    kubectl rollout undo deployment/ai-worker -n "$NAMESPACE"
    log_info "Rollback initiated. Monitor with: kubectl get pods -n $NAMESPACE"
    exit 0
fi

cd "$REPO_ROOT"

log_info "Deploying to $ENV with tag $TAG"

# ─── Prerequisite Checks ───────────────────────────────────
log_info "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { log_error "Docker is not installed"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is not installed"; exit 1; }
kubectl cluster-info >/dev/null 2>&1 || { log_error "kubectl cannot connect to cluster"; exit 1; }

# ─── Build Docker Images ───────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
    log_info "Building Docker images..."

    docker build -t "${REGISTRY}/backend:${TAG}" -t "${REGISTRY}/backend:${ROLLBACK_TAG}" ./backend
    docker build -t "${REGISTRY}/web:${TAG}" -t "${REGISTRY}/web:${ROLLBACK_TAG}" ./web
    docker build -t "${REGISTRY}/ai-worker:${TAG}" -t "${REGISTRY}/ai-worker:${ROLLBACK_TAG}" ./ai
    docker build -t "${REGISTRY}/nginx:${TAG}" -t "${REGISTRY}/nginx:${ROLLBACK_TAG}" ./deployment/docker/nginx

    log_info "All images built successfully."
else
    log_warn "Skipping build step."
fi

# ─── Push to Registry ──────────────────────────────────────
if [[ "$SKIP_PUSH" == false ]]; then
    log_info "Pushing images to registry ${REGISTRY}..."

    docker push "${REGISTRY}/backend:${TAG}"
    docker push "${REGISTRY}/web:${TAG}"
    docker push "${REGISTRY}/ai-worker:${TAG}"
    docker push "${REGISTRY}/nginx:${TAG}"

    log_info "All images pushed successfully."
else
    log_warn "Skipping push step."
fi

# ─── Tag Rollback Images ──────────────────────────────────
if [[ "$SKIP_PUSH" == false ]]; then
    docker push "${REGISTRY}/backend:${ROLLBACK_TAG}"
    docker push "${REGISTRY}/web:${ROLLBACK_TAG}"
    docker push "${REGISTRY}/ai-worker:${ROLLBACK_TAG}"
fi

# ─── Apply Kubernetes Configs ─────────────────────────────
log_info "Applying Kubernetes configurations..."

# Update image tags in K8s manifests
TMP_DIR=$(mktemp -d)
cp -r deployment/k8s/* "$TMP_DIR/"

for f in "$TMP_DIR"/*.yaml; do
    sed -i.bak "s|image: big-starz/|image: ${REGISTRY}/|g" "$f"
    sed -i.bak "s|:latest|:${TAG}|g" "$f"
    rm -f "$f.bak"
done

kubectl apply -f "$TMP_DIR/namespace.yaml" || true
kubectl apply -f "$TMP_DIR/configmap.yaml"
kubectl apply -f "$TMP_DIR/secret.yaml"
kubectl apply -f "$TMP_DIR/pvc-uploads.yaml"
kubectl apply -f "$TMP_DIR/postgres-deployment.yaml"
kubectl apply -f "$TMP_DIR/postgres-service.yaml"
kubectl apply -f "$TMP_DIR/redis-deployment.yaml"
kubectl apply -f "$TMP_DIR/redis-service.yaml"
kubectl apply -f "$TMP_DIR/backend-deployment.yaml"
kubectl apply -f "$TMP_DIR/backend-service.yaml"
kubectl apply -f "$TMP_DIR/backend-hpa.yaml"
kubectl apply -f "$TMP_DIR/web-deployment.yaml"
kubectl apply -f "$TMP_DIR/web-service.yaml"
kubectl apply -f "$TMP_DIR/ai-worker-deployment.yaml"
kubectl apply -f "$TMP_DIR/ingress.yaml"

rm -rf "$TMP_DIR"

# ─── Database Migration ───────────────────────────────────
if [[ "$SKIP_MIGRATE" == false ]]; then
    log_info "Running database migrations..."

    # Wait for postgres to be ready
    kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=120s

    # Run migration via a temporary job pod
    kubectl run prisma-migrate-${TIMESTAMP} \
        --image="${REGISTRY}/backend:${TAG}" \
        --namespace="$NAMESPACE" \
        --rm \
        --restart=Never \
        --env="DATABASE_URL=$(kubectl get secret big-starz-secrets -n "$NAMESPACE" -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
        -- npx prisma migrate deploy

    log_info "Database migrations complete."
else
    log_warn "Skipping migration step."
fi

# ─── Health Checks ─────────────────────────────────────────
log_info "Waiting for rollout and running health checks..."

kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s
kubectl rollout status deployment/web -n "$NAMESPACE" --timeout=300s
kubectl rollout status deployment/ai-worker -n "$NAMESPACE" --timeout=300s

# HTTP health checks
BACKEND_URL=$(kubectl get svc backend -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "backend.${NAMESPACE}.svc.cluster.local")
WEB_URL=$(kubectl get svc web -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "web.${NAMESPACE}.svc.cluster.local")

if command -v curl >/dev/null 2>&1; then
    log_info "Backend health check:"
    curl -sf "http://${BACKEND_URL}/health" || log_warn "Backend health check unreachable (expected if no external LB)"
fi

log_info "Deployment to $ENV completed successfully!"
log_info "Tag: $TAG  |  Rollback tag: $ROLLBACK_TAG"
log_info "Monitor: kubectl get pods -n $NAMESPACE"
