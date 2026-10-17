'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Upload, Lightbulb, LightbulbOff, AlertTriangle, CheckCircle2,
  RotateCw, Loader2, MapPin, ImageIcon,
} from 'lucide-react';
import {
  LAMP_SIZES, BOX_COLORS, MIN_PHOTO_SHORT_EDGE, MAX_PHOTO_BYTES,
  ACCEPTED_PHOTO_TYPES, panelAspect, estimateLampPrice,
  type LampSizeId, type LampOrientation, type LampBoxColor, type LampDeliveryTier,
} from './lampConfig';

const LampPreview3D = dynamic(() => import('./LampPreview3D'), { ssr: false });

interface PhotoState {
  file: File;
  objectUrl: string;
  img: HTMLImageElement;
  width: number;
  height: number;
}

interface PinState {
  checked: boolean;
  eligible: boolean;
  message: string;
}

const DELIVERY_TIERS: { id: LampDeliveryTier; label: string; eta: string; needsExpress?: boolean }[] = [
  { id: 'express-8h', label: '8-Hour Express', eta: 'Tonight in Bangalore', needsExpress: true },
  { id: 'standard-2d', label: 'Standard', eta: '2 days' },
  { id: 'budget-5-7d', label: 'Budget Eco', eta: '5–7 days · ₹100 off' },
];

export default function LampConfigurator({ initialSize }: { initialSize?: string }) {
  // ── Configuration state ────────────────────────────────────────────────────
  const validInitial = (['small', 'medium', 'large'] as const).find((s) => s === initialSize);
  const [size, setSize] = useState<LampSizeId>(validInitial ?? 'medium');
  const [orientation, setOrientation] = useState<LampOrientation>('landscape');
  const [boxColor, setBoxColor] = useState<LampBoxColor>('black');
  const [lampOn, setLampOn] = useState(true);

  // ── Photo + crop state ─────────────────────────────────────────────────────
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [lowRes, setLowRes] = useState(false);
  const [lowResOverride, setLowResOverride] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [ncx, setNcx] = useState(0.5); // crop center, normalized
  const [ncy, setNcy] = useState(0.5);
  const [previewTexture, setPreviewTexture] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // ── Delivery + contact state ───────────────────────────────────────────────
  const [tier, setTier] = useState<LampDeliveryTier>('standard-2d');
  const [pincode, setPincode] = useState('');
  const [pin, setPin] = useState<PinState>({ checked: false, eligible: false, message: '' });
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState<{ orderId: string; finalPrice: number } | null>(null);

  const cropRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; ncx: number; ncy: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspect = panelAspect(size, orientation);
  const price = estimateLampPrice(size, tier);

  // ── Crop window math (source-pixel space) ──────────────────────────────────
  const cropWindow = useMemo(() => {
    if (!photo) return null;
    const { width: iw, height: ih } = photo;
    const srcW0 = Math.min(iw, ih * aspect);
    const srcW = srcW0 / zoom;
    const srcH = srcW / aspect;
    const cx = Math.min(Math.max(ncx * iw, srcW / 2), iw - srcW / 2);
    const cy = Math.min(Math.max(ncy * ih, srcH / 2), ih - srcH / 2);
    return { srcW, srcH, cx, cy };
  }, [photo, aspect, zoom, ncx, ncy]);

  // ── Photo intake ───────────────────────────────────────────────────────────
  const acceptFile = useCallback((file: File) => {
    setPhotoError('');
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Please upload a JPG, PNG, or WebP photo.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Photo must be 15MB or smaller.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return { file, objectUrl, img, width: img.naturalWidth, height: img.naturalHeight };
      });
      setLowRes(Math.min(img.naturalWidth, img.naturalHeight) < MIN_PHOTO_SHORT_EDGE);
      setLowResOverride(false);
      setZoom(1);
      setNcx(0.5);
      setNcy(0.5);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setPhotoError('Could not read this image — please try another photo.');
    };
    img.src = objectUrl;
  }, []);

  // ── Crop export (canvas) ───────────────────────────────────────────────────
  const drawCrop = useCallback(
    (maxWidth: number): HTMLCanvasElement | null => {
      if (!photo || !cropWindow) return null;
      const { srcW, srcH, cx, cy } = cropWindow;
      const outW = Math.round(Math.min(maxWidth, srcW));
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(photo.img, cx - srcW / 2, cy - srcH / 2, srcW, srcH, 0, 0, outW, outH);
      return canvas;
    },
    [photo, cropWindow, aspect],
  );

  // Debounced 512px texture for the 3D preview.
  useEffect(() => {
    if (!photo) {
      setPreviewTexture(null);
      return;
    }
    const handle = setTimeout(() => {
      const canvas = drawCrop(512);
      if (canvas) setPreviewTexture(canvas.toDataURL('image/jpeg', 0.85));
    }, 300);
    return () => clearTimeout(handle);
  }, [photo, drawCrop]);

  // ── Crop drag interaction ──────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (!photo) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ncx, ncy };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || !photo || !cropWindow || !cropRef.current) return;
    const rect = cropRef.current.getBoundingClientRect();
    const { srcW, srcH } = cropWindow;
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * srcW;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * srcH;
    setNcx(Math.min(1, Math.max(0, dragStart.current.ncx - dx / photo.width)));
    setNcy(Math.min(1, Math.max(0, dragStart.current.ncy - dy / photo.height)));
  };
  const onPointerUp = () => {
    dragStart.current = null;
    setDragging(false);
  };

  // ── Pincode check ──────────────────────────────────────────────────────────
  const checkPincode = async (value: string) => {
    setPincode(value);
    if (!/^\d{6}$/.test(value)) {
      setPin({ checked: false, eligible: false, message: '' });
      return;
    }
    try {
      const res = await fetch(`/api/pincodes/check?pincode=${value}`);
      const data = await res.json();
      setPin({ checked: true, eligible: !!data.eligible, message: data.message || '' });
      if (!data.eligible && tier === 'express-8h') setTier('standard-2d');
    } catch {
      setPin({ checked: true, eligible: false, message: 'Could not verify pincode — standard delivery assumed.' });
    }
  };

  // ── Place order ────────────────────────────────────────────────────────────
  const canSubmit =
    !!photo && (!lowRes || lowResOverride) && /^\d{6}$/.test(pincode) &&
    address.trim() !== '' && email.trim() !== '' && phone.trim() !== '' && !submitting;

  const placeOrder = async () => {
    if (!canSubmit || !photo) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      // 1. Export the full-resolution crop (exactly what the preview shows).
      const canvas = drawCrop(2000);
      if (!canvas) throw new Error('Could not process the cropped photo.');
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92),
      );
      if (!blob) throw new Error('Could not export the cropped photo.');

      // 2. Upload the cropped photo.
      const form = new FormData();
      form.append('photo', blob, 'photo-lamp-crop.jpg');
      const uploadRes = await fetch('/api/uploads/photo', { method: 'POST', body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Photo upload failed.');

      // 3. Place the order.
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: 'photo_lamp',
          lamp_size: size,
          lamp_orientation: orientation,
          lamp_box_color: boxColor,
          photo_url: uploadData.photo_url,
          file_name: photo.file.name,
          file_size: blob.size,
          delivery_tier: tier,
          pincode,
          shipping_address: address,
          contact_email: email,
          contact_phone: phone,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order placement failed.');
      setSuccess({ orderId: orderData.order_id, finalPrice: orderData.final_price });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-xl mx-auto glass-card p-8 text-center animate-fade-in-up">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
        <h2 className="heading-section text-2xl text-[var(--text-on-page)] mb-2">
          Your Photo Lamp is on its way to the print farm!
        </h2>
        <p className="text-sm text-[var(--text-on-card)] mb-1">
          Order total: <span className="font-semibold">₹{success.finalPrice.toFixed(2)}</span>
        </p>
        <p className="text-xs text-[var(--text-muted)] font-mono break-all mb-6">
          Order ID: {success.orderId}
        </p>
        <Link
          href={`/track?id=${success.orderId}`}
          className="btn-accent px-8 py-3 inline-flex items-center justify-center"
        >
          Track Your Lamp →
        </Link>
      </div>
    );
  }

  // ── Upload-first state ─────────────────────────────────────────────────────
  if (!photo) {
    return (
      <div className="max-w-xl mx-auto">
        <div
          className="glass-card p-10 text-center border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--bg-accent)] transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) acceptFile(file);
          }}
        >
          <ImageIcon size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h2 className="heading-section text-lg text-[var(--text-on-page)] mb-2">
            Drop your photo here
          </h2>
          <p className="text-sm text-[var(--text-on-card)] mb-4">
            JPG, PNG, or WebP up to 15MB. Faces and high-contrast photos glow best.
          </p>
          <span className="btn-accent px-6 py-2.5 inline-flex items-center gap-2">
            <Upload size={16} /> Choose Photo
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) acceptFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {photoError && (
          <p className="mt-3 text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle size={14} /> {photoError}
          </p>
        )}
      </div>
    );
  }

  // ── Full configurator ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 items-start">
      {/* Left: crop + 3D preview */}
      <div className="lg:col-span-3 flex flex-col gap-6 w-full">
        {/* Crop */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="heading-section text-sm text-[var(--text-on-page)]">
              Frame Your Photo
            </h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--bg-accent)] flex items-center gap-1"
            >
              <RotateCw size={12} /> Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_PHOTO_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) acceptFile(file);
                e.target.value = '';
              }}
            />
          </div>

          <div
            ref={cropRef}
            className={`relative w-full overflow-hidden rounded-lg select-none touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              aspectRatio: `${aspect}`,
              backgroundImage: `url(${photo.objectUrl})`,
              backgroundSize: cropWindow
                ? `${(photo.width / cropWindow.srcW) * 100}% auto`
                : 'cover',
              backgroundPosition: cropWindow
                ? `${photo.width > cropWindow.srcW ? ((cropWindow.cx - cropWindow.srcW / 2) / (photo.width - cropWindow.srcW)) * 100 : 50}% ${photo.height > cropWindow.srcH ? ((cropWindow.cy - cropWindow.srcH / 2) / (photo.height - cropWindow.srcH)) * 100 : 50}%`
                : 'center',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="absolute inset-0 ring-2 ring-inset ring-white/30 rounded-lg pointer-events-none" />
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-[var(--text-muted)] w-10">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[var(--bg-accent)]"
            />
          </div>

          {lowRes && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-500 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                This photo is below {MIN_PHOTO_SHORT_EDGE}px — fine details may soften in the
                printed relief.
              </p>
              <label className="flex items-center gap-2 mt-2 text-xs text-[var(--text-on-card)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowResOverride}
                  onChange={(e) => setLowResOverride(e.target.checked)}
                  className="accent-[var(--bg-accent)]"
                />
                Print it anyway — I understand the quality may suffer
              </label>
            </div>
          )}
        </div>

        {/* 3D preview */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="heading-section text-sm text-[var(--text-on-page)]">
              Live Lamp Preview
            </h3>
            <button
              onClick={() => setLampOn((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                lampOn
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {lampOn ? <Lightbulb size={13} /> : <LightbulbOff size={13} />}
              {lampOn ? 'Lamp On' : 'Lamp Off'}
            </button>
          </div>
          <div className="h-[320px] rounded-lg bg-[#0a0d14] overflow-hidden">
            <LampPreview3D
              textureDataUrl={previewTexture}
              size={size}
              orientation={orientation}
              boxColor={boxColor}
              lampOn={lampOn}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
            Drag to orbit · scroll to zoom · warm-white USB-C LED included with every lamp
          </p>
        </div>
      </div>

      {/* Right: configuration + order */}
      <div className="lg:col-span-2 flex flex-col gap-6 w-full">
        {/* Size + orientation */}
        <div className="glass-card p-4">
          <h3 className="heading-section text-sm text-[var(--text-on-page)] mb-3">Size</h3>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(LAMP_SIZES) as LampSizeId[]).map((id) => {
              const cfg = LAMP_SIZES[id];
              return (
                <button
                  key={id}
                  onClick={() => setSize(id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    size === id
                      ? 'border-[var(--bg-accent)] bg-[var(--bg-accent)]/10 ring-1 ring-[var(--bg-accent)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--bg-accent)]/50'
                  }`}
                >
                  <span className="block text-xs font-semibold text-[var(--text-on-page)]">
                    {cfg.label}
                  </span>
                  <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                    {cfg.panelWcm}×{cfg.panelHcm} cm
                  </span>
                  <span className="block text-sm font-semibold text-[var(--text-on-page)] mt-1">
                    ₹{cfg.price}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            {(['landscape', 'portrait'] as LampOrientation[]).map((o) => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                className={`flex-1 py-2 rounded-lg border text-xs capitalize transition-all ${
                  orientation === o
                    ? 'border-[var(--bg-accent)] bg-[var(--bg-accent)]/10 text-[var(--text-on-page)] font-semibold'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--bg-accent)]/50'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Box color */}
        <div className="glass-card p-4">
          <h3 className="heading-section text-sm text-[var(--text-on-page)] mb-3">Box Finish</h3>
          <div className="flex gap-3">
            {BOX_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setBoxColor(c.id)}
                className={`flex-1 p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                  boxColor === c.id
                    ? 'border-[var(--bg-accent)] ring-1 ring-[var(--bg-accent)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--bg-accent)]/50'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[10px] text-[var(--text-on-card)]">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            The lithophane panel is always translucent white PLA — it&apos;s what makes the photo glow.
          </p>
        </div>

        {/* Delivery */}
        <div className="glass-card p-4">
          <h3 className="heading-section text-sm text-[var(--text-on-page)] mb-3">Delivery</h3>
          <div className="relative mb-3">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit Bangalore pincode"
              value={pincode}
              onChange={(e) => checkPincode(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-on-page)] focus:border-[var(--bg-accent)] outline-none"
            />
          </div>
          {pin.checked && (
            <p className={`text-xs mb-3 ${pin.eligible ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
              {pin.message}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {DELIVERY_TIERS.map((t) => {
              const disabled = !!t.needsExpress && !pin.eligible;
              return (
                <button
                  key={t.id}
                  disabled={disabled}
                  onClick={() => setTier(t.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed border-[var(--border-subtle)]'
                      : tier === t.id
                        ? 'border-[var(--bg-accent)] bg-[var(--bg-accent)]/10 ring-1 ring-[var(--bg-accent)]'
                        : 'border-[var(--border-subtle)] hover:border-[var(--bg-accent)]/50'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-semibold text-[var(--text-on-page)]">{t.label}</span>
                    <span className="block text-[10px] text-[var(--text-muted)]">{t.eta}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact + summary */}
        <div className="glass-card p-4">
          <h3 className="heading-section text-sm text-[var(--text-on-page)] mb-3">
            Shipping &amp; Contact
          </h3>
          <div className="flex flex-col gap-2 mb-4">
            <textarea
              placeholder="Full shipping address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-on-page)] focus:border-[var(--bg-accent)] outline-none resize-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-on-page)] focus:border-[var(--bg-accent)] outline-none"
            />
            <input
              type="tel"
              placeholder="Phone (+91…)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-on-page)] focus:border-[var(--bg-accent)] outline-none"
            />
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-3 text-sm">
            <div className="flex justify-between text-[var(--text-on-card)]">
              <span>{LAMP_SIZES[size].label} lamp · {boxColor} · LED included</span>
              <span>₹{price.base.toFixed(2)}</span>
            </div>
            {price.rushSurcharge > 0 && (
              <div className="flex justify-between text-[var(--text-on-card)]">
                <span>8-hour express</span>
                <span>+₹{price.rushSurcharge.toFixed(2)}</span>
              </div>
            )}
            {price.discount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Eco tier discount</span>
                <span>−₹{price.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-[var(--text-on-page)] mt-2 pt-2 border-t border-[var(--border-subtle)]">
              <span>Total</span>
              <span>₹{price.final.toFixed(2)}</span>
            </div>
          </div>

          {submitError && (
            <p className="mt-3 text-xs text-red-500 flex items-center gap-2">
              <AlertTriangle size={13} className="shrink-0" /> {submitError}
            </p>
          )}

          <button
            disabled={!canSubmit}
            onClick={placeOrder}
            className="btn-accent w-full mt-4 py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Placing order…
              </>
            ) : (
              <>Place Order · ₹{price.final.toFixed(2)}</>
            )}
          </button>
          <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
            Pay on delivery — online payment coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
