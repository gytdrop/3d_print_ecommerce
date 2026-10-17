package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"techazsure-3dprint/backend/internal/db"
	"techazsure-3dprint/backend/internal/service"
)

// CORSMiddleware wraps http.Handler to configure standard CORS headers.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

// HandleHealth handles GET /api/health
func HandleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dbStatus := "healthy"
	if err := db.DB.PingContext(r.Context()); err != nil {
		dbStatus = "unreachable"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "ok",
		"service":  "techazsure-backend",
		"database": dbStatus,
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
		// Default to standard delivery tier
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

// ProductResponse models product rows from database.
type ProductResponse struct {
	ID              string  `json:"id"`
	CategoryID      string  `json:"category_id"`
	Name            string  `json:"name"`
	Slug            string  `json:"slug"`
	Description     string  `json:"description"`
	BasePrice       float64 `json:"base_price"`
	ImageURL        string  `json:"image_url"`
	MaterialDefault string  `json:"material_default"`
	Tag             string  `json:"tag"`
	TagVariant      string  `json:"tag_variant"`
	IsActive        bool    `json:"is_active"`
}

// HandleProducts handles GET /api/products
func HandleProducts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	categoryFilter := r.URL.Query().Get("category")

	var rows *sql.Rows
	var err error

	if categoryFilter != "" && categoryFilter != "all" {
		rows, err = db.DB.QueryContext(r.Context(),
			`SELECT id, COALESCE(category_id, ''), name, slug, COALESCE(description, ''), base_price,
			        image_url, COALESCE(material_default, 'pla'), COALESCE(tag, ''), COALESCE(tag_variant, 'badge-accent'), is_active
			 FROM products WHERE category_id = $1 AND is_active = true ORDER BY name ASC`,
			categoryFilter)
	} else {
		rows, err = db.DB.QueryContext(r.Context(),
			`SELECT id, COALESCE(category_id, ''), name, slug, COALESCE(description, ''), base_price,
			        image_url, COALESCE(material_default, 'pla'), COALESCE(tag, ''), COALESCE(tag_variant, 'badge-accent'), is_active
			 FROM products WHERE is_active = true ORDER BY name ASC`)
	}

	if err != nil {
		log.Printf("[API] Database error fetching products: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	products := make([]ProductResponse, 0)
	for rows.Next() {
		var p ProductResponse
		if err := rows.Scan(&p.ID, &p.CategoryID, &p.Name, &p.Slug, &p.Description, &p.BasePrice,
			&p.ImageURL, &p.MaterialDefault, &p.Tag, &p.TagVariant, &p.IsActive); err != nil {
			log.Printf("[API] Row scan error: %v", err)
			continue
		}
		products = append(products, p)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(products)
}

// MaterialResponse models materials from database.
type MaterialResponse struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	Density           float64 `json:"density"`
	CostPerGram       float64 `json:"cost_per_gram"`
	MachineHourlyRate float64 `json:"machine_hourly_rate"`
	FinishType        string  `json:"finish_type"`
	IsAvailable       bool    `json:"is_available"`
}

// HandleMaterials handles GET /api/materials
func HandleMaterials(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.QueryContext(r.Context(),
		`SELECT id, name, density, cost_per_gram, machine_hourly_rate, COALESCE(finish_type, ''), is_available
		 FROM materials WHERE is_available = true ORDER BY cost_per_gram ASC`)
	if err != nil {
		log.Printf("[API] Database error fetching materials: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	materials := make([]MaterialResponse, 0)
	for rows.Next() {
		var m MaterialResponse
		if err := rows.Scan(&m.ID, &m.Name, &m.Density, &m.CostPerGram, &m.MachineHourlyRate, &m.FinishType, &m.IsAvailable); err != nil {
			log.Printf("[API] Row scan error: %v", err)
			continue
		}
		materials = append(materials, m)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(materials)
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
	Status     string  `json:"status"`
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
			shipping_address, contact_email, contact_phone, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'order_placed')
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

	// Create initial order_timeline entry
	_, _ = db.DB.ExecContext(r.Context(),
		`INSERT INTO order_timeline (order_id, stage, message, location)
		 VALUES ($1, 'order_placed', 'Order registered and queued for farm slicing.', 'Bangalore Hub')`,
		orderID,
	)

	response := OrderResponse{
		OrderID:    orderID,
		FinalPrice: prices.FinalPrice,
		Status:     "order_placed",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// TimelineEvent models an individual progression checkpoint.
type TimelineEvent struct {
	ID        string `json:"id"`
	Stage     string `json:"stage"`
	Message   string `json:"message"`
	Location  string `json:"location"`
	CreatedAt string `json:"created_at"`
}

// OrderDetailResponse models full details of an order for tracking.
type OrderDetailResponse struct {
	ID              string          `json:"id"`
	FileName        string          `json:"file_name"`
	VolumeCm3       float64         `json:"volume_cm3"`
	MaterialType    string          `json:"material_type"`
	DeliveryTier    string          `json:"delivery_tier"`
	Pincode         string          `json:"pincode"`
	FinalPrice      float64         `json:"final_price"`
	Status          string          `json:"status"`
	ShippingAddress string          `json:"shipping_address"`
	CreatedAt       string          `json:"created_at"`
	Timeline        []TimelineEvent `json:"timeline"`
}

// HandleOrderTracking routes GET /api/orders/track?id=<order_id> or handles single order lookups.
func HandleOrderTracking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	orderID := r.URL.Query().Get("id")
	if orderID == "" {
		// Also allow path extraction if routed like /api/orders/track/{id}
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) >= 3 && parts[1] == "track" {
			orderID = parts[2]
		}
	}

	if orderID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Missing order id parameter"})
		return
	}

	var detail OrderDetailResponse
	var createdAtStr string
	err := db.DB.QueryRowContext(r.Context(),
		`SELECT id, file_name, COALESCE(volume_cm3, 0), material_type, delivery_tier,
		        COALESCE(pincode, ''), final_price, status, COALESCE(shipping_address, ''),
		        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		 FROM orders WHERE id::text = $1`, orderID).
		Scan(&detail.ID, &detail.FileName, &detail.VolumeCm3, &detail.MaterialType, &detail.DeliveryTier,
			&detail.Pincode, &detail.FinalPrice, &detail.Status, &detail.ShippingAddress, &createdAtStr)

	if err == sql.ErrNoRows {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	} else if err != nil {
		log.Printf("[API] Database error fetching order %s: %v", orderID, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	detail.CreatedAt = createdAtStr

	// Fetch timeline events
	rows, err := db.DB.QueryContext(r.Context(),
		`SELECT id, stage, message, COALESCE(location, ''), to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		 FROM order_timeline WHERE order_id::text = $1 ORDER BY created_at ASC`, orderID)
	if err == nil {
		defer rows.Close()
		events := make([]TimelineEvent, 0)
		for rows.Next() {
			var ev TimelineEvent
			if err := rows.Scan(&ev.ID, &ev.Stage, &ev.Message, &ev.Location, &ev.CreatedAt); err == nil {
				events = append(events, ev)
			}
		}
		detail.Timeline = events
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(detail)
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
