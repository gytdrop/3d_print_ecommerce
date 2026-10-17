# TechAZsure 3D Print — Ledger & Architecture Resume

**Document Purpose**: Definitive technical ledger, system resume, and state record. Designed for onboarding human engineers and AI coding agents to instantly grasp the product vision, tech stack, genre, visual design system, active container state, and remaining roadmap.

---

## 1. Executive Summary & Purpose

* **Platform Name**: TechAZsure 3D Print
* **Website Genre**: Hardware Showcase + Custom On-Demand 3D Manufacturing E-Commerce Platform with Hyperlocal Express Dispatch.
* **Core Value Proposition**: 
  1. High-fidelity hardware showcase introducing TechAZsure's optical additive manufacturing capabilities.
  2. Instant 3D STL & photo lithophane quoting engine calculating material density, volume, and machine runtimes.
  3. Curated e-commerce catalog across 7 categories.
  4. Hyperlocal dispatch in under 8 hours across Bengaluru metropolitan postal zones.
  5. Real-time 5-stage dispatch telemetry and order status tracking.

---

## 2. Technical Stack Matrix

| Subsystem | Technologies & Frameworks | Description & Rationale |
|---|---|---|
| **Frontend Storefront** | Next.js 16.2.9 (App Router), React 19.2.4, TypeScript 5, Tailwind CSS 4 | Production-grade server/client architecture with static prerendering and Turbopack support. Built in `standalone` output mode for Docker. |
| **3D Engine & Graphics** | Three.js `0.168.0`, `@react-three/fiber` `8.17.10`, `@react-three/drei` `9.122.0` | In-browser WebGL canvas rendering for STL files, interactive mesh controls, and fallback 3D canvases. |
| **State Management** | Zustand 5.0.14 | Clean, boilerplate-free state store (`useOrderStore.ts`) managing 3D file metadata, custom dimensions, selected materials, and cart state. |
| **Backend Microservice** | Go 1.24 (`net/http`, `Jackc/pgx/v5`) | Sub-millisecond REST API handling volumetric density calculations, rush expedite multipliers, database persistence, and order tracking. |
| **Relational Database** | PostgreSQL 16 Alpine (`pgcrypto`) | Relational datastore containing 10 relational tables for pincodes, categories, products, product variants, materials, customers, orders, order timeline, and payments. |
| **Security SaaS & Reverse Proxy** | Nginx Alpine (Custom Gateway) | Reverse proxy terminating Port 80, enforcing rate limits (`15 req/s, burst 20`), security headers (CSP, HSTS, X-Frame-Options), and 50MB file upload limits. |
| **Orchestration** | Docker Compose v2.x | Multi-container microservice topology with dedicated internal bridge networks (`frontend-net`, `backend-net`). |

---

## 3. Genre & Design System ("Theme")

### Genre
**Cyber-Physical Hardware / Industrial Precision E-Commerce**
Combines the interactive showcase feel of [`antigravity.google`](https://antigravity.google/) with high-conversion consumer product configuration.

### Visual Design Theme & Language
* **Design Philosophy**: Strict adherence to `/no-slop-ui` — no generic neon gradients, no random floating blobs, no illegible low-contrast text.
* **Color Palette**:
  - **Base Background**: Deep Industrial Space `#050608`
  - **Content Surfaces (home)**: Cardless — local radial scrims (`rgba(5,6,8,0.88)` core) + layered text shadows over the video; small dark-glass chips `bg-black/45 backdrop-blur-md border-white/20` for badges/metrics
  - **Warm Lamp Accent**: Lithophane glow `#ffd9a0`/`#ff9d3c` used in the 2.5D floating product art
  - **Primary Accent**: Energetic Forge Orange (`#ff5722` / `from-orange-500 to-amber-500`)
  - **Secondary Accents**: Cyber Cyan (`#22d3ee`) for technical metrics and precision badges
  - **Text Colors**: High-contrast primary `#f8fafc`, muted specs `#94a3b8`
* **Typography**:
  - Headings: Clean sans-serif / Space Grotesk
  - Data Badges & Machine Specs: Monospace (`font-mono`)
* **Showcase Scrollytelling Mechanics**:
  - **Zero Vertical Page Displacement**: Fixed viewport pinning (`fixed inset-0 w-screen h-screen overflow-hidden`) locks the outer window. Content containers fade in and out in place without scrolling off screen.
  - **Hardware Frame Scrubbing**: Video frame seeking synchronized directly to scroll delta against All-Intra encoded mechanical assembly footage (`cube_assembly_intra_fast.mp4`).
  - **Ungrouped Scene Choreography** (2026-10-17): Stage cards decomposed into independent free-positioned elements with scrub-reversible per-element drift/stagger (`opacity^k`), flanked by blueprint/telemetry HUD side rails and stage-matched floating 2.5D product vectors (all inline SVG). See `task2_home.md` for the full decision log.

---

## 4. Current State Ledger: "Where We Stopped"

### ✅ Completed & Active Systems

1. **Database Schema & Embedded Seeds**:
   - PostgreSQL schema with tables: `pincodes`, `categories`, `products`, `product_variants`, `materials`, `customers`, `orders`, `order_timeline`, `payments`.
   - Automated triggers for `updated_at`.
   - Embedded migrations in Go (`//go:embed`) applying schema DDL and seeds automatically on container boot.
2. **REST API Handlers**:
   - `GET /api/health`: Health probe with live DB ping.
   - `GET /api/pincodes/check?pincode=...`: Real-time tier and express validation.
   - `GET /api/products`: Catalog query from PostgreSQL.
   - `GET /api/materials`: Physical density (g/cm³) and pricing specs.
   - `POST /api/quote`: Dynamic volume and expedite pricing formula engine.
   - `POST /api/orders`: Order placement generating initial `order_placed` timeline checkpoint.
   - `GET /api/orders/track?id=...`: Real-time timeline telemetry lookup.
3. **Frontend Storefront**:
   - Homepage (`/`): In-place 6-stage 3D video scrub showcase with timeline scrub pills; ungrouped scene choreography, blueprint/telemetry HUD rails, and floating 2.5D product vectors (PR #2, 2026-10-17 — see `task2_home.md`).
   - Lamp (`/lamp`): Photo-to-lithophane configurator with live Three.js studio preview covering all customisations (6 frame styles × 3 sizes × 2 orientations × 3 finishes × lamp toggle × crop).
   - Explore (`/explore`): Curated product catalog with Schema.org `ItemList` and `Product` JSON-LD.
   - Upload (`/upload`): STL/photo upload flow with Three.js preview and dynamic pricing summary.
   - Track (`/track`): Real-time 5-stage dispatch telemetry portal.
   - Zones (`/zones`): Bengaluru delivery zone checker.
   - Layout (`layout.tsx`): Enterprise `LocalBusiness` Schema.org JSON-LD structured data.
4. **Security SaaS & Docker Containerization**:
   - All 4 containers running and healthy: `techazsure-proxy`, `techazsure-frontend`, `techazsure-backend`, `techazsure-db`.
   - Nginx reverse proxy serving Port 80 with CSP, HSTS, X-Frame-Options, and rate limiting.
   - Zero hardcoded `localhost:8080` in frontend client code.

---

## 5. Remaining Roadmap: "How Much is Remaining"

### Phase 2: Production Hardening & Payment Gateways (Remaining)
- [ ] **Payment Gateway Integration**:
  - Connect Razorpay / Cashfree webhook handlers in Go (`POST /api/payments/webhook`) to update `payments` and transition order status to `sliced`.
  - Add client-side checkout modal in `PriceSummary.tsx`.
- [ ] **Cloud Storage S3/GCS Integration**:
  - Replace local file mock paths (`/uploads/...`) with signed presigned URL generation for uploaded user STL files in AWS S3 or Google Cloud Storage.
- [ ] **Admin Dispatch Dashboard**:
  - Create `/admin/dispatch` interface allowing operations team to update order timeline stages (`sliced` → `in_print` → `qc_passed` → `out_for_delivery`).
- [ ] **SSL / TLS Certificate Provisioning**:
  - Configure Let's Encrypt / Certbot in `techazsure-proxy` for HTTPS on Port 443 with automated renewal.
- [ ] **Automated CI/CD Pipeline**:
  - GitHub Actions workflow for building Docker images and running Go unit/integration tests on push.

### Phase 3: Photo Lamp Frame Product (Spec Complete — see `photo-lamp-spec.md`)
- [x] **PRD finalized (2026-10-17)**: Dedicated `/lamp` flow — photo import with aspect-locked crop UI, live Three.js backlit 3D preview (lamp on/off), server-side lithophane STL generation in Go, fixed 3-size matrix pricing (S 10×8cm ₹499, M 15×10cm ₹799, L 20×15cm ₹1299), slide-in rail cuboidal box with warm-white USB-C LED, orders via `product_type = 'photo_lamp'`.
- [x] **Implementation (P0) complete (2026-10-17)**: `/lamp` configurator with crop UI + live 3D preview, `POST /api/uploads/photo`, Go lithophane STL generator (`internal/lithophane`) running async per order, `orders` schema extension, homepage Stage 05 CTA + `/explore` card entry points. End-to-end verified against live PostgreSQL.
- [ ] **Blocking inputs before first production print**: measured USB-C LED module dimensions (box depth/rails); panel thickness min/max vs glow quality.

### Phase 4: Admin Ops Dashboard & Configurable Platform (Complete — 2026-10-17)
- [x] **DB-backed settings**: previously hardcoded values (lamp prices, eco discount, rush rate, machine rate, bulk discount rules, manufacturing origin) now live in a `settings` JSONB table, edited from the dashboard, cached 15s in the public API, seeded with defaults that never overwrite admin edits.
- [x] **Shipping estimator**: `GET /api/shipping/estimate?pincode=…` compares the customer pincode against the admin-configured manufacturing origin using India's hierarchical pincode structure (same pincode → district (3 digits) → region (2) → zone (1) → national), each level mapping to an admin-tunable day band; per-pincode overrides can pin an exact day window or a fixed delivery date. Shown live in the `/lamp` delivery step.
- [x] **Isolated admin service** (`cmd/admin`, container `techazsure-admin`): separate binary and container deliberately kept OFF the public Nginx proxy — binds `127.0.0.1:9090` on the VPS host only (SSH tunnel to access), requires `ADMIN_TOKEN` bearer auth (constant-time compare), strict CSP/no-store headers. Dashboard manages: origin & pricing, shipping bands, pincode tiers + overrides, an estimator test tool, and order dispatch stage transitions (`sliced` → … → `delivered`) feeding the public `/track` timeline — closing the Phase 2 "Admin Dispatch Dashboard" roadmap item.

---

## 6. How to Run & Verify

```bash
# 1. Start all containers in the background
docker compose --env-file .env.docker up -d

# 2. Inspect container status
docker ps

# 3. Test Health & Database Connection
curl -i http://localhost/api/health

# 4. View in Browser
# Storefront: http://localhost/
# Catalog:    http://localhost/explore
# Tracking:   http://localhost/track?id=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```
