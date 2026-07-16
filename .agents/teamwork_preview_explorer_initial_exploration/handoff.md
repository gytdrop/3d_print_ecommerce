# Initial Exploration Handoff Report

## 1. Observation
We explored the codebase and direct system parameters and observed the following:

- **Frontend Order Flow & Pricing Store**:
  - Location: `frontend/store/useOrderStore.ts`
  - Lead time definitions (lines 33-42):
    ```typescript
    export const DEFAULT_LEAD_TIME_DAYS = 2;
    export const RUSH_RATE = 0.5;
    export const TIER_LEAD_TIMES: Record<DeliveryTierId, number> = {
      'express-8h':  8 / 24,  // ≈ 0.333 days
      'standard-2d': 2.0,
    };
    ```
  - Pricing formula logic (lines 93-97):
    ```typescript
    const rushMultiplier = Math.max(
      1,
      1 + (DEFAULT_LEAD_TIME_DAYS - leadTimeDays) * RUSH_RATE,
    );
    const finalPrice   = basePrice * rushMultiplier;
    ```
    This yields a multiplier of `1.833` for `express-8h` and `1.0` for `standard-2d`.

- **Pincode Verification Discrepancy**:
  - In the checkout flow (`frontend/components/order-flow/DeliveryTiers.tsx`, lines 71-77):
    ```typescript
    const handleCheck = (e: React.FormEvent) => {
      e.preventDefault();
      if (value.length !== 6) return;
      // Placeholder check — replace with GET /api/zones/check?pincode=...
      setEligible(parseInt(value[0]) <= 4);
      setChecked(true);
    };
    ```
    This considers pincodes starting with `1`, `2`, `3`, or `4` to be eligible for express delivery, but denies pincodes starting with `5` (like Bangalore's `560xxx`).
  - In the information page (`frontend/app/zones/page.tsx`, lines 24-38):
    ```typescript
    // Express Tier: 560001 to 560110 (Bangalore Core Hub)
    if (pinNum >= 560001 && pinNum <= 560110) {
      return {
        tier: 'express',
        message: '8-Hour Express Available! Place your order before 2 PM to receive your print tonight.',
      };
    }
    ```
    This correctly targets Bangalore pincodes `560001-560110` for express delivery and Mahendragarh campus pincodes `123021-123035` for campus priority.

- **System and Environment Scan**:
  - There is currently no backend implementation (no Go files, no migrations, no `.env` configuration files).
  - Executing system level commands (`go version` and `psql --version`) timed out waiting for authorization, so we assume standard Linux tools are/will be installed.

---

## 2. Logic Chain
- **Pincode Eligibility Consistency**:
  1. The hero description states same-day delivery is active in Bangalore.
  2. The informational `/zones` route identifies `560001-560110` as the Express delivery zone.
  3. The checkout order flow (`DeliveryTiers.tsx`) checks `value[0] <= 4`, which marks Bangalore pincodes as ineligible.
  4. **Conclusion**: We must unify pincode checking via a PostgreSQL database table (`pincodes`) lookup and a Go endpoint `/api/zones/check?pincode=...`.

- **5-7 Day Eco/Budget Tier & Volume Discounts**:
  1. Adding a "5-7 Day Eco/Budget" tier using the linear rush calculation `(2 - leadTime) * 0.5` would result in a negative multiplier if unclamped, or `1.0` if clamped to `Math.max(1, ...)`.
  2. To reward customers for selecting a slower delivery speed, we must explicitly define a static discount multiplier of `0.85` (a 15% discount) for the `budget-5-7d` tier.
  3. Printing a larger volume model uses material linearly but amortizes fixed machine setup overheads. 
  4. Implementing volume-based bulk discounts: 10% discount for volumes between `50 cm³` and `150 cm³`, and 20% discount for volumes above `150 cm³`.
  5. The pricing calculation pipeline should be:
     `Base Price` $\to$ `Apply Bulk Volume Discount` $\to$ `Apply Delivery Speed Multiplier/Discount`.

---

## 3. Caveats
- Since shell access timed out, the exact versions of Go and PostgreSQL running on the local host are not verified. Standard installation of Go 1.22+ and PostgreSQL 15+ is assumed.
- S3 bucket details (name, credentials, region) are not defined in the frontend. S3 configuration must be added to Go backend environment files.
- The UI in `DeliveryTiers.tsx` currently only list two tiers (`express-8h`, `standard-2d`). The implementer will need to add a third option (`budget-5-7d`) to both the UI and the Zustand store state.

---

## 4. Conclusion & Recommendations

### A. Database Schema Design (PostgreSQL)
We propose two tables: `pincodes` (reference) and `orders` (transactional).

```sql
-- Database Migrations for PostgreSQL

-- 1. Create pincodes table
CREATE TABLE pincodes (
    pincode VARCHAR(6) PRIMARY KEY,
    tier VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'express', 'campus', 'standard'
    is_eligible_express BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Bangalore core hub and Campus pincodes
INSERT INTO pincodes (pincode, tier, is_eligible_express, message)
SELECT LPAD(gs.id::text, 6, '0'), 'express', TRUE, '8-Hour Express Available! Order before 2 PM for tonight.'
FROM generate_series(560001, 560110) AS gs(id)
ON CONFLICT (pincode) DO NOTHING;

INSERT INTO pincodes (pincode, tier, is_eligible_express, message)
SELECT LPAD(gs.id::text, 6, '0'), 'campus', FALSE, 'Campus Priority Active! Evening hand-delivery.'
FROM generate_series(123021, 123035) AS gs(id)
ON CONFLICT (pincode) DO NOTHING;

-- 2. Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    volume_cm3 DECIMAL(10, 2),
    file_url VARCHAR(1024) NOT NULL, -- S3 URL
    material_type VARCHAR(20) NOT NULL, -- 'pla', 'abs', 'petg', 'resin', 'nylon', 'carbon'
    delivery_tier VARCHAR(20) NOT NULL, -- 'express-8h', 'standard-2d', 'budget-5-7d'
    pincode VARCHAR(6) REFERENCES pincodes(pincode),
    base_price DECIMAL(12, 2) NOT NULL,
    rush_surcharge DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    bulk_discount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_address TEXT,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
```

### B. Go Backend Architecture
- **Routing**: Go 1.22's native `http.ServeMux` for zero-overhead, standard-library aligned URL routing.
- **Database Driver**: `pgx/v5` with connection pooling (`pgxpool`) and SQLC for generating type-safe DB queries.
- **Directory Structure**:
  ```
  backend/
  ├── cmd/
  │   └── server/
  │       └── main.go          # Entrypoint, DB pooling, config startup
  ├── internal/
  │   ├── config/
  │   │   └── config.go        # Config loading via ENV (DATABASE_URL, AWS_S3_BUCKET)
  │   ├── database/            # sqlc generated models and queries
  │   │   ├── db.go
  │   │   ├── models.go
  │   │   └── orders.sql.go
  │   ├── handlers/            # HTTP endpoints
  │   │   ├── orders.go        # POST /api/orders, GET /api/orders/{id}
  │   │   └── pincodes.go      # GET /api/zones/check
  │   └── service/
  │       └── pricing.go       # Mathematical model calculator
  ├── db/
  │   ├── schema.sql
  │   └── queries/
  ```

### C. Mathematical Pricing Model
1. **Base Price**:
   $$P_{\text{base}} = V \times (\text{density} \times \text{cost\_per\_gram} + 20)$$
   Where the machine rate overhead is constant at ₹20 per cm³ (₹120/hr at 10 minutes/cm³).
2. **Bulk Discount**:
   $$D_{\text{bulk\_rate}} = \begin{cases} 0.00 & \text{if } V \le 50 \\ 0.10 & \text{if } 50 < V \le 150 \\ 0.20 & \text{if } V > 150 \end{cases}$$
   $$P_{\text{discounted\_base}} = P_{\text{base}} \times (1 - D_{\text{bulk\_rate}})$$
3. **Delivery Tier Speed Multiplier**:
   $$P_{\text{final}} = P_{\text{discounted\_base}} \times M_{\text{tier}}$$
   Where:
   - $M_{\text{express-8h}} = 1.833$
   - $M_{\text{standard-2d}} = 1.000$
   - $M_{\text{budget-5-7d}} = 0.850$ (15% discount)

---

## 5. Verification Method
- **Pincode Lookup Route**:
  1. Trigger a GET request to `/api/zones/check?pincode=560001`.
  2. Expect output: `{ "tier": "express", "eligible": true, "message": "..." }`.
  3. Trigger GET to `/api/zones/check?pincode=999999` or non-eligible pincodes.
  4. Expect output: `{ "tier": "standard", "eligible": false }`.
- **Order Placement & Pricing Route**:
  1. Trigger a POST request to `/api/orders` with body containing volume, material, tier, and pincode.
  2. Verify that the response `base_price`, `bulk_discount`, `rush_surcharge`, and `final_price` strictly match the mathematical pricing model.
