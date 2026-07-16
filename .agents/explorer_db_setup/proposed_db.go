// Package db manages the PostgreSQL database connection and schema initialization.
// Target path: backend/internal/db/db.go
package db

import (
	"context"
	"database/sql"
	_ "embed"
	"fmt"
	"log"
	"os"
	"time"

	// Using Jackc PGX driver which is the standard, modern library for Postgres in Go
	_ "github.com/jackc/pgx/v5/stdlib"
)

// DB is the global database connection pool.
var DB *sql.DB

// Embed the schema and seed scripts directly into the Go binary.
// This guarantees that migrations run out-of-the-box in single-binary deployments.
//
//go:embed schema.sql
var schemaSQL string

//go:embed seed.sql
var seedSQL string

// InitDB initializes the connection pool and performs schema setup and seeding.
func InitDB() (*sql.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		// Provide a helpful fallback or return an error
		return nil, fmt.Errorf("DATABASE_URL environment variable is required but was not set")
	}

	var db *sql.DB
	var err error

	// Retry connection loop (critical when running alongside Postgres in Docker Compose
	// where Postgres may take a few seconds to start accepting connections).
	maxRetries := 5
	for i := 1; i <= maxRetries; i++ {
		log.Printf("[DB] Connecting to database (attempt %d/%d)...", i, maxRetries)
		
		db, err = sql.Open("pgx", databaseURL)
		if err == nil {
			err = db.Ping()
			if err == nil {
				break
			}
		}

		log.Printf("[DB] Warning: Connection attempt %d failed: %v. Retrying in 2 seconds...", i, err)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to establish database connection after %d attempts: %w", maxRetries, err)
	}

	// Configure reasonable connection pool boundaries
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	DB = db

	// Run schema migrations and seeds inside a transaction
	if err := runMigrationsAndSeeds(db); err != nil {
		return nil, fmt.Errorf("failed to apply migrations/seeds: %w", err)
	}

	log.Println("[DB] Database successfully connected and initialized.")
	return db, nil
}

// CloseDB closes the database connection pool.
func CloseDB() {
	if DB != nil {
		if err := DB.Close(); err != nil {
			log.Printf("[DB] Error closing connection pool: %v", err)
		} else {
			log.Println("[DB] Database connection pool closed.")
		}
	}
}

// runMigrationsAndSeeds executes the schema DDL and seeding SQL inside a single transaction.
func runMigrationsAndSeeds(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	// Defer rollback (safe as it's a no-op if transaction was already committed)
	defer tx.Rollback()

	log.Println("[DB] Applying database schema tables and triggers...")
	if _, err := tx.ExecContext(ctx, schemaSQL); err != nil {
		return fmt.Errorf("schema execution failed: %w", err)
	}

	log.Println("[DB] Applying seed data for pincodes...")
	if _, err := tx.ExecContext(ctx, seedSQL); err != nil {
		return fmt.Errorf("seed execution failed: %w", err)
	}

	// Commit the transaction to apply all changes atomically
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("transaction commit failed: %w", err)
	}

	log.Println("[DB] Transaction successfully committed (schema + seeds applied).")
	return nil
}
