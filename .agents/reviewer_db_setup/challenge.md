## Challenge Summary

**Overall risk assessment**: LOW

The database schema and seeds implemented for Milestone 1 are robust. The primary risk lies in the logical contradiction of unit tests for future milestones that are already committed to the repository, but the core DDL and seeding logic are sound.

## Challenges

### [Low] Challenge 1: Hardcoded 6-character Pincode Constraints

- **Assumption challenged**: Pincodes will always be exactly 6 characters.
- **Attack scenario**: If the company expands its storefront to international customers or regions outside India that use alphanumeric or different-length postal codes, inserting those postal codes into `pincodes` or `orders` will fail because of the `VARCHAR(6)` constraint.
- **Blast radius**: Future international expansion will require database migrations to alter column types and updates to backend validation logic.
- **Mitigation**: This is acceptable for the current scope (focused on Bangalore and Campus tiers in India). If expansion happens, the `pincode` column type can be migrated to `VARCHAR(20)`.

### [Low] Challenge 2: Referencing Unseeded Pincodes in Orders

- **Assumption challenged**: Orders will only be placed for pre-seeded pincodes.
- **Attack scenario**: If a customer places an order with a pincode not pre-seeded in the `pincodes` table, the foreign key constraint `orders(pincode) REFERENCES pincodes(pincode)` would normally fail.
- **Blast radius**: Order creation fails with foreign key constraint violation.
- **Mitigation**: The handler in `handlers.go` proactively upserts the pincode with the `standard` tier using `INSERT INTO pincodes ... ON CONFLICT DO NOTHING` before saving the order. This is a very robust design that fully mitigates this risk.

## Stress Test Results

- **Duplicate seeds execution** → run seed SQL script twice → `seed.sql` uses `ON CONFLICT (pincode) DO UPDATE` to gracefully update rather than crash → **PASS**
- **Existing table collision** → run schema migration when tables already exist → `schema.sql` uses `CREATE TABLE IF NOT EXISTS` and `DROP TRIGGER IF EXISTS` to prevent errors → **PASS**
- **Extreme volume decimal representation** → volume with floating-point precision (e.g., `33.553875...`) → stored in Postgres `volume_cm3 DECIMAL(10,2)` which rounds to 2 decimal places (`33.55`) without error → **PASS**

## Unchallenged Areas

- **Database Performance Under Heavy Load** — reason not challenged: beyond the scope of Milestone 1 (DB Schema & Seeds) and requires performance load testing frameworks.
