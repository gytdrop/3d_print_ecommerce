# PRD — Photo Lamp Frame (`/lamp`)

**Status**: Draft v1 · **Author**: TechAZsure founder + Claude · **Date**: 2026-10-17
**Platform**: TechAZsure 3D Print (Next.js 16 storefront · Go REST backend · PostgreSQL 16)

---

## Problem Statement

Customers want a personal, giftable 3D-printed product but the current `/upload` flow assumes they already have an STL file or understand 3D printing — a barrier for the mainstream gifting buyer. The homepage showcase already advertises frame sizes (₹499/₹799/₹1299) and a USB-C LED engine, but there is no dedicated flow where a customer can turn a phone photo into that product. Every day without it, the platform's highest-emotion, highest-margin SKU is effectively unbuyable.

**The product**: the customer imports a photo; it is printed as a 2.5D lithophane panel that slides into the open front face of a cuboidal lamp box with a warm-white USB-C LED inside. Lit, the photo glows through the relief.

---

## Goals

1. **Launch a self-serve photo → lamp flow** at `/lamp` where a non-technical user goes from photo import to placed order in under 3 minutes.
2. **Convert with a live "wow" preview** — an orbitable 3D render of their own photo as a backlit lithophane in the chosen box, before paying anything.
3. **Produce print-ready output automatically** — the Go backend generates the lithophane STL at order time so operators receive a printable file, not a raw photo.
4. **Reuse the existing order spine** — quoting matrix, `POST /api/orders`, `order_timeline`, `/track`, and delivery-tier logic all carry over; no parallel fulfillment system.
5. **Business goal**: make the Photo Lamp ≥30% of all placed orders within 60 days of launch.

## Non-Goals

- **Payment integration** — stays in Phase 2 (Razorpay/Cashfree) for the whole platform; lamp orders use the current place-order-then-track flow.
- **Cloud object storage** — photos and generated STLs use the existing local `/uploads/` path; migrates to S3/GCS together with STL uploads in Phase 2.
- **Multi-photo / collage panels** — one photo per panel in v1; collage layouts are a future configurator mode.
- **RGB / selectable LED variants** — every lamp ships with one warm-white braided USB-C LED module. One SKU per size×color keeps inventory and print profiles simple.
- **Custom dimensions** — exactly three fixed sizes; the dynamic volume-quote engine is not used for this product (flat matrix pricing).
- **Mobile app / AR preview** — web-only WebGL preview in v1.

---

## Product Definition

### Physical product
| | Small | Medium | Large |
|---|---|---|---|
| Visible panel (W×H, landscape) | 10 × 8 cm | 15 × 10 cm | 20 × 15 cm |
| Aspect ratio | 5:4 | 3:2 | 4:3 |
| Box depth | ~5–6 cm (LED clearance; final value → Open Questions) | | |
| Price (flat, incl. panel + box + LED) | ₹499 | ₹799 | ₹1299 |

- **Orientation**: portrait or landscape (panel W×H swaps; crop UI locks to the matching ratio).
- **Panel**: translucent white PLA, fixed — the only material that renders a backlit image correctly. Printed at 0.08 mm layers.
- **Box**: cuboidal, open front face with **slide-in rails** so the panel is swappable; rear cable pass-through hole for the USB-C lead. Customer-selectable color/finish: **matte black, white, walnut wood-tone PLA**.
- **Lamp**: warm-white braided USB-C LED module, included in every unit.

### Flow (happy path)
1. User lands on `/lamp` (from homepage Stage 05 CTA or `/explore` card).
2. Imports a photo (drag-drop or file picker): JPG/PNG/WebP, ≤15 MB.
3. Picks size (S/M/L) and orientation (portrait/landscape); crop/zoom UI locked to that panel's aspect ratio.
4. Picks box color (black / white / walnut).
5. Live 3D preview: orbitable cuboidal box with the photo-displaced panel in the open face, **lamp on/off toggle** (emissive warm backlight vs unlit relief).
6. Enters pincode (existing tier check), address, contact → **Place Order**.
7. Backend stores the photo + config, generates the lithophane STL, creates the order with `product_type = 'photo_lamp'`, returns order ID → success state links to `/track?id=…`.

---

## User Stories

**Gifting buyer (primary persona — non-technical, mobile-first)**
- As a gifting buyer, I want to upload a photo from my phone and immediately see it as a glowing lamp so that I'm confident the gift will look good before paying.
- As a gifting buyer, I want to crop and zoom my photo inside the exact panel shape so that faces aren't cut off in the printed result.
- As a gifting buyer, I want to be warned when my photo's resolution is too low so that I don't receive a blurry print.
- As a gifting buyer, I want to choose the lamp size and box color and see the final flat price instantly so that there are no surprises at checkout.
- As a gifting buyer, I want to check my pincode and pick express delivery so that the gift arrives in time.
- As a gifting buyer, I want a tracking link after ordering so that I can follow slicing → print → QC → delivery.

**Returning customer**
- As a returning customer, I want to order an additional panel for a box I already own so that I can swap photos seasonally. *(P2 — rails design enables it; flow out of scope v1.)*

**Print-farm operator**
- As an operator, I want each lamp order to arrive with a print-ready lithophane STL, size/orientation/color config, and the original photo so that I never reconstruct intent manually.
- As an operator, I want lamp orders in the same timeline/tracking system as STL orders so that dispatch runs one queue.

---

## Requirements

### Must-Have (P0)

**P0-1 · `/lamp` page (Next.js, client components + Zustand slice)**
- [ ] Route exists with global Header/Footer (not the showcase layout), SEO metadata, and Schema.org `Product` JSON-LD.
- [ ] Stepper: photo → size/orientation → crop → color → preview → delivery/contact → confirm.
- [ ] Fully usable at 375 px width (gifting traffic is mobile).

**P0-2 · Photo import & validation**
- [ ] Accept JPG/PNG/WebP via drag-drop and file picker; reject other types and >15 MB with clear errors.
- [ ] Soft block below 1200 px on the short edge: warning "print quality may suffer" with explicit override; no hard rejection.
- [ ] Photo uploads to existing local uploads path; stored reference joins the order payload.

**P0-3 · Crop UI**
- [ ] Crop/zoom/pan box locked to the selected size+orientation aspect ratio (5:4, 3:2, 4:3; swapped for portrait).
- [ ] Changing size or orientation re-locks the crop ratio without losing the user's framing where possible.
- [ ] Crop rectangle (normalized coords) is sent with the order so server STL generation matches the preview exactly.

**P0-4 · Live 3D preview (Three.js / R3F, reusing viewer patterns)**
- Given a cropped photo, when the preview loads, then it shows an orbitable cuboidal box in the chosen color with the photo as a displacement/alpha-mapped panel seated in the open front face.
- Given the preview, when the user toggles the lamp, then the panel switches between emissive warm-white backlit rendering and unlit matte relief.
- [ ] Preview updates on size, orientation, color, and crop changes.
- [ ] Graceful fallback (static simulated image) if WebGL is unavailable.

**P0-5 · Server-side lithophane STL generation (Go)**
- Given a placed order, when the backend processes it, then it converts the cropped grayscale image into a relief heightmap and emits a watertight printable STL (panel + mounting edge matching the rails) stored alongside the order.
- [ ] Thickness mapped dark→thick / light→thin within a configurable min/max mm range.
- [ ] Generation is asynchronous-safe: order placement never blocks on STL generation; failure flags the order for operator attention rather than losing it.

**P0-6 · Orders integration**
- [ ] `orders` schema extended: `product_type` (`'stl' | 'photo_lamp'`), lamp config (size, orientation, box color), photo reference, generated STL reference. Existing STL orders unaffected.
- [ ] `POST /api/orders` accepts the lamp payload; flat matrix price (₹499/₹799/₹1299) + existing delivery-tier surcharge; returns order ID and final price.
- [ ] Pincode check and delivery tiers reuse `GET /api/pincodes/check` and existing tier logic.
- [ ] `/track` renders lamp orders through the same 5-stage timeline.

**P0-7 · Entry points**
- [ ] Homepage showcase Stage 05 (frame pricing matrix) CTA links to `/lamp`.
- [ ] `/explore` gains a featured "Photo Lamp Frame" card (`Product` JSON-LD) whose Customize button routes to `/lamp`.

### Nice-to-Have (P1)
- **P1-1** Before/after slider in preview (original photo vs lithophane simulation).
- **P1-2** Server-generated preview thumbnail of the lit lamp attached to the tracking page and order record.
- **P1-3** Image auto-enhance for lithophane (contrast stretch, optional B&W) with on/off toggle.
- **P1-4** Header nav link and `/upload` cross-link banner ("Uploading a photo? Try the Photo Lamp Frame").
- **P1-5** Operator download bundle: original photo + cropped grayscale + STL from one tracking-admin URL.

### Future Considerations (P2)
- **P2-1 Extra-panel reorders** — "new panel for your existing box" flow at panel-only pricing; schema should already distinguish panel vs full-lamp line items.
- **P2-2 Collage/multi-photo panels** and text engraving on the box.
- **P2-3 RGB/remote LED variant** as a priced add-on.
- **P2-4 S3/GCS storage + Razorpay checkout** — land with platform Phase 2; keep file references abstract (path/URL column, not filesystem assumptions).

---

## Success Metrics

**Leading (first 2–4 weeks)**
- Photo-import → order conversion ≥ 8% (stretch 15%).
- Preview reached by ≥ 70% of users who import a photo (funnel drop-off before preview < 30%).
- Median photo→order time < 3 min.
- STL auto-generation success ≥ 98% of placed orders (failures flagged, zero lost orders).
- Low-res warning override rate tracked (quality-risk signal for ops).

**Lagging (60–90 days)**
- Photo Lamp ≥ 30% of all placed orders.
- Reprint/complaint rate for lamp orders < 3%.
- Repeat purchase rate of lamp buyers ≥ 10% (gifting is seasonal/repeatable).

*Measurement: order rows by `product_type` in PostgreSQL; funnel events via lightweight client telemetry (mechanism → Open Questions).*

## Open Questions

**Blocking (answer before build)**
1. **Hardware**: exact internal box depth and rail dimensions vs the USB-C LED module's physical size — needs a measured module. *(founder/ops)*
2. **Panel thickness range** (typical 0.8–3.0 mm min/max) and border/frame margin — confirm against printer + tested glow quality. *(ops)*

**Non-blocking (resolve during build)**
3. Does 8-hour express realistically apply to lamp orders given print time (M/L panels can exceed 6 h print)? May need per-size express eligibility. *(ops)*
4. Ship fully assembled with LED installed, or panel + box + LED as a 30-second self-assembly kit (cheaper, safer transit)? *(ops)*
5. Client telemetry mechanism for funnel metrics — existing tooling or minimal first-party events table? *(engineering)*
6. Any content-moderation stance on uploaded photos before printing? *(founder)*
7. Box color PLA SKUs: confirm walnut wood-tone filament availability at launch or swap to a stocked third color. *(ops)*

## Timeline Considerations

- **No hard external deadline**, but gifting demand peaks around Diwali/Christmas — launching before mid-November maximizes season capture.
- **Dependency**: none on Phase 2 (payments/S3); this feature deliberately rides the current order spine.
- **Suggested phasing**:
  - **v1.0 (this spec, P0 only)**: `/lamp` flow, preview, server STL, orders integration, two entry points.
  - **v1.1 (fast follow)**: P1 items — auto-enhance, nav links, operator bundle.
  - **v2 (with platform Phase 2)**: payments at order time, S3 storage, extra-panel reorders.
