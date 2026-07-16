package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"techazsure-3dprint/backend/internal/db"
)

func TestIntegration(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("Skipping integration test: DATABASE_URL environment variable is not set")
	}

	// Call db.InitDB() to connect, migrate, and seed the database.
	database, err := db.InitDB()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.CloseDB()

	// 1. Tests GET /api/pincodes/check?pincode=560001 (verifying eligible express tier response matches seed)
	t.Run("GET /api/pincodes/check?pincode=560001", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/pincodes/check?pincode=560001", nil)
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(HandlePincodeCheck)
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rr.Code)
		}

		var resp PincodeCheckResponse
		if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp.Pincode != "560001" {
			t.Errorf("expected pincode 560001, got %s", resp.Pincode)
		}
		if !resp.Eligible {
			t.Errorf("expected eligible true, got %t", resp.Eligible)
		}
		if resp.Tier != "express" {
			t.Errorf("expected tier express, got %s", resp.Tier)
		}
		expectedMsg := "8-Hour Express Available! Order before 2 PM for tonight."
		if resp.Message != expectedMsg {
			t.Errorf("expected message %q, got %q", expectedMsg, resp.Message)
		}
	})

	// 2. Tests POST /api/quote (verifying pricing calculations, rush surcharge, bulk/budget discounts)
	t.Run("POST /api/quote", func(t *testing.T) {
		// Scenario 1: Express with bulk discount (volume >= 100 or basePrice >= 2000)
		reqBody1, _ := json.Marshal(map[string]interface{}{
			"volume_cm3":    75.0,
			"material_type": "pla",
			"delivery_tier": "express-8h",
		})
		req1, err := http.NewRequest("POST", "/api/quote", bytes.NewBuffer(reqBody1))
		if err != nil {
			t.Fatal(err)
		}

		rr1 := httptest.NewRecorder()
		handler := http.HandlerFunc(HandleQuote)
		handler.ServeHTTP(rr1, req1)

		if rr1.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rr1.Code)
		}

		var resp1 map[string]interface{}
		if err := json.Unmarshal(rr1.Body.Bytes(), &resp1); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp1["base_price"].(float64) != 3174.00 {
			t.Errorf("expected base_price 3174.00, got %f", resp1["base_price"])
		}
		if resp1["bulk_discount"].(float64) != 317.40 {
			t.Errorf("expected bulk_discount 317.40, got %f", resp1["bulk_discount"])
		}
		if resp1["rush_surcharge"].(float64) != 2379.55 {
			t.Errorf("expected rush_surcharge 2379.55, got %f", resp1["rush_surcharge"])
		}
		if resp1["final_price"].(float64) != 5236.15 {
			t.Errorf("expected final_price 5236.15, got %f", resp1["final_price"])
		}

		// Scenario 2: Budget with eco discount (budget-5-7d gets flat discount of ₹100)
		reqBody2, _ := json.Marshal(map[string]interface{}{
			"volume_cm3":    10.0,
			"material_type": "pla",
			"delivery_tier": "budget-5-7d",
		})
		req2, err := http.NewRequest("POST", "/api/quote", bytes.NewBuffer(reqBody2))
		if err != nil {
			t.Fatal(err)
		}

		rr2 := httptest.NewRecorder()
		handler.ServeHTTP(rr2, req2)

		if rr2.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rr2.Code)
		}

		var resp2 map[string]interface{}
		if err := json.Unmarshal(rr2.Body.Bytes(), &resp2); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp2["base_price"].(float64) != 423.20 {
			t.Errorf("expected base_price 423.20, got %f", resp2["base_price"])
		}
		if resp2["bulk_discount"].(float64) != 100.00 {
			t.Errorf("expected bulk_discount 100.00, got %f", resp2["bulk_discount"])
		}
		if resp2["rush_surcharge"].(float64) != 0.00 {
			t.Errorf("expected rush_surcharge 0.00, got %f", resp2["rush_surcharge"])
		}
		if resp2["final_price"].(float64) != 323.20 {
			t.Errorf("expected final_price 323.20, got %f", resp2["final_price"])
		}
	})

	// 3. Tests POST /api/orders (verifying successful order creation, database persistence, and return of created UUID)
	// 4. Queries the database directly to verify the order row was inserted correctly.
	t.Run("POST /api/orders & Database Verification", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"file_name":        "test_order.stl",
			"file_size":        123456,
			"volume_cm3":       75.0,
			"file_url":         "https://s3.amazonaws.com/techazsure-3dprint/test_order.stl",
			"material_type":    "pla",
			"delivery_tier":    "express-8h",
			"pincode":          "560001",
			"shipping_address": "123 Main St, Bangalore",
			"contact_email":    "testcustomer@example.com",
			"contact_phone":    "9876543210",
		}
		bodyBytes, _ := json.Marshal(reqBody)
		req, err := http.NewRequest("POST", "/api/orders", bytes.NewBuffer(bodyBytes))
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(HandleOrders)
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusCreated {
			t.Fatalf("expected status 201 Created, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		var resp OrderResponse
		if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp.OrderID == "" {
			t.Errorf("expected non-empty order_id")
		}

		if resp.FinalPrice != 5236.15 {
			t.Errorf("expected final price 5236.15, got %f", resp.FinalPrice)
		}

		// Query the database directly to verify the order row was inserted correctly.
		var (
			fileName        string
			fileSize        int64
			volumeCm3       float64
			fileUrl         string
			materialType    string
			deliveryTier    string
			pincode         string
			basePrice       float64
			rushSurcharge   float64
			bulkDiscount    float64
			finalPrice      float64
			shippingAddress string
			contactEmail    string
			contactPhone    string
		)

		err = database.QueryRowContext(context.Background(),
			`SELECT file_name, file_size, volume_cm3, file_url, material_type, delivery_tier,
			        pincode, base_price, rush_surcharge, bulk_discount, final_price,
			        shipping_address, contact_email, contact_phone
			 FROM orders WHERE id = $1`, resp.OrderID).Scan(
			&fileName, &fileSize, &volumeCm3, &fileUrl, &materialType, &deliveryTier,
			&pincode, &basePrice, &rushSurcharge, &bulkDiscount, &finalPrice,
			&shippingAddress, &contactEmail, &contactPhone,
		)

		if err != nil {
			t.Fatalf("failed to query order from DB: %v", err)
		}

		if fileName != "test_order.stl" {
			t.Errorf("expected file_name 'test_order.stl', got %q", fileName)
		}
		if fileSize != 123456 {
			t.Errorf("expected file_size 123456, got %d", fileSize)
		}
		if volumeCm3 != 75.0 {
			t.Errorf("expected volume_cm3 75.0, got %f", volumeCm3)
		}
		if fileUrl != "https://s3.amazonaws.com/techazsure-3dprint/test_order.stl" {
			t.Errorf("expected file_url match, got %q", fileUrl)
		}
		if materialType != "pla" {
			t.Errorf("expected material_type 'pla', got %q", materialType)
		}
		if deliveryTier != "express-8h" {
			t.Errorf("expected delivery_tier 'express-8h', got %q", deliveryTier)
		}
		if pincode != "560001" {
			t.Errorf("expected pincode '560001', got %q", pincode)
		}
		if basePrice != 3174.00 {
			t.Errorf("expected basePrice 3174.00, got %f", basePrice)
		}
		if rushSurcharge != 2379.55 {
			t.Errorf("expected rushSurcharge 2379.55, got %f", rushSurcharge)
		}
		if bulkDiscount != 317.40 {
			t.Errorf("expected bulkDiscount 317.40, got %f", bulkDiscount)
		}
		if finalPrice != 5236.15 {
			t.Errorf("expected finalPrice 5236.15, got %f", finalPrice)
		}
		if shippingAddress != "123 Main St, Bangalore" {
			t.Errorf("expected shippingAddress match, got %q", shippingAddress)
		}
		if contactEmail != "testcustomer@example.com" {
			t.Errorf("expected contactEmail match, got %q", contactEmail)
		}
		if contactPhone != "9876543210" {
			t.Errorf("expected contactPhone match, got %q", contactPhone)
		}
	})
}
