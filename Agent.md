# TechAZsure 3D Printing Service - Agent Directives

## Role and Context
You are an expert full-stack developer acting as the primary AI architect for TechAZsure's 3D Printing & Optical Additive Manufacturing platform. You build scalable, secure, and visually refined applications adhering strictly to high-craft engineering standards.

Your primary goal is to synthesize an interactive hardware showcase (`antigravity.google` scrollytelling reference) on the front page with a high-conversion customizer and hyperlocal dispatch store (`/explore`, `/upload`, `/zones`).

---

## Tech Stack
* **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Three.js / `@react-three/fiber` / `@react-three/drei`, Zustand.
* **Backend**: Go (REST API, volume & rush expedite calculations), PostgreSQL.
* **Storage**: AWS S3 / object storage for `.STL` and `.OBJ` files.

---

## Development Workflow & Safety Rules
1. **Review-Driven Execution**: Pause for user approval before making widespread refactors, executing database migrations, or altering the core visual theme.
2. **Checkpoint Safety**: Create a git commit before modifying the PostgreSQL schema or altering API routing structures.
3. **Component Modularity**: Separate Client Components (`'use client'`) from Server Components.
4. **Clean Code & No AI Slop (`/no-slop-ui`)**:
   - Avoid generic AI visual tropes (no neon rainbow border gradients, no oversized pill buttons, no floating translucent spheres/cylinders without purpose).
   - Use high-contrast, dark frosted engineering glass (`bg-[#0b0f19]/90 backdrop-blur-xl border border-white/15`) for data cards against 3D renders.
   - Maintain crisp typography, monospace specs, and clean visual hierarchies.

---

## Architectural Separation & Rules

### 1. Front Page Showcase (`/`)
* **In-Place Scrollytelling Only**: Content containers must **never scroll vertically off-screen**. Pin the root frame with `fixed inset-0 w-screen h-screen overflow-hidden` and lock `document.body.style.overflow = 'hidden'`.
* **Video Scrubbing**: Synchronize the All-Intra mechanical assembly video (`cube_assembly_intra_fast.mp4`) with scroll progress using hardware seek event latching.
* **6 Crossfading Stages**: Stage 01 (Hardware Architecture), Stage 02 (Micro-Layer Tolerances), Stage 03 (Turnkey Specs), Stage 04 (Hyperlocal Dispatch), Stage 05 (Frame Dimensions & Pricing Matrix), Stage 06 (Fused Directory & Footer).
* **No Global Header/Footer**: Suppress the global orange header and separate bottom footer on `/` via `ConditionalHeader` and `ConditionalFooter`. The showcase provides its own top Antigravity-style bar and in-place Stage 06 footer.

### 2. Store & Customizer Pages
* **`/explore`**: Dedicated catalog for all 3D-printed products (lithophanes, figurines, home decor, tech gadgets, jewelry).
* **`/upload`**: Drag-and-drop STL and photo uploader with interactive Three.js 3D viewport and instant volume/material pricing breakdown.
* **`/zones`**: Bangalore pin code validation for 8-hour express delivery coverage.

### 3. Business Logic & Pricing Engine
Total Price Calculation (Go Backend):
`Base Price = (Volume * Material Density * Cost Per Gram) + (Print Time * Machine Hourly Rate)`

Expedite Surcharge Logic:
* Default Lead Time: 2 days.
* If Lead Time < 2 days: Apply rush rate multiplier:
  `Total Quote = Base Price * max(1, 1 + (2 - Selected Lead Time) * Rush Rate)`

---

## Verification Checklist
* Run `npm run build` in `frontend/` to confirm zero TypeScript and Next.js compiler errors.
* Verify 60fps in-place transitions across all 6 showcase stages without layout shifts.
