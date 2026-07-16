# Original User Request

## Initial Request — 2026-07-15T23:37:51Z

Add a Go/PostgreSQL backend API to TechAZsure's 3D print storefront to manage pricing, pincode checks, and order creation. Migrate the static frontend order flow to integrate dynamically with this backend, including support for a new Budget/Eco shipping tier (5-7 days) and volume-based/bulk pricing discounts.

Working directory: /home/gytdrop/Documents/Desktop_Archive/BHAYYA/techazsure/3d print
Integrity mode: development

## Requirements

### R1. Go/PostgreSQL Backend Service
- Create a backend service in Go. It must connect to PostgreSQL using a `DATABASE_URL` environment variable.
- Expose REST endpoints:
  - `POST /api/quote`: Calculates the order price based on material density, cost per gram, model volume, delivery tier, and volume-based discounts.
  - `GET /api/pincodes/check`: Verifies pincode eligibility for shipping speeds.
  - `POST /api/orders`: Submits and saves order records to the database (saving details like file metadata, selected options, and computed final price).

### R2. Next.js Frontend Integration
- Update the Next.js storefront (currently in `/frontend`) to connect with the Go backend API.
- Source quote prices dynamically by calling the backend `/api/quote` instead of calculating locally in `useOrderStore.ts`.
- Query the backend `/api/pincodes/check` for pincode validation in `DeliveryTiers.tsx`.
- Submit orders to `/api/orders` upon confirmation and display a success state with the actual database order ID.

### R3. Budget Rates & Discount Logic
- Add a "5-7 Day Eco/Budget" shipping speed to the delivery tier selection, costing less (e.g. ₹100 discount or lower multiplier).
- Implement bulk/budget pricing rules (e.g. orders with large volumes or total costs get a percentage discount).

### R4. Automated Integration Tests
- Write an automated integration test script (in Go or shell) that runs backend endpoints against a test/live database instance and verifies database writes and pricing math.

## Acceptance Criteria

### API Endpoints
- [ ] `GET /api/pincodes/check?pincode=560001` returns shipping eligibility in JSON format.
- [ ] `POST /api/quote` accurately returns the base price, surcharge, and total quote for all delivery tiers, including the 5-7 Day Eco/Budget tier and volume discounts.
- [ ] `POST /api/orders` inserts a new order row into the PostgreSQL database and returns the created order ID.

### Frontend Integration
- [ ] The order flow displays the "5-7 Day Budget" option correctly and fetches the updated quote from the backend API.
- [ ] Clicking "Confirm Order" submits a POST request to `/api/orders` and renders a success banner displaying the actual database order ID.
- [ ] Pincode check on `/upload` calls the backend API and renders the eligibility result.

### Testing & Verification
- [ ] An automated test suite passes successfully, testing pricing calculations, pincode verification, and database persistence.
- [ ] A migration script or SQL schema file is provided to initialize the database tables automatically.
