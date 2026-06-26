import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { siteContent } from '@/config/siteContent';
import { themeComboMatrix, ThemeColors } from '@/config/themes';
import {
  Quicksand,
  Nunito,
  Playfair_Display,
  Inclusive_Sans,
  Fredoka,
  Lato,
  Fraunces,
  Cinzel,
  Montserrat,
  Cormorant_Garamond,
  Cabin,
  Open_Sans,
  Merriweather,
  Source_Sans_3,
  Lora,
  Inter,
  Urbanist,
  Mulish,
  Josefin_Sans,
  Work_Sans,
  Bodoni_Moda,
  Arimo,
  Jost,
  Assistant,
  Varela_Round,
  Noto_Sans,
  PT_Serif,
  Comfortaa,
  Rubik,
  Baloo_2,
  Public_Sans,
  Hind,
  Prata,
  Signika,
  Chivo,
  DM_Serif_Display,
} from 'next/font/google';

// ─── Font Definitions ────────────────────────────────────────────────────────
const fontQuicksand    = Quicksand         ({ subsets: ['latin'], variable: '--font-quicksand'    });
const fontNunito       = Nunito            ({ subsets: ['latin'], variable: '--font-nunito'       });
const fontPlayfair     = Playfair_Display  ({ subsets: ['latin'], variable: '--font-playfair'     });
const fontInclusiveSans= Inclusive_Sans    ({ subsets: ['latin'], variable: '--font-inclusivesans'});
const fontFredoka      = Fredoka           ({ subsets: ['latin'], variable: '--font-fredoka'      });
const fontLato         = Lato             ({ weight: ['400','700'], subsets: ['latin'], variable: '--font-lato'         });
const fontFraunces     = Fraunces          ({ subsets: ['latin'], variable: '--font-fraunces'     });
const fontCinzel       = Cinzel            ({ subsets: ['latin'], variable: '--font-cinzel'       });
const fontMontserrat   = Montserrat        ({ subsets: ['latin'], variable: '--font-montserrat'   });
const fontCormorant    = Cormorant_Garamond({ weight: ['400','600'], subsets: ['latin'], variable: '--font-cormorant'   });
const fontCabin        = Cabin             ({ subsets: ['latin'], variable: '--font-cabin'        });
const fontOpenSans     = Open_Sans         ({ subsets: ['latin'], variable: '--font-opensans'     });
const fontMerriweather = Merriweather      ({ weight: ['400','700'], subsets: ['latin'], variable: '--font-merriweather'});
const fontSourceSans   = Source_Sans_3     ({ subsets: ['latin'], variable: '--font-sourcesans'   });
const fontLora         = Lora              ({ subsets: ['latin'], variable: '--font-lora'         });
const fontInter        = Inter             ({ subsets: ['latin'], variable: '--font-inter'        });
const fontUrbanist     = Urbanist          ({ subsets: ['latin'], variable: '--font-urbanist'     });
const fontMulish       = Mulish            ({ subsets: ['latin'], variable: '--font-mulish'       });
const fontJosefin      = Josefin_Sans      ({ subsets: ['latin'], variable: '--font-josefin'      });
const fontWorkSans     = Work_Sans         ({ subsets: ['latin'], variable: '--font-worksans'     });
const fontBodoni       = Bodoni_Moda       ({ subsets: ['latin'], variable: '--font-bodoni'       });
const fontArimo        = Arimo             ({ subsets: ['latin'], variable: '--font-arimo'        });
const fontJost         = Jost              ({ subsets: ['latin'], variable: '--font-jost'         });
const fontAssistant    = Assistant         ({ subsets: ['latin'], variable: '--font-assistant'    });
const fontVarela       = Varela_Round      ({ weight: ['400'], subsets: ['latin'], variable: '--font-varela'       });
const fontNotoSans     = Noto_Sans         ({ subsets: ['latin'], variable: '--font-notosans'     });
const fontPTSerif      = PT_Serif          ({ weight: ['400','700'], subsets: ['latin'], variable: '--font-ptserif'      });
const fontComfortaa    = Comfortaa         ({ subsets: ['latin'], variable: '--font-comfortaa'    });
const fontRubik        = Rubik             ({ subsets: ['latin'], variable: '--font-rubik'        });
const fontBaloo        = Baloo_2           ({ subsets: ['latin'], variable: '--font-baloo'        });
const fontPublicSans   = Public_Sans       ({ subsets: ['latin'], variable: '--font-publicsans'   });
const fontHind         = Hind             ({ weight: ['400','600'], subsets: ['latin'], variable: '--font-hind'         });
const fontPrata        = Prata             ({ weight: ['400'], subsets: ['latin'], variable: '--font-prata'        });
const fontSignika      = Signika           ({ subsets: ['latin'], variable: '--font-signika'      });
const fontChivo        = Chivo             ({ subsets: ['latin'], variable: '--font-chivo'        });
const fontDmSerif      = DM_Serif_Display  ({ weight: ['400'], subsets: ['latin'], variable: '--font-dm-serif'     });

// All font variable class names — injected on <body> so every CSS var is defined
const ALL_FONT_VARS = [
  fontQuicksand, fontNunito, fontPlayfair, fontInclusiveSans, fontFredoka,
  fontLato, fontFraunces, fontCinzel, fontMontserrat, fontCormorant,
  fontCabin, fontOpenSans, fontMerriweather, fontSourceSans, fontLora,
  fontInter, fontUrbanist, fontMulish, fontJosefin, fontWorkSans,
  fontBodoni, fontArimo, fontJost, fontAssistant, fontVarela,
  fontNotoSans, fontPTSerif, fontComfortaa, fontRubik, fontBaloo,
  fontPublicSans, fontHind, fontPrata, fontSignika, fontChivo, fontDmSerif,
].map((f) => f.variable).join(' ');

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
      <head />
      <body
        className={`antialiased ${ALL_FONT_VARS}`}
        style={{
          '--font-heading': `var(${headingVar})`,
          '--font-body':    `var(${bodyVar})`,
          
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
        <div className="relative z-10 flex flex-col min-h-screen w-full overflow-x-hidden">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
