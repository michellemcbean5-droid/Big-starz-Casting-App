# Kubernetes Deployment Guide

This guide covers deploying the Big Starz Platform on Kubernetes.

---

## Prerequisites

- Kubernetes cluster 1.28+
- kubectl configured
- Helm 3.12+ (optional but recommended)
- Container registry access

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Ingress Controller             │
│     (nginx-ingress / traefik)            │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌───────┐    ┌───────┐    ┌─────────┐
│  Web  │    │  API  │    │ AI Pipeline │
│ (3 pods)│   │(3 pods)│   │  (2 pods)   │
└───┬───┘    └───┬───┘    └────┬────┘
    │            │             │
    └────────────┼─────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐      ┌──────────┐
   │PostgreSQL│      │  Redis   │
   │(Stateful)│      │(1 pod)   │
   └─────────┘      └──────────┘
```

---

## Namespace

```yaml
# deployment/k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bigstarz
  labels:
    name: bigstarz
```

---

## ConfigMaps & Secrets

```yaml
# deployment/k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bigstarz-config
  namespace: bigstarz
data:
  NODE_ENV: "production"
  PORT: "3001"
  API_URL: "https://api.bigstarz.com"
  APP_URL: "https://app.bigstarz.com"
  HF_MODEL_TEXT: "mistralai/Mistral-7B-Instruct-v0.2"
  HF_MODEL_IMAGE: "stabilityai/stable-diffusion-xl-base-1.0"
```

```yaml
# deployment/k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: bigstarz-secrets
  namespace: bigstarz
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  JWT_SECRET: "..."
  JWT_REFRESH_SECRET: "..."
  HUGGINGFACE_API_TOKEN: "..."
  STRIPE_SECRET_KEY: "..."
  STRIPE_WEBHOOK_SECRET: "..."
```

---

## Backend Deployment

```yaml
# deployment/k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bigstarz-backend
  namespace: bigstarz
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bigstarz-backend
  template:
    metadata:
      labels:
        app: bigstarz-backend
    spec:
      containers:
      - name: backend
        image: registry.bigstarz.com/backend:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: bigstarz-config
        - secretRef:
            name: bigstarz-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Backend Service

```yaml
# deployment/k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: bigstarz-backend
  namespace: bigstarz
spec:
  selector:
    app: bigstarz-backend
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
```

---

## Web Deployment

```yaml
# deployment/k8s/web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bigstarz-web
  namespace: bigstarz
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bigstarz-web
  template:
    metadata:
      labels:
        app: bigstarz-web
    spec:
      containers:
      - name: web
        image: registry.bigstarz.com/web:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: bigstarz-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

---

## Ingress Setup

```yaml
# deployment/k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bigstarz-ingress
  namespace: bigstarz
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - app.bigstarz.com
    - api.bigstarz.com
    secretName: bigstarz-tls
  rules:
  - host: app.bigstarz.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bigstarz-web
            port:
              number: 80
  - host: api.bigstarz.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bigstarz-backend
            port:
              number: 80
```

---

## PostgreSQL (StatefulSet)

```yaml
# deployment/k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: bigstarz-postgres
  namespace: bigstarz
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          value: bigstarz
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bigstarz-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
```

---

## HPA (Horizontal Pod Autoscaler)

```yaml
# deployment/k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bigstarz-backend-hpa
  namespace: bigstarz
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bigstarz-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Deployment Commands

```bash
# Apply all configurations
kubectl apply -f deployment/k8s/namespace.yaml
kubectl apply -f deployment/k8s/configmap.yaml
kubectl apply -f deployment/k8s/secret.yaml
kubectl apply -f deployment/k8s/postgres-statefulset.yaml
kubectl apply -f deployment/k8s/backend-deployment.yaml
kubectl apply -f deployment/k8s/backend-service.yaml
kubectl apply -f deployment/k8s/web-deployment.yaml
kubectl apply -f deployment/k8s/ingress.yaml
kubectl apply -f deployment/k8s/hpa.yaml

# Check status
kubectl get pods -n bigstarz
kubectl get services -n bigstarz
kubectl get ingress -n bigstarz

# View logs
kubectl logs -f deployment/bigstarz-backend -n bigstarz

# Scale manually
kubectl scale deployment bigstarz-backend --replicas=5 -n bigstarz

# Rollout restart
kubectl rollout restart deployment/bigstarz-backend -n bigstarz
```

---

## Production Checklist

- [ ] SSL certificates configured (cert-manager + Let's Encrypt)
- [ ] Network policies defined
- [ ] Pod security policies / OPA Gatekeeper
- [ ] Resource quotas and limits
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Logging (ELK / Loki)
- [ ] Backup strategy for persistent volumes
- [ ] CI/CD pipeline for automated deployments
- [ ] Disaster recovery plan
