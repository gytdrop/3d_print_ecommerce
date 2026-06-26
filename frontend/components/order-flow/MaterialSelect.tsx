'use client';

import { useState } from 'react';
import { Layers, Info, Check } from 'lucide-react';
import {
  useOrderStore,
  DEMO_BASE_PRICES,
  type MaterialTypeId,
} from '@/store/useOrderStore';

/* ─── Data ─────────────────────────────────────────────────────────────────── */

type Material = {
  id: MaterialTypeId;
  name: string;
  category: string;
  color: string;
  glowColor: string;
  density: number;       // g/cm³
  costPerGram: number;   // ₹
  strength: number;      // 1-5
  flexibility: number;   // 1-5
  detail: number;        // 1-5
  desc: string;
  popular?: boolean;
};

const MATERIALS: Material[] = [
  {
    id: 'pla', name: 'PLA', category: 'Plastic',
    color: '#60a5fa', glowColor: 'rgba(96,165,250,0.3)',
    density: 1.24, costPerGram: 18,
    strength: 3, flexibility: 2, detail: 5,
    desc: 'Easy to print. Great for prototypes & display models.',
    popular: true,
  },
  {
    id: 'abs', name: 'ABS', category: 'Plastic',
    color: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)',
    density: 1.05, costPerGram: 22,
    strength: 4, flexibility: 3, detail: 4,
    desc: 'Impact-resistant. Ideal for functional mechanical parts.',
  },
  {
    id: 'petg', name: 'PETG', category: 'Plastic',
    color: '#34d399', glowColor: 'rgba(52,211,153,0.3)',
    density: 1.27, costPerGram: 25,
    strength: 4, flexibility: 4, detail: 4,
    desc: 'Best of PLA & ABS. Food-safe, moisture-resistant.',
    popular: true,
  },
  {
    id: 'resin', name: 'Resin', category: 'Resin',
    color: '#a78bfa', glowColor: 'rgba(167,139,250,0.3)',
    density: 1.18, costPerGram: 35,
    strength: 3, flexibility: 1, detail: 5,
    desc: 'Ultra-fine details. Perfect for miniatures & jewellery.',
  },
  {
    id: 'nylon', name: 'Nylon', category: 'Composite',
    color: '#fb7185', glowColor: 'rgba(251,113,133,0.3)',
    density: 1.01, costPerGram: 42,
    strength: 5, flexibility: 5, detail: 3,
    desc: 'Tough & flexible. Excellent for living hinges & gears.',
  },
  {
    id: 'carbon', name: 'Carbon CF', category: 'Composite',
    color: '#9ca3af', glowColor: 'rgba(156,163,175,0.2)',
    density: 1.35, costPerGram: 89,
    strength: 5, flexibility: 2, detail: 3,
    desc: 'Lightweight, stiff, premium. For structural parts.',
  },
];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function StatBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ background: i < value ? color : 'var(--border-mid)' }}
        />
      ))}
    </div>
  );
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function MaterialSelect() {
  // Read from store
  const materialType = useOrderStore((s) => s.materialType);
  const fileData     = useOrderStore((s) => s.fileData);
  // Write to store
  const setMaterialType = useOrderStore((s) => s.setMaterialType);
  const setBasePrice    = useOrderStore((s) => s.setBasePrice);

  const [showInfo, setShowInfo] = useState(false);

  const selected = materialType;

  function handleSelect(id: MaterialTypeId) {
    setMaterialType(id);
    // Reactively update the base price when the material changes,
    // but only if a file has already been accepted.
    if (fileData !== null) {
      setBasePrice(DEMO_BASE_PRICES[id]);
    }
  }

  const active = MATERIALS.find((m) => m.id === selected)!;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Layers size={16} className="text-[var(--bg-accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-on-page)]">Material</h2>
        <button
          type="button"
          onClick={() => setShowInfo(v => !v)}
          className="ml-auto p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-on-card)] hover:bg-[var(--bg-glass)] transition-colors"
          aria-label="Material information"
          aria-expanded={showInfo}
        >
          <Info size={14} />
        </button>
      </div>

      {/* Material grid */}
      <div className="p-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select material">
        {MATERIALS.map((mat) => {
          const isActive = selected === mat.id;
          return (
            <button
              type="button"
              key={mat.id}
              id={`material-select-${mat.id}`}
              role="radio"
              aria-checked={isActive}
              onClick={() => handleSelect(mat.id as MaterialTypeId)}
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 group ${
                isActive
                  ? 'border-[var(--bg-accent)] bg-[var(--accent-muted)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-mid)] hover:bg-[var(--bg-glass)]'
              }`}
              style={isActive ? { boxShadow: `0 0 16px ${mat.glowColor}` } : {}}
            >
              {/* Popular badge */}
              {mat.popular && !isActive && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-accent)] text-white px-1.5 py-0.5 rounded-full">
                  Popular
                </span>
              )}

              {/* Selected check */}
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--bg-accent)] flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}

              {/* Color swatch */}
              <div
                className="w-8 h-8 rounded-lg mb-2 transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${mat.color}, ${mat.color}66)`,
                  boxShadow: isActive ? `0 0 12px ${mat.glowColor}` : 'none',
                }}
              />

              <p className={`text-xs font-semibold ${isActive ? 'text-[var(--bg-accent)]' : 'text-[var(--text-on-page)]'}`}>
                {mat.name}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">₹{mat.costPerGram}/g</p>
            </button>
          );
        })}
      </div>

      {/* Active material detail panel */}
      {active && (
        <div
          className="mx-4 mb-4 p-4 rounded-xl border transition-all duration-300"
          style={{
            background: `${active.color}08`,
            borderColor: `${active.color}30`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-[var(--text-on-page)]">{active.name}</span>
                <span className="badge badge-cyan text-[9px]">{active.category}</span>
              </div>
              <p className="text-xs text-[var(--text-on-card)] leading-relaxed">{active.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-[var(--text-muted)]">Density</p>
              <p className="text-sm font-semibold text-[var(--text-on-page)]">{active.density} g/cm³</p>
            </div>
          </div>

          {/* Property bars */}
          {showInfo && (
            <div className="mt-3 pt-3 border-t grid gap-2" style={{ borderColor: `${active.color}20` }}>
              {[
                { label: 'Strength',    value: active.strength },
                { label: 'Flexibility', value: active.flexibility },
                { label: 'Detail',      value: active.detail },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[10px] text-[var(--text-muted)] w-20">{label}</span>
                  <div className="flex-1">
                    <StatBar value={value} color={active.color} />
                  </div>
                  <span className="text-[10px] text-[var(--text-on-card)] w-4">{value}/5</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
