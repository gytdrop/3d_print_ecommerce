'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  ArrowRight,
  Shield,
  Clock,
  MapPin,
  Mail
} from 'lucide-react';
import { siteContent } from '@/config/siteContent';

interface StageInfo {
  step: string;
  badge: string;
  tag: string;
  title: string;
  desc: string;
  metric: string;
  highlights: string[];
}

const STAGES: StageInfo[] = [
  {
    step: '01',
    badge: 'Hardware Architecture',
    tag: 'SPEC // CORE-01',
    title: 'Custom Lithophane Lamps & Optical Additive Fabrication',
    desc: 'High-contrast photo-to-relief conversion with tuned ambient warm LED illumination. Engineered for lasting personal keepsakes, bespoke gallery displays, and precision functional prints.',
    metric: 'Sub-millimeter relief depth · Calibrated light diffusion',
    highlights: ['2700K Warm LED Engine', 'CNC Hardwood Base', 'Micro-Cavity Relief'],
  },
  {
    step: '02',
    badge: 'Micro-Layer Tolerances',
    tag: 'SPEC // RESIN-02',
    title: '0.08mm Layer Precision Across 5 Engineering Polymers',
    desc: 'Zero surface stair-stepping. Select from biocompatible PLA+, impact-resistant PETG, heat-tolerant ABS, and optical-grade translucent photopolymers for pristine optical fidelity.',
    metric: '5 Production Polymers · 0.08mm Slicing Precision',
    highlights: ['PLA+ Archival White', 'Tough PETG Mechanical', 'Optical Clear Resin'],
  },
  {
    step: '03',
    badge: 'Turnkey Specifications',
    tag: 'SPEC // HARNESS-03',
    title: 'Integrated Solid Polymer & Hardwood LED Bases',
    desc: 'Each custom lamp arrives ready to illuminate with an internal warm white LED array, precision milled base stand, tactile dimmer, and reinforced braided USB-C power connection.',
    metric: 'Warm White Ambient Array · Braided USB Connection',
    highlights: ['Type-C Power Cable', 'Touch Dimming Circuit', 'Silicone Grip Base'],
  },
  {
    step: '04',
    badge: 'Hyperlocal Logistics',
    tag: 'SPEC // ROUTE-04',
    title: 'Same-Day Express Dispatch Across Bangalore',
    desc: 'Distributed fabrication clusters throughout Bengaluru. Upload your photo or 3D STL file before 2:00 PM for doorstep courier delivery tonight across 50+ active pin codes.',
    metric: '50+ Bangalore Pin Codes · 8-Hour Express Dispatch',
    highlights: ['Koramangala & Indiranagar', 'Whitefield & Electronic City', 'HSR Layout & Hebbal'],
  },
];

interface PricingTier {
  id: string;
  name: string;
  price: number;
  size: string;
  popular?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  { id: 'small', name: 'Small Frame', price: 499, size: '10x8 cm' },
  { id: 'medium', name: 'Medium Frame', price: 799, size: '15x10 cm', popular: true },
  { id: 'large', name: 'Large Frame', price: 1299, size: '20x15 cm' },
];

export default function Fused3DScrollExperience() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Derive activeStepIndex directly from scrollProgress for 100% sync
  const activeStepIndex =
    scrollProgress < 0.14 ? 0 :
    scrollProgress < 0.30 ? 1 :
    scrollProgress < 0.46 ? 2 :
    scrollProgress < 0.62 ? 3 :
    scrollProgress < 0.80 ? 4 : 5;

  useEffect(() => {
    const video = videoRef.current;
    let animId: number;
    const lerpFactor = 0.08;

    // Lock document scroll so page never scrolls up/down
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let isSeeking = false;
    let pendingTime: number | null = null;

    const performSeek = (targetTime: number) => {
      if (!video || !video.duration) return;
      if (isSeeking) {
        pendingTime = targetTime;
        return;
      }
      isSeeking = true;
      video.currentTime = Math.max(0, Math.min(video.duration, targetTime));
    };

    const onSeeked = () => {
      isSeeking = false;
      if (pendingTime !== null) {
        const nextTime = pendingTime;
        pendingTime = null;
        performSeek(nextTime);
      }
    };

    if (video) {
      video.addEventListener('seeked', onSeeked);
    }

    // Wheel event handler: drives progress in-place with zero page movement
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      const factor = 0.00065;
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta * factor));
    };

    // Touch event handlers for mobile gestures
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const currentY = e.touches[0].clientY;
      const delta = touchStartY - currentY;
      touchStartY = currentY;
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta * 0.0016));
    };

    // Keyboard navigation (Arrow keys, Space, PageUp/PageDown)
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        targetProgressRef.current = Math.min(1, targetProgressRef.current + 0.1);
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    // Deep-link to specific stage via ?step=0..5
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get('step');
      if (stepParam !== null) {
        const stepNum = parseInt(stepParam, 10);
        if (!isNaN(stepNum) && stepNum >= 0 && stepNum <= 5) {
          const progressTargets = [0.00, 0.22, 0.38, 0.54, 0.72, 0.95];
          targetProgressRef.current = progressTargets[stepNum];
          currentProgressRef.current = progressTargets[stepNum];
          setScrollProgress(progressTargets[stepNum]);
        }
      }
    }

    const loop = () => {
      const current = currentProgressRef.current;
      const target = targetProgressRef.current;
      const next = current + (target - current) * lerpFactor;
      currentProgressRef.current = next;
      setScrollProgress(next);

      if (video && video.duration && !isNaN(video.duration)) {
        const targetTime = next * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          performSeek(targetTime);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(animId);
      if (video) {
        video.removeEventListener('seeked', onSeeked);
      }
    };
  }, []);

  // In-place opacity calculation with comfortable reading plateaus
  const getStageOpacity = (stageIndex: number) => {
    // Stage 0: visible immediately from 0.00 to 0.16
    if (stageIndex === 0) {
      if (scrollProgress <= 0.08) return 1;
      if (scrollProgress <= 0.16) return 1 - (scrollProgress - 0.08) / 0.08;
      return 0;
    }
    // Stage 1: 0.12 to 0.32
    if (stageIndex === 1) {
      if (scrollProgress < 0.12 || scrollProgress > 0.32) return 0;
      if (scrollProgress < 0.18) return (scrollProgress - 0.12) / 0.06;
      if (scrollProgress <= 0.26) return 1;
      return 1 - (scrollProgress - 0.26) / 0.06;
    }
    // Stage 2: 0.28 to 0.48
    if (stageIndex === 2) {
      if (scrollProgress < 0.28 || scrollProgress > 0.48) return 0;
      if (scrollProgress < 0.34) return (scrollProgress - 0.28) / 0.06;
      if (scrollProgress <= 0.42) return 1;
      return 1 - (scrollProgress - 0.42) / 0.06;
    }
    // Stage 3: 0.44 to 0.64
    if (stageIndex === 3) {
      if (scrollProgress < 0.44 || scrollProgress > 0.64) return 0;
      if (scrollProgress < 0.50) return (scrollProgress - 0.44) / 0.06;
      if (scrollProgress <= 0.58) return 1;
      return 1 - (scrollProgress - 0.58) / 0.06;
    }
    return 0;
  };

  // Dimensions & Pricing (0.60 -> 0.82)
  const getPricingOpacity = () => {
    if (scrollProgress < 0.60 || scrollProgress > 0.82) return 0;
    if (scrollProgress < 0.66) return (scrollProgress - 0.60) / 0.06;
    if (scrollProgress <= 0.76) return 1;
    return 1 - (scrollProgress - 0.76) / 0.06;
  };

  // Directory & Footer (0.78 -> 1.00)
  const getFooterOpacity = () => {
    if (scrollProgress < 0.78) return 0;
    if (scrollProgress < 0.86) return (scrollProgress - 0.78) / 0.08;
    return 1;
  };

  const scrollToStep = (idx: number) => {
    const progressTargets = [0.00, 0.22, 0.38, 0.54, 0.72, 0.95];
    targetProgressRef.current = progressTargets[idx];
  };

  const pricingOpacity = getPricingOpacity();
  const footerOpacity = getFooterOpacity();

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#050608] text-[#f8fafc] font-sans antialiased selection:bg-slate-700 selection:text-white select-none">
      
      {/* ─── Pinned 3D Mechanical Video Background (Zero Lag All-Intra) ─── */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#050608]">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-85 filter contrast-105 brightness-105"
          src="/videos/cube_assembly_intra_fast.mp4"
        />

        {/* Clean Radial Gradient: Gentle center vignette so 3D mechanical details remain visible through cards */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(5,6,8,0.15) 0%, rgba(5,6,8,0.6) 70%, #050608 100%)',
          }}
        />

        {/* Minimal Engineering Dot Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ─── Fixed Viewport Frame: Never scrolls off screen ─── */}
      <div className="absolute inset-0 w-full h-full z-20 flex flex-col justify-between pointer-events-none p-4 sm:p-8 md:p-10">
        
        {/* Top Clean Header (antigravity.google style) */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between pointer-events-auto border-b border-white/10 pb-4">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="TechAZsure Home">
            <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs shadow-md">
              3D
            </div>
            <span className="font-semibold text-sm tracking-tight text-white drop-shadow-sm">
              TechAZsure 3D Print
            </span>
            <span className="text-white/20">/</span>
            <span className="text-xs text-slate-300 font-normal">Showcase</span>
          </Link>
          
          <nav className="flex items-center gap-6 text-xs font-medium">
            <Link
              href="/explore"
              className="text-slate-300 hover:text-white transition-colors drop-shadow-sm"
            >
              All Products
            </Link>
            <Link
              href="/zones"
              className="text-slate-300 hover:text-white transition-colors hidden sm:inline-block drop-shadow-sm"
            >
              Bangalore Zones
            </Link>
            <Link
              href="/upload"
              className="px-3.5 py-1.5 bg-white text-slate-950 font-semibold rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Upload size={13} />
              Custom Order
            </Link>
          </nav>
        </header>

        {/* Center Stage: All stages fade in/out in the exact same coordinates */}
        <div className="w-full max-w-6xl mx-auto my-auto relative min-h-[380px] flex items-center justify-center">
          
          {/* ─── Stages 01 to 04: Product Capabilities (Transparent Frosted Glass) ─── */}
          {STAGES.map((stage, idx) => {
            const opacity = getStageOpacity(idx);
            const isVisible = opacity > 0.04;

            return (
              <div
                key={stage.step}
                className="absolute inset-x-0 mx-auto max-w-xl"
                style={{
                  opacity: opacity,
                  visibility: opacity > 0.01 ? 'visible' : 'hidden',
                  pointerEvents: opacity > 0.5 ? 'auto' : 'none',
                }}
              >
                {/* High-Contrast Engineering Glass Card */}
                <div className="bg-[#0b0f19]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-slate-300 mb-4">
                    <span className="font-mono text-slate-300 font-medium drop-shadow-sm">{stage.tag}</span>
                    <span className="font-medium text-slate-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 backdrop-blur-sm shadow-sm">
                      {stage.badge}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-white leading-snug drop-shadow-md">
                    {stage.title}
                  </h1>

                  <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal drop-shadow-sm">
                    {stage.desc}
                  </p>

                  {/* Technical Highlight Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stage.highlights.map((item) => (
                      <span
                        key={item}
                        className="text-[11px] font-mono text-slate-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/15 backdrop-blur-sm shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Technical Metric Strip */}
                  <div className="mt-4 text-[11px] font-mono text-slate-200 bg-black/40 py-2 px-3 rounded-lg border border-white/15 backdrop-blur-md flex items-center justify-between shadow-sm">
                    <span className="drop-shadow-sm">{stage.metric}</span>
                    <span className="text-slate-400 font-mono">0{idx + 1} / 06</span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <Link
                      href="/explore"
                      className="text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 drop-shadow-sm"
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
              </div>
            );
          })}

          {/* Scroll Cue (Fades out when scrubbing begins) */}
          <div 
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] font-mono text-slate-300 tracking-wider pointer-events-none transition-opacity duration-300 drop-shadow-sm"
            style={{ opacity: scrollProgress < 0.05 ? 1 : 0 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-ping" />
            <span>SCROLL OR USE ARROW KEYS TO INSPECT HARDWARE</span>
          </div>

          {/* ─── Stage 05: Sizing & Dimension Rates (Transparent Frosted Glass) ─── */}
          <div
            className="absolute inset-x-0 mx-auto max-w-3xl"
            style={{
              opacity: pricingOpacity,
              visibility: pricingOpacity > 0.01 ? 'visible' : 'hidden',
              pointerEvents: pricingOpacity > 0.5 ? 'auto' : 'none',
            }}
          >
            <div className="bg-[#0b0f19]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white drop-shadow-sm">Select Frame Dimensions</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Every unit includes high-resolution relief mapping, custom stand, and warm LED base.</p>
                </div>
                <Link
                  href="/explore"
                  className="text-xs text-slate-300 hover:text-white transition-colors"
                >
                  View All Products →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRICING_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                      tier.popular
                        ? 'border-white/30 bg-white/15 shadow-xl ring-1 ring-white/25'
                        : 'border-white/10 bg-black/50 hover:border-white/25'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">{tier.name}</h3>
                        {tier.popular && (
                          <span className="text-[10px] uppercase font-semibold text-white bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/20">
                            Standard
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{tier.size}</p>
                      <div className="mt-3 text-xl font-semibold text-white">
                        ₹{tier.price}
                      </div>
                    </div>

                    <Link
                      href={`/lamp?size=${tier.id}`}
                      className={`mt-4 w-full py-2 rounded text-xs font-medium text-center transition-colors shadow-md ${
                        tier.popular
                          ? 'bg-white hover:bg-slate-200 text-slate-950 font-semibold'
                          : 'bg-white/10 hover:bg-white/15 text-slate-200'
                      }`}
                    >
                      Customize {tier.name}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    8-Hour Express delivery in Bangalore
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} className="text-slate-400" />
                    Verified layer inspection
                  </span>
                </div>
                <Link
                  href="/zones"
                  className="text-slate-200 hover:underline"
                >
                  Check pin code eligibility →
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Stage 06: Fused In-Place Footer (Transparent Frosted Glass) ─── */}
          <div
            className="absolute inset-x-0 mx-auto max-w-4xl"
            style={{
              opacity: footerOpacity,
              visibility: footerOpacity > 0.01 ? 'visible' : 'hidden',
              pointerEvents: footerOpacity > 0.5 ? 'auto' : 'none',
            }}
          >
            <div className="bg-[#0b0f19]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-white/10">
                {/* Brand Column */}
                <div className="md:col-span-2 space-y-3">
                  <div className="text-base font-semibold text-white tracking-tight drop-shadow-sm">
                    TechAZsure 3D Print
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                    {siteContent.footer.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-400" />
                      Bangalore, India
                    </span>
                    <a href={`mailto:${siteContent.footer.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <Mail size={12} className="text-slate-400" />
                      {siteContent.footer.email}
                    </a>
                  </div>
                </div>

                {/* Navigation Columns */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Store
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><Link href="/explore" className="hover:text-white transition-colors">All Products</Link></li>
                    <li><Link href="/upload" className="hover:text-white transition-colors">Custom STL Upload</Link></li>
                    <li><Link href="/zones" className="hover:text-white transition-colors">Delivery Zones</Link></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Company
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                    <li><a href={`tel:${siteContent.footer.phone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">Support</a></li>
                  </ul>
                </div>
              </div>

              {/* Sub-footer copyright */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <span>© {new Date().getFullYear()} TechAZsure Technologies Pvt. Ltd. All rights reserved.</span>
                <div className="flex items-center gap-4">
                  <Link href="/upload" className="text-slate-200 hover:text-white transition-colors font-medium">Start Instant Custom Order →</Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Interactive Step Indicator (Antigravity scrollytelling navigation) */}
        <footer className="w-full max-w-6xl mx-auto flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-300 pointer-events-auto">
          {/* Step Pills */}
          <div className="flex items-center gap-1 sm:gap-2">
            {['Overview', 'Slicing', 'Hardware', 'Dispatch', 'Dimensions', 'Directory'].map((label, idx) => (
              <button
                type="button"
                key={label}
                onClick={() => scrollToStep(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeStepIndex === idx
                    ? 'text-white font-semibold bg-white/15 border border-white/20 backdrop-blur-sm shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                aria-label={`Jump to ${label} stage`}
              >
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${activeStepIndex === idx ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-600'}`} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Interactive Scrub Track */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
            <span>{Math.round(scrollProgress * 100)}%</span>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                targetProgressRef.current = ratio;
              }}
              className="w-24 h-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer overflow-hidden p-0.5 transition-colors relative"
              title="Click to jump timeline"
            >
              <div
                className="h-full bg-white rounded-full transition-[width] duration-75 shadow-sm"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
