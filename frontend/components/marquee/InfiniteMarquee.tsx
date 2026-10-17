'use client';

import { 
  Zap, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  Cpu, 
  Flame, 
  Sparkles, 
  Box, 
  Clock, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react';

const ROW_1 = [
  { icon: Zap, text: '8-Hour Express Bangalore Delivery', highlight: 'Express' },
  { icon: Layers, text: '0.08mm Micro-Layer Tolerance', highlight: 'Ultra-Fine' },
  { icon: MapPin, text: '50+ Bangalore Pin Codes Active', highlight: 'Hyperlocal' },
  { icon: Clock, text: 'Same-Day Dispatch for Orders Before 2 PM', highlight: 'Fast-Track' },
  { icon: ShieldCheck, text: 'Dual-Point Dimensional Verification', highlight: 'Quality' },
  { icon: Box, text: 'Direct STL/OBJ Automated Volumetric Slicing', highlight: 'Real-Time' },
];

const ROW_2 = [
  { icon: Cpu, text: 'Bambu Lab X1-Carbon Precision Fleet', highlight: 'Hardware' },
  { icon: Sparkles, text: 'Optical Grade Translucent Glow Resin', highlight: 'Premium' },
  { icon: Flame, text: 'High-Temperature Chemical Resistant ABS', highlight: 'Industrial' },
  { icon: Sliders, text: 'Custom 2700K Warm Edison LED Base Included', highlight: 'Turnkey' },
  { icon: Layers, text: 'High-Impact Carbon-Reinforced PETG', highlight: 'Structural' },
  { icon: CheckCircle2, text: 'Zero Stair-Stepping Lithophane Curvature', highlight: 'Optics' },
];

export default function InfiniteMarquee() {
  return (
    <div className="relative w-full py-12 overflow-hidden bg-[#03050a] border-y border-white/5 select-none">
      {/* Side gradient fade masks */}
      <div className="absolute top-0 left-0 w-24 sm:w-48 h-full bg-gradient-to-r from-[#03050a] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 sm:w-48 h-full bg-gradient-to-l from-[#03050a] to-transparent z-10 pointer-events-none" />

      <div className="flex flex-col gap-3.5">
        {/* Row 1 (Left Scrolling) */}
        <div className="flex w-fit animate-marquee-left hover:[animation-play-state:paused] whitespace-nowrap">
          {[...ROW_1, ...ROW_1, ...ROW_1].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`r1-${idx}`}
                className="flex items-center gap-2.5 mx-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md hover:border-cyan-500/40 hover:bg-slate-800/80 transition-colors"
              >
                <div className="w-5 h-5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Icon size={12} />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  {item.text}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase tracking-wider">
                  {item.highlight}
                </span>
              </div>
            );
          })}
        </div>

        {/* Row 2 (Right Scrolling) */}
        <div className="flex w-fit animate-marquee-right hover:[animation-play-state:paused] whitespace-nowrap">
          {[...ROW_2, ...ROW_2, ...ROW_2].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`r2-${idx}`}
                className="flex items-center gap-2.5 mx-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md hover:border-amber-500/40 hover:bg-slate-800/80 transition-colors"
              >
                <div className="w-5 h-5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Icon size={12} />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  {item.text}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase tracking-wider">
                  {item.highlight}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-left {
          animation: marqueeLeft 38s linear infinite;
        }
        .animate-marquee-right {
          animation: marqueeRight 42s linear infinite;
        }
      `}</style>
    </div>
  );
}
