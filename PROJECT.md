# Project: Go/PostgreSQL Backend & Storefront Integration for TechAZsure 3D Print

## Architecture
The application consists of a Go REST backend and a Next.js frontend storefront, with a PostgreSQL database.

```
                  ┌──────────────────┐
                  │ Next.js Frontend │
                  └────────┬─────────┘
                           │
             HTTP REST API │ (Ports, e.g. 8080)
                           ▼
                  ┌──────────────────┐
                  │    Go Backend    │
                  └────────┬─────────┘
                           │
            SQL Connection │ (DATABASE_URL)
                           ▼
                  ┌──────────────────┐
                  │    PostgreSQL    │
                  └──────────────────┘
```

## Code Layout
- `backend/` - Go REST backend source files.
  - `cmd/server/main.go` - Entrypoint.
  - `internal/db/` - DB models and seed scripts.
  - `internal/handlers/` - REST API handler implementations.
  - `internal/service/` - Pricing and business logic.
- `frontend/` - Next.js storefront source files.
- `integration-tests/` - Integration tests.

## Interface Contracts

### 1. `GET /api/pincodes/check?pincode=560001`
- Request Parameters:
  - `pincode`: 6-digit string
- Response (200 OK):
  ```json
  {
    "pincode": "560001",
    "eligible": true,
    "tier": "express",
    "message": "8-Hour Express Available! Order before 2 PM for tonight."
  }
  ```

### 2. `POST /api/quote`
- Request Body:
  ```json
  {
    "volume_cm3": 75.0,
    "material_type": "pla",
    "delivery_tier": "express-8h"
  }
  ```
- Response (200 OK):
  ```json
  {
    "base_price": 1420.00,
    "bulk_discount": 142.00,
    "rush_surcharge": 1064.58,
    "final_price": 2342.58,
    "rush_multiplier": 1.833,
    "is_expedited": true
  }
  ```

### 3. `POST /api/orders`
- Request Body:
  ```json
  {
    "file_name": "apple.stl",
    "file_size": 133334,
    "volume_cm3": 75.0,
    "file_url": "https://s3.amazonaws.com/techazsure-3dprint/apple.stl",
    "material_type": "pla",
    "delivery_tier": "express-8h",
    "pincode": "560001",
    "shipping_address": "123 Main St, Bangalore",
    "contact_email": "customer@example.com",
    "contact_phone": "9876543210"
  }
  ```
- Response (201 Created):
  ```json
  {
    "order_id": "3b29db42-a8c6-419f-b98a-54f9d0c649bd",
    "final_price": 2342.58
  }
  ```

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | DB Schema & Seeds | Create schema.sql for `pincodes` and `orders` tables; seed scripts. | None | DONE |
| 2 | Backend Pincodes API | Implement GET /api/pincodes/check in Go. | M1 | DONE |
| 3 | Backend Quote API | Implement POST /api/quote calculations and endpoint. | None | DONE |
| 4 | Backend Orders API | Implement POST /api/orders database persistence. | M2, M3 | DONE |
| 5 | Frontend Eco Tier & Pincode check | Update DeliveryTiers & store to support budget-5-7d and call backend pincode check. | M2 | DONE |
| 6 | Frontend Quoting & Order Placement | Dynamically source quotes from Go and submit orders on Confirm Order. | M3, M4, M5 | DONE |
| 7 | Automated Integration Tests | Automated test suite verifying pricing, pincode, and DB writes. | M4 | DONE |

