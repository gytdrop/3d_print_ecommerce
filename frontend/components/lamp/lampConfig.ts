/**
 * Shared Photo Lamp Frame configuration — mirrors the backend matrix in
 * backend/internal/service/lamp.go (photo-lamp-spec.md). Final pricing is
 * always computed server-side at order time; these values drive the UI.
 */

export type LampSizeId = 'small' | 'medium' | 'large';
export type LampOrientation = 'landscape' | 'portrait';
export type LampBoxColor = 'black' | 'white' | 'walnut';
export type LampDeliveryTier = 'express-8h' | 'standard-2d' | 'budget-5-7d';

export interface LampSizeConfig {
  label: string;
  /** Visible panel size in cm, landscape orientation. */
  panelWcm: number;
  panelHcm: number;
  depthCm: number;
  price: number;
  popular?: boolean;
}

export const LAMP_SIZES: Record<LampSizeId, LampSizeConfig> = {
  small:  { label: 'Small',  panelWcm: 10, panelHcm: 8,  depthCm: 3, price: 499 },
  medium: { label: 'Medium', panelWcm: 15, panelHcm: 10, depthCm: 3, price: 799, popular: true },
  large:  { label: 'Large',  panelWcm: 20, panelHcm: 15, depthCm: 3, price: 1299 },
};

export const BOX_COLORS: { id: LampBoxColor; label: string; hex: string }[] = [
  { id: 'black',  label: 'Matte Black', hex: '#1a1d23' },
  { id: 'white',  label: 'White',       hex: '#e8e8e6' },
  { id: 'walnut', label: 'Walnut',      hex: '#7a5230' },
];

export const BOX_COLOR_HEX: Record<LampBoxColor, string> = Object.fromEntries(
  BOX_COLORS.map((c) => [c.id, c.hex]),
) as Record<LampBoxColor, string>;

/** Minimum short-edge resolution before the soft quality warning (P0-2). */
export const MIN_PHOTO_SHORT_EDGE = 1200;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Panel aspect ratio (width / height) for a size + orientation. */
export function panelAspect(size: LampSizeId, orientation: LampOrientation): number {
  const { panelWcm, panelHcm } = LAMP_SIZES[size];
  return orientation === 'landscape' ? panelWcm / panelHcm : panelHcm / panelWcm;
}

/**
 * Client-side price estimate matching backend CalculateLampQuote exactly:
 * express adds 83.3% rush surcharge, eco tier discounts ₹100 flat.
 */
export function estimateLampPrice(size: LampSizeId, tier: LampDeliveryTier) {
  const base = LAMP_SIZES[size].price;
  const rushSurcharge = tier === 'express-8h' ? Math.round(base * 0.833 * 100) / 100 : 0;
  const discount = tier === 'budget-5-7d' ? 100 : 0;
  return {
    base,
    rushSurcharge,
    discount,
    final: Math.max(0, Math.round((base + rushSurcharge - discount) * 100) / 100),
  };
}
