# 🍓 Smart Strawberry Greenhouse - IoT Dashboard

Hệ thống Dashboard giám sát và tự động hóa nhà kính trồng dâu tây thông minh tích hợp IoT. Dự án được phát triển nhằm phục vụ cho học phần **Kỹ thuật phần mềm (Software Engineering)**, cung cấp giao diện trực quan để theo dõi thông số môi trường, điều khiển thiết bị chấp hành và quản lý cơ chế an toàn (Failsafe) theo thời gian thực.

---

## 🚀 Các Tính năng Chính

* **📊 Giám sát Telemetry Real-time:** Theo dõi các thông số môi trường quan trọng theo thời gian thực (Nhiệt độ không khí, Độ ẩm đất/không khí, độ dẫn điện EC, và độ pH dung dịch dinh dưỡng).
* **🗺️ Sơ đồ Phân vùng (Zones Topology):** Quản lý độc lập các khu vực trồng dâu công nghệ cao khác nhau (Ví dụ: Khu 1 - Dâu Hana Nhật Bản, Khu 2 - Tochiotome, Khu 3 - Shizuka Premium).
* **⚡ Bảng điều khiển Actuators (Manual Override):** Cho phép người vận hành bật/tắt thủ công các thiết bị chấp hành (Bơm tưới nhỏ giọt, quạt thông gió, lưới che nắng, van châm phân) kèm theo chế độ chuyển đổi linh hoạt.
* **🛡️ Cơ chế Failsafe & Quản lý Mã lỗi:** Tích hợp bảo vệ phần cứng thông minh (Ví dụ: Tự động khóa rơ-le bơm khi mực nước bồn chứa dưới 15% với mã lỗi `ERR_WATER_TANK_DEPLETED`).
* **🚨 Nhật ký Sự cố (Incident Logs):** Lưu trữ lịch sử cảnh báo nhiệt độ, sự cố cảm biến và trạng thái xử lý lỗi của hệ thống.

---

## 🧰 Công nghệ Sử dụng

* **Frontend Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS (v4)](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Ngôn ngữ:** JavaScript (JSX)

---

## ⚙️ Hướng dẫn Cài đặt & Chạy Dự án

Để chạy ứng dụng ở môi trường cục bộ (Local), hãy đảm bảo máy tính của bạn đã cài đặt [Node.js (v18 trở lên)](https://nodejs.org/).

1. **Clone repository về máy:**
   ```bash
   git clone [https://github.com/Akuta2k6/smart-greenhouse-dashboard.git](https://github.com/Akuta2k6/smart-greenhouse-dashboard.git)
## Di chuyển vào thư mục dự án:

## Bash
cd smart-greenhouse-dashboard/greenhouse-app
Cài đặt các gói thư viện phụ thuộc:

## Bash
npm install
Khởi động máy chủ phát triển (Dev Server):

## Bash
npm run dev
Mở trình duyệt và truy cập đường dẫn hiển thị trên terminal (thường là http://localhost:5173).

## 📂 Cấu trúc Thư mục Dự án
Plaintext
greenhouse-app/
├── public/             # Tài nguyên tĩnh (Favicon, icons)
├── src/
│   ├── assets/         # Hình ảnh và media
│   ├── App.jsx         # Component điều hướng và giao diện chính của Dashboard
│   ├── App.css         # Custom style phụ trợ
│   ├── index.css       # Cấu hình Tailwind CSS (@import "tailwindcss";)
│   └── main.jsx        # Điểm vào ứng dụng React (Entry point)
├── tailwind.config.js  # Cấu hình Tailwind CSS
├── postcss.config.cjs  # Cấu hình PostCSS
└── package.json        # Danh sách thư viện và dependencies
👥 Thành viên Phát triển
Nhóm thực hiện: OiOiOi3ka

Ngành: Khoa học Máy tính - Khoa Công nghệ Thông tin

Trường: Đại học Tôn Đức Thắng (TDTU)
