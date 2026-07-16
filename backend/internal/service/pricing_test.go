package service

import (
	"math"
	"testing"
)

func TestCalculateQuote_NoBulkDiscount(t *testing.T) {
	// Vol = 33.553875 (base price 1420.00, no bulk discount because < 2000 and vol < 100)
	vol := 33.5538752362949
	res, err := CalculateQuote(vol, "pla", "express-8h")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if math.Abs(res.BasePrice-1420.00) > 0.01 {
		t.Errorf("expected BasePrice 1420.00, got %.2f", res.BasePrice)
	}
	if res.BulkDiscount != 0.00 {
		t.Errorf("expected BulkDiscount 0.00, got %.2f", res.BulkDiscount)
	}
	if math.Abs(res.RushSurcharge-1182.86) > 0.01 {
		t.Errorf("expected RushSurcharge 1182.86, got %.2f", res.RushSurcharge)
	}
	if math.Abs(res.FinalPrice-2602.86) > 0.01 {
		t.Errorf("expected FinalPrice 2602.86, got %.2f", res.FinalPrice)
	}
	if res.RushMultiplier != 1.833 {
		t.Errorf("expected RushMultiplier 1.833, got %.3f", res.RushMultiplier)
	}
	if !res.IsExpedited {
		t.Errorf("expected IsExpedited true, got false")
	}
}

func TestCalculateQuote_WithBulkDiscount(t *testing.T) {
	// Vol = 75.0 (base price 3174.00 >= 2000, qualifies for 10% bulk discount)
	vol := 75.0
	res, err := CalculateQuote(vol, "pla", "express-8h")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if math.Abs(res.BasePrice-3174.00) > 0.01 {
		t.Errorf("expected BasePrice 3174.00, got %.2f", res.BasePrice)
	}
	if math.Abs(res.BulkDiscount-317.40) > 0.01 {
		t.Errorf("expected BulkDiscount 317.40, got %.2f", res.BulkDiscount)
	}
	if math.Abs(res.RushSurcharge-2379.55) > 0.01 {
		t.Errorf("expected RushSurcharge 2379.55, got %.2f", res.RushSurcharge)
	}
	if math.Abs(res.FinalPrice-5236.15) > 0.01 {
		t.Errorf("expected FinalPrice 5236.15, got %.2f", res.FinalPrice)
	}
}

func TestCalculateQuote_BudgetTier(t *testing.T) {
	// Test budget-5-7d tier for pla material, volume 10 (no bulk discount, only eco discount)
	// Base Price = 10 * (1.24 * 18 + 20) = 10 * 42.32 = 423.20.
	// Eco discount = 100.
	// Bulk discount = 100.
	// Rush surcharge = 0.
	// Final price = 423.20 - 100 = 323.20.
	vol := 10.0
	res, err := CalculateQuote(vol, "pla", "budget-5-7d")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if math.Abs(res.BasePrice-423.20) > 0.01 {
		t.Errorf("expected BasePrice 423.20, got %.2f", res.BasePrice)
	}
	if math.Abs(res.BulkDiscount-100.00) > 0.01 {
		t.Errorf("expected BulkDiscount 100.00, got %.2f", res.BulkDiscount)
	}
	if res.RushSurcharge != 0.0 {
		t.Errorf("expected RushSurcharge 0, got %.2f", res.RushSurcharge)
	}
	if math.Abs(res.FinalPrice-323.20) > 0.01 {
		t.Errorf("expected FinalPrice 323.20, got %.2f", res.FinalPrice)
	}
}
