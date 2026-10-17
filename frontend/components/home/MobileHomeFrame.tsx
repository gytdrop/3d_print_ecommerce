'use client';

/**
 * MobileHomeFrame — the portrait-phone chrome for the home scrollytelling
 * experience (below the `md` breakpoint only). The desktop frame inside
 * Fused3DScrollExperience is untouched; this is a separate composition that
 * reads the same scrub state.
 *
 * Layout (100dvh, safe-area aware):
 *   header  — brand + two targets (Products, Order)
 *   stage   — HUD-bracketed zone with a slim telemetry ruler on the right edge
 *             and the six stage scenes crossfading in the same scrub windows
 *   footer  — stage dots (active one expands to its label) + live scrub track
 */

import { memo } from 'react';
import Link from 'next/link';
import { Upload, ChevronUp } from 'lucide-react';
import { HudFrame, type SpecStage, type PricingTier } from '@/components/home/StageScenes';
import {
  MobileSpecStageScene,
  MobilePricingScene,
  MobileFooterScene,
} from '@/components/home/MobileStageScenes';

const STAGE_LABELS = ['Overview', 'Slicing', 'Hardware', 'Dispatch', 'Dimensions', 'Directory'];

interface MobileHomeFrameProps {
  scrollProgress: number;
  activeStepIndex: number;
  stages: SpecStage[];
  tiers: PricingTier[];
  getStageOpacity: (idx: number) => number;
  pricingOpacity: number;
  footerOpacity: number;
  onJumpToStep: (idx: number) => void;
  onScrub: (ratio: number) => void;
}

/** Slim vertical ruler with a live diamond marker — the phone-sized echo of
    the desktop telemetry rail. */
function Ruler({ progress }: { progress: number }) {
  return (
    <div aria-hidden className="absolute right-0 inset-y-4 w-3 pointer-events-none select-none">
      <div className="absolute inset-y-0 right-[5px] border-r border-white/15" />
      {Array.from({ length: 11 }, (_, i) => (
        <div
          key={i}
          className="absolute right-[5px] border-t border-white/25"
          style={{ top: `${i * 10}%`, width: i % 5 === 0 ? 8 : 4 }}
        />
      ))}
      <div className="absolute right-[1px] -translate-y-1/2" style={{ top: `${progress * 100}%` }}>
        <div className="w-2 h-2 rotate-45 bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
      </div>
    </div>
  );
}

function MobileHomeFrame({
  scrollProgress,
  activeStepIndex,
  stages,
  tiers,
  getStageOpacity,
  pricingOpacity,
  footerOpacity,
  onJumpToStep,
  onScrub,
}: MobileHomeFrameProps) {
  const pct = Math.round(scrollProgress * 100);

  return (
    <div className="md:hidden absolute inset-0 z-20 flex flex-col pointer-events-none px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between pointer-events-auto border-b border-white/10 pb-3">
        <Link href="/" className="flex items-center gap-2" aria-label="TechAZsure Home">
          <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs shadow-md">
            3D
          </div>
          <span className="font-semibold text-[13px] tracking-tight text-white drop-shadow-sm">
            TechAZsure 3D Print
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-xs font-medium">
          <Link href="/explore" className="px-2 py-2 text-slate-300 active:text-white drop-shadow-sm">
            Products
          </Link>
          <Link
            href="/upload"
            className="h-9 px-3 bg-white text-slate-950 font-semibold rounded-md active:bg-slate-200 flex items-center gap-1.5 shadow-md"
          >
            <Upload size={13} />
            Order
          </Link>
        </nav>
      </header>

      {/* ── Stage zone ── */}
      <div className="relative flex-1 min-h-0 my-3">
        <HudFrame />
        <Ruler progress={scrollProgress} />

        {stages.map((stage, idx) => {
          const opacity = getStageOpacity(idx);
          return (
            <div
              key={stage.step}
              className="absolute inset-0"
              style={{
                visibility: opacity > 0.01 ? 'visible' : 'hidden',
                pointerEvents: opacity > 0.5 ? 'auto' : 'none',
              }}
            >
              <MobileSpecStageScene stage={stage} o={opacity} />
            </div>
          );
        })}

        <div
          className="absolute inset-0"
          style={{
            visibility: pricingOpacity > 0.01 ? 'visible' : 'hidden',
            pointerEvents: pricingOpacity > 0.5 ? 'auto' : 'none',
          }}
        >
          <MobilePricingScene o={pricingOpacity} tiers={tiers} />
        </div>

        <div
          className="absolute inset-0"
          style={{
            visibility: footerOpacity > 0.01 ? 'visible' : 'hidden',
            pointerEvents: footerOpacity > 0.5 ? 'auto' : 'none',
          }}
        >
          <MobileFooterScene o={footerOpacity} />
        </div>

        {/* Swipe cue — fades once scrubbing begins */}
        <div
          className="absolute bottom-1 inset-x-0 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-300 tracking-[0.18em] pointer-events-none transition-opacity duration-300"
          style={{
            opacity: scrollProgress < 0.05 ? 1 : 0,
            visibility: scrollProgress < 0.05 ? 'visible' : 'hidden',
          }}
        >
          <ChevronUp size={12} className="animate-bounce" />
          <span>SWIPE UP TO INSPECT HARDWARE</span>
        </div>
      </div>

      {/* ── Bottom stage navigation ── */}
      <footer className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 pointer-events-auto">
        <div className="flex items-center gap-0.5" aria-label="Stages">
          {STAGE_LABELS.map((label, idx) => {
            const active = activeStepIndex === idx;
            return (
              <button
                type="button"
                key={label}
                onClick={() => onJumpToStep(idx)}
                aria-label={`Jump to ${label} stage`}
                aria-current={active ? 'step' : undefined}
                className={`h-8 flex items-center justify-center gap-1.5 rounded-full transition-all ${
                  active
                    ? 'px-2.5 text-[11px] font-semibold text-white bg-white/15 border border-white/20 backdrop-blur-sm shadow-sm'
                    : 'w-6 border border-transparent'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                    active ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-500'
                  }`}
                />
                {active && <span className="whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300 shrink-0">
          <span className="tabular-nums w-8 text-right">{pct}%</span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onScrub(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
            }}
            className="w-16 h-2 bg-white/10 rounded-full overflow-hidden p-0.5 relative"
            title="Tap to jump timeline"
          >
            <div
              className="h-full bg-white rounded-full transition-[width] duration-75 shadow-sm"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default memo(MobileHomeFrame);
