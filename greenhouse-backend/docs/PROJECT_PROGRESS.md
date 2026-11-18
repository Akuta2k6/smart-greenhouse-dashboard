
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

## Current Work

### Phase 4 - Backend Refactoring
- Extract in-memory data into data module.
- Separate actuator validation rules.
- Separate business logic into services.
- Separate API controllers and routes.
- Add error handling middleware.
- Preserve existing API endpoints.

Status: In progress.

## Pending

- Test refactored Backend.
- Align supported actuator types with Frontend.
- Add automated Backend tests.
- Integrate PostgreSQL.
- Build Python Sensor Simulator.
- Implement Rule Engine.
- Add telemetry history and alerts.
- Improve Dashboard and charts.
- Build interactive 2D greenhouse model.
- Perform end-to-end testing.

## Git Milestones

- Initial repository: existing Git history.
- API standardization and actuator error handling: commit completed only after user confirmation.
- Backend refactoring: pending validation and commit.
