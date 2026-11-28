# 🍓 Smart Strawberry Greenhouse

Hệ thống mô phỏng giám sát và tự động hóa nhà kính trồng dâu tây thông minh, được phát triển phục vụ học phần **Kỹ thuật phần mềm (Software Engineering)**.

Dự án triển khai theo mô hình phần mềm: Python Simulator tạo dữ liệu cảm biến, PostgreSQL lưu trữ telemetry và trạng thái hệ thống, Node.js/Express xử lý API và Rule Engine, React hiển thị Dashboard và sơ đồ nhà kính 2D. **Dự án hiện là mô phỏng phần mềm, không yêu cầu kết nối ESP32 hoặc cảm biến vật lý.**

## 1. Tính năng chính

- **Giám sát môi trường:** Theo dõi nhiệt độ, độ ẩm không khí, độ ẩm đất, ánh sáng, EC, pH và mực nước bồn.
- **Quản lý khu vực:** Theo dõi 3 khu vực trồng dâu tây trên Dashboard và sơ đồ nhà kính 2D.
- **Điều khiển thiết bị:** Theo dõi và điều khiển các thiết bị chấp hành như máy bơm, quạt thông gió, lưới che, thiết bị sưởi, van và các thiết bị mô phỏng khác.
- **Rule Engine:** Tự động đưa ra lệnh điều khiển dựa trên telemetry và trạng thái thiết bị.
- **Incident Management:** Ghi nhận sự cố theo mức độ HIGH/CRITICAL, hiển thị trạng thái và tự động cập nhật khi điều kiện sự cố không còn.
- **Failsafe và ưu tiên lệnh:** Bảo vệ hệ thống trong các tình huống như mực nước thấp hoặc máy bơm chạy quá thời gian cho phép.
- **Simulator:** Sinh dữ liệu cảm biến định kỳ 5 giây và hỗ trợ nhiều kịch bản môi trường để kiểm thử.

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React, Vite, Axios, Recharts, Lucide React, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Simulator | Python, psycopg, python-dotenv |
| Kiểm thử | Node.js test runner, pytest |

## 3. Kiến trúc tổng quan

```text
Python Sensor Simulator
          |
          v
      PostgreSQL
          ^
          |
Node.js / Express API
          |
          +---- Rule Engine
          |
          v
React Dashboard + 2D Greenhouse Map
```

Simulator tạo telemetry cho 3 khu vực và ghi dữ liệu vào PostgreSQL. Backend đọc dữ liệu, cung cấp API, đánh giá các quy tắc tự động và quản lý Incident. Frontend gọi API để hiển thị dữ liệu, trạng thái thiết bị và sự cố.

## 4. Cấu trúc thư mục

```text
smart-greenhouse-dashboard/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── GreenhouseMap.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── greenhouse-backend/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   │       └── 001_initial_data.sql
│   ├── simulator/
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── sensor_simulator.py
│   │   └── requirements.txt
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── rules/
│   │   └── services/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── docs/
├── package.json
├── vite.config.js
└── README.md
```

## 5. Yêu cầu môi trường

Cài đặt các phần mềm sau trước khi chạy:

- Node.js và npm.
- PostgreSQL.
- Python 3.
- Git (nếu clone repository).

Các lệnh bên dưới sử dụng **Windows PowerShell**. Nếu dùng hệ điều hành khác, điều chỉnh lệnh kích hoạt môi trường Python và đường dẫn tương ứng.

## 6. Cài đặt và cấu hình

### Bước 1: Clone repository

```powershell
git clone <REPOSITORY_URL>
cd smart-greenhouse-dashboard
```

Thay `<REPOSITORY_URL>` bằng URL repository GitHub của nhóm.

### Bước 2: Tạo database PostgreSQL

Mở PostgreSQL bằng tài khoản quản trị (ví dụ `postgres`) và tạo role, database:

```sql
CREATE ROLE greenhouse_app WITH LOGIN PASSWORD 'YOUR_DB_PASSWORD';
CREATE DATABASE smart_greenhouse_db OWNER greenhouse_app;
```

Nếu role hoặc database đã tồn tại, không tạo lại; hãy kiểm tra và sử dụng cấu hình hiện có.

### Bước 3: Chạy migration và seed dữ liệu

Mở PowerShell tại thư mục gốc dự án. Chạy lần lượt các migration theo đúng thứ tự:

```powershell
psql -U greenhouse_app -d smart_greenhouse_db -f .\greenhouse-backend\database\migrations\001_initial_schema.sql
psql -U greenhouse_app -d smart_greenhouse_db -f .\greenhouse-backend\database\migrations\002_add_fog_heater_category.sql
psql -U greenhouse_app -d smart_greenhouse_db -f .\greenhouse-backend\database\migrations\003_add_failsafe_mode.sql
psql -U greenhouse_app -d smart_greenhouse_db -f .\greenhouse-backend\database\migrations\004_add_nutrient_valve.sql
psql -U greenhouse_app -d smart_greenhouse_db -f .\greenhouse-backend\database\seeds\001_initial_data.sql
```

Nếu PowerShell không nhận diện lệnh `psql`, thêm thư mục `bin` của PostgreSQL vào PATH hoặc gọi `psql.exe` bằng đường dẫn đầy đủ.

### Bước 4: Cấu hình Backend

Tạo file `.env` từ file mẫu:

```powershell
Copy-Item .\greenhouse-backend\.env.example .\greenhouse-backend\.env
```

Mở `greenhouse-backend/.env` và cập nhật mật khẩu PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_greenhouse_db
DB_USER=greenhouse_app
DB_PASSWORD=YOUR_DB_PASSWORD
DB_SSL=false
```

Không commit file `.env` hoặc chia sẻ mật khẩu database lên GitHub.

### Bước 5: Cài đặt dependencies

Cài dependencies Backend:

```powershell
cd .\greenhouse-backend
npm install
```

Mở terminal khác tại thư mục gốc dự án và cài dependencies Frontend:

```powershell
npm install
```

Cài dependencies Python Simulator trong terminal đang ở `greenhouse-backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\simulator\requirements.txt
```

Nếu PowerShell chặn kích hoạt môi trường ảo, có thể cho phép trong phiên terminal hiện tại:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Sau đó chạy lại lệnh Activate.

## 7. Khởi động hệ thống

Cần chạy PostgreSQL trước. Sau đó mở các terminal riêng để chạy Backend, Frontend và Simulator.

### Terminal 1 — Backend API

Tại thư mục `greenhouse-backend`:

```powershell
npm start
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

### Terminal 2 — Frontend Dashboard

Tại thư mục gốc dự án:

```powershell
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, mặc định:

```text
http://localhost:5173
```

Vite được cấu hình proxy các request `/api` đến Backend tại `http://localhost:5000`.

### Terminal 3 — Python Sensor Simulator

Tại thư mục `greenhouse-backend` và đã kích hoạt môi trường Python:

```powershell
python .\simulator\main.py --scenario normal
```

Simulator kết nối PostgreSQL, đọc 3 sensor node đã seed và ghi telemetry mỗi 5 giây. Dừng Simulator bằng `Ctrl + C`.

## 8. Các kịch bản mô phỏng

Tham số `--scenario` hỗ trợ các giá trị được khai báo trong `SCENARIOS` của `greenhouse-backend/simulator/sensor_simulator.py`.

| Kịch bản | Mục đích |
|---|---|
| `normal` | Điều kiện môi trường bình thường |
| `high-temperature` | Kiểm tra tình huống nhiệt độ cao |
| `high-humidity` | Kiểm tra độ ẩm không khí cao |
| `low-humidity` | Kiểm tra độ ẩm không khí thấp |
| `low-water-tank` | Kiểm tra mực nước bồn thấp |
| `low-soil-moisture` | Kiểm tra độ ẩm đất thấp và tưới |
| `soil-moisture-recovered` | Kiểm tra tình huống độ ẩm đất phục hồi |

Ví dụ chạy kịch bản nhiệt độ cao:

```powershell
python .\simulator\main.py --scenario high-temperature
```

Muốn đổi kịch bản, dừng tiến trình Simulator hiện tại bằng `Ctrl + C`, sau đó chạy lại với scenario mới.

## 9. Quy tắc điều khiển và Incident

### 9.1. Rule Engine — điều khiển thiết bị

Các ngưỡng được xác minh trong `greenhouse-backend/src/rules/greenhouseRuleEngine.js`:

| Điều kiện telemetry | Hành động tự động |
|---|---|
| Độ ẩm đất <60% và mực nước >15% | Bật máy bơm nếu máy bơm chưa ON |
| Độ ẩm đất ≥80% và máy bơm đang ON | Tắt máy bơm |
| Mực nước ≤15% và máy bơm đang ON | Tắt máy bơm bằng chế độ FAILSAFE |
| Nhiệt độ >30°C hoặc độ ẩm không khí >80% | Bật quạt thông gió |
| Nhiệt độ ≤25°C và độ ẩm không khí ≤75% | Tắt quạt nếu đang ON |
| Nhiệt độ >30°C | Mở lưới che |
| Nhiệt độ ≤25°C | Đóng lưới che |
| Nhiệt độ <18°C | Bật thiết bị sưởi |
| Nhiệt độ ≥20°C | Tắt thiết bị sưởi nếu đang ON |

### 9.2. Incident Management — phát hiện sự cố

Các điều kiện tạo Incident được xác minh trong `greenhouse-backend/src/services/incidentService.js`:

| Điều kiện | Priority |
|---|---|
| Nhiệt độ >25°C và ≤30°C | HIGH |
| Nhiệt độ >30°C | CRITICAL |
| Độ ẩm không khí >80% | HIGH |
| Độ ẩm không khí <50% | HIGH |
| Mực nước bồn ≤15% | CRITICAL |

Incident mới được tạo với trạng thái `OPEN`. Khi điều kiện tương ứng không còn đúng, Incident đang `OPEN` hoặc `IN_PROGRESS` được chuyển sang `RESOLVED`. Nếu giá trị metric bị thiếu hoặc không hợp lệ, hệ thống không xem đó là điều kiện đã phục hồi.

**Lưu ý:** Ngưỡng Incident và ngưỡng điều khiển thiết bị là hai nhóm quy tắc khác nhau. Ví dụ, nhiệt độ trên 25°C đã tạo Incident HIGH, nhưng quạt chỉ được bật khi nhiệt độ trên 30°C (hoặc độ ẩm không khí trên 80%).

## 10. API hiện có

Các route được mount dưới tiền tố `/api/v1`:

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/v1/greenhouse/zones/:zoneId/telemetry/latest` | Lấy telemetry mới nhất của khu vực |
| GET | `/api/v1/greenhouse/zones/:zoneId/actuators` | Lấy trạng thái thiết bị của khu vực |
| POST | `/api/v1/greenhouse/actuators/control` | Gửi lệnh điều khiển thiết bị |
| GET | `/api/v1/greenhouse/incidents` | Lấy danh sách Incident |

Endpoint Incident hỗ trợ lọc theo khu vực bằng query parameter `zoneId` và trả về tối đa 100 Incident mới nhất.

Ví dụ:

```text
GET http://localhost:5000/api/v1/greenhouse/incidents
GET http://localhost:5000/api/v1/greenhouse/incidents?zoneId=ZONE-STRAWBERRY-01
```

## 11. Kiểm thử

### Backend

Tại thư mục `greenhouse-backend`:

```powershell
npm test
```

### Frontend

Tại thư mục gốc dự án:

```powershell
npm run lint
npm run build
```

### Python Simulator

Tại thư mục `greenhouse-backend`, kích hoạt môi trường Python và cài pytest nếu môi trường chưa có:

```powershell
python -m pip install pytest
python -m pytest .\simulator -v
```

## 12. Quy trình demo đề xuất

1. Khởi động PostgreSQL.
2. Khởi động Backend và chờ thông báo server sẵn sàng.
3. Khởi động Frontend, mở Dashboard trên trình duyệt.
4. Khởi động Simulator với `normal`, kiểm tra telemetry của 3 khu vực.
5. Dừng Simulator và chạy `high-temperature`; quan sát Incident nhiệt độ và trạng thái quạt/lưới che.
6. Chạy `low-water-tank`; quan sát Incident CRITICAL và cơ chế bảo vệ máy bơm khi điều kiện áp dụng.
7. Chạy `low-soil-moisture`; quan sát quy tắc tưới khi mực nước đáp ứng điều kiện.
8. Chạy `normal` hoặc `soil-moisture-recovered` để quan sát dữ liệu phục hồi và Incident được resolve khi điều kiện tương ứng không còn.

Mỗi lần chỉ chạy một tiến trình Simulator để tránh nhiều nguồn cùng ghi telemetry ngoài ý muốn. Kết quả demo phụ thuộc trạng thái thiết bị, cooldown, thời gian chạy và dữ liệu đang có trong database.

## 13. Giới hạn và phạm vi hiện tại

- Đây là hệ thống mô phỏng phần mềm; dữ liệu cảm biến được sinh bởi Python Simulator.
- Các API được liệt kê ở trên là những route đã xác minh trong router hiện tại.
- README không mô tả chức năng đăng nhập/JWT là tính năng đã hoàn thành vì chưa xác minh được endpoint xác thực ở Backend.
- Các ngưỡng trong tài liệu phản ánh logic đang có trong Rule Engine và Incident Service; nếu mã nguồn thay đổi, cần cập nhật lại tài liệu tương ứng.

## 14. Nhóm thực hiện

- **Nhóm:** OiOiOi3ka
- **Ngành:** Khoa học Máy tính — Khoa Công nghệ Thông tin
- **Trường:** Đại học Tôn Đức Thắng (TDTU)
- **Học phần:** Kỹ thuật phần mềm (Software Engineering)
