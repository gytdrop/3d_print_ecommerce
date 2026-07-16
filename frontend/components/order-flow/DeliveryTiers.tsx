'use client';

import { useState } from 'react';
import { Zap, Clock, Check, MapPin, ChevronRight } from 'lucide-react';
import { useOrderStore, type DeliveryTierId } from '@/store/useOrderStore';

/* ─── Types ──────────────────────────────────────────────────────────────── */

type TierId = DeliveryTierId;


interface Tier {
  id: TierId;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  accentBg: string;
  accentShadow: string;
  label: string;
  tagline: string;
  detail: string;
  badge?: string;
  badgeClass?: string;
  surcharge: string;
  surchargeLabel: string;
}

/* ─── Tier definitions ───────────────────────────────────────────────────── */

const TIERS: Tier[] = [
  {
    id: 'express-8h',
    icon: Zap,
    iconBg:        'var(--accent-muted)',
    iconColor:     'var(--bg-accent)',
    accentBorder:  'var(--bg-accent)',
    accentBg:      'var(--accent-muted)',
    accentShadow:  '0 0 28px var(--accent-glow)',
    label:         '8-Hour Local Express',
    tagline:       'Order by noon — delivered by 8 PM, today.',
    detail:        'Rider-picked. Hyper-local. No courier middlemen.',
    badge:         '⚡ FASTEST',
    badgeClass:    'badge-accent',
    surcharge:     '+ ₹299 rush',
    surchargeLabel: 'Expedite surcharge applied',
  },
  {
    id: 'standard-2d',
    icon: Clock,
    iconBg:        'rgba(156,163,175,0.1)',
    iconColor:     '#9ca3af',
    accentBorder:  'rgba(255,255,255,0.12)',
    accentBg:      'rgba(255,255,255,0.03)',
    accentShadow:  'none',
    label:         '2-Day Standard',
    tagline:       'Delivered within 2 business days.',
    detail:        'Default lead time. No rush surcharge.',
    surcharge:     'No extra charge',
    surchargeLabel: 'Included in base price',
  },
  {
    id: 'budget-5-7d',
    icon: Clock,
    iconBg:        'rgba(16,185,129,0.1)',
    iconColor:     '#10b981',
    accentBorder:  'rgba(16,185,129,0.3)',
    accentBg:      'rgba(16,185,129,0.05)',
    accentShadow:  'none',
    label:         '5-7 Day Eco/Budget',
    tagline:       'Eco-friendly shipping tier. Flat ₹100 discount.',
    detail:        'Slower shipping for bulk or budget friendly orders.',
    surcharge:     '- ₹100 discount',
    surchargeLabel: 'Discount applied to quote',
  },
];

/* ─── Pincode banner ─────────────────────────────────────────────────────── */

function PincodeBanner() {
  const [value, setValue] = useState('');
  const pincode = useOrderStore((s) => s.pincode);
  const eligible = useOrderStore((s) => s.pincodeEligible);
  const message = useOrderStore((s) => s.pincodeMessage);
  const setPincode = useOrderStore((s) => s.setPincode);
  const setPincodeEligible = useOrderStore((s) => s.setPincodeEligible);
  const setPincodeMessage = useOrderStore((s) => s.setPincodeMessage);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length !== 6) return;
    try {
      const response = await fetch(`http://localhost:8080/api/pincodes/check?pincode=${value}`);
      if (!response.ok) {
        console.error('Failed to check pincode');
        return;
      }
      const data = await response.json();
      setPincode(value);
      setPincodeEligible(data.eligible);
      setPincodeMessage(data.message);
    } catch (error) {
      console.error('Error checking pincode:', error);
    }
  };

  if (pincode !== '' && eligible !== null) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          eligible
            ? 'border-[var(--bg-accent)]/30 bg-[var(--accent-muted)]'
            : 'border-[var(--border-subtle)] bg-[var(--bg-glass)]'
        }`}
      >
        <MapPin size={14} className={eligible ? 'text-[var(--bg-accent)]' : 'text-[var(--text-muted)]'} />
        <span className="flex-1 text-[var(--text-on-card)]">
          Pincode <strong className="text-[var(--text-on-page)]">{pincode}</strong> —{' '}
          <span className={eligible ? 'text-[var(--bg-accent)] font-semibold' : 'text-[var(--text-on-card)]'}>
            {message}
          </span>
        </span>
        <button
          onClick={() => {
            setValue('');
            setPincode('');
            setPincodeEligible(null);
            setPincodeMessage('');
          }}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-on-page)] transition-colors shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleCheck}
      className="flex flex-col gap-3 max-w-md mx-auto w-full"
      aria-label="Check express delivery eligibility by pincode"
    >
      <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border-mid)] bg-[var(--bg-glass)] focus-within:border-[var(--bg-accent)] transition-colors duration-200">
        <MapPin size={14} className="text-[var(--text-muted)] flex-shrink-0" />
        <input
          id="pincode-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={e => setValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter your 6-digit pincode"
          className="flex-1 bg-transparent text-sm text-[var(--text-on-card)] placeholder:text-[var(--text-muted)] outline-none min-w-0"
          aria-label="Pincode for delivery eligibility check"
        />
      </div>
      <button
        id="pincode-check-btn"
        type="submit"
        disabled={value.length !== 6}
        className="btn-accent py-2.5 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full"
      >
        Check <ChevronRight size={14} />
      </button>
    </form>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function DeliveryTiers() {
  // Read + write delivery tier via global store
  const selected     = useOrderStore((s) => s.deliveryTier);
  const setDeliveryTier = useOrderStore((s) => s.setDeliveryTier);

  return (
    <section aria-label="Delivery speed selection" className="flex flex-col gap-3">

      {/* Heading */}
      <div className="px-1">
        <h2 className="heading-section text-base text-[var(--text-on-page)]">
          Choose delivery speed
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Express tiers are subject to your delivery pincode.
        </p>
      </div>

      {/* Pincode zone check */}
      <PincodeBanner />

      {/* ── Tier cards ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-3"
        role="radiogroup"
        aria-label="Select delivery tier"
      >
        {TIERS.map((tier) => {
          const isActive = selected === tier.id;
          const Icon = tier.icon;

          return (
            <button
              key={tier.id}
              id={`tier-${tier.id}`}
              role="radio"
              aria-checked={isActive}
              onClick={() => setDeliveryTier(tier.id)}
              className="relative w-full text-left rounded-2xl border p-5 transition-all duration-250 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg-accent)]"
              style={{
                borderColor: isActive ? tier.accentBorder : 'var(--border-subtle)',
                background:  isActive ? tier.accentBg    : 'var(--bg-glass)',
                boxShadow:   isActive ? tier.accentShadow : 'none',
                transform:   isActive ? 'scale(1.01)'    : 'scale(1)',
              }}
            >
              <div className="flex items-start gap-4">

                {/* Icon bubble */}
                <div
                  className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{
                    background: tier.iconBg,
                    border: `1px solid ${tier.iconColor}30`,
                  }}
                >
                  <Icon
                    size={22}
                    style={{ color: tier.iconColor }}
                    strokeWidth={1.75}
                  />
                </div>

                {/* Text block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="font-bold text-[15px] leading-tight"
                      style={{ color: isActive ? tier.iconColor : 'var(--text-on-page)' }}
                    >
                      {tier.label}
                    </span>
                    {tier.badge && (
                      <span className={`badge ${tier.badgeClass}`}>
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[var(--text-on-card)] leading-relaxed">
                    {tier.tagline}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {tier.detail}
                  </p>
                </div>

                {/* Price + radio indicator */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                  {/* Radio circle */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                    style={{
                      borderColor: isActive ? tier.iconColor : 'var(--border-mid)',
                      background: isActive ? tier.iconColor : 'transparent',
                    }}
                  >
                    {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>

                  {/* Surcharge */}
                  <div className="text-right">
                    <p
                      className="text-xs font-bold"
                      style={{ color: tier.surcharge.startsWith('No') ? 'var(--success)' : tier.iconColor }}
                    >
                      {tier.surcharge}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 whitespace-nowrap">
                      {tier.surchargeLabel}
                    </p>
                  </div>
                </div>

              </div>

              {/* ── Express badge strip (8-hour only) ───────────────────── */}
              {tier.id === 'express-8h' && isActive && (
                <div
                  className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-[var(--text-on-card)]"
                  style={{ borderColor: 'var(--accent-glow)' }}
                >
                  <Zap size={11} className="text-[var(--bg-accent)]" fill="currentColor" />
                  <span>Rush formula: <code className="text-[var(--bg-accent)] font-mono">Base × max(1, 1 + (2 − 0.33) × 0.5)</code></span>
                </div>
              )}
            </button>
          );
        })}
      </div>

    </section>
  );
}
