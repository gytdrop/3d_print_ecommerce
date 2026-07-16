# Scope: Milestone 1 — DB Schema & Seeds

## Objective
Create the PostgreSQL database tables (`pincodes` and `orders`) and write seed scripts to populate them with the initial Bangalore and Campus pincodes.

## Requirements
1. **Database Tables**:
   - `pincodes`:
     - `pincode`: VARCHAR(6) PRIMARY KEY
     - `tier`: VARCHAR(20) NOT NULL DEFAULT 'standard' -- 'express', 'campus', 'standard'
     - `is_eligible_express`: BOOLEAN NOT NULL DEFAULT FALSE
     - `message`: TEXT
     - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     - `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   - `orders`:
     - `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
     - `file_name`: VARCHAR(255) NOT NULL
     - `file_size`: BIGINT NOT NULL
     - `volume_cm3`: DECIMAL(10,2)
     - `file_url`: VARCHAR(1024) NOT NULL
     - `material_type`: VARCHAR(20) NOT NULL
     - `delivery_tier`: VARCHAR(20) NOT NULL
     - `pincode`: VARCHAR(6) REFERENCES pincodes(pincode)
     - `base_price`: DECIMAL(12,2) NOT NULL
     - `rush_surcharge`: DECIMAL(12,2) NOT NULL DEFAULT 0.00
     - `bulk_discount`: DECIMAL(12,2) NOT NULL DEFAULT 0.00
     - `final_price`: DECIMAL(12,2) NOT NULL
     - `status`: VARCHAR(50) NOT NULL DEFAULT 'pending'
     - `shipping_address`: TEXT
     - `contact_email`: VARCHAR(255) NOT NULL
     - `contact_phone`: VARCHAR(20) NOT NULL
     - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     - `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

2. **Seed Scripts**:
   - Populate `pincodes` with:
     - Pincodes `560001` to `560110` (Bangalore Core Hub): tier = 'express', is_eligible_express = true, message = '8-Hour Express Available! Order before 2 PM for tonight.'
     - Pincodes `123021` to `123035` (Campus): tier = 'campus', is_eligible_express = false, message = 'Campus Priority Active! Evening hand-delivery.'

3. **Database Initialization**:
   - Create a Go script or integrated Go startup logic in `backend/cmd/server/main.go` or `backend/internal/db/db.go` that reads the schema and applies it to initialize the database if tables do not exist.
   - Use the environment variable `DATABASE_URL` for connecting.

## Verification
- Running the schema migration successfully creates the tables.
- Querying the database shows `pincodes` are fully populated.
- Tables match layout in PROJECT.md.
