# Install & Deployment Guide — TechAZsure 3D Print

This guide covers running the application locally for development as well as spinning up the complete production multi-container Docker cluster.

---

## 1. Quick Start with Docker (Recommended)

The entire platform is fully containerized across 4 services:
1. `techazsure-proxy`: Hardened Nginx reverse proxy on Port 80 with rate limiting and security headers.
2. `techazsure-frontend`: Next.js 16 standalone production container on internal Port 3000.
3. `techazsure-backend`: High-performance Go REST service on internal Port 8080.
4. `techazsure-db`: PostgreSQL 16 Alpine database with automatic schema migrations and seeds on internal Port 5432.

### Prerequisites
- Docker Engine `24.x+` (or Docker Desktop)
- Docker Compose `v2.x+`

### One-Command Launch
```bash
# From the project root:
docker compose --env-file .env.docker up -d
```

### Verify Running Containers
```bash
docker ps
```
All containers should report `Up (healthy)`.

### Test Endpoints
```bash
# 1. API Health Check
curl -i http://localhost/api/health

# 2. Products Catalog Check
curl -s http://localhost/api/products

# 3. Open in Browser
# Homepage Showcase: http://localhost/
# Curated Catalog:   http://localhost/explore
# STL Customizer:    http://localhost/upload
# Dispatch Tracking: http://localhost/track?id=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

---

## 2. Local Manual Development (Without Docker)

If you prefer to run services individually without containers:

### Prerequisites
- **Node.js**: `20.x` or `22.x` (LTS)
- **Go**: `1.22+` or `1.24`
- **PostgreSQL**: `15+` running on `localhost:5432`

### Step 1: PostgreSQL Setup
Create the database and export the connection string:
```bash
createdb techazsure_3dprint
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/techazsure_3dprint?sslmode=disable"
```

### Step 2: Run Go REST Backend
```bash
cd backend
go run cmd/server/main.go
```
*Note: Go automatically executes `schema.sql` and `seed.sql` on startup.*
Server listens on `http://localhost:8080`.

### Step 3: Run Next.js Frontend
In a new terminal window:
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Storefront opens on `http://localhost:3000`.

---

## 3. Useful Docker Commands

```bash
# View live container logs
docker compose logs -f backend
docker compose logs -f proxy

# Rebuild images after changing code
docker compose --env-file .env.docker build

# Stop all containers
docker compose --env-file .env.docker down

# Stop all containers and wipe database volume (clean reset)
docker compose --env-file .env.docker down -v
```
