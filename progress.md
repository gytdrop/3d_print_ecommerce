# Progress & Milestone Tracker

Last updated: 2026-10-17

## Completed Milestones

### Backend & Database (Milestones 1 – 7)
- [x] **M1: DB Schema & Seeds**: Expanded PostgreSQL schema with 10 tables (`pincodes`, `categories`, `products`, `product_variants`, `materials`, `customers`, `orders`, `order_timeline`, `payments`) and automatic `updated_at` triggers.
- [x] **M2: Backend Pincodes API**: Implemented `GET /api/pincodes/check?pincode=560001` in Go with tier classifications.
- [x] **M3: Backend Quote API**: Implemented `POST /api/quote` calculating volume density, machine rates, and rush multipliers.
- [x] **M4: Backend Orders API**: Implemented `POST /api/orders` with database persistence, UUID generation, and automated `order_timeline` initial event creation.
- [x] **M5: Backend Health, Catalog & Materials API**: Added `GET /api/health`, `GET /api/products`, and `GET /api/materials`.
- [x] **M6: Backend Tracking API**: Implemented `GET /api/orders/track?id=...` returning complete order details and real-time checkpoint event history.
- [x] **M7: Automated Integration Tests**: Created end-to-end integration test suite (`integration_test.go`).

### Frontend In-Place 3D Showcase & Storefront (Milestones 8 – 11)
- [x] **M8: Antigravity-Inspired In-Place Showcase (`/`)**:
  - Implemented `Fused3DScrollExperience.tsx` with fixed viewport pinning (`fixed inset-0 overflow-hidden`).
  - Zero vertical displacement: all containers remain in the exact same coordinates and fade in/out smoothly.
  - Zero-lag video scrub latching against `cube_assembly_intra_fast.mp4`.
  - Built 6 unified stages:
    1. Hardware Architecture & Optical Additive Fabrication
    2. 0.08mm Layer Precision Across 5 Engineering Polymers
    3. Integrated Solid Polymer & Hardwood LED Bases
    4. Same-Day Express Dispatch Across Bangalore (50+ pin codes)
    5. Select Frame Dimensions & Pricing Matrix (Small ₹499, Medium ₹799, Large ₹1299)
    6. Fused Store Directory & Copyright Footer
  - Interactive bottom navigation pills with instant timeline scrub track and direct stage jumping.
  - Dark frosted engineering glass (`bg-[#0b0f19]/90 backdrop-blur-xl border border-white/15 ring-1 ring-white/10`) adhering strictly to `/no-slop-ui`.
- [x] **M9: Decoupled Storefront Routes**:
  - Front page (`/`) dedicated to 3D hardware showcase.
  - Suppressed duplicate global header and footer on `/` via `ConditionalHeader.tsx` and `ConditionalFooter.tsx`.
  - Linked dedicated functional pages:
    - `/explore`: Full product catalog across 7 categories with Schema.org `ItemList` & `Product` JSON-LD.
    - `/upload`: Custom STL & photo lithophane customizer with interactive Three.js 3D viewport.
    - `/zones`: Hyperlocal delivery pin code verification.
    - `/about`: Company story & contact.
- [x] **M10: Live Dispatch Tracking Portal (`/track`)**:
  - Implemented 5-stage real-time progress indicators: Order Confirmed, Layer Slicing, 3D Extrusion Active, Precision QC, Out for Delivery.
  - Added timestamped checkpoint event feed and destination hub metadata.
  - Added "Track Order" link in top header navigation.
- [x] **M11: SEO & Schema.org Rich Snippets**:
  - Injected `LocalBusiness` JSON-LD structured data into root layout.
  - Injected `ItemList` and `Product` JSON-LD into the `/explore` catalog.

### Docker Multi-Container Architecture (Milestone 12)
- [x] **M12: Full Docker Composition & Security SaaS Proxy**:
  - Multi-stage Go static binary container (`backend/Dockerfile`).
  - Multi-stage Next.js standalone container (`frontend/Dockerfile`) with React 19 compatibility (`--legacy-peer-deps`).
  - Hardened Nginx reverse proxy on Port 80 (`docker/nginx/nginx.conf`) with rate limiting (15r/s burst 20), CSP, HSTS, and 50MB STL upload capability.
  - Multi-container orchestration in `docker-compose.yml` with isolated bridge networks.
  - Eliminated all hardcoded localhost URLs across frontend client components.
  - Validated live container status with 100% healthy services.

---

## Current Status: "Where We Stopped"
- **Docker Stack**: Fully running and healthy across 4 containers (`techazsure-proxy`, `techazsure-frontend`, `techazsure-backend`, `techazsure-db`).
- **Access**: Exposed via standard HTTP on Port 80 (`http://localhost/`).
- **Health Check**: Verified via `curl -i http://localhost/api/health` returning `200 OK` and `"database": "healthy"`.

---

## Remaining Scope: "How Much is Remaining"

### Estimated Total Project Completion: ~85%

### Remaining Tasks (Phase 2):
1. **Payment Gateway Integration (Razorpay / Cashfree)**:
   - Webhook endpoint in Go (`POST /api/payments/webhook`) to verify signatures, record transactions in `payments`, and update order status.
   - Client checkout modal in `PriceSummary.tsx`.
2. **Cloud Object Storage (AWS S3 / GCS)**:
   - Replace local file mock paths (`/uploads/...`) with signed presigned URL generation for uploaded user STL files.
3. **Operator / Admin Dispatch Dashboard**:
   - Web interface (`/admin/dispatch`) for printing farm operators to transition orders through slicing, extrusion, QC, and courier handoff.
4. **Production Domain & SSL**:
   - Provision automated Let's Encrypt SSL/TLS certificates on Port 443 via Nginx Certbot.

### Phase 3: Photo Lamp Frame Product
- [x] **M13: Photo Lamp Frame PRD** (2026-10-17): Full product spec written and approved — see [photo-lamp-spec.md](photo-lamp-spec.md). Covers the `/lamp` flow (photo import → crop → live backlit 3D preview → order), server-side lithophane STL generation, fixed 3-size matrix pricing, and reuse of the existing orders/tracking spine.
- [x] **M14: `/lamp` Implementation (P0 scope)** (2026-10-17):
  - Frontend: `/lamp` configurator (photo import with type/size/resolution validation, aspect-locked crop with drag + zoom, size/orientation/box-color selection, live Three.js lamp preview with on/off backlight toggle, pincode-gated delivery tiers, order placement + tracking link).
  - Backend: `POST /api/uploads/photo` (15MB JPEG/PNG multipart), `service.CalculateLampQuote` flat matrix pricing, `internal/lithophane` image→watertight binary STL generator (0.8–2.8mm relief, 512-sample grid), async generation after order placement with success/failure recorded on the order + timeline.
  - Schema: idempotent `orders` columns (`product_type`, `lamp_size`, `lamp_orientation`, `lamp_box_color`, `photo_url`, `generated_stl_url`, `stl_generation_status`); `photo-lamp-frame` catalog seed.
  - Entry points: homepage Stage 05 size CTAs → `/lamp?size=…`; featured `/explore` card → `/lamp`.
  - Verified: Go unit tests pass, `npm run build` clean, end-to-end order flow tested against a live PostgreSQL instance (photo upload → ₹699 eco order → 35MB STL generated + timeline event; express/eco pricing and legacy STL orders confirmed intact).
  - Still open before first production print: LED module measurements (box depth/rails) and panel thickness glow validation (spec Open Questions 1–2).

### Phase 4: Admin Ops Dashboard & Configurable Platform
- [x] **M15: Isolated Admin Dashboard + DB-backed settings + shipping estimator** (2026-10-17):
  - Moved hardcoded pricing/shipping values into an admin-editable `settings` table (lamp prices, eco discount, rush rate, machine rate, bulk rules, manufacturing origin pincode/address) with a 15s read cache in the public API.
  - Pincode-proximity shipping estimator (`internal/shipping`): compares customer pincode to the manufacturing origin via prefix depth (district/region/zone/national), admin-tunable day bands, per-pincode overrides (exact day window or fixed delivery date). Public endpoint `GET /api/shipping/estimate`; ETA shown live on `/lamp`.
  - Separate admin server (`cmd/admin` → `techazsure-admin` container) bound to `127.0.0.1:9090` only — never behind the public proxy; `ADMIN_TOKEN` bearer auth. Embedded dashboard: settings editor, shipping band matrix, pincode manager with overrides, estimator test tool, and dispatch stage control (closes the Phase 2 admin dashboard roadmap item).
  - Verified end-to-end: admin price/origin edits propagate to public quotes and estimates, fixed-date override honored, stage transition visible on public `/track`, unauthorized requests rejected.
- [x] **M16: `/zones` + `/upload` bug fixes** (2026-10-17):
  - `/zones` now queries the live backend (`/api/pincodes/check`) and shows the shipping-estimator ETA instead of a hardcoded client-side pincode algorithm that ignored admin edits; offline fallback retained.
  - `/upload` project mode dead end fixed: mesh (STL/OBJ) uploads now get a "Configure Print & Get Quote" button — previously MaterialSelect/DeliveryTiers/PriceSummary were unreachable for mesh files.
  - Fixed blob-URL revocation bug: the upload zone remounting on preview generation revoked the file's object URL and blanked the accepted-file card, breaking the Three.js viewer ("Error loading STL: Failed to fetch"). Real STL geometry now loads and computes true volume for quotes; photo uploads preview the placeholder mesh instead of being fed to the STL parser.

### Phase 5: Home Page Visual Redesign (PR #2 — awaiting merge)
- [x] **M17: Engineering HUD home page** (2026-10-17, branch `claude/home-page-visual-design-02688b`, see [task2_home.md](task2_home.md)):
  - Stage cards removed; every stage is an ungrouped, free-positioned scene (`components/home/StageScenes.tsx`) with scrub-reversible per-element drift/stagger choreography.
  - Blueprint figure rail (left) + live telemetry rail (right) on desktop (`components/hud/EngineeringHudRails.tsx`); stage-matched floating 2.5D product vectors (`components/home/FloatingArt.tsx`). All inline SVG, no external assets (VPS-safe).
  - Legibility system: local radial scrims + layered text shadows for headline type, dark-glass chips/panels for small type and the rails. Scroll-performance pass: lerp snaps on convergence, quantized state updates, memoized scenes/rails (previously the whole tree re-rendered at 60 fps even while idle).
  - `/lamp` 3D preview audited: rebuilds correctly for every customisation (size, orientation, box finish, lamp toggle, crop); no frame-style option exists in product or spec.
  - Verified: `tsc` + `next build` clean on the merged branch; PR mergeable with `master`.
- [ ] Owner review + merge of PR #2.
