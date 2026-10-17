# TechAZsure 3D Print — Hardware Showcase & E-Commerce Platform

A production-grade 3D printing and custom optical lithophane fabrication platform. The application combines an in-place, scrollytelling hardware showcase on the front page with a full-featured e-commerce catalog, instant 3D STL quoting engine, real-time dispatch telemetry, and hyperlocal delivery verification across Bengaluru.

---

## Architecture Overview

```
Client Browser (Port 80)
         │
         ▼
┌──────────────────────────────────────────┐
│      techazsure-proxy (Nginx:Alpine)     │
│  - Rate Limiting (15 req/s, burst 20)    │
│  - Enterprise Security Headers           │
│  - Reverse Proxy Routing (/ & /api/)     │
└────────────┬─────────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼ (Port 3000)   ▼ (Port 8080)
┌───────────────┐ ┌────────────────────────┐
│  frontend     │ │        backend         │
│ (Next.js 16)  │ │   (Go REST Server)     │
└───────────────┘ └───────────┬────────────┘
                              │ SQL Connection (Port 5432)
                              ▼
                  ┌────────────────────────┐
                  │           db           │
                  │ (PostgreSQL 16 Alpine) │
                  └────────────────────────┘
```

---

## Key Features

### 1. Front-Page In-Place 3D Showcase (`/`)
- **Antigravity-Inspired Scrollytelling**: Architectural and design reference taken from [`antigravity.google`](https://antigravity.google/).
- **Zero Vertical Page Displacement**: Fixed viewport pinning (`fixed inset-0 w-screen h-screen overflow-hidden bg-[#050608]`) prevents content containers from moving vertically off-screen. Wheel, touch, and keyboard deltas drive timeline progress in place.
- **Zero-Lag Video Scrubbing**: Frame-accurate seeking against an All-Intra mechanical assembly video (`cube_assembly_intra_fast.mp4`) with hardware latching.
- **High-Contrast Engineering Frosted Glass**: Built with dark engineering glass cards (`bg-[#0b0f19]/90 backdrop-blur-xl border border-white/15 ring-1 ring-white/10`) ensuring 100% legibility against specular 3D render highlights.
- **6 Unified Stages**:
  1. `Stage 01 (Overview)`: Hardware Architecture & Optical Additive Fabrication
  2. `Stage 02 (Slicing)`: 0.08mm Layer Precision Across 5 Engineering Polymers
  3. `Stage 03 (Hardware)`: Turnkey Specifications & Braided USB-C LED Engine
  4. `Stage 04 (Dispatch)`: Hyperlocal Logistics Across 50+ Bangalore Pin Codes
  5. `Stage 05 (Dimensions)`: Select Frame Dimensions & Pricing Matrix (Small ₹499, Medium ₹799, Large ₹1299)
  6. `Stage 06 (Directory)`: Fused Store Directory & Copyright Footer
- **Timeline Scrub & Pill Navigation**: Interactive step pills with real-time percentage scrub track and direct jumping.

### 2. E-Commerce Store & Dedicated Pages
- **`/explore` (Product Catalog)**: Browse 3D-printed lithophanes, figurines, home decor, jewelry, keychains, and architectural models with Schema.org `ItemList` & `Product` structured data.
- **`/upload` (Custom STL / Photo Quoting)**: Drag-and-drop STL or image uploader with interactive 3D WebGL preview and dynamic quote breakdown.
- **`/track` (Real-Time Dispatch Telemetry)**: Real-time 5-stage progress indicators and event checkpoints for placed orders.
- **`/zones` (Bangalore Delivery Coverage)**: 6-digit pin code checker verifying 8-hour express vs standard courier delivery eligibility.
- **`/about`**: Craftsmanship story, additive manufacturing tolerances, and support contact details.

### 3. Backend & Data Layer
- **Go REST Service**: High-performance endpoints for volume calculation, material density pricing, rush expedite surcharges, order placement, and tracking lookups.
- **PostgreSQL Database**: Relational schema storing active delivery pin codes, catalog categories, products, materials, customers, orders, order timeline, and payments.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Reverse Proxy** | Nginx Alpine (Rate limiting, CSP, HSTS, X-Frame-Options) |
| **Frontend Framework** | Next.js 16.2.9 (App Router, Standalone output) |
| **UI Library** | React 19, TypeScript 5, Tailwind CSS 4 |
| **3D Rendering** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **Icons & Design** | Lucide React, Custom Dark Frosted Engineering Glass tokens (`/no-slop-ui`) |
| **State Management** | Zustand (order flow state, pricing tier selection) |
| **Backend Engine** | Go 1.24 (`net/http`, custom pricing & quoting service) |
| **Database** | PostgreSQL 16 Alpine (`pgcrypto`) |

---

## Quick Start (Docker)

To launch the complete multi-container stack:
```bash
docker compose --env-file .env.docker up -d
```
All services will start on Port 80 (`http://localhost/`).

See [LEDGER.md](file:///home/gytdrop/Documents/Desktop_Archive/BHAYYA/techazsure/3d%20print/LEDGER.md) for complete architecture resume, ledger, and remaining roadmap.
