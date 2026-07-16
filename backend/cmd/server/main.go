package main

import (
	"log"
	"net/http"
	"os"

	"techazsure-3dprint/backend/internal/db"
	"techazsure-3dprint/backend/internal/handlers"
)

func main() {
	log.Println("Starting TechAZsure 3D Print backend server...")

	// Initialize the database connection, migrate schema, and seed data.
	_, err := db.InitDB()
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer db.CloseDB()

	// Register routes with standard multiplexer
	mux := http.NewServeMux()
	mux.HandleFunc("/api/pincodes/check", handlers.HandlePincodeCheck)
	mux.HandleFunc("/api/quote", handlers.HandleQuote)
	mux.HandleFunc("/api/orders", handlers.HandleOrders)

	// Wrap handlers with CORS middleware
	handler := handlers.CORSMiddleware(mux)

	// Determine port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server listening on port %s...", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
