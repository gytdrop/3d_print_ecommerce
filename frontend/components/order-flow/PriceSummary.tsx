'use client';

import { Receipt, Zap, Clock, ShoppingCart, ChevronRight, Info } from 'lucide-react';
import {
  useOrderStore,
  calculatePriceBreakdown,
  TIER_LEAD_TIMES,
  RUSH_RATE,
} from '@/store/useOrderStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupees(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function LineItem({
  label,
  value,
  muted,
  accent,
  large,
}: {
  label:  React.ReactNode;
  value:  string;
  muted?: boolean;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${large ? 'py-1' : ''}`}>
      <span className={`text-sm ${muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-on-card)]'}`}>
        {label}
      </span>
      <span
        className={`font-semibold tabular-nums ${
          large   ? 'text-xl text-[var(--text-on-page)]' :
          accent  ? 'text-sm text-[var(--bg-accent)]' :
          muted   ? 'text-sm text-[var(--text-muted)]' :
                    'text-sm text-[var(--text-on-page)]'
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Formula badge ────────────────────────────────────────────────────────────

function FormulaTag({ multiplier }: { multiplier: number }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
      <Info size={12} className="text-[var(--bg-accent)] flex-shrink-0 mt-0.5" />
      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-mono">
        {/* Agent.md formula display */}
        <span className="text-[var(--text-on-card)]">Rush formula: </span>
        Base × max(1, 1 + (2 − {TIER_LEAD_TIMES['express-8h'].toFixed(2)}) × {RUSH_RATE}){' '}
        <span className="text-[var(--bg-accent)]">= ×{multiplier.toFixed(3)}</span>
      </p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
        <Receipt size={20} className="text-[var(--text-muted)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-on-card)]">No quote yet</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Upload a file to calculate your price
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PriceSummary() {
  // Read all four tracked state pieces from the global store
  const fileData     = useOrderStore((s) => s.fileData);
  const materialType = useOrderStore((s) => s.materialType);
  const basePrice    = useOrderStore((s) => s.basePrice);
  const deliveryTier = useOrderStore((s) => s.deliveryTier);

  const hasFile = fileData !== null && basePrice > 0;

  // ── Apply Agent.md formula ─────────────────────────────────────────────────
  //
  //   Total = Base × max(1, 1 + (2 − leadTimeDays) × RUSH_RATE)
  //
  // calculatePriceBreakdown is a pure function — no side effects.
  const breakdown = hasFile
    ? calculatePriceBreakdown(basePrice, deliveryTier)
    : null;

  // Material label for display
  const materialLabel = materialType.toUpperCase();

  // Delivery tier label
  const tierLabel = deliveryTier === 'express-8h' ? '8-Hour Express' : '2-Day Standard';
  const TierIcon  = deliveryTier === 'express-8h' ? Zap : Clock;

  return (
    <div className="glass-card overflow-hidden" id="price-summary-panel">

      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Receipt size={16} className="text-[var(--bg-accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-on-page)]">Price Summary</h2>
        {hasFile && breakdown?.isExpedited && (
          <span className="badge badge-accent ml-auto">⚡ Rush order</span>
        )}
        {hasFile && !breakdown?.isExpedited && (
          <span className="badge badge-green ml-auto">Standard rate</span>
        )}
      </div>

      <div className="p-5">
        {!hasFile ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">

            {/* ── Line items ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5">
              <LineItem
                label={<span>Base price <span className="text-[var(--text-muted)] text-[11px]">({materialLabel} · demo estimate)</span></span>}
                value={formatRupees(breakdown!.basePrice)}
              />

              <LineItem
                label={
                  <span className="flex items-center gap-1.5">
                    <TierIcon size={11} />
                    {tierLabel} delivery
                  </span>
                }
                value={breakdown!.isExpedited ? `+${formatRupees(breakdown!.rushSurcharge)}` : 'Included'}
                accent={breakdown!.isExpedited}
                muted={!breakdown!.isExpedited}
              />

              {breakdown!.isExpedited && (
                <LineItem
                  label={<span className="text-[var(--text-muted)]">Rush multiplier</span>}
                  value={`×${breakdown!.rushMultiplier.toFixed(3)}`}
                  muted
                />
              )}
            </div>

            {/* Divider */}
            <div className="divider" />

            {/* ── Total ────────────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{
                background: breakdown!.isExpedited
                  ? 'var(--accent-muted)'
                  : 'rgba(34,197,94,0.06)',
                border: breakdown!.isExpedited
                  ? '1px solid var(--accent-glow)'
                  : '1px solid rgba(34,197,94,0.2)',
              }}
            >
              <span className="text-sm font-semibold text-[var(--text-on-page)]">Total Quote</span>
              <span
                className="text-2xl font-black tabular-nums"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: breakdown!.isExpedited ? 'var(--bg-accent)' : 'var(--success)',
                }}
              >
                {formatRupees(breakdown!.finalPrice)}
              </span>
            </div>

            {/* ── Formula breakdown (visible only for rush orders) ──────── */}
            {breakdown!.isExpedited && (
              <FormulaTag multiplier={breakdown!.rushMultiplier} />
            )}

            {/* ── Metadata row ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span className="truncate" title={fileData!.fileName}>
                📄 {fileData!.fileName}
              </span>
              <span className="shrink-0">
                {breakdown!.leadTimeDays < 1
                  ? `${Math.round(breakdown!.leadTimeDays * 24)}h lead`
                  : `${breakdown!.leadTimeDays}d lead`}
              </span>
            </div>

            {/* ── Confirm CTA ───────────────────────────────────────────── */}
            <button
              id="confirm-order-btn"
              className="btn-accent w-full justify-center py-4 text-base mt-1"
              aria-label="Confirm order and proceed to payment"
            >
              <ShoppingCart size={17} />
              Confirm Order
              <ChevronRight size={15} className="ml-auto" />
            </button>

            <p className="text-center text-[10px] text-[var(--text-muted)]">
              Volume-based quote · Prices in INR incl. GST
            </p>

          </div>
        )}
      </div>
    </div>
  );
}
