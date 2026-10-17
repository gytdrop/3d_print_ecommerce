# TechAZsure 3D Print — File & Component Hierarchy

```
techazsure/
└── 3d print/
    ├── Agent.md                     # Agent directives, design rules & pricing formulas
    ├── LEDGER.md                    # Core architecture resume, purpose, stack & roadmap
    ├── PROJECT.md                   # Architecture, API interface contracts & container specs
    ├── README.md                    # Primary repository overview & quickstart
    ├── hierarchy.md                 # System file and component hierarchy map
    ├── install.md                   # Environment, dependency & Docker install guide
    ├── progress.md                  # Milestone status & completion tracker
    ├── photo-lamp-spec.md           # PRD for the Photo Lamp Frame product (/lamp)
    ├── docker-compose.yml           # Production multi-container orchestration
    ├── .env.docker                  # Docker compose environment variables
    │
    ├── docker/
    │   └── nginx/
    │       └── nginx.conf           # Security reverse proxy with rate limiting & CSP
    │
    ├── backend/                     # Go REST backend service
    │   ├── Dockerfile               # Multi-stage Alpine build (public server + admin binaries)
    │   ├── .dockerignore            # Docker ignore file
    │   ├── cmd/server/main.go       # Public HTTP server entrypoint
    │   ├── cmd/admin/               # ISOLATED admin dashboard server (127.0.0.1:9090, token auth)
    │   │   ├── main.go              # Admin entrypoint: auth middleware + embedded dashboard
    │   │   └── dashboard.html       # Self-contained ops dashboard (settings, pincodes, orders)
    │   ├── go.mod / go.sum          # Go module definitions
    │   └── internal/
    │       ├── admin/               # Admin REST API (config, pincode overrides, dispatch stages)
    │       ├── config/              # DB-backed platform settings (pricing & shipping, cached)
    │       ├── db/                  # DB connection pool, schema.sql & seed.sql
    │       ├── handlers/            # Public REST handlers (health, pincodes, quote, orders, shipping estimate, lamp)
    │       ├── lithophane/          # Photo → watertight lithophane STL generator
    │       ├── service/             # Pricing engines (volumetric STL + lamp matrix)
    │       └── shipping/            # Pincode-proximity delivery estimator (vs manufacturing origin)
    │
    └── frontend/                    # Next.js 16 storefront application
        ├── Dockerfile               # Multi-stage standalone Next.js build
        ├── .dockerignore            # Docker ignore file
        ├── .npmrc                   # legacy-peer-deps configuration
        ├── next.config.ts           # Standalone output & /api/* proxy rewrites
        ├── package.json             # NPM dependencies & build scripts
        │
        ├── app/
        │   ├── layout.tsx           # Global HTML layout with Schema.org LocalBusiness JSON-LD
        │   ├── globals.css          # Tailwind CSS 4 styling and design tokens
        │   ├── page.tsx             # Homepage mounting Fused3DScrollExperience
        │   ├── explore/page.tsx     # Full product catalog with Schema.org ItemList JSON-LD
        │   ├── track/page.tsx       # Live 5-stage dispatch telemetry tracking portal
        │   ├── upload/page.tsx      # Lithophane & STL customizer with 3D WebGL preview
        │   ├── zones/page.tsx       # Bangalore 6-digit pin code delivery checker
        │   └── about/page.tsx       # Company story, tolerances & support contact
        │
        ├── components/
        │   ├── Fused3DScrollExperience.tsx # In-place 3D showcase (antigravity.google style)
        │   ├── layout/
        │   │   ├── ConditionalHeader.tsx   # Hides global header on homepage showcase
        │   │   ├── ConditionalFooter.tsx   # Hides global footer on homepage showcase
        │   │   ├── Header.tsx              # Storefront navigation bar (includes Track Order link)
        │   │   └── Footer.tsx              # Storefront global footer
        │   ├── order-flow/
        │   │   ├── UploadZone.tsx          # Drag & drop photo/STL upload container
        │   │   ├── DeliveryTiers.tsx       # Express vs standard delivery selector (/api/pincodes)
        │   │   ├── MaterialSelect.tsx      # Polymer selector (PLA+, PETG, ABS, Resin)
        │   │   └── PriceSummary.tsx        # Dynamic quote breakdown & checkout (/api/orders)
        │   └── viewer/
        │       ├── ModelViewer.tsx         # Three.js canvas for interactive STL simulation
        │       └── Scroll3DProductCanvas.tsx # WebGL fallback canvas
        │
        ├── config/
        │   ├── siteContent.ts       # Central source of truth for copy, pricing & specs
        │   └── themes.ts            # 20 pre-configured design theme matrices
        │
        ├── store/
        │   └── useOrderStore.ts     # Zustand store for order configuration & cart (/api/quote)
        │
        └── public/
            ├── placeholder.stl      # Fallback STL 3D asset
            ├── videos/
            │   └── cube_assembly_intra_fast.mp4 # Zero-lag All-Intra 3D scrub video
            ├── models/              # Product preview renders
            └── slides/              # Lithophane slide assets
```
