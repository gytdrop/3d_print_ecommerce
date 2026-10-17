-- Database Schema DDL for TechAZsure 3D Print
-- Target path: backend/internal/db/schema.sql

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Pincodes Table (Bangalore Express & Regional Hubs)
CREATE TABLE IF NOT EXISTS pincodes (
    pincode VARCHAR(6) PRIMARY KEY,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('express', 'campus', 'standard')),
    is_eligible_express BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pincodes_tier ON pincodes(tier);

-- 2. Catalog Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Catalog Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(1024) NOT NULL,
    material_default VARCHAR(50) DEFAULT 'pla',
    tag VARCHAR(50), -- e.g. 'Bestseller', 'Romantic', 'Elegant', 'Popular'
    tag_variant VARCHAR(50) DEFAULT 'badge-accent',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 4. Product Variants (Sizes & Dimensions)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    size_name VARCHAR(50) NOT NULL,
    dimensions VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    popular BOOLEAN DEFAULT FALSE
);

-- 5. Materials & Density Physical Specs
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(50) PRIMARY KEY, -- 'pla', 'petg', 'abs', 'resin', 'nylon', 'carbon'
    name VARCHAR(100) NOT NULL,
    density DECIMAL(5,2) NOT NULL, -- g/cm³
    cost_per_gram DECIMAL(8,2) NOT NULL, -- ₹/g
    machine_hourly_rate DECIMAL(8,2) DEFAULT 120.00,
    finish_type VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    saved_address TEXT,
    saved_pincode VARCHAR(6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
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
    status VARCHAR(50) NOT NULL DEFAULT 'order_placed',
    shipping_address TEXT,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_pincode ON orders(pincode);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(contact_email);

-- 8. Order Timeline / Real-Time Progress Events
CREATE TABLE IF NOT EXISTS order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- 'order_placed', 'sliced', 'in_print', 'qc_passed', 'out_for_delivery', 'delivered'
    status VARCHAR(50),
    message TEXT NOT NULL,
    location VARCHAR(255),
    rider_name VARCHAR(100),
    rider_phone VARCHAR(20),
    tracking_url VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_order ON order_timeline(order_id);

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL, -- 'razorpay', 'cashfree', 'upi_direct', 'mock_gateway'
    transaction_id VARCHAR(255) UNIQUE,
    payment_method VARCHAR(50), -- 'upi', 'card', 'netbanking'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'captured', 'failed', 'refunded'
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_pincodes_updated_at ON pincodes;
CREATE TRIGGER trg_pincodes_updated_at
    BEFORE UPDATE ON pincodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
