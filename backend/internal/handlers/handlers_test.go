package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandlePincodeCheck_Invalid(t *testing.T) {
	tests := []struct {
		pincode string
		status  int
	}{
		{"", http.StatusBadRequest},
		{"123", http.StatusBadRequest},
		{"abcdeg", http.StatusBadRequest},
		{"1234567", http.StatusBadRequest},
	}

	for _, tc := range tests {
		req, err := http.NewRequest("GET", "/api/pincodes/check?pincode="+tc.pincode, nil)
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(HandlePincodeCheck)

		handler.ServeHTTP(rr, req)

		if rr.Code != tc.status {
			t.Errorf("for pincode %q expected status %d, got %d", tc.pincode, tc.status, rr.Code)
		}
	}
}

func TestHandleQuote_Valid(t *testing.T) {
	reqBody, _ := json.Marshal(map[string]interface{}{
		"volume_cm3":    75.0,
		"material_type": "pla",
		"delivery_tier": "express-8h",
	})
	req, err := http.NewRequest("POST", "/api/quote", bytes.NewBuffer(reqBody))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(HandleQuote)

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}

	// Verify fields
	for _, key := range []string{"base_price", "bulk_discount", "rush_surcharge", "final_price", "rush_multiplier", "is_expedited"} {
		if _, ok := resp[key]; !ok {
			t.Errorf("expected response to contain key %q", key)
		}
	}
}

func TestHandleQuote_Invalid(t *testing.T) {
	tests := []struct {
		body   map[string]interface{}
		status int
	}{
		{map[string]interface{}{"volume_cm3": -10.0, "material_type": "pla", "delivery_tier": "standard-2d"}, http.StatusBadRequest},
		{map[string]interface{}{"volume_cm3": 10.0, "material_type": "unknown", "delivery_tier": "standard-2d"}, http.StatusBadRequest},
	}

	for _, tc := range tests {
		reqBody, _ := json.Marshal(tc.body)
		req, err := http.NewRequest("POST", "/api/quote", bytes.NewBuffer(reqBody))
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(HandleQuote)

		handler.ServeHTTP(rr, req)

		if rr.Code != tc.status {
			t.Errorf("for body %v expected status %d, got %d", tc.body, tc.status, rr.Code)
		}
	}
}
