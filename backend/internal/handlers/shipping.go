package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"techazsure-3dprint/backend/internal/config"
	"techazsure-3dprint/backend/internal/db"
	"techazsure-3dprint/backend/internal/shipping"
)

// lookupOverride fetches admin shipping overrides for a pincode, if any.
func lookupOverride(ctx context.Context, pincode string) *shipping.Override {
	var daysMin, daysMax int
	var date sql.NullTime
	err := db.DB.QueryRowContext(ctx,
		`SELECT COALESCE(override_days_min, -1), COALESCE(override_days_max, -1), override_delivery_date
		 FROM pincodes WHERE pincode = $1`, pincode).
		Scan(&daysMin, &daysMax, &date)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Printf("[API] Override lookup failed for %s: %v", pincode, err)
		}
		return nil
	}

	hasDays := daysMin >= 0 && daysMax >= daysMin
	if !hasDays && !date.Valid {
		return nil
	}
	ov := &shipping.Override{DaysMin: daysMin, DaysMax: daysMax}
	if !hasDays {
		ov.DaysMin, ov.DaysMax = -1, -1
	}
	if date.Valid {
		d := date.Time
		ov.DeliveryDate = &d
	}
	return ov
}

// HandleShippingEstimate handles GET /api/shipping/estimate?pincode=560001.
// It compares the destination pincode against the manufacturing origin
// configured in the admin dashboard and returns an estimated delivery window,
// honoring any per-pincode admin override.
func HandleShippingEstimate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pincode := r.URL.Query().Get("pincode")
	if !isValidPincode(pincode) {
		writeJSONError(w, http.StatusBadRequest, "Invalid pincode format. Must be a 6-digit number.")
		return
	}

	cfg := config.Get(r.Context())
	override := lookupOverride(r.Context(), pincode)
	est := shipping.EstimateDelivery(cfg, pincode, time.Now(), override)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(est)
}

// HandleLampConfig handles GET /api/lamp/config — the public, read-only
// subset of platform settings the lamp configurator needs to display
// accurate prices before the server-side quote.
func HandleLampConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cfg := config.Get(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"lamp_prices":         cfg.LampPrices,
		"eco_discount":        cfg.EcoDiscount,
		"rush_surcharge_rate": cfg.RushSurchargeRate,
	})
}
