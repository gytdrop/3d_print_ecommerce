'use client';

import { useState } from 'react';
import { Search, Zap, GraduationCap, Package, AlertCircle, Loader2, CalendarClock } from 'lucide-react';

interface LookupResult {
  tier: 'express' | 'campus' | 'standard' | 'invalid';
  message: string;
}

interface ShipEstimate {
  days_min: number;
  days_max: number;
  eta_from: string;
  eta_to: string;
  message: string;
}

// Offline fallback mirroring the seeded tiers — used only when the backend
// is unreachable. The live source of truth is /api/pincodes/check.
function fallbackLookup(pin: string): LookupResult {
  const pinNum = parseInt(pin, 10);
  if (pinNum >= 560001 && pinNum <= 560110) {
    return {
      tier: 'express',
      message: '8-Hour Express Available! Place your order before 2 PM to receive your print tonight.',
    };
  }
  if (pinNum >= 123021 && pinNum <= 123035) {
    return {
      tier: 'campus',
      message: 'Campus Priority Active! Hand-delivered straight to hostels/departments by evening.',
    };
  }
  return {
    tier: 'standard',
    message: 'Standard Delivery Available via priority partner courier.',
  };
}

export default function ZonesPage() {
  const [pinInput, setPinInput] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [estimate, setEstimate] = useState<ShipEstimate | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = pinInput.replace(/\s+/g, '');

    if (!/^\d{6}$/.test(sanitized)) {
      setLookupResult({
        tier: 'invalid',
        message: 'Please enter a valid 6-digit numeric PIN code.',
      });
      setEstimate(null);
      return;
    }

    setChecking(true);
    setEstimate(null);

    // Live tier from the pincodes database (admin-managed).
    try {
      const res = await fetch(`/api/pincodes/check?pincode=${sanitized}`);
      if (!res.ok) throw new Error('check failed');
      const data = await res.json();
      const tier: LookupResult['tier'] =
        data.tier === 'express' || data.tier === 'campus' ? data.tier : 'standard';
      setLookupResult({
        tier,
        message: data.message || 'Standard Delivery Available via priority partner courier.',
      });
    } catch {
      setLookupResult(fallbackLookup(sanitized));
    }

    // Delivery window estimated against the manufacturing origin pincode,
    // honoring any admin-set per-pincode override.
    try {
      const res = await fetch(`/api/shipping/estimate?pincode=${sanitized}`);
      setEstimate(res.ok ? await res.json() : null);
    } catch {
      setEstimate(null);
    }

    setChecking(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-0 w-full max-w-xl mx-auto px-4 py-8 text-center">
      <div className="w-full mb-6">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[var(--bg-accent)] mb-2">
          Delivery Coverage
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-on-page)]">
          PIN Code Checker
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Enter your 6-digit PIN code to check delivery availability and speeds in your region.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex w-full items-center gap-2 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border-subtle)] focus-within:border-[var(--bg-accent)] transition-colors">
          <div className="flex items-center pl-2 text-[var(--text-muted)]">
            <Search size={18} />
          </div>
          <input
            type="text"
            pattern="\d*"
            maxLength={8}
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              if (lookupResult) {
                setLookupResult(null);
                setEstimate(null);
              }
            }}
            placeholder="Enter 6-digit PIN code"
            className="w-full bg-transparent border-0 outline-none text-base text-[var(--text-on-page)] placeholder:text-[var(--text-muted)] py-1 font-mono"
            aria-label="PIN code checker input"
          />
          <button
            type="submit"
            disabled={checking}
            className="h-12 px-6 rounded-xl text-base font-semibold btn-accent hover:opacity-90 active:scale-[0.98] transition-transform shrink-0 disabled:opacity-50 flex items-center gap-2"
          >
            {checking ? <Loader2 size={16} className="animate-spin" /> : null}
            {checking ? 'Checking…' : 'Check'}
          </button>
        </div>
      </form>

      {/* Dynamic Context-Driven Status Badges */}
      {lookupResult && (
        <div className="w-full mt-4 animate-fade-in-up flex flex-col gap-3">
          {lookupResult.tier === 'express' && (
            <div className="p-4 rounded-xl text-left border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex gap-3 items-start">
              <Zap size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{lookupResult.message}</p>
            </div>
          )}

          {lookupResult.tier === 'campus' && (
            <div className="p-4 rounded-xl text-left border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 flex gap-3 items-start">
              <GraduationCap size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{lookupResult.message}</p>
            </div>
          )}

          {lookupResult.tier === 'standard' && (
            <div className="p-4 rounded-xl text-left border bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-on-card)] flex gap-3 items-start">
              <Package size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{lookupResult.message}</p>
            </div>
          )}

          {lookupResult.tier === 'invalid' && (
            <div className="p-4 rounded-xl text-left border bg-red-500/10 text-red-400 border-red-500/20 flex gap-3 items-start">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{lookupResult.message}</p>
            </div>
          )}

          {/* Estimated delivery window vs manufacturing origin */}
          {estimate && lookupResult.tier !== 'invalid' && (
            <div className="p-4 rounded-xl text-left border bg-[var(--bg-card)] border-[var(--border-subtle)] flex gap-3 items-start">
              <CalendarClock size={18} className="shrink-0 mt-0.5 text-[var(--bg-accent)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-on-page)]">{estimate.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                  {estimate.eta_from === estimate.eta_to
                    ? `Expected: ${estimate.eta_from}`
                    : `Expected: ${estimate.eta_from} → ${estimate.eta_to}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
