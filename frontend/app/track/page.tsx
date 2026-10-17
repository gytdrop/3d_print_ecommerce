"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, Clock, CheckCircle2, AlertCircle, ArrowRight, Printer, Sparkles, MapPin, Truck } from 'lucide-react';

interface TimelineEvent {
  id: string;
  stage: string;
  message: string;
  location: string;
  created_at: string;
}

interface OrderDetail {
  id: string;
  file_name: string;
  volume_cm3: number;
  material_type: string;
  delivery_tier: string;
  pincode: string;
  final_price: number;
  status: string;
  shipping_address: string;
  created_at: string;
  timeline: TimelineEvent[];
}

const STAGES = [
  { key: 'order_placed', label: 'Order Confirmed', icon: Package },
  { key: 'sliced', label: 'Layer Slicing', icon: Clock },
  { key: 'in_print', label: '3D Extrusion Active', icon: Printer },
  { key: 'qc_passed', label: 'Precision QC', icon: CheckCircle2 },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [orderId, setOrderId] = useState(initialId);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(id.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Order not found. Please verify your Tracking UUID.');
        } else {
          setError('Unable to fetch order status. Please try again.');
        }
        setOrder(null);
      } else {
        const data: OrderDetail = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error(err);
      setError('Network error connecting to tracking cluster.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchOrder(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId);
  };

  const getStageIndex = (status: string) => {
    const idx = STAGES.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStageIdx = order ? getStageIndex(order.status) : 0;

  return (
    <div className="min-h-[85vh] py-12 px-4 max-w-5xl mx-auto flex flex-col justify-center">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="badge badge-accent mb-3 inline-flex items-center gap-1.5">
          <Sparkles size={12} />
          Real-time Dispatch Telemetry
        </span>
        <h1 className="heading-display text-3xl md:text-5xl text-[var(--text-on-page)] mb-4">
          Track Your 3D Print
        </h1>
        <p className="text-sm md:text-base text-[var(--text-muted)]">
          Follow your component across high-precision STL slicing, heated build plate extrusion, and express Bangalore logistics.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto w-full mb-12">
        <div className="glass-card flex items-center p-2 rounded-2xl border border-[var(--border-subtle)] focus-within:border-[var(--accent-glow)] transition-all">
          <Search size={20} className="text-[var(--text-muted)] ml-3 mr-2" />
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID (e.g. a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11)"
            className="w-full bg-transparent border-none outline-none text-sm text-[var(--text-on-page)] placeholder-[var(--text-muted)]"
          />
          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="btn-accent px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {loading ? 'Locating...' : 'Track'}
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="glass-card p-6 rounded-2xl max-w-xl mx-auto text-center border border-red-500/20 mb-10">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-200">{error}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Sample demo order ID: <span className="font-mono text-cyan-400 cursor-pointer" onClick={() => { setOrderId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'); fetchOrder('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'); }}>a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11</span></p>
        </div>
      )}

      {/* Order Progress Details */}
      {order && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-2xl space-y-8 animate-fade-in-up">
          {/* Metadata Top Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[var(--border-subtle)]">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-cyan-400">ORDER #{order.id.slice(0, 8).toUpperCase()}</span>
                <span className="badge badge-accent uppercase tracking-wider text-[10px]">{order.status.replace('_', ' ')}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Created on {new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--text-muted)]">Total Amount</span>
              <div className="text-xl md:text-2xl font-bold text-[var(--text-on-page)]">₹{order.final_price.toFixed(2)}</div>
            </div>
          </div>

          {/* Stepper Progression */}
          <div className="relative py-4">
            <div className="hidden md:flex justify-between items-center relative z-10">
              {STAGES.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={s.key} className="flex flex-col items-center text-center max-w-[120px]">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-black shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/20'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-[var(--text-muted)] border border-white/5'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span className={`text-xs mt-3 font-medium ${isCompleted ? 'text-[var(--text-on-page)]' : 'text-[var(--text-muted)]'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Spec Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block">Component File</span>
              <span className="text-xs font-medium font-mono text-[var(--text-on-page)] truncate block">{order.file_name}</span>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block">Material Grade</span>
              <span className="text-xs font-semibold uppercase text-cyan-400">{order.material_type}</span>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block">Delivery Speed</span>
              <span className="text-xs font-medium capitalize text-[var(--text-on-page)]">{order.delivery_tier} Express</span>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block">Destination Hub</span>
              <span className="text-xs font-medium text-[var(--text-on-page)] flex items-center gap-1">
                <MapPin size={11} className="text-orange-400" /> Pincode {order.pincode}
              </span>
            </div>
          </div>

          {/* Timeline Events Feed */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Live Checkpoints</h3>
            <div className="space-y-4">
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-1.5 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-[var(--text-on-page)]">{event.message}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="text-[11px] text-cyan-400/80 mt-0.5 block">{event.location}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Order received. Telemetry checkpoints will update once slicing commences.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Back Link */}
      <div className="text-center mt-12">
        <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-white transition-colors">
          ← Back to TechAZsure Home
        </Link>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-xs text-[var(--text-muted)]">Loading tracking terminal...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
