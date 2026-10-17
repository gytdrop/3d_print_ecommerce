package service

import (
	"errors"
	"math"

	"techazsure-3dprint/backend/internal/config"
)

// Material represents 3D print material physical properties.
type Material struct {
	Density     float64
	CostPerGram float64
}

// Materials maps material identifiers to their physical configurations.
var Materials = map[string]Material{
	"pla":    {Density: 1.24, CostPerGram: 18},
	"abs":    {Density: 1.05, CostPerGram: 22},
	"petg":   {Density: 1.27, CostPerGram: 25},
	"resin":  {Density: 1.18, CostPerGram: 35},
	"nylon":  {Density: 1.01, CostPerGram: 42},
	"carbon": {Density: 1.35, CostPerGram: 89},
}

// QuoteRequest is the payload accepted by POST /api/quote.
type QuoteRequest struct {
	VolumeCm3    float64 `json:"volume_cm3"`
	MaterialType string  `json:"material_type"`
	DeliveryTier string  `json:"delivery_tier"`
}

// QuoteResponse is the payload returned by POST /api/quote.
type QuoteResponse struct {
	BasePrice      float64 `json:"base_price"`
	BulkDiscount   float64 `json:"bulk_discount"`
	RushSurcharge  float64 `json:"rush_surcharge"`
	FinalPrice     float64 `json:"final_price"`
	RushMultiplier float64 `json:"rush_multiplier"`
	IsExpedited    bool    `json:"is_expedited"`
}

// CalculateQuote computes pricing with the platform's shipped default
// configuration. Prefer CalculateQuoteCfg in handlers so admin-edited values
// take effect.
func CalculateQuote(volume float64, materialType string, deliveryTier string) (QuoteResponse, error) {
	return CalculateQuoteCfg(config.Defaults(), volume, materialType, deliveryTier)
}

// CalculateQuoteCfg computes pricing, discounts, surcharges, and final totals
// using admin-configurable rates.
func CalculateQuoteCfg(cfg config.Config, volume float64, materialType string, deliveryTier string) (QuoteResponse, error) {
	material, ok := Materials[materialType]
	if !ok {
		return QuoteResponse{}, errors.New("invalid material type")
	}

	// Base Price = (Volume * Material Density * Cost Per Gram) + machine cost per cm³
	materialCost := volume * material.Density * material.CostPerGram
	machineCost := volume * cfg.MachineRatePerCm3
	basePrice := materialCost + machineCost
	basePrice = math.Round(basePrice*100) / 100

	// Bulk discount rule: large volumes or totals get a percentage discount.
	var bulkDiscount float64
	if volume >= cfg.BulkVolumeThreshold || basePrice >= cfg.BulkPriceThreshold {
		bulkDiscount = basePrice * cfg.BulkDiscountPct
	}
	bulkDiscount = math.Round(bulkDiscount*100) / 100

	// Eco tier flat discount (budget-5-7d).
	if deliveryTier == "budget-5-7d" {
		bulkDiscount += cfg.EcoDiscount
	}
	bulkDiscount = math.Round(bulkDiscount*100) / 100

	var rushMultiplier float64 = 1.0
	var rushSurcharge float64 = 0.0
	var isExpedited bool = false

	if deliveryTier == "express-8h" {
		rushMultiplier = 1.0 + cfg.RushSurchargeRate
		isExpedited = true
		// Surcharge is calculated on the net price after bulk discount (excluding eco discount, which doesn't apply to express)
		rushSurcharge = (basePrice - bulkDiscount) * cfg.RushSurchargeRate
		rushSurcharge = math.Round(rushSurcharge*100) / 100
	}

	finalPrice := basePrice + rushSurcharge - bulkDiscount
	if finalPrice < 0 {
		finalPrice = 0
	}
	finalPrice = math.Round(finalPrice*100) / 100

	return QuoteResponse{
		BasePrice:      basePrice,
		BulkDiscount:   bulkDiscount,
		RushSurcharge:  rushSurcharge,
		FinalPrice:     finalPrice,
		RushMultiplier: rushMultiplier,
		IsExpedited:    isExpedited,
	}, nil
}
