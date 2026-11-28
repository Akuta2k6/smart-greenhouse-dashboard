
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

## Phase 8 – Incident Service & Rule Engine Integration

**Trạng thái: COMPLETED**

### 1. Mục tiêu
Xây dựng Incident Service và tích hợp với Rule Engine nhằm tự động phát hiện các điều kiện môi trường bất thường, tạo cảnh báo trong cơ sở dữ liệu PostgreSQL và tự động cập nhật trạng thái Incident khi điều kiện trở lại bình thường.

### 2. Các chức năng đã triển khai

- Xây dựng `incidentService.js` để quản lý việc tạo và đồng bộ Incident theo từng Zone.
- Tích hợp `syncZoneIncidents()` vào `ruleEngineService.js`.
- Sử dụng transaction và khóa bản ghi Zone (`SELECT ... FOR UPDATE`) để hạn chế tạo Incident trùng khi xử lý đồng thời.
- Kiểm tra tính hợp lệ của dữ liệu cảm biến trước khi đánh giá điều kiện cảnh báo.
- Không tự động đóng Incident khi dữ liệu cảm biến không hợp lệ hoặc đã cũ.
- Tự động chuyển Incident từ `OPEN` sang `RESOLVED` khi điều kiện cảnh báo không còn tồn tại.
- Cho phép tạo Incident mới khi cùng một điều kiện bất thường tái diễn.

### 3. Các ngưỡng cảnh báo đã triển khai

| Điều kiện | Mức độ ưu tiên |
|---|---|
| Nhiệt độ > 25°C và <= 30°C | HIGH |
| Nhiệt độ > 30°C | CRITICAL |
| Độ ẩm không khí > 80% | HIGH |
| Độ ẩm không khí < 50% | HIGH |
| Mực nước bồn chứa <= 15% | CRITICAL |

### 4. Kết quả kiểm thử

| Nội dung kiểm thử | Kết quả |
|---|---|
| Tạo Incident khi nhiệt độ vượt 25°C | PASS |
| Tạo Incident CRITICAL khi nhiệt độ vượt 30°C | PASS |
| Chuyển cảnh báo nhiệt độ khi mức độ nguy hiểm thay đổi | PASS |
| Tạo Incident khi độ ẩm không khí > 80% | PASS |
| Tạo Incident khi độ ẩm không khí < 50% | PASS |
| Tạo Incident khi mực nước bồn chứa <= 15% | PASS |
| Hạn chế tạo Incident trùng khi điều kiện bất thường vẫn tồn tại | PASS |
| Tự động chuyển Incident sang RESOLVED khi điều kiện bình thường | PASS |
| Quản lý Incident độc lập theo từng Zone | PASS |
| Giữ trạng thái Incident khi dữ liệu cảm biến không hợp lệ hoặc đã cũ | PASS |

Các kiểm thử thực tế với PostgreSQL và Python Sensor Simulator đã xác nhận:

- Incident ID 17: cảnh báo độ ẩm không khí cao được tạo và sau đó chuyển sang `RESOLVED`.
- Incident ID 19: cảnh báo độ ẩm không khí thấp được tạo và sau đó chuyển sang `RESOLVED`.
- Incident ID 20, 21, 22: cảnh báo mực nước thấp được tạo cho cả ba Zone và sau đó chuyển sang `RESOLVED`.
- Incident ID 18: cảnh báo nhiệt độ Zone 2 được giữ ở trạng thái `OPEN` khi nhiệt độ vẫn vượt ngưỡng. Đây là hành vi đúng theo quy tắc nghiệp vụ.

### 5. Trạng thái sau kiểm thử

- Đã khôi phục các thông số Sensor Simulator về trạng thái bình thường.
- Mực nước bồn chứa được khôi phục về 80%.
- Nhiệt độ các Zone được đưa về khoảng 23–24°C.
- Độ ẩm không khí Zone 1 được khôi phục về 68.2%.
- Đã chạy truy vấn kiểm tra cuối cùng trên PostgreSQL: không còn Incident nào ở trạng thái `OPEN` hoặc `IN_PROGRESS`.

### 6. Các file chính liên quan

- `greenhouse-backend/src/services/incidentService.js`
- `greenhouse-backend/src/services/ruleEngineService.js`
- `greenhouse-backend/src/rules/greenhouseRuleEngine.js`
- `greenhouse-backend/src/rules/actuatorRules.js`
- `greenhouse-backend/src/rules/commandPriority.js`
- `greenhouse-backend/src/rules/pumpTiming.js`
- `greenhouse-backend/src/jobs/`
- `greenhouse-backend/simulator/sensor_simulator.py`
- `greenhouse-backend/database/migrations/002_add_fog_heater_category.sql`
- `greenhouse-backend/database/migrations/003_add_failsafe_mode.sql`
- Các file kiểm thử liên quan trong `greenhouse-backend/tests/`

### 7. Kết luận

Phase 8 đã hoàn thành. Incident Service hoạt động cùng Rule Engine và Python Sensor Simulator, có khả năng phát hiện các điều kiện môi trường bất thường, tạo cảnh báo theo mức độ ưu tiên, hạn chế cảnh báo trùng và tự động đóng Incident khi điều kiện trở lại bình thường.

**Trạng thái cuối: COMPLETED – Đã kiểm thử các chức năng chính và khôi phục dữ liệu mô phỏng về trạng thái bình thường.**



## Phase 9 – 2D Greenhouse Model

Status: Initial implementation completed.

### Files changed
- `src/components/GreenhouseMap.jsx` – New interactive 2D greenhouse SVG model.
- `src/App.jsx` – Integrated GreenhouseMap into Zones tab.

### Implemented
- Top-down greenhouse layout with three strawberry growing zones.
- Strawberry growing beds, sensor icons, actuator labels and central water tank.
- Zone status colors: OPTIMAL, WARNING, CRITICAL.
- Displays live temperature and soil humidity from zonesData.
- Displays water tank level from API telemetry.
- Clicking a zone updates selectedZone in the main Dashboard.

### Validation
- `npm run build`: PASSED.
- Vite production build completed successfully.
- 2D model rendered successfully in browser.
- Live zone telemetry and water tank level displayed.

### Remaining
- Connect actual actuator states to the 2D model.
- Connect incidents and alert status to each zone.
- Improve device status visualization.
- Test abnormal environmental scenarios.


## Phase 10 – Incident Management API

### 1. Objectives

Develop an API for managing greenhouse incidents and integrating incident data from the PostgreSQL database with the frontend dashboard.

### 2. Implementation

- Created the Incident Service to retrieve incident records from PostgreSQL.
- Implemented the Incident Controller to handle incident-related requests.
- Added the API endpoint:
  - `GET /api/v1/greenhouse/incidents`
- Supported retrieving the latest 100 incidents.
- Supported filtering incidents by `zoneId`.
- Integrated the `getIncidents()` function into the frontend API service (`src/services/api.js`).

### 3. Validation

- Verified that the backend can retrieve incident records from PostgreSQL.
- Verified that the API supports retrieving incidents and filtering them by zone.
- Confirmed that the backend can synchronize incident statuses when environmental conditions return to normal.

### 4. Status

- [x] Incident Service implemented.
- [x] Incident Controller implemented.
- [x] Incident API route implemented.
- [x] API retrieval and filtering implemented.
- [ ] Frontend incident interface integration verified.


## Phase 11 – Simulator Scenarios and Automation Testing

### 1. Objectives

Extend the Python Simulator to support predefined environmental scenarios and test the automatic greenhouse control rules under different conditions.

### 2. Implementation

Updated the Simulator files:

- `greenhouse-backend/simulator/main.py`
- `greenhouse-backend/simulator/sensor_simulator.py`

Implemented command-line scenario selection using the `--scenario` argument.

Supported scenarios:

| Scenario | Description |
|---|---|
| `normal` | Normal greenhouse environmental conditions |
| `high-temperature` | Simulates high temperature in Zone 01 (32°C) |
| `high-humidity` | Simulates high air humidity in Zone 01 (85%) |
| `low-humidity` | Simulates low air humidity in Zone 01 (40%) |
| `low-water-tank` | Simulates a low shared water tank level (10%) |
| `low-soil-moisture` | Simulates low soil moisture in Zone 01 (50%) |
| `soil-moisture-recovered` | Simulates soil moisture recovery in Zone 01 (80%) |

The Simulator sends telemetry data for three greenhouse zones every 5 seconds.

### 3. Automation Testing

Tested the following automatic control behaviors:

- **High temperature:** The system creates a critical incident, activates the cooling fan, and opens the shade system.
- **Normal temperature:** The system resolves the related incident and restores the fan and shade states.
- **High air humidity:** The system creates a HIGH-priority incident and activates the fan.
- **Low air humidity:** The system creates a HIGH-priority incident.
- **Low water tank level:** The system creates a CRITICAL incident for all three zones and activates the pump failsafe protection when necessary.
- **Low soil moisture:** The irrigation pump automatically starts when soil moisture is below 60% and the water tank level is above 15%.
- **Pump maximum runtime:** The system automatically stops the irrigation pump after 120 seconds of operation using FAILSAFE mode.
- **Pump cooldown:** The system prevents automatic pump restart during the 15-minute cooldown period.

### 4. Validation

- Successfully executed all predefined Simulator scenarios.
- Verified telemetry updates in PostgreSQL.
- Verified automatic actuator commands and execution statuses in the `actuator_commands` table.
- Verified incident creation and resolution through the backend logs and database.
- Confirmed that Python Simulator files pass syntax validation using `py_compile`.

### 5. Status

- [x] Added predefined Simulator scenarios.
- [x] Added command-line scenario selection.
- [x] Implemented telemetry simulation for three zones.
- [x] Tested temperature and humidity automation.
- [x] Tested low water tank protection.
- [x] Tested automatic irrigation startup.
- [x] Tested maximum pump runtime protection.
- [x] Tested pump cooldown.
- [ ] Independently verified early irrigation stop when soil moisture reaches 80% in AUTO mode.


## Phase 12 – Frontend Integration & End-to-End Verification

**Status: COMPLETED**

### 1. Objectives

Integrate the Incident Management API with the React Dashboard and verify the complete communication flow between the Frontend, Backend, PostgreSQL database, Rule Engine, and Python Sensor Simulator.

### 2. Implementation

Updated the following frontend files:

- `src/services/api.js`
- `src/App.jsx`

Implemented the following features:

- Integrated the `getIncidents()` API function into the Frontend.
- Retrieved incident records from the Backend.
- Displayed incident information on the Dashboard, including priority, status, zone, timestamp, and description.
- Supported filtering incidents by the selected greenhouse zone.
- Automatically refreshed incident data every 5 seconds.
- Connected the incident interface with the existing Backend API.

### 3. End-to-End Verification

**High-temperature scenario:**

- Executed the `high-temperature` Simulator scenario.
- Successfully processed telemetry for all three greenhouse zones.
- Created a CRITICAL incident in Zone 01.
- Automatically activated the cooling fan and opened the shade system.
- Verified that the pump activation request in Zone 02 was skipped because the 15-minute cooldown period was still active.
- Verified the incident record in PostgreSQL and its display on the Frontend.

**Normal scenario:**

- Restored the Simulator to normal environmental conditions.
- Automatically turned off the cooling fan.
- Automatically closed the shade system.
- Updated the related incident from `OPEN` to `RESOLVED`.
- Confirmed that the Frontend displayed the updated incident status.

### 4. Validation

- Verified Frontend–Backend communication.
- Verified incident retrieval from PostgreSQL through the API.
- Verified automatic incident creation and resolution.
- Verified automatic actuator control under abnormal environmental conditions.
- Verified that the Frontend correctly displayed incident information and status updates.
- Confirmed that no errors occurred during the tested end-to-end scenarios.

### 5. Status

- [x] Integrated Incident API into the Frontend.
- [x] Implemented incident display on the Dashboard.
- [x] Implemented zone-based incident filtering.
- [x] Implemented automatic incident data refresh.
- [x] Tested high-temperature automation.
- [x] Tested automatic recovery under normal conditions.
- [x] Verified incident creation and resolution through the complete system.
- [x] Completed Git commit and push.


## Phase 13 – Final System Audit & Demo Preparation

**Status: IN PROGRESS**

### 1. Objectives

Perform a final technical audit of the Smart Strawberry Greenhouse system, verify the quality and stability of the source code, execute automated tests, and prepare the project for demonstration.

### 2. Frontend Code Quality & Build Verification

Reviewed and cleaned up the Frontend source code.

The following issues were fixed:

- Removed unused variables and imports.
- Fixed unused function parameters.
- Improved React state and effect handling.
- Replaced unnecessary state variables with references where appropriate.
- Stabilized effect dependencies.
- Improved timeout and cleanup handling in React effects.

**Validation:**

- `npm run lint`: PASSED – 0 errors and 0 warnings across 28 files.
- `npm run build`: PASSED.
- Vite production build completed successfully.
- Generated production assets successfully.

### 3. Backend Automated Testing

Reviewed and executed the Backend automated test suite using Node.js built-in `node:test`.

Fixed the water tank protection test to verify that pump activation is rejected when the water tank level is below 15%.

The test verifies:

- HTTP 400 response.
- Error code `ERR_WATER_TANK_DEPLETED`.
- Restoration of the original water tank state after the test.

**Validation:**

- Backend automated tests: 17/17 PASSED.
- No failing tests.

### 4. Python Simulator Automated Testing

Converted the existing Simulator test scripts into automated tests using `pytest`.

Updated the following files:

- `greenhouse-backend/simulator/test_config.py`
- `greenhouse-backend/simulator/test_simulator.py`

Implemented tests for:

- Environment file availability.
- Database configuration validation.
- Simulation interval validation.
- Telemetry generation for all three greenhouse zones.
- Required sensor metrics.
- Sensor value boundaries.
- High-temperature scenario.
- High-humidity scenario.
- Low-humidity scenario.
- Low-soil-moisture scenario.
- Low-water-tank scenario.
- Soil-moisture recovery scenario.
- Invalid scenario handling.
- Resetting sensor states under normal conditions.

**Validation:**

- Python Simulator automated tests: 14/14 PASSED.
- Test execution time: 0.11 seconds.

### 5. Overall Validation Results

| Component | Validation | Result |
|---|---|---|
| Frontend | `npm run lint` | PASSED – 0 warnings, 0 errors |
| Frontend | `npm run build` | PASSED |
| Backend | `npm test` | PASSED – 17/17 tests |
| Python Simulator | `python -m pytest .\simulator -v` | PASSED – 14/14 tests |
| End-to-End System | Frontend–Backend integration | PASSED |
| Automation | Environmental scenarios | PASSED |

### 6. Remaining Tasks

- [x] Complete Frontend code quality checks.
- [x] Verify Frontend production build.
- [x] Complete Backend automated tests.
- [x] Convert Simulator scripts into automated tests.
- [x] Complete Python Simulator automated tests.
- [ ] Review and update the project README.
- [ ] Review database migrations and project setup instructions.
- [ ] Complete the final system audit.
- [ ] Prepare the final demonstration workflow.
- [ ] Commit and push the completed Phase 13 changes.

### 7. Conclusion

Phase 13 has successfully completed the major code quality checks and automated testing for the Frontend, Backend, and Python Simulator.

All current automated tests have passed:

- Frontend lint: 0 errors and 0 warnings.
- Backend: 17/17 tests passed.
- Python Simulator: 14/14 tests passed.

The project is currently undergoing its final documentation review and demonstration preparation before the final milestone is completed.

**Current Status: IN PROGRESS – Core validation completed; documentation review and final demo preparation remain.**

### Pending
- Add telemetry history and alerts.
- Improve Dashboard and charts.
- Perform end-to-end testing.

## Git Milestones

- Initial repository: existing Git history.
- API standardization and actuator error handling: commit completed only after user confirmation.
- Backend refactoring: pending validation and commit.
