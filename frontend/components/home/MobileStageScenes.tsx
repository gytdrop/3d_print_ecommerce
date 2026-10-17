'use client';

/**
 * MobileStageScenes — portrait-phone compositions for the home scrollytelling
 * experience (rendered below the `md` breakpoint only; the desktop scenes in
 * StageScenes.tsx are untouched).
 *
 * The desktop scenes scatter elements across a wide canvas. On a tall, narrow
 * phone the same elements are re-choreographed as a single reading column:
 * tag row → badge → headline → description → chips → metric → CTAs, with the
 * 2.5D product art floating behind the column. The scrub-reversible `drift`
 * model is reused, but the drift is mostly vertical so elements rise into
 * place as the stage fades in.
 */

import { memo } from 'react';
import Link from 'next/link';
import { Upload, ArrowRight, Shield, Clock, MapPin, Mail } from 'lucide-react';
import { siteContent } from '@/config/siteContent';
import { LampArt, FramesArt } from '@/components/home/FloatingArt';
import {
  drift,
  TS,
  TS_SM,
  STAGE_FLOATS,
  type SpecStage,
  type PricingTier,
} from '@/components/home/StageScenes';

const CHIP_M =
  'text-[10px] font-mono text-slate-100 bg-black/45 px-2.5 py-1 rounded-md border border-white/20 backdrop-blur-md shadow-sm';

/** Mono tag row shared by every mobile stage: left tag, right step counter. */
function TagRow({ tag, step, o }: { tag: string; step: string; o: number }) {
  return (
    <div className="flex items-center gap-2" style={drift(o, 1, -20, 0)}>
      <span className="w-1.5 h-1.5 border border-white/60 rotate-45 shrink-0" />
      <span className={`font-mono text-[10px] text-slate-100 tracking-[0.2em] ${TS_SM}`}>{tag}</span>
      <span className={`ml-auto font-mono text-[10px] text-slate-300 tabular-nums ${TS_SM}`}>{step} / 06</span>
    </div>
  );
}

/** Local scrim behind the reading column so type stays legible over the video. */
function Scrim({ o }: { o: number }) {
  return (
    <div
      aria-hidden
      className="absolute -inset-x-4 -inset-y-6 pointer-events-none"
      style={{
        opacity: o,
        background:
          'radial-gradient(ellipse at 42% 50%, rgba(5,6,8,0.9) 0%, rgba(5,6,8,0.62) 50%, rgba(5,6,8,0) 86%)',
      }}
    />
  );
}

/* ─── Stages 01–04: spec scenes ──────────────────────────────────────────── */

export const MobileSpecStageScene = memo(function MobileSpecStageScene({
  stage,
  o,
}: {
  stage: SpecStage;
  o: number;
}) {
  const floats = STAGE_FLOATS[stage.step];
  return (
    <div className="absolute inset-0 flex flex-col justify-center pr-6">
      <Scrim o={o} />

      <div className="relative">
        {/* 2.5D art — behind the text layer. Main piece sits bottom-right beside
            the chips/metric rows (which reserve space for it); the alt piece
            peeks out above the headline on the right. */}
        {floats && (
          <>
            <div
              className="absolute right-0 bottom-[4.5rem] w-24 pointer-events-none"
              style={drift(o, 1.4, 26, 14)}
            >
              <div className="hud-float">
                <floats.main id={`m${stage.step}m`} />
              </div>
            </div>
            <div
              className="absolute right-4 -top-[5.75rem] w-16 opacity-70 pointer-events-none"
              style={drift(o, 1.7, 0, -18)}
            >
              <div className="hud-float-alt">
                <floats.alt id={`m${stage.step}a`} />
              </div>
            </div>
          </>
        )}

        {/* Ghost step numeral — slow rise behind the headline */}
        <div
          aria-hidden
          className="absolute -left-2 -top-8 font-mono font-semibold text-[5.5rem] leading-none text-white/[0.07] select-none pointer-events-none"
          style={drift(o, 1, 0, 44)}
        >
          {stage.step}
        </div>

        <TagRow tag={stage.tag} step={stage.step} o={o} />

        {/* Badge */}
        <div className="mt-3" style={drift(o, 1.1, -16, 0)}>
          <span className="inline-block text-[10px] font-medium text-slate-100 bg-black/45 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md shadow-sm">
            {stage.badge}
          </span>
        </div>

        {/* Headline + description */}
        <h1
          className={`mt-3 text-[1.6rem] leading-[1.15] font-semibold tracking-tight text-white ${TS}`}
          style={drift(o, 1, 0, 28)}
        >
          {stage.title}
        </h1>
        <p
          className={`mt-3 text-[13px] leading-relaxed text-slate-100 ${TS_SM} [@media(max-height:700px)]:line-clamp-3`}
          style={drift(o, 1.3, 0, 36)}
        >
          {stage.desc}
        </p>

        {/* Highlight chips — wrap, reserving the right edge for the art */}
        <div className="mt-4 flex flex-wrap gap-2 pr-24">
          {stage.highlights.map((item, i) => (
            <span key={item} className={CHIP_M} style={drift(o, 1.3 + i * 0.25, 22 + i * 8, 0)}>
              {item}
            </span>
          ))}
        </div>

        {/* Metric strip */}
        <div
          className="mt-3 max-w-[calc(100%-6rem)] text-[10px] font-mono text-slate-100 bg-black/50 py-1.5 px-2.5 rounded-lg border border-white/20 backdrop-blur-md shadow-sm leading-snug"
          style={drift(o, 1.6, 0, 22)}
        >
          {stage.metric}
        </div>

        {/* CTAs — full-width primary, compact secondary; 44px touch targets */}
        <div className="mt-5 flex items-center gap-3" style={drift(o, 1.8, 0, 22)}>
          <Link
            href="/upload"
            className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-white text-black text-xs font-semibold rounded-md shadow-lg active:bg-slate-200"
          >
            <Upload size={14} />
            Upload 3D STL
          </Link>
          <Link
            href="/explore"
            className="h-11 px-4 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/20 bg-black/40 backdrop-blur-md text-xs font-medium text-slate-100 active:bg-black/60"
          >
            Explore
            <ArrowRight size={13} className="text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
});

/* ─── Stage 05: pricing scene ────────────────────────────────────────────── */

export const MobilePricingScene = memo(function MobilePricingScene({
  o,
  tiers,
}: {
  o: number;
  tiers: PricingTier[];
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center pr-6">
      <Scrim o={o} />

      <div className="relative">
        {/* Fanned frames — behind the heading, top right */}
        <div className="absolute right-2 -top-[5.5rem] w-24 opacity-80 pointer-events-none" style={drift(o, 1.6, 0, -22)}>
          <div className="hud-float">
            <FramesArt id="mprice" />
          </div>
        </div>

        <TagRow tag="SPEC // FRAME-05" step="05" o={o} />

        <h2 className={`mt-3 text-2xl font-semibold text-white tracking-tight ${TS}`} style={drift(o, 1, 0, 26)}>
          Select Frame Dimensions
        </h2>
        <p className={`mt-2 pr-20 text-xs text-slate-200 leading-relaxed ${TS_SM}`} style={drift(o, 1.2, 0, 30)}>
          Every unit includes high-resolution relief mapping, custom stand, and warm LED base.
        </p>

        {/* Tier rows — 56px tap targets, staggered rise */}
        <div className="mt-4 space-y-2">
          {tiers.map((tier, i) => (
            <Link
              key={tier.id}
              href="/upload"
              className={`flex items-center gap-3 h-14 px-4 rounded-xl border backdrop-blur-md shadow-xl ${
                tier.popular
                  ? 'border-white/30 bg-white/15 ring-1 ring-white/25'
                  : 'border-white/10 bg-black/50 active:border-white/25'
              }`}
              style={drift(o, 1.2 + i * 0.25, 28 + i * 8, 0)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{tier.name}</span>
                  {tier.popular && (
                    <span className="text-[9px] uppercase font-semibold text-white bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/20">
                      Standard
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">{tier.size}</div>
              </div>
              <span className="text-base font-semibold text-white tabular-nums">₹{tier.price}</span>
              <ArrowRight size={14} className="text-slate-400 shrink-0" />
            </Link>
          ))}
        </div>

        {/* Perks */}
        <div
          className={`mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-200 ${TS_SM}`}
          style={drift(o, 1.7, 0, 20)}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-slate-400" />
            8-Hour Express · Bangalore
          </span>
          <span className="flex items-center gap-1.5">
            <Shield size={12} className="text-slate-400" />
            Verified layer inspection
          </span>
        </div>

        {/* Secondary links */}
        <div
          className={`mt-3 flex items-center justify-between text-xs text-slate-200 ${TS_SM}`}
          style={drift(o, 1.9, 0, 20)}
        >
          <Link href="/explore" className="py-1 active:text-white">
            View all products →
          </Link>
          <Link href="/zones" className="py-1 active:text-white">
            Check pin code →
          </Link>
        </div>
      </div>
    </div>
  );
});

/* ─── Stage 06: directory / footer scene ─────────────────────────────────── */

export const MobileFooterScene = memo(function MobileFooterScene({ o }: { o: number }) {
  const year = new Date().getFullYear();
  return (
    <div className="absolute inset-0 flex flex-col justify-center pr-6">
      <Scrim o={o} />

      <div className="relative">
        {/* Glowing lamp — the product, as the closing image, behind the brand */}
        <div className="absolute right-2 -top-[7.25rem] w-20 pointer-events-none" style={drift(o, 1.5, 22, -14)}>
          <div className="hud-float">
            <LampArt id="mfoot" />
          </div>
        </div>

        <TagRow tag="SPEC // DIRECTORY-06" step="06" o={o} />

        {/* Brand block */}
        <div className="mt-3 pr-20" style={drift(o, 1, 0, 26)}>
          <span className="block w-8 border-t border-white/40 mb-2" />
          <div className={`text-2xl font-semibold text-white tracking-tight leading-tight ${TS}`}>
            TechAZsure 3D Print
          </div>
        </div>
        <p className={`mt-3 text-[13px] text-slate-100 leading-relaxed ${TS_SM}`} style={drift(o, 1.2, 0, 30)}>
          {siteContent.footer.description}
        </p>
        <div
          className={`mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-200 ${TS_SM}`}
          style={drift(o, 1.3, 0, 26)}
        >
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-slate-400" />
            Bangalore, India
          </span>
          <a href={`mailto:${siteContent.footer.email}`} className="flex items-center gap-1.5 active:text-white">
            <Mail size={12} className="text-slate-400" />
            {siteContent.footer.email}
          </a>
        </div>

        {/* Link columns — two-up on a dark-glass surface */}
        <div
          className="mt-4 grid grid-cols-2 gap-5 bg-black/45 backdrop-blur-md border border-white/10 rounded-xl p-4"
          style={drift(o, 1.5, 0, 26)}
        >
          <div>
            <div className={`text-[11px] font-semibold text-white uppercase tracking-wider ${TS_SM}`}>
              <span className="block w-8 border-t border-white/40 mb-2" />
              Store
            </div>
            <ul className={`mt-2 space-y-1 text-xs text-slate-200 ${TS_SM}`}>
              <li>
                <Link href="/explore" className="block py-1 active:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/upload" className="block py-1 active:text-white">
                  Custom STL Upload
                </Link>
              </li>
              <li>
                <Link href="/zones" className="block py-1 active:text-white">
                  Delivery Zones
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className={`text-[11px] font-semibold text-white uppercase tracking-wider ${TS_SM}`}>
              <span className="block w-8 border-t border-white/40 mb-2" />
              Company
            </div>
            <ul className={`mt-2 space-y-1 text-xs text-slate-200 ${TS_SM}`}>
              <li>
                <Link href="/about" className="block py-1 active:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href={`tel:${siteContent.footer.phone.replace(/\s+/g, '')}`}
                  className="block py-1 active:text-white"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright + CTA */}
        <div className={`mt-4 text-[11px] text-slate-300 ${TS_SM}`} style={drift(o, 1.7, 0, 20)}>
          © {year} TechAZsure Technologies Pvt. Ltd. All rights reserved.
        </div>
        <Link
          href="/upload"
          className="mt-3 h-11 inline-flex w-full items-center justify-center gap-2 text-xs font-semibold bg-white text-black rounded-md shadow-lg active:bg-slate-200"
          style={drift(o, 1.9, 0, 22)}
        >
          Start Instant Custom Order
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
});
