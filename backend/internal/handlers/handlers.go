package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"techazsure-3dprint/backend/internal/db"
	"techazsure-3dprint/backend/internal/service"
)

// CORSMiddleware wraps http.Handler to configure standard CORS headers.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow localhost:3000 or any origin for local development convenience.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// PincodeCheckResponse represents the body returned by GET /api/pincodes/check.
type PincodeCheckResponse struct {
	Pincode  string `json:"pincode"`
	Eligible bool   `json:"eligible"`
	Tier     string `json:"tier"`
	Message  string `json:"message"`
}

// HandlePincodeCheck handles GET /api/pincodes/check.
func HandlePincodeCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pincode := r.URL.Query().Get("pincode")
	if !isValidPincode(pincode) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid pincode format. Must be a 6-digit number."})
		return
	}

	var tier string
	var eligible bool
	var msg sql.NullString

	err := db.DB.QueryRowContext(r.Context(),
		"SELECT tier, is_eligible_express, message FROM pincodes WHERE pincode = $1", pincode).
		Scan(&tier, &eligible, &msg)

	if err == sql.ErrNoRows {
		// If not found in the DB but is a valid 6-digit number, return standard tier
		response := PincodeCheckResponse{
			Pincode:  pincode,
			Eligible: false,
			Tier:     "standard",
			Message:  "Standard shipping available.",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	} else if err != nil {
		log.Printf("[API] Database error checking pincode: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := PincodeCheckResponse{
		Pincode:  pincode,
		Eligible: eligible,
		Tier:     tier,
		Message:  msg.String,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// HandleQuote handles POST /api/quote.
func HandleQuote(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req service.QuoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON payload"})
		return
	}

	if req.VolumeCm3 <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "volume_cm3 must be greater than 0"})
		return
	}

	res, err := service.CalculateQuote(req.VolumeCm3, req.MaterialType, req.DeliveryTier)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

// OrderRequest represents the body accepted by POST /api/orders.
type OrderRequest struct {
	FileName        string  `json:"file_name"`
	FileSize        int64   `json:"file_size"`
	VolumeCm3       float64 `json:"volume_cm3"`
	FileURL         string  `json:"file_url"`
	MaterialType    string  `json:"material_type"`
	DeliveryTier    string  `json:"delivery_tier"`
	Pincode         string  `json:"pincode"`
	ShippingAddress string  `json:"shipping_address"`
	ContactEmail    string  `json:"contact_email"`
	ContactPhone    string  `json:"contact_phone"`
}

// OrderResponse represents the body returned by POST /api/orders.
type OrderResponse struct {
	OrderID    string  `json:"order_id"`
	FinalPrice float64 `json:"final_price"`
}

// HandleOrders handles POST /api/orders.
func HandleOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req OrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON payload"})
		return
	}

	// Validate inputs
	if req.FileName == "" || req.FileSize <= 0 || req.VolumeCm3 <= 0 || req.FileURL == "" ||
		req.MaterialType == "" || req.DeliveryTier == "" || req.ShippingAddress == "" ||
		req.ContactEmail == "" || req.ContactPhone == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "All fields are required and must be valid"})
		return
	}

	if !isValidPincode(req.Pincode) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid pincode format. Must be a 6-digit number."})
		return
	}

	// Ensure material is valid
	if _, ok := service.Materials[req.MaterialType]; !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid material type"})
		return
	}

	// Calculate prices
	prices, err := service.CalculateQuote(req.VolumeCm3, req.MaterialType, req.DeliveryTier)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Upsert the pincode into pincodes table if not already present
	_, err = db.DB.ExecContext(r.Context(),
		`INSERT INTO pincodes (pincode, tier, is_eligible_express, message)
		 VALUES ($1, 'standard', false, 'Standard shipping available.')
		 ON CONFLICT (pincode) DO NOTHING`, req.Pincode)
	if err != nil {
		log.Printf("[API] Database error upserting pincode: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Save order to the database
	var orderID string
	err = db.DB.QueryRowContext(r.Context(),
		`INSERT INTO orders (
			file_name, file_size, volume_cm3, file_url, material_type, delivery_tier,
			pincode, base_price, rush_surcharge, bulk_discount, final_price,
			shipping_address, contact_email, contact_phone
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id`,
		req.FileName, req.FileSize, req.VolumeCm3, req.FileURL, req.MaterialType, req.DeliveryTier,
		req.Pincode, prices.BasePrice, prices.RushSurcharge, prices.BulkDiscount, prices.FinalPrice,
		req.ShippingAddress, req.ContactEmail, req.ContactPhone,
	).Scan(&orderID)

	if err != nil {
		log.Printf("[API] Database error saving order: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := OrderResponse{
		OrderID:    orderID,
		FinalPrice: prices.FinalPrice,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// isValidPincode checks if a string is exactly 6 decimal digits.
func isValidPincode(p string) bool {
	if len(p) != 6 {
		return false
	}
	for _, c := range p {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}
