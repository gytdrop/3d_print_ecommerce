package service

import (
	"errors"
	"math"
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

// CalculateQuote computes pricing, discounts, surcharges, and final totals.
func CalculateQuote(volume float64, materialType string, deliveryTier string) (QuoteResponse, error) {
	material, ok := Materials[materialType]
	if !ok {
		return QuoteResponse{}, errors.New("invalid material type")
	}

	// Base Price = (Volume * Material Density * Cost Per Gram) + (Print Time * Machine Hourly Rate)
	// Print Time Hours = (Volume * 10) / 60
	// Machine Cost = Print Time Hours * 120 = Volume * 20
	materialCost := volume * material.Density * material.CostPerGram
	machineCost := volume * 20.0
	basePrice := materialCost + machineCost
	basePrice = math.Round(basePrice*100) / 100

	// Bulk discount rule:
	// If volume_cm3 >= 100 or base_price >= 2000, apply 10% discount on the base price.
	var bulkDiscount float64
	if volume >= 100 || basePrice >= 2000 {
		bulkDiscount = basePrice * 0.10
	}
	bulkDiscount = math.Round(bulkDiscount*100) / 100

	// Eco tier discount (budget-5-7d gets flat discount of ₹100)
	if deliveryTier == "budget-5-7d" {
		bulkDiscount += 100.0
	}
	bulkDiscount = math.Round(bulkDiscount*100) / 100

	// Delivery tiers:
	// express-8h: Lead time = 8/24 days (0.3333 days). Multiplier = 1.833. Surcharge = base_price * 0.8333.
	// standard-2d: Multiplier = 1.0. Surcharge = 0.
	// budget-5-7d: Multiplier = 1.0. Surcharge = 0.
	var rushMultiplier float64 = 1.0
	var rushSurcharge float64 = 0.0
	var isExpedited bool = false

	if deliveryTier == "express-8h" {
		rushMultiplier = 1.833
		isExpedited = true
		// Surcharge is calculated on the net price after bulk discount (excluding eco discount, which doesn't apply to express)
		rushSurcharge = (basePrice - bulkDiscount) * 0.833
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
