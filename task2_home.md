# Task 2 — Home Page Visual Fill (Engineering HUD)

> Status: **awaiting final owner review** · Branch: `claude/home-page-visual-design-02688b` · Started: 2026-10-17
> PR: https://github.com/gytdrop/3d_print_ecommerce/pull/2 (mergeable; master merged in)

## Problem

The home page (`frontend/components/Fused3DScrollExperience.tsx`) is a fixed full-viewport
scrub-video scrollytelling experience. The Three.js-rendered assembly video and the fading
glass cards work well, but the screen reads as **dull** — a single centered card leaves large
empty dark regions on the left and right of every stage.

## Decisions (confirmed with owner, 2026-10-17)

| Question | Decision |
|---|---|
| Visual style | **Engineering HUD** — blueprint SVG callouts, dimension lines, wireframe diagrams, spec readouts (matches the existing `SPEC // CORE-01` language) |
| Fill areas | **Side rails, left + right** of the center card, changing per scroll stage |
| Asset source | **Hand-coded inline SVG** React components (crisp, animatable, zero asset weight); AI-generated SVG also acceptable |
| Density | **Balanced** — clearly fuller, but the video + center card stay the stars |
| Mobile | Rails hidden below `xl` breakpoint (no crowding on small screens) |

## Deployment note

**This application will be deployed on a VPS** (self-hosted, not a managed platform).
The existing Docker Compose stack (Nginx reverse proxy on port 80 → Next.js :3000 + Go :8080
→ PostgreSQL :5432) is the deployment unit. All home-page visuals must therefore stay
self-contained (inline SVG, local `/public` assets, no external CDNs or font/image calls).
This note is mirrored in `README.md` and `PROJECT.md`.

## Work plan

- [x] Explore current home page implementation and asset inventory
- [x] Confirm art direction with owner (Q&A above)
- [x] Create this task file
- [x] Add VPS deployment note to `README.md` and `PROJECT.md`
- [x] Build `frontend/components/hud/EngineeringHudRails.tsx`
  - Left rail: per-stage wireframe diagram (crossfades with stage)
    - Stage 01 Overview — lithophane lamp wireframe with dimension lines + light rays
    - Stage 02 Slicing — layer-stack diagram with 0.08 mm callout + nozzle path
    - Stage 03 Hardware — exploded view: frame / LED array / base / USB-C
    - Stage 04 Dispatch — Bangalore hub-and-spoke route map with pin nodes
    - Stage 05 Dimensions — nested S/M/L frame outlines with dimension arrows
    - Stage 06 Directory — compass / crosshair coordinates plate
  - Right rail: persistent telemetry column
    - Vertical ruler with live progress marker tied to scrub position
    - Per-stage spec readout block (mono type, animated values)
    - Status ticks: layer res, material, LED temp, dispatch window
- [x] Wire rails into `Fused3DScrollExperience` (driven by `scrollProgress` / `activeStepIndex`)
- [x] Verify: `next build` clean, no console errors, stage crossfades in sync with cards
- [x] Hybrid cardless pass (owner choice, 2026-10-17 round 2):
  - Stages 01–04: glass box removed — type sits directly on the video behind a local
    radial scrim; badges / metric strip / CTAs remain as small glass chips
  - HUD corner brackets + periodic specular edge sweep (`HudFrame`) on all content zones
  - Pricing & footer panels: clearer glass (55% fill, `backdrop-blur-md`)
- [x] PR opened: https://github.com/gytdrop/3d_print_ecommerce/pull/2
- [x] Ungrouped scene pass (owner feedback, round 3 — "big card feels unsettling"):
  - New `frontend/components/home/StageScenes.tsx` — every card decomposed into
    independent free-positioned elements (tag, badge, ghost step numeral, title,
    description, highlight chips, metric, CTAs, link columns, copyright)
  - Scrub-reversible choreography: per-element `opacity^k` stagger + directional
    drift `(1-o)·(dx,dy)` driven by the scroll lerp (Apple / antigravity model —
    plays identically forwards and backwards, unlike CSS keyframe delays)
  - Pricing: 3 tier chips scattered at staggered heights (middle raised);
    footer: brand lower-left, link columns upper-right, copyright + CTA bottom
  - Scene zone reserves rail space on xl+ (`xl:left-56 xl:right-56`); rail
    recede behavior removed (no more collisions, FIG.05/06 fully visible)
  - Mobile (< md): compact stacked fallbacks, one small glass panel per stage
    (superseded 2026-10-17 by the phone-portrait pass below)
- [x] Typography legibility pass (round 4): layered text shadows, lifted slate
  tones, dark-glass chips, deeper scrims, rail drop-shadows
- [x] 2.5D floating product art (round 5) — `frontend/components/home/FloatingArt.tsx`:
  glossy gradient-faced vectors (glowing lithophane lamp, layer slabs, LED base,
  dispatch parcel + pin, fanned frames) floating per stage with bob animation +
  scroll drift; positions change per stage. Also fixed rails jumping above the
  header (drop-shadow filter made the wrapper a containing block — wrapper is
  now `absolute inset-0`).
- [x] Merge conflict with master resolved (master's old-card edits superseded by
  scenes; its new tier sizes 10x8 / 15x10 carried through `PRICING_TIERS`)
- [x] Directory stage typography settled (round 6): brand + Store + Company on one
  shared baseline, rigid right-anchored column group with fixed gap, blueprint
  rule lines above headers, copyright/CTA baseline-aligned, lamp moved below the
  columns; footer fade window moved to 0.82–0.90 so it no longer interleaves
  with the pricing fade-out (rails updated to match)
- [x] Scroll performance pass (round 6): lerp snaps on convergence + UI state
  quantized to sub-visible steps (was re-rendering the whole tree at 60fps
  forever, even idle); scenes + rails memoized so hidden stages skip rendering;
  video still scrubs on the precise unquantized value
- [x] Docs updated: README key-features section, PROJECT.md code layout,
  LEDGER.md design language (all described the retired frosted-glass cards)
- [ ] Final owner review → merge PR #2
- [x] Phone-portrait pass (branch `claude/home-mobile-portrait-view-445a7a`, 2026-10-17) —
  desktop (`md+`) untouched; below `md` the experience gets its own composition:
  - `frontend/components/home/MobileHomeFrame.tsx` — phone chrome: brand + Products /
    Order header, HUD-bracketed stage zone with a slim right-edge telemetry ruler (ticks +
    live diamond marker), swipe cue, bottom stage dots (active dot expands to its label)
    + live scrub track. `100dvh` + safe-area padding (`viewport-fit=cover` set in
    `app/layout.tsx`).
  - `frontend/components/home/MobileStageScenes.tsx` — each desktop scatter scene
    re-choreographed as one reading column (tag row → badge → headline → description →
    chips → metric → full-width CTAs; pricing as 56 px tier rows; directory as two link
    columns + full-width CTA). Same scrub-reversible `drift` model, mostly vertical.
    Floating 2.5D art kept, placed above the tag row and beside the chips.
  - Touch model (phone only): swipe sensitivity lowered so one swipe ≈ one stage, and on
    release the timeline snaps to the nearest stage plateau (`STAGE_TARGETS`), so a flick
    never parks between two crossfades. Taps / <10 px moves leave the timeline alone.
  - Desktop frame now renders only at `md+` (`useIsPhone` after mount; CSS decides before);
    old `md:hidden` fallbacks removed from `StageScenes.tsx`. Phone landscape not addressed.

## Log

- **2026-10-17** — Explored repo; home = `Fused3DScrollExperience` (video scrub + 6 fading
  stages). Stale screenshot in `public/screenshots/home.png` predates this design. Confirmed
  direction with owner. Created this file; installed frontend deps; dev server verified on :3000.
- **2026-10-17** — Implemented `EngineeringHudRails` (~470 lines, pure inline SVG + Tailwind):
  - **Left rail** — 6 blueprint figures (FIG.01–06) crossfading on the exact same scroll
    windows as the center cards: lamp assembly w/ dimension line, 0.08 mm layer-stack with
    magnifier callout, exploded plate/LED/base/USB-C view, Bangalore hub-and-spoke dispatch
    map with real pin codes, nested S/M/L frame outlines with price table, and a compass
    plate with Bengaluru coordinates. Header shows per-stage drawing tag + DWG number.
  - **Right rail** — persistent telemetry column: live % readout (tabular mono), STAGE n/06,
    per-stage spec block (crossfades on `activeStepIndex`), pulsing status dot, and a
    vertical ruler with a glowing diamond marker tracking scrub position in real time.
  - Rails are `hidden xl:block`, `aria-hidden`, `pointer-events-none`. During the wider
    pricing/footer stages (05–06) rails recede: opacity 0.35 + 14 px outward shift, 700 ms ease.
  - Verified in browser at 1280×720: stage-0 clearances 80 px (left) / 112 px (right) to the
    card; correct single diagram visible per stage; recede + readout switch confirmed via
    computed styles at `?step=4`. `tsc --noEmit` and `next build` both clean.
