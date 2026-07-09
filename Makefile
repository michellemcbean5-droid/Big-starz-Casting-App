# ───────────────────────────────────────────────────────────
# Big Starz Casting App — Makefile
# ───────────────────────────────────────────────────────────

.PHONY: setup dev build test migrate seed deploy backup logs stop

# ─── Variables ────────────────────────────────────────────
REPO_ROOT := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# ─── Targets ──────────────────────────────────────────────

## setup: Run local development setup (prereqs, .env, docker compose up)
setup:
	@echo "🚀 Setting up Big Starz local development environment..."
	bash $(REPO_ROOT)/deployment/scripts/setup-local.sh

## dev: Start all services in development mode with docker-compose
dev:
	@echo "🐳 Starting Docker Compose services..."
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml up -d
	@echo ""
	@echo "Services starting..."
	@echo "  Web App:    http://localhost:3000"
	@echo "  API:        http://localhost:3001"
	@echo "  Health:     http://localhost:3001/health"
	@echo "  Nginx:      http://localhost"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis:      localhost:6379"
	@echo ""
	@echo "Logs: make logs"

## build: Build all Docker images
build:
	@echo "🔨 Building all Docker images..."
	docker build -t bigstarz/backend:latest $(REPO_ROOT)/backend
	docker build -t bigstarz/web:latest $(REPO_ROOT)/web
	docker build -t bigstarz/ai-worker:latest $(REPO_ROOT)/ai
	docker build -t bigstarz/nginx:latest $(REPO_ROOT)/deployment/docker/nginx
	@echo "✅ All images built."

## test: Run all test suites (backend + web)
test:
	@echo "🧪 Running backend tests..."
	cd $(REPO_ROOT)/backend && npm run test
	@echo "🧪 Running web build check..."
	cd $(REPO_ROOT)/web && npm run build
	@echo "✅ All tests passed."

## migrate: Run Prisma database migrations
migrate:
	@echo "🗄️  Running database migrations..."
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml exec -T backend npx prisma migrate deploy

## seed: Seed the database with initial data
seed:
	@echo "🌱 Seeding database..."
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml exec -T backend npx prisma seed || \
		$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml exec -T backend npx ts-node prisma/seed.ts

## deploy: Deploy to production (Kubernetes)
deploy:
	@echo "🚀 Deploying to production..."
	bash $(REPO_ROOT)/deployment/scripts/deploy.sh --env production

## backup: Run database and files backup
backup:
	@echo "💾 Running backup..."
	bash $(REPO_ROOT)/deployment/scripts/backup.sh

## logs: Show real-time logs from all services
logs:
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml logs -f --tail=50

## stop: Stop all Docker Compose services
stop:
	@echo "🛑 Stopping all services..."
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml down

## stop-clean: Stop all services and remove volumes (⚠️  data loss)
stop-clean:
	@echo "⚠️  Stopping all services and removing volumes..."
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml down -v

## ps: Show running container status
ps:
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml ps

## shell-backend: Open a shell in the backend container
shell-backend:
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml exec backend sh

## shell-web: Open a shell in the web container
shell-web:
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml exec web sh

## shell-db: Open psql in the PostgreSQL container
shell-db:
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml exec postgres psql -U bigstarz -d bigstarz

## shell-redis: Open redis-cli in the Redis container
shell-redis:
	$(COMPOSE) -f $(REPO_ROOT)/docker-compose.yml exec redis redis-cli

## k8s-apply: Apply all Kubernetes manifests
k8s-apply:
	@echo "☸️  Applying Kubernetes manifests..."
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/namespace.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/configmap.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/secret.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/pvc-uploads.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/postgres-deployment.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/postgres-service.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/redis-deployment.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/redis-service.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/backend-deployment.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/backend-service.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/backend-hpa.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/web-deployment.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/web-service.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/ai-worker-deployment.yaml
	kubectl apply -f $(REPO_ROOT)/deployment/k8s/ingress.yaml
	@echo "✅ Kubernetes manifests applied."

## k8s-status: Show Kubernetes pod status
k8s-status:
	kubectl get pods -n big-starz

## k8s-logs: Stream Kubernetes backend logs
k8s-logs:
	kubectl logs -f deployment/backend -n big-starz --tail=50

## k8s-rollback: Rollback Kubernetes deployments
k8s-rollback:
	@echo "↩️  Rolling back Kubernetes deployments..."
	kubectl rollout undo deployment/backend -n big-starz
	kubectl rollout undo deployment/web -n big-starz
	kubectl rollout undo deployment/ai-worker -n big-starz

## lint: Lint all packages
lint:
	@echo "🔍 Linting backend..."
	cd $(REPO_ROOT)/backend && npm run lint
	@echo "🔍 Linting web..."
	cd $(REPO_ROOT)/web && npm run lint

## format: Format code with Prettier (if configured)
format:
	@echo "✨ Formatting code..."
	cd $(REPO_ROOT)/backend && npx prettier --write src/ || true
	cd $(REPO_ROOT)/web && npx prettier --write src/ || true

## help: Show this help message
help:
	@echo "Big Starz Casting App — Makefile Targets"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
