// Package admin implements the REST API behind the operations dashboard.
// Every handler here is reachable only through the token-gated admin server
// (cmd/admin) — never through the public proxy.
package admin

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"techazsure-3dprint/backend/internal/config"
	"techazsure-3dprint/backend/internal/db"
	"techazsure-3dprint/backend/internal/shipping"
)

// NewAPI returns the admin API router mounted at /admin/api/.
func NewAPI() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/admin/api/config", handleConfig)
	mux.HandleFunc("/admin/api/pincodes", handlePincodes)
	mux.HandleFunc("/admin/api/pincodes/", handlePincodeItem)
	mux.HandleFunc("/admin/api/estimate", handleEstimateTest)
	mux.HandleFunc("/admin/api/orders", handleOrdersList)
	mux.HandleFunc("/admin/api/orders/", handleOrderStage)
	return mux
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// ── Settings ────────────────────────────────────────────────────────────────

// handleConfig implements GET and PUT /admin/api/config.
func handleConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, config.Get(r.Context()))
	case http.MethodPut:
		var cfg config.Config
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			writeErr(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}
		if err := config.Save(r.Context(), cfg); err != nil {
			writeErr(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, config.Get(r.Context()))
	default:
		writeErr(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// ── Pincodes & shipping overrides ───────────────────────────────────────────

// PincodeRow is a pincode record with shipping overrides.
type PincodeRow struct {
	Pincode              string  `json:"pincode"`
	Tier                 string  `json:"tier"`
	IsEligibleExpress    bool    `json:"is_eligible_express"`
	Message              string  `json:"message"`
	OverrideDaysMin      int     `json:"override_days_min"`
	OverrideDaysMax      int     `json:"override_days_max"`
	OverrideDeliveryDate *string `json:"override_delivery_date"` // YYYY-MM-DD or null
}

// handlePincodes implements GET (list, optional ?q= prefix filter) and
// POST/PUT (upsert) /admin/api/pincodes.
func handlePincodes(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		q := r.URL.Query().Get("q")
		rows, err := db.DB.QueryContext(r.Context(),
			`SELECT pincode, tier, is_eligible_express, COALESCE(message, ''),
			        COALESCE(override_days_min, -1), COALESCE(override_days_max, -1),
			        to_char(override_delivery_date, 'YYYY-MM-DD')
			 FROM pincodes
			 WHERE pincode LIKE $1 || '%'
			 ORDER BY (override_days_min >= 0 OR override_delivery_date IS NOT NULL) DESC, pincode ASC
			 LIMIT 200`, q)
		if err != nil {
			log.Printf("[ADMIN] pincode list failed: %v", err)
			writeErr(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		defer rows.Close()
		list := make([]PincodeRow, 0)
		for rows.Next() {
			var p PincodeRow
			var date sql.NullString
			if err := rows.Scan(&p.Pincode, &p.Tier, &p.IsEligibleExpress, &p.Message,
				&p.OverrideDaysMin, &p.OverrideDaysMax, &date); err != nil {
				continue
			}
			if date.Valid {
				p.OverrideDeliveryDate = &date.String
			}
			list = append(list, p)
		}
		writeJSON(w, http.StatusOK, list)

	case http.MethodPost, http.MethodPut:
		var p PincodeRow
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeErr(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}
		if len(p.Pincode) != 6 || strings.Trim(p.Pincode, "0123456789") != "" {
			writeErr(w, http.StatusBadRequest, "pincode must be 6 digits")
			return
		}
		if p.Tier != "express" && p.Tier != "campus" && p.Tier != "standard" {
			writeErr(w, http.StatusBadRequest, "tier must be express, campus, or standard")
			return
		}
		if p.OverrideDaysMin >= 0 && p.OverrideDaysMax < p.OverrideDaysMin {
			writeErr(w, http.StatusBadRequest, "override_days_max must be >= override_days_min")
			return
		}
		var date interface{}
		if p.OverrideDeliveryDate != nil && *p.OverrideDeliveryDate != "" {
			parsed, err := time.Parse("2006-01-02", *p.OverrideDeliveryDate)
			if err != nil {
				writeErr(w, http.StatusBadRequest, "override_delivery_date must be YYYY-MM-DD")
				return
			}
			date = parsed
		}
		_, err := db.DB.ExecContext(r.Context(),
			`INSERT INTO pincodes (pincode, tier, is_eligible_express, message,
			                       override_days_min, override_days_max, override_delivery_date)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT (pincode) DO UPDATE SET
			     tier = EXCLUDED.tier,
			     is_eligible_express = EXCLUDED.is_eligible_express,
			     message = EXCLUDED.message,
			     override_days_min = EXCLUDED.override_days_min,
			     override_days_max = EXCLUDED.override_days_max,
			     override_delivery_date = EXCLUDED.override_delivery_date,
			     updated_at = CURRENT_TIMESTAMP`,
			p.Pincode, p.Tier, p.IsEligibleExpress, p.Message,
			p.OverrideDaysMin, p.OverrideDaysMax, date)
		if err != nil {
			log.Printf("[ADMIN] pincode upsert failed: %v", err)
			writeErr(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		writeJSON(w, http.StatusOK, p)

	default:
		writeErr(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// handlePincodeItem implements DELETE /admin/api/pincodes/{code}.
func handlePincodeItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeErr(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	code := strings.TrimPrefix(r.URL.Path, "/admin/api/pincodes/")
	res, err := db.DB.ExecContext(r.Context(), `DELETE FROM pincodes WHERE pincode = $1`, code)
	if err != nil {
		// Pincodes referenced by orders are protected by the FK; clear
		// overrides and downgrade instead of failing opaquely.
		writeErr(w, http.StatusConflict, "Pincode is referenced by orders — set it to standard tier instead of deleting")
		return
	}
	n, _ := res.RowsAffected()
	writeJSON(w, http.StatusOK, map[string]interface{}{"deleted": n > 0})
}

// ── Estimator test tool ─────────────────────────────────────────────────────

// handleEstimateTest implements GET /admin/api/estimate?pincode= so the admin
// can preview exactly what customers will be shown.
func handleEstimateTest(w http.ResponseWriter, r *http.Request) {
	pincode := r.URL.Query().Get("pincode")
	if len(pincode) != 6 || strings.Trim(pincode, "0123456789") != "" {
		writeErr(w, http.StatusBadRequest, "pincode must be 6 digits")
		return
	}

	var override *shipping.Override
	var daysMin, daysMax int
	var date sql.NullTime
	err := db.DB.QueryRowContext(r.Context(),
		`SELECT COALESCE(override_days_min, -1), COALESCE(override_days_max, -1), override_delivery_date
		 FROM pincodes WHERE pincode = $1`, pincode).Scan(&daysMin, &daysMax, &date)
	if err == nil && (daysMin >= 0 || date.Valid) {
		override = &shipping.Override{DaysMin: daysMin, DaysMax: daysMax}
		if date.Valid {
			d := date.Time
			override.DeliveryDate = &d
		}
	}

	est := shipping.EstimateDelivery(config.Get(r.Context()), pincode, time.Now(), override)
	writeJSON(w, http.StatusOK, est)
}

// ── Orders & dispatch stages ────────────────────────────────────────────────

// validStages are the dispatch stages an operator can set, in order.
var validStages = map[string]string{
	"sliced":           "G-code generated and verified for printing.",
	"in_print":         "3D extrusion in progress on the print farm.",
	"qc_passed":        "Precision QC passed — preparing for dispatch.",
	"out_for_delivery": "Courier picked up — out for delivery.",
	"delivered":        "Order delivered.",
}

// OrderSummary is a compact order row for the dashboard list.
type OrderSummary struct {
	ID           string  `json:"id"`
	ProductType  string  `json:"product_type"`
	FileName     string  `json:"file_name"`
	LampSize     string  `json:"lamp_size"`
	DeliveryTier string  `json:"delivery_tier"`
	Pincode      string  `json:"pincode"`
	FinalPrice   float64 `json:"final_price"`
	Status       string  `json:"status"`
	StlStatus    string  `json:"stl_generation_status"`
	CreatedAt    string  `json:"created_at"`
}

// handleOrdersList implements GET /admin/api/orders — the 50 most recent.
func handleOrdersList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeErr(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	rows, err := db.DB.QueryContext(r.Context(),
		`SELECT id, COALESCE(product_type, 'stl'), file_name, COALESCE(lamp_size, ''),
		        delivery_tier, COALESCE(pincode, ''), final_price, status,
		        COALESCE(stl_generation_status, ''),
		        to_char(created_at, 'YYYY-MM-DD HH24:MI')
		 FROM orders ORDER BY created_at DESC LIMIT 50`)
	if err != nil {
		log.Printf("[ADMIN] orders list failed: %v", err)
		writeErr(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	defer rows.Close()
	list := make([]OrderSummary, 0)
	for rows.Next() {
		var o OrderSummary
		if err := rows.Scan(&o.ID, &o.ProductType, &o.FileName, &o.LampSize, &o.DeliveryTier,
			&o.Pincode, &o.FinalPrice, &o.Status, &o.StlStatus, &o.CreatedAt); err != nil {
			continue
		}
		list = append(list, o)
	}
	writeJSON(w, http.StatusOK, list)
}

// handleOrderStage implements POST /admin/api/orders/{id}/stage with body
// {"stage": "...", "location": "..."} — advances dispatch and appends the
// timeline event shown on the public /track page.
func handleOrderStage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	rest := strings.TrimPrefix(r.URL.Path, "/admin/api/orders/")
	parts := strings.Split(rest, "/")
	if len(parts) != 2 || parts[1] != "stage" || parts[0] == "" {
		writeErr(w, http.StatusNotFound, "Use POST /admin/api/orders/{id}/stage")
		return
	}
	orderID := parts[0]

	var body struct {
		Stage    string `json:"stage"`
		Message  string `json:"message"`
		Location string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	defaultMsg, ok := validStages[body.Stage]
	if !ok {
		writeErr(w, http.StatusBadRequest, "stage must be one of: sliced, in_print, qc_passed, out_for_delivery, delivered")
		return
	}
	if body.Message == "" {
		body.Message = defaultMsg
	}
	if body.Location == "" {
		body.Location = "Bangalore Hub"
	}

	res, err := db.DB.ExecContext(r.Context(),
		`UPDATE orders SET status = $2 WHERE id::text = $1`, orderID, body.Stage)
	if err != nil {
		log.Printf("[ADMIN] order stage update failed: %v", err)
		writeErr(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeErr(w, http.StatusNotFound, "Order not found")
		return
	}
	_, err = db.DB.ExecContext(r.Context(),
		`INSERT INTO order_timeline (order_id, stage, message, location)
		 VALUES ($1::uuid, $2, $3, $4)`, orderID, body.Stage, body.Message, body.Location)
	if err != nil {
		log.Printf("[ADMIN] timeline insert failed: %v", err)
	}
	writeJSON(w, http.StatusOK, map[string]string{"id": orderID, "status": body.Stage})
}
