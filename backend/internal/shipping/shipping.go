// Package shipping estimates delivery windows by comparing a destination
// pincode against the manufacturing origin pincode configured in the admin
// dashboard.
//
// Indian pincodes are hierarchical: the first digit is the postal zone, the
// first two digits the postal circle/region, and the first three the sorting
// district. Proximity between origin and destination therefore maps cleanly
// onto prefix-match depth, and each depth gets an admin-tunable delivery band.
// Admins can also pin an exact window or a fixed delivery date per pincode,
// which overrides the algorithm entirely.
package shipping

import (
	"time"

	"techazsure-3dprint/backend/internal/config"
)

// Override carries per-pincode admin overrides from the pincodes table.
type Override struct {
	// DaysMin/DaysMax pin the estimate to an exact window when both ≥ 0.
	DaysMin int
	DaysMax int
	// DeliveryDate pins the estimate to a fixed calendar date (e.g. a batch
	// dispatch day); takes precedence over DaysMin/DaysMax.
	DeliveryDate *time.Time
}

// Estimate is the computed delivery window for a destination pincode.
type Estimate struct {
	Pincode       string `json:"pincode"`
	OriginPincode string `json:"origin_pincode"`
	// MatchLevel: same_pincode | same_district | same_region | same_zone |
	// national | override_days | override_date
	MatchLevel string `json:"match_level"`
	DaysMin    int    `json:"days_min"`
	DaysMax    int    `json:"days_max"`
	EtaFrom    string `json:"eta_from"` // YYYY-MM-DD
	EtaTo      string `json:"eta_to"`   // YYYY-MM-DD
	Message    string `json:"message"`
}

// prefixLen returns how many leading characters of two 6-digit pincodes match.
func prefixLen(a, b string) int {
	n := 0
	for n < len(a) && n < len(b) && a[n] == b[n] {
		n++
	}
	return n
}

// matchLevel classifies destination proximity and returns the configured band.
func matchLevel(cfg config.Config, dest string) (string, config.Band) {
	switch p := prefixLen(cfg.OriginPincode, dest); {
	case p == 6:
		return "same_pincode", cfg.Shipping.SamePincode
	case p >= 3:
		return "same_district", cfg.Shipping.SameDistrict
	case p >= 2:
		return "same_region", cfg.Shipping.SameRegion
	case p >= 1:
		return "same_zone", cfg.Shipping.SameZone
	default:
		return "national", cfg.Shipping.National
	}
}

// EstimateDelivery computes the delivery window for dest as of now.
// A non-nil override replaces the algorithmic band.
func EstimateDelivery(cfg config.Config, dest string, now time.Time, override *Override) Estimate {
	est := Estimate{Pincode: dest, OriginPincode: cfg.OriginPincode}

	if override != nil && override.DeliveryDate != nil {
		date := override.DeliveryDate.Format("2006-01-02")
		est.MatchLevel = "override_date"
		days := int(override.DeliveryDate.Sub(now).Hours() / 24)
		if days < 0 {
			days = 0
		}
		est.DaysMin, est.DaysMax = days, days
		est.EtaFrom, est.EtaTo = date, date
		est.Message = "Scheduled delivery on " + override.DeliveryDate.Format("Mon, 02 Jan 2006") + "."
		return est
	}

	var level string
	var band config.Band
	if override != nil && override.DaysMin >= 0 && override.DaysMax >= override.DaysMin {
		level = "override_days"
		band = config.Band{MinDays: override.DaysMin, MaxDays: override.DaysMax}
	} else {
		level, band = matchLevel(cfg, dest)
	}

	est.MatchLevel = level
	est.DaysMin, est.DaysMax = band.MinDays, band.MaxDays
	est.EtaFrom = now.AddDate(0, 0, band.MinDays).Format("2006-01-02")
	est.EtaTo = now.AddDate(0, 0, band.MaxDays).Format("2006-01-02")

	switch {
	case band.MinDays == 0 && band.MaxDays <= 1:
		est.Message = "Hyperlocal — same-day to next-day delivery."
	case band.MinDays == band.MaxDays:
		est.Message = "Estimated delivery in " + itoa(band.MinDays) + " day(s)."
	default:
		est.Message = "Estimated delivery in " + itoa(band.MinDays) + "–" + itoa(band.MaxDays) + " days."
	}
	return est
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [8]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}
