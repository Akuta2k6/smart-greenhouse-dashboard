# 🍓 Smart Strawberry Greenhouse - IoT Dashboard

Hệ thống Dashboard giám sát và tự động hóa nhà kính trồng dâu tây thông minh tích hợp IoT.

Dự án được phát triển nhằm phục vụ cho học phần **Kỹ thuật phần mềm (Software Engineering)**, cung cấp giao diện trực quan để theo dõi thông số môi trường, điều khiển thiết bị chấp hành và quản lý cơ chế an toàn (Failsafe) theo thời gian thực.

---

## 🚀 Các tính năng chính

- **📊 Giám sát Telemetry Real-time:** Theo dõi các thông số môi trường quan trọng theo thời gian thực (Nhiệt độ không khí, Độ ẩm đất/không khí, độ dẫn điện EC và độ pH dung dịch dinh dưỡng).

- **🗺️ Sơ đồ phân vùng (Zones Topology):** Quản lý độc lập các khu vực trồng dâu công nghệ cao khác nhau:
  - Khu 1 - Dâu Hana Nhật Bản
  - Khu 2 - Tochiotome
  - Khu 3 - Shizuka Premium

- **⚡ Bảng điều khiển Actuators (Manual Override):** Cho phép người vận hành bật/tắt thủ công các thiết bị chấp hành (Bơm tưới nhỏ giọt, quạt thông gió, lưới che nắng, van châm phân), kèm theo chế độ chuyển đổi linh hoạt.

- **🛡️ Cơ chế Failsafe & Quản lý mã lỗi:** Tích hợp bảo vệ phần cứng thông minh. Ví dụ: Tự động khóa rơ-le bơm khi mực nước bồn chứa dưới 15% với mã lỗi `ERR_WATER_TANK_DEPLETED`.

- **🚨 Nhật ký sự cố (Incident Logs):** Lưu trữ lịch sử cảnh báo nhiệt độ, sự cố cảm biến và trạng thái xử lý lỗi của hệ thống.

---

## 🧰 Công nghệ sử dụng

| Thành phần | Công nghệ | Mô tả |
|:---|:---|:---|
| **Frontend Framework** | [React](https://react.dev/) + [Vite](https://vitejs.dev/) | Giao diện quản trị SPA phản hồi thời gian thực |
| **Styling** | [Tailwind CSS (v4)](https://tailwindcss.com/) | Giao diện Dark-mode tối ưu trải nghiệm |
| **Icons** | [Lucide React](https://lucide.dev/) | Bộ icon chuyên biệt cho IoT và nông nghiệp |
| **Backend Runtime** | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) | RESTful API Server xử lý logic & Failsafe |
| **HTTP Client** | [Axios](https://axios-http.com/) | Gửi/nhận yêu cầu API giữa Frontend & Backend |

---

## ⚙️ Hướng dẫn cài đặt & chạy dự án

Để chạy ứng dụng ở môi trường cục bộ (Local), hãy đảm bảo máy tính đã cài đặt [Node.js (v18 trở lên)](https://nodejs.org/).

### 1. Clone repository về máy

```bash
git clone https://github.com/Akuta2k6/smart-greenhouse-dashboard.git
```

### 2. Khởi động Backend Server (Port 5000)

Mở một cửa sổ Terminal thứ nhất:

```bash
cd greenhouse-backend
npm install
node server.js
```

**Backend Service:** http://localhost:5000

### 3. Khởi động Frontend Client (Port 5173)

Mở một cửa sổ Terminal thứ hai tại thư mục `greenhouse-app`:

```bash
npm install
npm run dev
```

**Frontend Dashboard:** http://localhost:5173

---

## 📂 Cấu trúc thư mục dự án

```text
greenhouse-app/
├── public/                 # Tài nguyên tĩnh (Favicon, icons)
├── src/
│   ├── assets/             # Hình ảnh và media
│   ├── App.jsx             # Component giao diện chính & gọi API Axios
│   ├── App.css             # Custom style phụ trợ
│   ├── index.css           # Cấu hình Tailwind CSS
│   └── main.jsx            # Điểm vào ứng dụng React
├── greenhouse-backend/     # Thư mục mã nguồn Backend Node.js/Express
│   ├── server.js           # Express API Server & Logic kiểm tra Failsafe
│   ├── package.json        # Dependencies của Backend (express, cors)
│   └── .gitignore          # Cấu hình Git bỏ qua node_modules của Backend
├── tailwind.config.js      # Cấu hình Tailwind CSS
├── vite.config.js          # Cấu hình Vite & Proxy API Server
└── package.json            # Dependencies của Frontend
```

---

## 👥 Thành viên phát triển

- **Nhóm thực hiện:** OiOiOi3ka
- **Ngành:** Khoa học Máy tính - Khoa Công nghệ Thông tin
- **Trường:** Đại học Tôn Đức Thắng (TDTU)