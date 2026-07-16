'use client';

import { Receipt, Zap, Clock, ShoppingCart, ChevronRight, Info, CheckCircle } from 'lucide-react';
import {
  useOrderStore,
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
  // Read state and actions from the global Zustand store
  const fileData         = useOrderStore((s) => s.fileData);
  const materialType     = useOrderStore((s) => s.materialType);
  const deliveryTier     = useOrderStore((s) => s.deliveryTier);
  const uploadMode       = useOrderStore((s) => s.uploadMode);

  const priceBreakdown   = useOrderStore((s) => s.priceBreakdown);
  const pincode          = useOrderStore((s) => s.pincode);
  const pincodeEligible  = useOrderStore((s) => s.pincodeEligible);
  const shippingAddress  = useOrderStore((s) => s.shippingAddress);
  const contactEmail     = useOrderStore((s) => s.contactEmail);
  const contactPhone     = useOrderStore((s) => s.contactPhone);
  const orderSuccessId   = useOrderStore((s) => s.orderSuccessId);

  const setShippingAddress = useOrderStore((s) => s.setShippingAddress);
  const setContactEmail    = useOrderStore((s) => s.setContactEmail);
  const setContactPhone    = useOrderStore((s) => s.setContactPhone);
  const setOrderSuccessId  = useOrderStore((s) => s.setOrderSuccessId);
  const resetOrder         = useOrderStore((s) => s.resetOrder);

  const hasFile = fileData !== null && priceBreakdown !== null;
  const breakdown = priceBreakdown;

  // Material label for display
  const materialLabel = materialType.toUpperCase();

  // Delivery tier label
  const tierLabel = deliveryTier === 'express-8h'
    ? '8-Hour Express'
    : deliveryTier === 'budget-5-7d'
      ? '5-7 Day Eco/Budget'
      : '2-Day Standard';

  const TierIcon  = deliveryTier === 'express-8h' ? Zap : Clock;

  const handleConfirmOrder = async () => {
    // Perform validations
    if (!fileData) {
      alert('Please upload a 3D model or photo first.');
      return;
    }
    if (!pincode || pincodeEligible === null) {
      alert('Please enter and check a valid 6-digit pincode before placing order.');
      return;
    }
    if (!shippingAddress.trim()) {
      alert('Please enter your complete shipping address.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!contactPhone.trim()) {
      alert('Please enter a contact phone number.');
      return;
    }

    const volume_cm3 = fileData.volumeCm3 !== null
      ? fileData.volumeCm3
      : (uploadMode === 'gift' ? 18.88 : 50.0);

    const payload = {
      file_name: fileData.fileName,
      file_size: fileData.fileSize,
      volume_cm3: volume_cm3,
      file_url: fileData.fileUrl || '',
      material_type: materialType,
      delivery_tier: deliveryTier,
      pincode: pincode,
      shipping_address: shippingAddress,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    };

    try {
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        const data = await response.json();
        setOrderSuccessId(data.order_id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to place order: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Failed to connect to the backend server. Make sure the backend is running at http://localhost:8080.');
    }
  };

  // If order is placed successfully, render Success Banner
  if (orderSuccessId !== null) {
    return (
      <div className="glass-card overflow-hidden" id="price-summary-panel">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
          <Receipt size={16} className="text-[var(--success)]" />
          <h2 className="text-sm font-semibold text-[var(--text-on-page)]">Order Confirmed</h2>
        </div>
        <div className="p-5 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 border-2 border-[var(--success)] flex items-center justify-center animate-pulse">
            <CheckCircle size={32} className="text-[var(--success)]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--success)]">Order Placed Successfully!</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Your order has been saved to the database. We will begin processing your model shortly.
            </p>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 rounded-xl font-mono text-xs inline-block">
              <span className="text-[var(--text-muted)]">Order ID:</span>{' '}
              <strong className="text-[var(--text-on-page)]">{orderSuccessId}</strong>
            </div>
          </div>
          <button
            onClick={() => resetOrder()}
            className="btn-accent w-full justify-center py-3 text-sm mt-2 flex items-center gap-2"
          >
            Reset/Place New Order
          </button>
        </div>
      </div>
    );
  }

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
                label={<span>Base price <span className="text-[var(--text-muted)] text-[11px]">({materialLabel})</span></span>}
                value={formatRupees(breakdown!.basePrice)}
              />

              {breakdown!.bulkDiscount !== undefined && breakdown!.bulkDiscount > 0 && (
                <LineItem
                  label={<span className="text-[var(--success)]">Discount Applied</span>}
                  value={`- ${formatRupees(breakdown!.bulkDiscount)}`}
                  accent
                />
              )}

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

            {/* ── Shipping & Contact Info Form ─────────────────────────── */}
            <div className="border-t border-[var(--border-subtle)] pt-4 mt-1 flex flex-col gap-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Shipping & Contact Info
              </h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--text-on-card)] font-medium">Shipping Address</label>
                <textarea
                  id="shipping-address-input"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter complete address..."
                  className="w-full text-xs p-2.5 rounded-xl border bg-[var(--bg-glass)] text-[var(--text-on-card)] border-[var(--border-mid)] outline-none focus:border-[var(--bg-accent)] transition-colors resize-none"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-on-card)] font-medium">Contact Email</label>
                  <input
                    id="contact-email-input"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full text-xs p-2.5 rounded-xl border bg-[var(--bg-glass)] text-[var(--text-on-card)] border-[var(--border-mid)] outline-none focus:border-[var(--bg-accent)] transition-colors min-w-0"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-on-card)] font-medium">Contact Phone</label>
                  <input
                    id="contact-phone-input"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full text-xs p-2.5 rounded-xl border bg-[var(--bg-glass)] text-[var(--text-on-card)] border-[var(--border-mid)] outline-none focus:border-[var(--bg-accent)] transition-colors min-w-0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ── Confirm CTA ───────────────────────────────────────────── */}
            <button
              id="confirm-order-btn"
              onClick={handleConfirmOrder}
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
