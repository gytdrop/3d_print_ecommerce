package service

import "testing"

func TestCalculateLampQuoteMatrix(t *testing.T) {
	cases := []struct {
		size  string
		tier  string
		final float64
	}{
		{"small", "standard-2d", 499},
		{"medium", "standard-2d", 799},
		{"large", "standard-2d", 1299},
		{"small", "budget-5-7d", 399},
		{"medium", "express-8h", 799 + 665.57},
	}

	for _, c := range cases {
		res, err := CalculateLampQuote(c.size, c.tier)
		if err != nil {
			t.Fatalf("CalculateLampQuote(%s, %s) returned error: %v", c.size, c.tier, err)
		}
		if res.FinalPrice != c.final {
			t.Errorf("CalculateLampQuote(%s, %s) final = %.2f, want %.2f", c.size, c.tier, res.FinalPrice, c.final)
		}
	}
}

func TestCalculateLampQuoteInvalidSize(t *testing.T) {
	if _, err := CalculateLampQuote("xl", "standard-2d"); err == nil {
		t.Error("expected error for invalid lamp size, got nil")
	}
}

func TestLampExpressSurcharge(t *testing.T) {
	res, err := CalculateLampQuote("small", "express-8h")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsExpedited || res.RushSurcharge <= 0 {
		t.Errorf("express tier should be expedited with a surcharge, got %+v", res)
	}
	if res.BulkDiscount != 0 {
		t.Errorf("lamp orders must not get bulk discounts, got %.2f", res.BulkDiscount)
	}
}
