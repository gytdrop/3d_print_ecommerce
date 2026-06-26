import { ComboKey } from './themes';

/**
 * siteContent.ts
 * Single source of truth for all copy, pricing, assets, and theme selection
 * for the TechAZsure Photo-to-Lithophane Lamp platform.
 */

export const siteContent = {
  // ─── Theme Selection ──────────────────────────────────────────────────────
  // Quickly change the look and feel of the site by choosing a theme combo.
  themeControl: {
    // Set to "yes" to use one of the 20 pre-configured combos.
    // Set to "no" to use the fallback typography/color overrides below.
    useCombo: 'yes' as 'yes' | 'no',

    // Choose the active theme. Supported options grouped by design vibe:
    // • Warm & Cozy:     'cozy-moments', 'golden-warmth', 'honey-oak', 'nordic-cozy'

    // • Elegant/Classic: 'timeless-glow', 'blush-poetry', 'velvet-dusk', 'amber-journal', 'rose-library'

    // • Playful/Happy:   'sweet-celebration', 'cloudberry', 'mint-nostalgia', 'spice-market', 'marigold-festival'

    // • Organic/Earthy:  'garden-gift', 'morning-linen', 'soft-terracotta', 'sage-ritual', 'lavender-letter', 'desert-sun'
    selectedCombo: 'desert-sun' as ComboKey,

    // Fallback options (only active when useCombo: "no")
    fallback: {
      typography: 'warm' as 'warm' | 'elegant' | 'playful',
      colorPalette: 'glow' as 'glow' | 'gallery' | 'celebration',
    },
  },

  // ─── Navigation Copy ──────────────────────────────────────────────────────
  navbar: {
    logoText: 'TechAZsure',
    ctaText: 'Create Lamp',
  },

  // ─── Hero Section ─────────────────────────────────────────────────────────
  hero: {
    badgeText: 'Live in Bangalore· Same-day delivery',
    title: 'Turn your favorite photo into a glowing 3D lamp',
    description:
      'Upload a picture, select your size, and get a custom 3D-printed glowing frame. Complete with a warm LED stand.',
    ctaPrimary: 'Upload Photo',
    ctaSecondary: 'View Sizes & Pricing',
    heroSliderImages: [
      '/slides/sample1.png',
      '/slides/sample2.png',
      '/slides/sample3.png',
    ],
  },

  // ─── Footer Copy ───────────────────────────────────────────────────────────
  footer: {
    description:
      'Precision 3D printing with hyper-local delivery. Upload your photo, preview in 3D, and receive your custom lamp same day.',
    email: 'hello@techazsure.in',
    phone: '+91 99999 99999',
    location: 'Banglore, India · Serving 50+ pin codes',
    copyright: 'TechAZsure Technologies Pvt. Ltd. All rights reserved.',
  },

  // ─── Customization & Order Flow ───────────────────────────────────────────
  uploadFlow: {
    zoneTitle: 'Upload Your Image',
    zonePlaceholder: 'Drag & drop your photo here, or click to browse',
    zoneSubtext: 'Supports JPG, JPEG, and PNG (Max 25MB)',
    processingText: 'Processing image for Lithophane conversion...',
    processingSubtext: 'Calculating thickness profile & generating relief map',
    previewTitle: 'Interactive 3D Preview',
    previewBacklight: 'Toggle Lamp Backlight',
    sizeSelectLabel: 'Choose Frame Size',
    pricing: {
      small:  { name: 'Small Frame',  price: 499,  size: '10x7.5 cm'  },
      medium: { name: 'Medium Frame', price: 799,  size: '15x11.2 cm' },
      large:  { name: 'Large Frame',  price: 1299, size: '20x15 cm'   },
    },
    ctaCheckout: 'Order Custom Lamp',
  },
};
