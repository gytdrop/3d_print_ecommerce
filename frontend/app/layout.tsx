import type { Metadata, Viewport } from 'next';
import './globals.css';
import ConditionalHeader from '@/components/layout/ConditionalHeader';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import { siteContent } from '@/config/siteContent';
import { themeComboMatrix, ThemeColors } from '@/config/themes';
// System font stack matching high-performance engineering platforms
const ALL_FONT_VARS = '';

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    template: `%s | ${siteContent.navbar.logoText}`,
    default: `${siteContent.navbar.logoText} — ${siteContent.hero.title}`,
  },
  description: siteContent.hero.description,
  keywords: ['lithophane', 'custom lamp', 'photo gift', 'same-day delivery', 'personalized light'],
  openGraph: {
    type: 'website',
    siteName: siteContent.navbar.logoText,
    title: `${siteContent.navbar.logoText} — ${siteContent.hero.title}`,
    description: siteContent.hero.description,
  },
};

// Phone portrait: let the fixed home frame extend under the notch / home bar
// (safe-area insets are applied inside the frame itself).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050608',
};

// ─── Theme Resolution Logic ──────────────────────────────────────────────────
function resolveTheme(): { headingVar: string; bodyVar: string; colors: ThemeColors } {
  const { themeControl } = siteContent;

  if (themeControl.useCombo === 'yes') {
    // Combo path — look up the selected combo in the matrix
    const combo = themeComboMatrix[themeControl.selectedCombo as keyof typeof themeComboMatrix];
    if (combo) {
      return {
        headingVar: combo.headingFont,
        bodyVar:    combo.bodyFont,
        colors:     combo.colors,
      };
    }
  }

  // Fallback path — use the separated typography + colorPalette strings
  const { typography } = themeControl.fallback;
  const fallbackMap: Record<string, { headingVar: string; bodyVar: string }> = {
    warm:    { headingVar: '--font-quicksand', bodyVar: '--font-nunito'        },
    elegant: { headingVar: '--font-playfair',  bodyVar: '--font-inclusivesans' },
    playful: { headingVar: '--font-fredoka',   bodyVar: '--font-lato'          },
  };
  const fonts = fallbackMap[typography] ?? fallbackMap['warm'];
  const defaultColors = themeComboMatrix['cozy-moments'].colors;
  return { ...fonts, colors: defaultColors };
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { headingVar, bodyVar, colors } = resolveTheme();

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "TechAZsure 3D Print",
              "image": "https://techazsure.com/logo.png",
              "description": "Enterprise-grade on-demand 3D printing and customized manufacturing hub with express 8-hour Bangalore delivery.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bangalore",
                "addressRegion": "Karnataka",
                "postalCode": "560001",
                "addressCountry": "IN"
              },
              "priceRange": "₹149 - ₹1299",
              "openingHours": "Mo-Su 08:00-22:00",
              "telephone": "+91-80-3DPRINT",
              "url": "https://techazsure.com"
            })
          }}
        />
      </head>
      <body
        className={`antialiased ${ALL_FONT_VARS} bg-[#050608] text-[#f8fafc]`}
        style={{
          '--font-heading': `var(${headingVar}, var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)`,
          '--font-body':    `var(${bodyVar}, var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)`,
          
          '--bg-page': colors.bgPage,
          '--bg-card': colors.bgCard,
          '--text-on-page': colors.textOnPage,
          '--text-on-card': colors.textOnCard,
          '--bg-accent': colors.bgAccent,
          '--text-on-accent': colors.textOnAccent,
          '--accent-muted': colors.accentMuted,
          '--accent-glow': colors.accentGlow,
          '--accent-hover': colors.accentHover,
          '--bg-glass': colors.bgGlass,
          '--bg-glass-hover': colors.bgGlassHover,
          '--border-subtle': colors.borderSubtle,
          '--border-mid': colors.borderMid,
          '--text-muted': colors.textMuted,
        } as React.CSSProperties}
      >
        {/* Ambient orbs */}
        <div className="ambient-bg" aria-hidden="true">
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
          <div className="ambient-orb ambient-orb-3" />
        </div>

        {/* Subtle grid texture */}
        <div className="fixed inset-0 grid-bg opacity-100 pointer-events-none z-0" aria-hidden="true" />

        {/* Page structure */}
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          <ConditionalHeader />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
        </div>
      </body>
    </html>
  );
}
