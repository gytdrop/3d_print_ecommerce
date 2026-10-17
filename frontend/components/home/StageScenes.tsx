'use client';

/**
 * StageScenes — ungrouped, free-positioned stage compositions for the home
 * scrollytelling experience. Every former card is decomposed into independent
 * elements (tag, badge, title, chips, metrics, CTAs, link columns) that drift
 * in from different directions with per-element stagger.
 *
 * Choreography model (Apple / antigravity.google style, scrub-reversible):
 * each element's opacity = stageOpacity ^ k (higher k ⇒ appears later) and its
 * transform = (1 - stageOpacity) * (dx, dy). Driven directly by the scroll
 * lerp, so the sequence plays identically forwards and backwards — no CSS
 * keyframe delays, which cannot reverse with a scrub.
 */

import { memo, type ComponentType } from 'react';
import Link from 'next/link';
import { Upload, ArrowRight, Shield, Clock, MapPin, Mail } from 'lucide-react';
import { siteContent } from '@/config/siteContent';
import { LampArt, LayersArt, BaseArt, ParcelArt, FramesArt, type ArtProps } from '@/components/home/FloatingArt';

export interface SpecStage {
  step: string;
  badge: string;
  tag: string;
  title: string;
  desc: string;
  metric: string;
  highlights: string[];
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  size: string;
  popular?: boolean;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Per-element entrance: opacity^k staggers appearance, (dx,dy) sets drift direction. */
const drift = (o: number, k: number, dx: number, dy: number) => {
  const c = clamp01(o);
  return {
    opacity: Math.pow(c, k),
    transform: `translate(${(1 - c) * dx}px, ${(1 - c) * dy}px)`,
  };
};

/* Layered shadows: a tight dark edge for contrast + a wide soft halo to kill
   bright video hotspots behind the glyphs. */
const TS = '[text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_3px_20px_rgba(0,0,0,0.9),0_0_40px_rgba(0,0,0,0.6)]';
const TS_SM = '[text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_12px_rgba(0,0,0,0.9)]';

const CHIP =
  'text-[11px] font-mono text-slate-100 bg-black/45 px-3 py-1.5 rounded-md border border-white/20 backdrop-blur-md shadow-sm';

/** Blueprint corner brackets + periodic specular sweep framing the scene zone. */
export function HudFrame() {
  return (
    <>
      <span aria-hidden className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/40" />
      <span aria-hidden className="absolute top-0 right-0 w-5 h-5 border-t border-r border-white/40" />
      <span aria-hidden className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-white/40" />
      <span aria-hidden className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/40" />
      <span aria-hidden className="absolute top-0 left-6 right-6 h-px overflow-hidden block">
        <span className="hud-sweep block h-full w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </span>
    </>
  );
}

/* ─── Stages 01–04: spec scenes ──────────────────────────────────────────── */

/** Per-stage 2.5D floating art: main piece matches the stage's subject. */
const STAGE_FLOATS: Record<string, { main: ComponentType<ArtProps>; alt: ComponentType<ArtProps> }> = {
  '01': { main: LampArt, alt: LayersArt },
  '02': { main: LayersArt, alt: LampArt },
  '03': { main: BaseArt, alt: LampArt },
  '04': { main: ParcelArt, alt: LampArt },
};

/* Scenes are memoized: while a stage is hidden its `o` stays 0, so the memo
   skips re-rendering 5 of the 6 scenes on every scroll frame. */
export const SpecStageScene = memo(function SpecStageScene({ stage, o }: { stage: SpecStage; o: number }) {
  const floats = STAGE_FLOATS[stage.step];
  return (
    <>
      {/* ── Desktop: free-positioned composition ── */}
      <div className="hidden md:block absolute inset-0">
        {/* Local scrim behind the headline zone only */}
        <div
          aria-hidden
          className="absolute -left-10 top-1/2 -translate-y-1/2 w-[75%] h-[130%] pointer-events-none"
          style={{
            opacity: o,
            background:
              'radial-gradient(ellipse at 32% 50%, rgba(5,6,8,0.88) 0%, rgba(5,6,8,0.55) 55%, rgba(5,6,8,0) 80%)',
          }}
        />

        {/* 2.5D floating product art — behind the text layer */}
        {floats && (
          <>
            <div
              className="absolute right-[2%] top-[50%] w-32 lg:w-40 pointer-events-none"
              style={drift(o, 1.4, 34, 18)}
            >
              <div className="hud-float">
                <floats.main id={`f${stage.step}m`} />
              </div>
            </div>
            <div
              className="absolute left-[44%] top-0 w-20 opacity-80 pointer-events-none"
              style={drift(o, 1.7, 0, -26)}
            >
              <div className="hud-float-alt">
                <floats.alt id={`f${stage.step}a`} />
              </div>
            </div>
          </>
        )}

        {/* Tag — drifts in from the left */}
        <div className="absolute left-0 top-0 flex items-center gap-2.5" style={drift(o, 1, -28, 0)}>
          <span className="w-2 h-2 border border-white/60 rotate-45" />
          <span className={`font-mono text-xs text-slate-100 tracking-[0.2em] ${TS_SM}`}>{stage.tag}</span>
        </div>

        {/* Badge — drifts in from the right */}
        <div className="absolute right-0 top-0" style={drift(o, 1.15, 28, 0)}>
          <span className="text-xs font-medium text-slate-100 bg-black/45 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md shadow-sm">
            {stage.badge}
          </span>
        </div>

        {/* Ghost step numeral — slow parallax rise behind the headline */}
        <div
          aria-hidden
          className="absolute -left-3 top-[6%] font-mono font-semibold text-[7.5rem] leading-none text-white/[0.07] select-none pointer-events-none"
          style={drift(o, 1, 0, 70)}
        >
          {stage.step}
        </div>

        {/* Headline block — title then description, each with its own timing */}
        <div className="absolute left-0 top-[21%] w-[60%] max-w-xl">
          <h1
            className={`text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight ${TS}`}
            style={drift(o, 1, 0, 34)}
          >
            {stage.title}
          </h1>
          <p
            className={`mt-5 max-w-md text-sm text-slate-100 leading-relaxed ${TS_SM}`}
            style={drift(o, 1.35, 0, 46)}
          >
            {stage.desc}
          </p>
        </div>

        {/* Highlight chips — right column, individually staggered from the right */}
        <div className="absolute right-0 top-[28%] flex flex-col items-end gap-2.5">
          {stage.highlights.map((item, i) => (
            <span key={item} className={CHIP} style={drift(o, 1.3 + i * 0.3, 36 + i * 12, 0)}>
              {item}
            </span>
          ))}
        </div>

        {/* Metric strip — rises from the bottom left */}
        <div
          className="absolute left-0 bottom-0 text-[11px] font-mono text-slate-100 bg-black/50 py-2 px-3 rounded-lg border border-white/20 backdrop-blur-md shadow-sm"
          style={drift(o, 1.6, 0, 26)}
        >
          {stage.metric}
        </div>

        {/* CTAs — last to arrive, bottom right */}
        <div className="absolute right-0 bottom-0 flex items-center gap-5" style={drift(o, 1.8, 0, 26)}>
          <Link
            href="/explore"
            className={`text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 ${TS_SM}`}
          >
            Explore catalogue
            <ArrowRight size={13} className="text-slate-300" />
          </Link>
          <Link
            href="/upload"
            className="text-xs font-semibold px-4 py-2 bg-white text-black hover:bg-slate-200 rounded-md transition-colors flex items-center gap-2 shadow-lg"
          >
            <Upload size={13} />
            Upload 3D STL
          </Link>
        </div>
      </div>

      {/* ── Mobile: compact stacked fallback ── */}
      <div className="md:hidden absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ opacity: o }}>
        <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-2">
            <span>{stage.tag}</span>
            <span>{stage.step} / 06</span>
          </div>
          <h1 className="text-lg font-semibold text-white leading-snug">{stage.title}</h1>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{stage.desc}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stage.highlights.map((h) => (
              <span key={h} className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                {h}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Link href="/explore" className="text-xs text-slate-300">
              Explore →
            </Link>
            <Link
              href="/upload"
              className="text-xs font-semibold px-3 py-1.5 bg-white text-black rounded-md flex items-center gap-1.5"
            >
              <Upload size={12} />
              Upload STL
            </Link>
          </div>
        </div>
      </div>
    </>
  );
});

/* ─── Stage 05: pricing scene ────────────────────────────────────────────── */

export const PricingScene = memo(function PricingScene({ o, tiers }: { o: number; tiers: PricingTier[] }) {
  // Explicit scatter positions: left / raised middle / right
  const POS = ['left-0 top-[34%]', 'left-[34.5%] top-[22%]', 'right-0 top-[38%]'];
  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden md:block absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 h-[130%] pointer-events-none"
          style={{
            opacity: o,
            background:
              'radial-gradient(ellipse at 50% 48%, rgba(5,6,8,0.85) 0%, rgba(5,6,8,0.5) 60%, rgba(5,6,8,0) 82%)',
          }}
        />

        {/* Floating fanned frames — behind the tier chips */}
        <div className="absolute left-[58%] bottom-[2%] w-28 pointer-events-none" style={drift(o, 1.6, 0, 30)}>
          <div className="hud-float">
            <FramesArt id="fprice" />
          </div>
        </div>

        {/* Heading — from the left */}
        <div className="absolute left-0 top-0 max-w-sm" style={drift(o, 1, -26, 0)}>
          <h2 className={`text-2xl font-semibold text-white tracking-tight ${TS}`}>Select Frame Dimensions</h2>
          <p className={`mt-1.5 text-xs text-slate-200 ${TS_SM}`}>
            Every unit includes high-resolution relief mapping, custom stand, and warm LED base.
          </p>
        </div>

        {/* Catalogue link — from the right */}
        <Link
          href="/explore"
          className={`absolute right-0 top-1.5 text-xs text-slate-200 hover:text-white transition-colors ${TS_SM}`}
          style={drift(o, 1.2, 26, 0)}
        >
          View All Products →
        </Link>

        {/* Tier chips — scattered band, middle raised, staggered rise */}
        {tiers.map((tier, i) => (
          <div
            key={tier.id}
            className={`absolute w-[31%] ${POS[i]} p-5 rounded-xl border backdrop-blur-md shadow-xl ${
              tier.popular
                ? 'border-white/30 bg-white/15 ring-1 ring-white/25'
                : 'border-white/10 bg-black/50 hover:border-white/25'
            }`}
            style={drift(o, 1.2 + i * 0.25, 0, 44 + i * 10)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{tier.name}</h3>
              {tier.popular && (
                <span className="text-[10px] uppercase font-semibold text-white bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/20">
                  Standard
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">{tier.size}</p>
            <div className="mt-3 text-xl font-semibold text-white">₹{tier.price}</div>
            <Link
              href="/upload"
              className={`mt-4 block w-full py-2 rounded text-xs font-medium text-center transition-colors shadow-md ${
                tier.popular
                  ? 'bg-white hover:bg-slate-200 text-slate-950 font-semibold'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              Customize {tier.name}
            </Link>
          </div>
        ))}

        {/* Perks — bottom left */}
        <div
          className={`absolute left-0 bottom-0 flex items-center gap-5 text-xs text-slate-200 ${TS_SM}`}
          style={drift(o, 1.7, 0, 24)}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            8-Hour Express delivery in Bangalore
          </span>
          <span className="flex items-center gap-1.5">
            <Shield size={13} className="text-slate-400" />
            Verified layer inspection
          </span>
        </div>

        {/* Pin code link — bottom right */}
        <Link
          href="/zones"
          className={`absolute right-0 bottom-0 text-xs text-slate-200 hover:underline ${TS_SM}`}
          style={drift(o, 1.9, 0, 24)}
        >
          Check pin code eligibility →
        </Link>
      </div>

      {/* ── Mobile: compact rows ── */}
      <div className="md:hidden absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ opacity: o }}>
        <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <h2 className="text-base font-semibold text-white">Select Frame Dimensions</h2>
          <div className="mt-3 space-y-2">
            {tiers.map((tier) => (
              <Link
                key={tier.id}
                href="/upload"
                className={`flex items-center justify-between py-2 px-3 rounded-lg border text-xs ${
                  tier.popular ? 'border-white/30 bg-white/15' : 'border-white/10 bg-black/40'
                }`}
              >
                <span className="font-medium text-white">{tier.name}</span>
                <span className="text-slate-300">{tier.size}</span>
                <span className="font-semibold text-white">₹{tier.price}</span>
                <ArrowRight size={12} className="text-slate-400" />
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>8-Hour Express · Bangalore</span>
            <Link href="/zones" className="text-slate-200">
              Check pin code →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
});

/* ─── Stage 06: directory / footer scene ─────────────────────────────────── */

export const FooterScene = memo(function FooterScene({ o }: { o: number }) {
  const year = new Date().getFullYear();
  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden md:block absolute inset-0">
        <div
          aria-hidden
          className="absolute -left-10 top-1/2 -translate-y-1/2 w-[80%] h-[130%] pointer-events-none"
          style={{
            opacity: o,
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(5,6,8,0.88) 0%, rgba(5,6,8,0.55) 55%, rgba(5,6,8,0) 80%)',
          }}
        />

        {/* Floating glowing lamp — the product, as the closing image */}
        <div className="absolute right-[2%] top-[52%] w-28 lg:w-32 pointer-events-none" style={drift(o, 1.5, 28, 20)}>
          <div className="hud-float">
            <LampArt id="ffoot" />
          </div>
        </div>

        {/* Brand block — from the left */}
        <div className="absolute left-0 top-[14%] max-w-sm" style={drift(o, 1, -30, 0)}>
          <span className="block w-8 border-t border-white/40 mb-2" />
          <div className={`text-2xl font-semibold text-white tracking-tight ${TS}`}>TechAZsure 3D Print</div>
          <p className={`mt-3 text-sm text-slate-100 leading-relaxed ${TS_SM}`}>{siteContent.footer.description}</p>
          <div className={`mt-4 flex items-center gap-5 text-xs text-slate-200 ${TS_SM}`}>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-slate-400" />
              Bangalore, India
            </span>
            <a
              href={`mailto:${siteContent.footer.email}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail size={12} className="text-slate-400" />
              {siteContent.footer.email}
            </a>
          </div>
        </div>

        {/* Link columns — rigid right-anchored group, shared baseline with brand */}
        <div className="absolute right-0 top-[14%] flex gap-14">
          <div className="space-y-2.5" style={drift(o, 1.3, 0, -26)}>
            <div className={`text-xs font-semibold text-white uppercase tracking-wider ${TS_SM}`}>
              <span className="block w-8 border-t border-white/40 mb-2" />
              Store
            </div>
            <ul className={`space-y-2 text-xs text-slate-200 ${TS_SM}`}>
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-white transition-colors">
                  Custom STL Upload
                </Link>
              </li>
              <li>
                <Link href="/zones" className="hover:text-white transition-colors">
                  Delivery Zones
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5" style={drift(o, 1.5, 26, 0)}>
            <div className={`text-xs font-semibold text-white uppercase tracking-wider ${TS_SM}`}>
              <span className="block w-8 border-t border-white/40 mb-2" />
              Company
            </div>
            <ul className={`space-y-2 text-xs text-slate-200 ${TS_SM}`}>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href={`tel:${siteContent.footer.phone.replace(/\s+/g, '')}`}
                  className="hover:text-white transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright — rises from the bottom, baseline-aligned with the CTA */}
        <div className={`absolute left-0 bottom-2 text-xs text-slate-300 ${TS_SM}`} style={drift(o, 1.7, 0, 20)}>
          © {year} TechAZsure Technologies Pvt. Ltd. All rights reserved.
        </div>

        {/* CTA — last element in, bottom right */}
        <Link
          href="/upload"
          className="absolute right-0 bottom-0 text-xs font-semibold px-4 py-2 bg-white text-black hover:bg-slate-200 rounded-md transition-colors flex items-center gap-2 shadow-lg"
          style={drift(o, 1.9, 0, 24)}
        >
          Start Instant Custom Order
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* ── Mobile: compact stack ── */}
      <div className="md:hidden absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ opacity: o }}>
        <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-3">
          <div className="text-base font-semibold text-white">TechAZsure 3D Print</div>
          <p className="text-xs text-slate-300 leading-relaxed">{siteContent.footer.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-300">
            <Link href="/explore">All Products</Link>
            <Link href="/upload">Custom Upload</Link>
            <Link href="/zones">Delivery Zones</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400">
            <span>© {year} TechAZsure</span>
            <Link href="/upload" className="text-slate-200 font-medium">
              Start Custom Order →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
});
