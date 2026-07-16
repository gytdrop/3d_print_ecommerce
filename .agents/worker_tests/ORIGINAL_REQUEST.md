## 2026-07-16T00:01:33Z

You are a teamwork_preview_worker. Your working directory is `/home/gytdrop/Documents/Desktop_Archive/BHAYYA/techazsure/3d print/.agents/worker_tests/`.
Your mission is to implement and run automated integration tests for TechAZsure's 3D print backend.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please perform the following:
1. Write an integration test file in `backend/internal/handlers/integration_test.go` that:
   - Checks if `DATABASE_URL` environment variable is set. If not set, skips the test (`t.Skip`).
   - If set, calls `db.InitDB()` to connect, migrate, and seed the database.
   - Tests GET `/api/pincodes/check?pincode=560001` (verifying eligible express tier response matches seed).
   - Tests POST `/api/quote` (verifying pricing calculations, rush surcharge, bulk/budget discounts).
   - Tests POST `/api/orders` (verifying successful order creation, database persistence, and return of created UUID).
   - Queries the database directly to verify the order row was inserted correctly.
2. Compile and run all backend tests by executing `go test -v ./...` in the `backend/` directory. Make sure you set a suitable `DATABASE_URL` if one exists in the environment, or search the system environment variables.
3. Build the Go backend binary using `go build -o server ./cmd/server` to confirm it compiles cleanly.
4. Deliver a completion report detailing the tests written, test execution outputs, and build results. If any commands prompt for user permission, wait or resolve them.
