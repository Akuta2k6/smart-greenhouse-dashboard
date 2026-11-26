
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


### Pending
- Online deployment.
- Add telemetry history and alerts.
- Improve Dashboard and charts.
- Build interactive 2D greenhouse model.
- Perform end-to-end testing.

## Git Milestones

- Initial repository: existing Git history.
- API standardization and actuator error handling: commit completed only after user confirmation.
- Backend refactoring: pending validation and commit.
