-- Database Schema DDL for TechAZsure 3D Print
-- Target path: backend/internal/db/schema.sql

-- Enable UUID extension if we want to use uuid_generate_v4() instead of gen_random_uuid()
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Pincodes Table
CREATE TABLE IF NOT EXISTS pincodes (
    pincode VARCHAR(6) PRIMARY KEY,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('express', 'campus', 'standard')),
    is_eligible_express BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on tier for quick lookup
CREATE INDEX IF NOT EXISTS idx_pincodes_tier ON pincodes(tier);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    volume_cm3 DECIMAL(10,2),
    file_url VARCHAR(1024) NOT NULL,
    material_type VARCHAR(20) NOT NULL,
    delivery_tier VARCHAR(20) NOT NULL,
    pincode VARCHAR(6) REFERENCES pincodes(pincode) ON DELETE SET NULL,
    base_price DECIMAL(12,2) NOT NULL,
    rush_surcharge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    bulk_discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_address TEXT,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on orders foreign key for join optimization
CREATE INDEX IF NOT EXISTS idx_orders_pincode ON orders(pincode);

-- Trigger for auto-updating updated_at timestamp on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS trg_pincodes_updated_at ON pincodes;
CREATE TRIGGER trg_pincodes_updated_at
    BEFORE UPDATE ON pincodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
