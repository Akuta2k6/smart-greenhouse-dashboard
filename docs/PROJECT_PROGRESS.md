
# Smart Strawberry Greenhouse - Project Progress

Last updated: 2026-11-18

## Technology Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL (planned)
- Sensor Simulator: Python (planned)
- Greenhouse Model: Interactive 2D (planned)

## Completed

### Phase 1 - Initial Setup
- Installed Node.js and npm.
- Installed Frontend and Backend dependencies.
- Started Frontend and Backend successfully.
- Verified Telemetry API.
- Verified Frontend-Backend communication.

### Phase 2 - API Standardization
- Consolidated Axios client.
- Configured Vite proxy to Backend port 5000.
- Verified Frontend build.
- Verified API requests return HTTP 200.

### Phase 3 - Actuator Error Handling
- Removed local actuator state fallback on API failure.
- Added Backend confirmation before updating Frontend state.
- Tested normal actuator control.
- Tested water tank failsafe below 15%.
- Tested Backend disconnection.
- Frontend build passed.

### Phase 4 - Backend Refactoring

Status: Completed.

- Separated in-memory data into data module.
- Created actuator validation rules.
- Separated business logic into services.
- Created telemetry and actuator controllers.
- Created greenhouse API routes.
- Added 404 and error handling middleware.
- Preserved existing API endpoints.
- Verified Backend startup.
- Verified telemetry API.
- Verified actuator control.
- Verified water tank failsafe.
- Verified Frontend integration.

Manual tests: 5/5 PASS.

### Phase 5 - Automated Backend Tests

Status: Completed.

- Added automated Backend tests using Node.js built-in node:test.
- Added HTTP API tests using fetch.
- Tested valid and invalid telemetry requests.
- Tested actuator control and input validation.
- Tested water tank failsafe below 15%.
- All 7 automated tests passed.


## Phase 6 – PostgreSQL Local Integration

Status: COMPLETED

### Completed
- Installed and configured PostgreSQL 18.
- Created database smart_greenhouse_db and role greenhouse_app.
- Created 10 database tables and required indexes.
- Seeded greenhouse, zones, devices, thresholds and initial telemetry.
- Configured PostgreSQL connection using pg and dotenv.
- Integrated GET Latest Telemetry API with PostgreSQL.
- Integrated actuator command persistence with PostgreSQL transactions.
- Enforced a server-side irrigation duration of 120 seconds.
- Preserved water tank failsafe: pump activation is blocked below 15%.
- Added integration test verifying actuator command persistence and duration_seconds = 120.

### Validation
- Backend automated tests: 8/8 passed.
- PostgreSQL telemetry query: successful.
- Actuator command persistence: successful.
- Irrigation duration validation: successful.
- Water tank failsafe validation: successful.

### Pending
- Python sensor simulator.
- Automated Rule Engine.
- Automatic pump shutdown and 15-minute cooldown.
- Online deployment.
- Add telemetry history and alerts.
- Improve Dashboard and charts.
- Build interactive 2D greenhouse model.
- Perform end-to-end testing.

## Git Milestones

- Initial repository: existing Git history.
- API standardization and actuator error handling: commit completed only after user confirmation.
- Backend refactoring: pending validation and commit.
