## 2026-07-15T18:23:03Z
You are a teamwork_preview_worker. Your working directory is `/home/gytdrop/Documents/Desktop_Archive/BHAYYA/techazsure/3d print/.agents/worker_backend_api/`.
Your mission is to implement the Go backend REST API for TechAZsure's 3D print storefront.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please follow these requirements:
1. Load database parameters using the `DATABASE_URL` environment variable.
2. Implement REST endpoints using Go's `net/http` standard library. Ensure it supports:
   - `GET /api/pincodes/check`:
     - Accept `pincode` as query parameter.
     - Query the database `pincodes` table.
     - If the pincode is found, return the tier, eligibility for express, and the message in JSON.
     - If not found in the DB but is a valid 6-digit number, return standard tier (eligible: false, tier: "standard", message: "Standard shipping available.").
     - If invalid, return 400 Bad Request.
   - `POST /api/quote`:
     - Accept JSON body with `volume_cm3`, `material_type`, `delivery_tier`.
     - Calculate base price using the formula: Base Price = (Volume * Material Density * Cost Per Gram) + (Print Time * Machine Hourly Rate).
       - Materials config:
         - `pla`: { density: 1.24, costPerGram: 18 }
         - `abs`: { density: 1.05, costPerGram: 22 }
         - `petg`: { density: 1.27, costPerGram: 25 }
         - `resin`: { density: 1.18, costPerGram: 35 }
         - `nylon`: { density: 1.01, costPerGram: 42 }
         - `carbon`: { density: 1.35, costPerGram: 89 }
       - Print time is estimated at 10 mins per cm³ of volume. Print Time Hours = (volume_cm3 * 10) / 60.
       - Machine Hourly Rate = ₹120.
       - So Machine Cost = Print Time Hours * 120 = volume_cm3 * 20.
     - Delivery tiers:
       - `express-8h`: Lead time = 8/24 days (0.3333 days). Multiplier = 1 + (2 - 1/3) * 0.5 = 1.833. Surcharge = base_price * 0.8333. is_expedited = true.
       - `standard-2d`: Lead time = 2.0 days. Multiplier = 1.0. Surcharge = 0. is_expedited = false.
       - `budget-5-7d`: Lead time = 6.0 days. Multiplier = 1.0. Surcharge = 0. is_expedited = false. Flat discount of ₹100.
     - Bulk discount rule:
       - If `volume_cm3 >= 100` or `base_price >= 2000`, apply 10% discount on the base price.
     - Calculations:
       - `base_price`: calculated base price
       - `bulk_discount`: bulk discount + eco tier discount (if applicable)
       - `rush_surcharge`: rush surcharge
       - `final_price`: base_price + rush_surcharge - bulk_discount
       - `rush_multiplier`: 1.833 or 1.0
       - `is_expedited`: boolean
     - Return JSON matching the contract in `PROJECT.md`.
   - `POST /api/orders`:
     - Accept JSON body matching the contract in `PROJECT.md`.
     - Save order to the `orders` table in PostgreSQL.
     - Return 201 Created with the generated order ID (UUID) and final price.
3. Update `backend/cmd/server/main.go` to start the HTTP server on port 8080 (or PORT env var) and register the handlers.
4. Support CORS so that the frontend on localhost:3000 can communicate with the backend.
5. Create a verification script or compile and test the server to verify it compiles and runs without issues.

Deliver a completion report detailing the files modified, Go compile outcomes, and verification results.
