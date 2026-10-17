package service

import (
	"errors"
	"math"

	"techazsure-3dprint/backend/internal/config"
)

// LampSize describes one fixed Photo Lamp Frame size. Panel dimensions are the
// visible lithophane face in landscape orientation (swap W/H for portrait).
type LampSize struct {
	PanelWidthMm  float64
	PanelHeightMm float64
	BoxDepthMm    float64
	Price         float64
	// NominalVolumeCm3 is a bookkeeping estimate (panel + box walls) stored on
	// the order row so lamp orders coexist with volume-based STL orders.
	NominalVolumeCm3 float64
}

// LampSizes is the fixed Photo Lamp Frame pricing matrix (photo-lamp-spec.md).
var LampSizes = map[string]LampSize{
	"small":  {PanelWidthMm: 100, PanelHeightMm: 80, BoxDepthMm: 30, Price: 499, NominalVolumeCm3: 42},
	"medium": {PanelWidthMm: 150, PanelHeightMm: 100, BoxDepthMm: 30, Price: 799, NominalVolumeCm3: 78},
	"large":  {PanelWidthMm: 200, PanelHeightMm: 150, BoxDepthMm: 30, Price: 1299, NominalVolumeCm3: 142},
}

// LampBoxColors enumerates the box color/finish options offered in v1.
var LampBoxColors = map[string]bool{
	"black":  true,
	"white":  true,
	"walnut": true,
}

// LampOrientations enumerates the panel orientations.
var LampOrientations = map[string]bool{
	"landscape": true,
	"portrait":  true,
}

// CalculateLampQuote prices a Photo Lamp Frame with the platform's shipped
// default configuration. Prefer CalculateLampQuoteCfg in handlers so
// admin-edited prices take effect.
func CalculateLampQuote(size string, deliveryTier string) (QuoteResponse, error) {
	return CalculateLampQuoteCfg(config.Defaults(), size, deliveryTier)
}

// CalculateLampQuoteCfg prices a Photo Lamp Frame: flat matrix base price
// (admin-editable) with the same delivery-tier adjustments used by
// CalculateQuoteCfg (express rush surcharge, eco tier flat discount). Bulk
// volume discounts do not apply.
func CalculateLampQuoteCfg(cfg config.Config, size string, deliveryTier string) (QuoteResponse, error) {
	if _, ok := LampSizes[size]; !ok {
		return QuoteResponse{}, errors.New("invalid lamp size: must be small, medium, or large")
	}

	basePrice := cfg.LampPrices[size]
	if basePrice <= 0 {
		basePrice = LampSizes[size].Price
	}

	var bulkDiscount float64
	if deliveryTier == "budget-5-7d" {
		bulkDiscount = cfg.EcoDiscount
	}

	var rushMultiplier float64 = 1.0
	var rushSurcharge float64 = 0.0
	var isExpedited bool = false
	if deliveryTier == "express-8h" {
		rushMultiplier = 1.0 + cfg.RushSurchargeRate
		isExpedited = true
		rushSurcharge = math.Round(basePrice*cfg.RushSurchargeRate*100) / 100
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
