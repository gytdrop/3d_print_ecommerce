# Project: Go/PostgreSQL Backend & Storefront Integration for TechAZsure 3D Print

> **Deployment target: self-managed VPS.** The entire stack ships as the Docker Compose unit
> described below (Nginx :80 → Next.js :3000 + Go :8080 → PostgreSQL :5432). Keep all frontend
> assets self-contained (local `/public` files, inline SVG) — no external CDN dependencies.

## Architecture
The application is a fully containerized multi-tier e-commerce and on-demand 3D printing platform:

```
                            ┌────────────────────────┐
                            │ Client Browser / User  │
                            └───────────┬────────────┘
                                        │ HTTP Port 80
                                        ▼
                   ┌──────────────────────────────────────────┐
                   │    Nginx Reverse Proxy & Security SaaS    │
                   │  - Rate Limiting (15 req/s, burst 20)    │
                   │  - Hardened Security Headers (CSP, HSTS) │
                   │  - Microservice Routing (/ & /api/)      │
                   └────────────┬─────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼ (Port 3000)                                   ▼ (Port 8080)
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     Next.js 16 Storefront     │               │        Go REST Backend        │
│   (Standalone Node Runner)    │               │    (Alpine Static Binary)     │
│ - In-Place 3D Video Scrub (/) │               │ - Realtime Slicing Estimates  │
│ - Curated Catalog (/explore)  │               │ - Order State Machine         │
│ - Live Telemetry (/track)     │               │ - Bangalore Delivery Tiers    │
│ - JSON-LD Schema.org SEO      │               │ - Health Checks & Products    │
└───────────────────────────────┘               └───────────────┬───────────────┘
                                                                │ SQL Connection (Port 5432)
                                                                ▼
                                                ┌───────────────────────────────┐
                                                │      PostgreSQL 16 Alpine     │
                                                │ - Pincodes, Categories        │
                                                │ - Products, Variants          │
                                                │ - Materials, Orders           │
                                                │ - Order Timeline & Payments   │
                                                └───────────────────────────────┘
```

## Docker Container Composition
All services are orchestrated in `docker-compose.yml`:
- `techazsure-proxy`: Port 80 exposed. Nginx reverse proxy with SSL termination readiness and rate limiting.
- `techazsure-frontend`: Standalone Next.js 16 container built with React 19 compatibility (`--legacy-peer-deps`).
- `techazsure-backend`: High-performance Go 1.24 static binary container.
- `techazsure-db`: PostgreSQL 16 Alpine with automatic embedded migrations and seeds.

## Code Layout
- `backend/` - Go REST backend source files.
  - `cmd/server/main.go` - Server entrypoint registering `/api/health`, `/api/pincodes/check`, `/api/quote`, `/api/orders`, `/api/orders/track`, `/api/products`, `/api/materials`.
  - `internal/db/` - DB initialization (`db.go`), expanded schema DDL (`schema.sql`), and seeds (`seed.sql`).
  - `internal/handlers/` - REST API handler implementations.
  - `internal/service/` - Pricing and physical material calculation logic.
- `frontend/` - Next.js storefront source files.
  - `app/page.tsx` - In-place 3D showcase mounting `Fused3DScrollExperience`.
  - `app/explore/page.tsx` - E-commerce product catalog with Schema.org `ItemList` & `Product` structured data.
  - `app/track/page.tsx` - Real-time 5-stage dispatch telemetry and order status tracking.
  - `app/upload/page.tsx` - Custom STL/photo order flow with Three.js preview.
  - `app/zones/page.tsx` - Bangalore delivery zone checker.
  - `components/Fused3DScrollExperience.tsx` - Zero vertical displacement scrollytelling engine (scroll lerp, video scrubbing, stage fade windows, quantized state updates for render performance).
  - `components/home/StageScenes.tsx` - Ungrouped free-positioned stage compositions (memoized; scrub-reversible per-element drift/stagger choreography).
  - `components/home/MobileHomeFrame.tsx` - Phone-portrait chrome (header, HUD-bracketed stage zone + ruler, stage dots + scrub track); rendered below `md` only.
  - `components/home/MobileStageScenes.tsx` - Phone-portrait stage compositions (single reading column, same scrub-reversible drift model).
  - `components/home/FloatingArt.tsx` - 2.5D gradient-faced SVG product vectors floated per stage.
  - `components/hud/EngineeringHudRails.tsx` - Blueprint figure rail (left) + live telemetry rail (right), desktop only; stage fade windows mirror `Fused3DScrollExperience` and must be kept in sync.
  - `components/layout/ConditionalHeader.tsx` & `ConditionalFooter.tsx` - Layout routing.
- `docker/nginx/nginx.conf` - Production Nginx reverse proxy and security configuration.
- `docker-compose.yml` - Production container orchestration definition.

## Interface Contracts

### 1. `GET /api/health`
- Response (200 OK):
  ```json
  {
    "database": "healthy",
    "service": "techazsure-backend",
    "status": "ok"
  }
  ```

### 2. `GET /api/pincodes/check?pincode=560001`
- Request Parameters:
  - `pincode`: 6-digit string
- Response (200 OK):
  ```json
  {
    "pincode": "560001",
    "eligible": true,
    "tier": "express",
    "message": "8-Hour Express Available! Order before 2 PM for tonight."
  }
  ```

### 3. `GET /api/products`
- Response (200 OK): List of catalog products from the database.

### 4. `GET /api/materials`
- Response (200 OK): Physical density, cost per gram, and finish properties for engineering materials.

### 5. `POST /api/orders`
- Request Payload:
  ```json
  {
    "file_name": "model.stl",
    "file_size": 1542000,
    "volume_cm3": 35.5,
    "file_url": "/uploads/model.stl",
    "material_type": "pla",
    "delivery_tier": "express",
    "pincode": "560025",
    "shipping_address": "Indiranagar 100ft Road, Bangalore 560025",
    "contact_email": "user@example.com",
    "contact_phone": "+919999988888"
  }
  ```
- Response (201 Created):
  ```json
  {
    "order_id": "3cd13477-fe72-4572-8f09-67f076df5a64",
    "final_price": 1502.36,
    "status": "order_placed"
  }
  ```

### 6. `GET /api/orders/track?id=<uuid>`
- Response (200 OK):
  ```json
  {
    "id": "3cd13477-fe72-4572-8f09-67f076df5a64",
    "file_name": "model.stl",
    "volume_cm3": 35.5,
    "material_type": "pla",
    "delivery_tier": "express",
    "pincode": "560025",
    "final_price": 1502.36,
    "status": "order_placed",
    "shipping_address": "Indiranagar 100ft Road, Bangalore 560025",
    "created_at": "2026-10-17T09:42:54Z",
    "timeline": [
      {
        "id": "1fc404c5-e1b4-47cd-9941-ac8a698f3538",
        "stage": "order_placed",
        "message": "Order registered and queued for farm slicing.",
        "location": "Bangalore Hub",
        "created_at": "2026-10-17T09:42:54Z"
      }
    ]
  }
  ```
