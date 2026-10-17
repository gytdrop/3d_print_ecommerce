'use client';

import { Layers, ShieldCheck, Zap, MapPin, Gauge } from 'lucide-react';

const STATS = [
  {
    icon: Layers,
    value: '50,000+',
    label: 'Micro-Layers Sliced',
    detail: 'Precision additive layers extruded with zero visual stair-stepping',
    color: 'text-cyan-400',
    borderColor: 'hover:border-cyan-500/40',
  },
  {
    icon: Gauge,
    value: '0.08 mm',
    label: 'Micro-Layer Tolerance',
    detail: 'Calibrated stereolithography & filament micro-tolerances',
    color: 'text-blue-400',
    borderColor: 'hover:border-blue-500/40',
  },
  {
    icon: Zap,
    value: '8-Hour',
    label: 'Fastest Bangalore Dispatch',
    detail: 'Orders placed before 2:00 PM delivered doorstep tonight',
    color: 'text-emerald-400',
    borderColor: 'hover:border-emerald-500/40',
  },
  {
    icon: MapPin,
    value: '50+',
    label: 'Bangalore Pin Codes',
    detail: 'Direct hyperlocal logistics across all central & tech corridors',
    color: 'text-amber-400',
    borderColor: 'hover:border-amber-500/40',
  },
];

export default function StatsSection() {
  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-3xl bg-[#080c16]/80 border border-white/10 backdrop-blur-md shadow-xl transition-all duration-300 ${stat.borderColor} group flex flex-col justify-between`}
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={18} className={stat.color} />
                </div>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  {stat.label}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed border-t border-white/5 pt-3">
                {stat.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
