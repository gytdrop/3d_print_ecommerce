/**
 * useOrderStore — Global Zustand store for TechAZsure order flow.
 *
 * Tracks the four pieces of state that flow through the upload page:
 *   fileData      → set by UploadZone when a file is accepted
 *   materialType  → set by MaterialSelect when a material is chosen
 *   basePrice     → set when a file+material combo is present (placeholder until real parser runs)
 *   deliveryTier  → set by DeliveryTiers when the user picks a speed
 *
 * PriceSummary reads all four and computes the final quote via the
 * Agent.md expedite formula:
 *   Total = Base × max(1, 1 + (2 − leadTimeDays) × RUSH_RATE)
 */

import { create } from 'zustand';

// ─── Domain types ─────────────────────────────────────────────────────────────

export type MaterialTypeId = 'pla' | 'abs' | 'petg' | 'resin' | 'nylon' | 'carbon';
export type DeliveryTierId = 'express-8h' | 'standard-2d';

export interface FileData {
  fileName:  string;
  fileSize:  number;      // bytes
  volumeCm3: number | null; // null until STL parser runs (Phase 3.5)
  fileUrl?:  string;
  dimensions?: string;
}

// ─── Pricing constants (Agent.md) ─────────────────────────────────────────────

/** Default lead time threshold: orders at or above this incur no rush surcharge. */
export const DEFAULT_LEAD_TIME_DAYS = 2;

/** Rush surcharge rate: 50 % extra per day saved below the 2-day threshold. */
export const RUSH_RATE = 0.5;

/** Lead time in days for each delivery tier. */
export const TIER_LEAD_TIMES: Record<DeliveryTierId, number> = {
  'express-8h':  8 / 24,  // ≈ 0.333 days
  'standard-2d': 2.0,
};

/**
 * Demo base-price table (₹) used until the real STL volume parser is wired in.
 * These represent rough estimates for a ~50 cm³ part at standard quality.
 */
export const DEMO_BASE_PRICES: Record<MaterialTypeId, number> = {
  pla:    450,
  abs:    540,
  petg:   620,
  resin:  850,
  nylon:  1100,
  carbon: 2200,
};

// ─── Pricing formula (exact from Agent.md) ────────────────────────────────────

export interface PriceBreakdown {
  basePrice:      number;
  leadTimeDays:   number;
  rushMultiplier: number;   // 1.0 when no rush surcharge
  rushSurcharge:  number;   // rupees added above base
  finalPrice:     number;
  isExpedited:    boolean;
}

/**
 * Applies the Agent.md expedite formula.
 *
 * Formula:  Total = Base × max(1, 1 + (2 − leadTimeDays) × RUSH_RATE)
 *
 * If leadTimeDays ≥ 2 → multiplier = 1 → no surcharge.
 * If leadTimeDays < 2 → multiplier > 1 → rush surcharge applied.
 */
export function calculatePriceBreakdown(
  basePrice:    number,
  deliveryTier: DeliveryTierId,
): PriceBreakdown {
  const leadTimeDays = TIER_LEAD_TIMES[deliveryTier];

  if (leadTimeDays >= DEFAULT_LEAD_TIME_DAYS) {
    return {
      basePrice,
      leadTimeDays,
      rushMultiplier: 1.0,
      rushSurcharge:  0,
      finalPrice:     basePrice,
      isExpedited:    false,
    };
  }

  const rushMultiplier = Math.max(
    1,
    1 + (DEFAULT_LEAD_TIME_DAYS - leadTimeDays) * RUSH_RATE,
  );
  const finalPrice   = basePrice * rushMultiplier;
  const rushSurcharge = finalPrice - basePrice;

  return {
    basePrice,
    leadTimeDays,
    rushMultiplier,
    rushSurcharge,
    finalPrice,
    isExpedited: true,
  };
}

// ─── Store shape ──────────────────────────────────────────────────────────────

export type UploadMode = 'gift' | 'project';

interface OrderState {
  // State
  fileData:         FileData | null;
  materialType:     MaterialTypeId;
  basePrice:        number;
  deliveryTier:     DeliveryTierId;
  previewGenerated: boolean;
  uploadMode:       UploadMode;

  // Actions
  setFileData:         (data: FileData | null) => void;
  setMaterialType:     (type: MaterialTypeId) => void;
  setBasePrice:        (price: number) => void;
  setDeliveryTier:     (tier: DeliveryTierId) => void;
  setPreviewGenerated: (val: boolean) => void;
  setUploadMode:       (mode: UploadMode) => void;
  resetOrder:          () => void;
}

const INITIAL_STATE = {
  fileData:         null,
  materialType:     'pla'          as MaterialTypeId,
  basePrice:        0,
  deliveryTier:     'standard-2d'  as DeliveryTierId,
  previewGenerated: false,
  uploadMode:       'gift'         as UploadMode,
} satisfies Partial<OrderState>;

export function getBasePriceForVolume(
  volumeCm3: number,
  materialId: MaterialTypeId,
): number {
  const materialsConfig: Record<MaterialTypeId, { density: number; costPerGram: number }> = {
    pla:    { density: 1.24, costPerGram: 18 },
    abs:    { density: 1.05, costPerGram: 22 },
    petg:   { density: 1.27, costPerGram: 25 },
    resin:  { density: 1.18, costPerGram: 35 },
    nylon:  { density: 1.01, costPerGram: 42 },
    carbon: { density: 1.35, costPerGram: 89 },
  };

  const { density, costPerGram } = materialsConfig[materialId];
  const materialCost = volumeCm3 * density * costPerGram;
  
  // Estimate print time: 10 mins per cm³ of volume
  const printTimeHours = (volumeCm3 * 10) / 60;
  const machineRatePerHour = 120; // ₹120 per hour machine rate
  const machineCost = printTimeHours * machineRatePerHour;
  
  return Math.round(materialCost + machineCost);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOrderStore = create<OrderState>()((set) => ({
  ...INITIAL_STATE,

  setFileData: (fileData) => set((state) => {
    let basePrice = state.basePrice;
    if (fileData && fileData.volumeCm3 !== null) {
      basePrice = getBasePriceForVolume(fileData.volumeCm3, state.materialType);
    } else if (fileData) {
      // Fallback base price if no volume yet (e.g. 799 for image gifts, or material demo rate)
      basePrice = state.uploadMode === 'gift' ? 799 : DEMO_BASE_PRICES[state.materialType];
    } else {
      basePrice = 0;
    }
    return { fileData, basePrice };
  }),

  setMaterialType: (materialType) => set((state) => {
    let basePrice = state.basePrice;
    if (state.fileData && state.fileData.volumeCm3 !== null) {
      basePrice = getBasePriceForVolume(state.fileData.volumeCm3, materialType);
    } else if (state.fileData) {
      basePrice = DEMO_BASE_PRICES[materialType];
    }
    return { materialType, basePrice };
  }),

  setBasePrice:        (basePrice)        => set({ basePrice }),
  setDeliveryTier:     (deliveryTier)     => set({ deliveryTier }),
  setPreviewGenerated: (previewGenerated) => set({ previewGenerated }),
  setUploadMode:       (uploadMode)       => set({ uploadMode }),
  resetOrder:          ()                 => set(INITIAL_STATE),
}));
