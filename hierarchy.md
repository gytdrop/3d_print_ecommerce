techazsure/
├── 3d print/
│   └── frontend/
│       ├── app/
│       │   ├── layout.tsx             # Global layout (Dynamic Google Fonts & theme provider integration)
│       │   ├── page.tsx               # Homepage (Split-screen desktop layout & touch-swipeable mobile layout)
│       │   ├── upload/
│       │   │   └── page.tsx           # Lithophane upload & interactive 3D preview page
│       │   ├── zones/                 # Delivery zones checker
│       │   ├── explore/               # Explore flow
│       │   └── about/                 # About section
│       ├── components/
│       │   ├── index.ts               # Barrel file for active components
│       │   ├── layout/
│       │   │   ├── Header.tsx         # Responsive configuration-driven header navbar
│       │   │   └── Footer.tsx         # Configuration-driven bottom footer
│       │   ├── order-flow/
│       │   │   ├── UploadZone.tsx     # 2D image drag & drop and dynamic badge container
│       │   │   └── PriceSummary.tsx   # Order cost breakdown
│       │   └── viewer/
│       │       └── ModelViewer.tsx    # Three.js canvas for 3D lithophane simulation
│       ├── config/
│       │   ├── siteContent.ts         # Single source of truth for all copy, pricing, assets, and footer
│       │   └── themes.ts              # Theme combos matrix and interface definitions
│       ├── public/
│       │   ├── placeholder.stl
│       │   └── slides/                # Generated 3D lithophane slide assets
│       │       ├── sample1.png
│       │       ├── sample2.png
│       │       └── sample3.png
│       └── tailwind.config.js
├── archive/
│   └── deprecated_features/           # Deprecated engineering/3D specs pages & components
│       ├── pricing/                   # Archived Pricing page
│       ├── materials/                 # Archived Materials page
│       └── MaterialSelect.tsx         # Archived material selector component
└── package-lock.json