// Command admin runs the TechAZsure operations dashboard as a SEPARATE
// service from the public storefront, for security isolation:
//
//   - It is never routed through the public Nginx proxy.
//   - In Docker it binds to 127.0.0.1 on the VPS host only — reach it from
//     outside via an SSH tunnel: ssh -L 9090:127.0.0.1:9090 user@vps
//   - Every request (except the login page shell) requires the ADMIN_TOKEN
//     bearer token, compared in constant time.
//
// The dashboard edits platform settings (pricing, manufacturing origin,
// shipping bands), manages per-pincode delivery overrides, tests the
// shipping estimator, and advances order dispatch stages.
package main

import (
	"crypto/rand"
	"crypto/subtle"
	_ "embed"
	"encoding/hex"
	"log"
	"net/http"
	"os"

	"techazsure-3dprint/backend/internal/admin"
	"techazsure-3dprint/backend/internal/db"
)

//go:embed dashboard.html
var dashboardHTML []byte

func main() {
	log.Println("Starting TechAZsure ADMIN dashboard server...")

	if _, err := db.InitDB(); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer db.CloseDB()

	token := os.Getenv("ADMIN_TOKEN")
	if token == "" {
		// Refuse to run unauthenticated: generate a one-boot token and log it
		// so a dev instance is still usable without configuration.
		buf := make([]byte, 24)
		if _, err := rand.Read(buf); err != nil {
			log.Fatalf("Failed to generate admin token: %v", err)
		}
		token = hex.EncodeToString(buf)
		log.Printf("[ADMIN] ADMIN_TOKEN not set — generated one-boot token: %s", token)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(dashboardHTML)
	})

	api := admin.NewAPI()
	mux.Handle("/admin/api/", requireToken(token, api))

	port := os.Getenv("ADMIN_PORT")
	if port == "" {
		port = "9090"
	}

	log.Printf("[ADMIN] Dashboard listening on port %s (keep this port OFF the public proxy; use an SSH tunnel)...", port)
	if err := http.ListenAndServe(":"+port, securityHeaders(mux)); err != nil {
		log.Fatalf("Admin server failed: %v", err)
	}
}

// requireToken enforces the bearer token on every API request using a
// constant-time comparison.
func requireToken(token string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got := r.Header.Get("Authorization")
		const prefix = "Bearer "
		if len(got) <= len(prefix) ||
			subtle.ConstantTimeCompare([]byte(got[:len(prefix)]), []byte(prefix)) != 1 ||
			subtle.ConstantTimeCompare([]byte(got[len(prefix):]), []byte(token)) != 1 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"Unauthorized — provide the admin token"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// securityHeaders applies strict headers; the dashboard is a single
// self-contained page with inline assets.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Security-Policy",
			"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:")
		next.ServeHTTP(w, r)
	})
}
