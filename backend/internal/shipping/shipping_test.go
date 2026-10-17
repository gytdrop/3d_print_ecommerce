package shipping

import (
	"testing"
	"time"

	"techazsure-3dprint/backend/internal/config"
)

var now = time.Date(2026, 10, 17, 12, 0, 0, 0, time.UTC)

func TestMatchLevels(t *testing.T) {
	cfg := config.Defaults() // origin 560001

	cases := []struct {
		dest    string
		level   string
		daysMin int
		daysMax int
	}{
		{"560001", "same_pincode", 0, 1},
		{"560095", "same_district", 1, 2}, // 560xxx — Bengaluru sorting district
		{"562110", "same_region", 2, 3},   // 56xxxx — Karnataka circle
		{"500081", "same_zone", 3, 5},     // 5xxxxx — southern zone (Hyderabad)
		{"110001", "national", 5, 7},      // Delhi
	}

	for _, c := range cases {
		est := EstimateDelivery(cfg, c.dest, now, nil)
		if est.MatchLevel != c.level {
			t.Errorf("%s: level = %s, want %s", c.dest, est.MatchLevel, c.level)
		}
		if est.DaysMin != c.daysMin || est.DaysMax != c.daysMax {
			t.Errorf("%s: days = %d–%d, want %d–%d", c.dest, est.DaysMin, est.DaysMax, c.daysMin, c.daysMax)
		}
	}
}

func TestEtaDates(t *testing.T) {
	cfg := config.Defaults()
	est := EstimateDelivery(cfg, "110001", now, nil) // national: 5–7 days
	if est.EtaFrom != "2026-10-22" || est.EtaTo != "2026-10-24" {
		t.Errorf("ETA = %s → %s, want 2026-10-22 → 2026-10-24", est.EtaFrom, est.EtaTo)
	}
}

func TestOverrideDays(t *testing.T) {
	cfg := config.Defaults()
	est := EstimateDelivery(cfg, "110001", now, &Override{DaysMin: 2, DaysMax: 2})
	if est.MatchLevel != "override_days" || est.DaysMin != 2 || est.DaysMax != 2 {
		t.Errorf("override days not applied: %+v", est)
	}
}

func TestOverrideDate(t *testing.T) {
	cfg := config.Defaults()
	date := time.Date(2026, 10, 25, 0, 0, 0, 0, time.UTC)
	est := EstimateDelivery(cfg, "560001", now, &Override{DaysMin: -1, DaysMax: -1, DeliveryDate: &date})
	if est.MatchLevel != "override_date" || est.EtaFrom != "2026-10-25" || est.EtaTo != "2026-10-25" {
		t.Errorf("override date not applied: %+v", est)
	}
}

func TestOriginChangeMovesBands(t *testing.T) {
	cfg := config.Defaults()
	cfg.OriginPincode = "110001" // admin relocates manufacturing to Delhi
	est := EstimateDelivery(cfg, "110092", now, nil)
	if est.MatchLevel != "same_district" {
		t.Errorf("Delhi→Delhi should be same_district, got %s", est.MatchLevel)
	}
	est = EstimateDelivery(cfg, "560001", now, nil)
	if est.MatchLevel != "national" {
		t.Errorf("Delhi→Bengaluru should be national, got %s", est.MatchLevel)
	}
}
