'use client';

import { useState } from 'react';
import { Search, Zap, GraduationCap, Package, AlertCircle } from 'lucide-react';

interface LookupResult {
  tier: 'express' | 'campus' | 'standard' | 'invalid';
  message: string;
}

// Local helper utility to validate input and return matching delivery tier
function validatePinCode(pin: string): LookupResult {
  const sanitized = pin.replace(/\s+/g, '');
  
  if (!/^\d{6}$/.test(sanitized)) {
    return {
      tier: 'invalid',
      message: 'Please enter a valid 6-digit numeric PIN code.',
    };
  }

  const pinNum = parseInt(sanitized, 10);

  // Express Tier: 560001 to 560110 (Bangalore Core Hub)
  if (pinNum >= 560001 && pinNum <= 560110) {
    return {
      tier: 'express',
      message: '8-Hour Express Available! Place your order before 2 PM to receive your print tonight.',
    };
  }

  // Campus Priority Tier: 123021 to 123035 (Mahendragarh / Central University of Haryana Campus region)
  if (pinNum >= 123021 && pinNum <= 123035) {
    return {
      tier: 'campus',
      message: 'Campus Priority Active! Hand-delivered straight to hostels/departments by evening.',
    };
  }

  // Default Standard Tier for any other 6-digit sequences
  return {
    tier: 'standard',
    message: 'Standard Delivery Available. Dispatched via priority partner courier in 3-5 business days.',
  };
}

export default function ZonesPage() {
  const [pinInput, setPinInput] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validatePinCode(pinInput);
    setLookupResult(result);
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
              if (lookupResult) setLookupResult(null);
            }}
            placeholder="Enter 6-digit PIN code"
            className="w-full bg-transparent border-0 outline-none text-base text-[var(--text-on-page)] placeholder:text-[var(--text-muted)] py-1 font-mono"
            aria-label="PIN code checker input"
          />
          <button
            type="submit"
            className="h-12 px-6 rounded-xl text-base font-semibold btn-accent hover:opacity-90 active:scale-[0.98] transition-transform shrink-0"
          >
            Check
          </button>
        </div>
      </form>

      {/* Dynamic Context-Driven Status Badges */}
      {lookupResult && (
        <div className="w-full mt-4 animate-fade-in-up">
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
        </div>
      )}
    </main>
  );
}
