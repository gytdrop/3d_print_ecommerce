// Package config provides platform settings stored in the database and
// editable from the admin dashboard, replacing previously hardcoded pricing
// and shipping values. Readers get a cached snapshot with safe defaults when
// the settings row is absent or unreadable.
package config

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"

	"techazsure-3dprint/backend/internal/db"
)

// settingsKey is the single settings document key in the settings table.
const settingsKey = "platform_config"

// cacheTTL bounds how stale a public-API pricing/shipping read can be after
// an admin edit.
const cacheTTL = 15 * time.Second

// Band is an estimated delivery window in days.
type Band struct {
	MinDays int `json:"min_days"`
	MaxDays int `json:"max_days"`
}

// ShippingBands maps pincode proximity levels (India's hierarchical pincode
// structure compared against the manufacturing origin) to delivery windows.
type ShippingBands struct {
	SamePincode  Band `json:"same_pincode"`  // identical 6 digits
	SameDistrict Band `json:"same_district"` // first 3 digits match (sorting district)
	SameRegion   Band `json:"same_region"`   // first 2 digits match (postal circle/region)
	SameZone     Band `json:"same_zone"`     // first digit matches (postal zone)
	National     Band `json:"national"`      // everything else
}

// Config is the editable platform configuration document.
type Config struct {
	// Manufacturing origin used by the shipping estimator.
	OriginPincode string `json:"origin_pincode"`
	OriginAddress string `json:"origin_address"`

	// Photo Lamp Frame flat prices by size.
	LampPrices map[string]float64 `json:"lamp_prices"`

	// Delivery tier pricing rules.
	EcoDiscount       float64 `json:"eco_discount"`        // flat ₹ off for budget-5-7d
	RushSurchargeRate float64 `json:"rush_surcharge_rate"` // fraction of base added for express-8h

	// Volumetric (STL) pricing rules.
	MachineRatePerCm3   float64 `json:"machine_rate_per_cm3"`
	BulkVolumeThreshold float64 `json:"bulk_volume_threshold"`
	BulkPriceThreshold  float64 `json:"bulk_price_threshold"`
	BulkDiscountPct     float64 `json:"bulk_discount_pct"`

	// Shipping estimation bands.
	Shipping ShippingBands `json:"shipping"`
}

// Defaults returns the values the platform shipped with — used when no
// settings row exists yet and as the fallback on read errors.
func Defaults() Config {
	return Config{
		OriginPincode: "560001",
		OriginAddress: "TechAZsure Print Farm, Bangalore 560001",
		LampPrices: map[string]float64{
			"small":  499,
			"medium": 799,
			"large":  1299,
		},
		EcoDiscount:         100,
		RushSurchargeRate:   0.833,
		MachineRatePerCm3:   20,
		BulkVolumeThreshold: 100,
		BulkPriceThreshold:  2000,
		BulkDiscountPct:     0.10,
		Shipping: ShippingBands{
			SamePincode:  Band{MinDays: 0, MaxDays: 1},
			SameDistrict: Band{MinDays: 1, MaxDays: 2},
			SameRegion:   Band{MinDays: 2, MaxDays: 3},
			SameZone:     Band{MinDays: 3, MaxDays: 5},
			National:     Band{MinDays: 5, MaxDays: 7},
		},
	}
}

var (
	cacheMu   sync.RWMutex
	cached    Config
	cachedAt  time.Time
	haveCache bool
)

// Get returns the current configuration, served from a short-lived cache.
// Falls back to Defaults() merged with whatever was readable.
func Get(ctx context.Context) Config {
	cacheMu.RLock()
	if haveCache && time.Since(cachedAt) < cacheTTL {
		c := cached
		cacheMu.RUnlock()
		return c
	}
	cacheMu.RUnlock()

	cfg, err := load(ctx)
	if err != nil {
		log.Printf("[CONFIG] Falling back to defaults: %v", err)
		cfg = Defaults()
	}

	cacheMu.Lock()
	cached = cfg
	cachedAt = time.Now()
	haveCache = true
	cacheMu.Unlock()
	return cfg
}

// Invalidate clears the cache so the next Get re-reads the database.
// Called after admin saves.
func Invalidate() {
	cacheMu.Lock()
	haveCache = false
	cacheMu.Unlock()
}

func load(ctx context.Context) (Config, error) {
	if db.DB == nil {
		return Config{}, errors.New("database not initialized")
	}
	var raw []byte
	err := db.DB.QueryRowContext(ctx,
		`SELECT value FROM settings WHERE key = $1`, settingsKey).Scan(&raw)
	if err == sql.ErrNoRows {
		return Defaults(), nil
	}
	if err != nil {
		return Config{}, err
	}

	// Start from defaults so newly added fields keep sane values when the
	// stored document predates them.
	cfg := Defaults()
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return Config{}, err
	}
	normalize(&cfg)
	return cfg, nil
}

// Save validates and persists the configuration, then invalidates the cache.
func Save(ctx context.Context, cfg Config) error {
	normalize(&cfg)
	if err := Validate(cfg); err != nil {
		return err
	}
	raw, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	_, err = db.DB.ExecContext(ctx,
		`INSERT INTO settings (key, value) VALUES ($1, $2)
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
		settingsKey, raw)
	if err != nil {
		return err
	}
	Invalidate()
	return nil
}

// Validate rejects configurations that would break pricing or estimation.
func Validate(cfg Config) error {
	if len(cfg.OriginPincode) != 6 {
		return errors.New("origin_pincode must be a 6-digit pincode")
	}
	for _, c := range cfg.OriginPincode {
		if c < '0' || c > '9' {
			return errors.New("origin_pincode must be a 6-digit pincode")
		}
	}
	for _, size := range []string{"small", "medium", "large"} {
		if cfg.LampPrices[size] <= 0 {
			return errors.New("lamp price for " + size + " must be greater than 0")
		}
	}
	if cfg.EcoDiscount < 0 || cfg.RushSurchargeRate < 0 || cfg.BulkDiscountPct < 0 || cfg.BulkDiscountPct >= 1 {
		return errors.New("discount and surcharge rates must be non-negative (bulk discount below 100%)")
	}
	bands := []Band{
		cfg.Shipping.SamePincode, cfg.Shipping.SameDistrict,
		cfg.Shipping.SameRegion, cfg.Shipping.SameZone, cfg.Shipping.National,
	}
	for _, b := range bands {
		if b.MinDays < 0 || b.MaxDays < b.MinDays {
			return errors.New("shipping bands must satisfy 0 <= min_days <= max_days")
		}
	}
	return nil
}

// normalize fills gaps left by partial JSON documents.
func normalize(cfg *Config) {
	if cfg.LampPrices == nil {
		cfg.LampPrices = Defaults().LampPrices
	}
	def := Defaults().LampPrices
	for _, size := range []string{"small", "medium", "large"} {
		if cfg.LampPrices[size] == 0 {
			cfg.LampPrices[size] = def[size]
		}
	}
}
