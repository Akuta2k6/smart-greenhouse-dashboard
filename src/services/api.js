// src/services/api.js
import axios from 'axios';

// Khởi tạo cấu hình chung dựa trên Base URL từ tài liệu API Contract
const api = axios.create({
  baseURL: 'https://api.smartstrawberry.io/api/v1', // Hoặc http://localhost:5000/api/v1 khi chạy local
  headers: {
    'Content-Type': 'application/json',
  }
});

// Tự động gắn Token xác thực vào Header của mọi request (nếu đã đăng nhập)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 1. API Lấy dữ liệu Telemetry mới nhất theo Zone (FR-2.1)[cite: 5]
export const getTelemetryLatest = async (zoneId) => {
  const response = await api.get(`/greenhouse/zones/${zoneId}/telemetry/latest`);
  return response.data;
};

// 2. API Điều khiển thiết bị thủ công / Manual Override (FR-3.4)[cite: 5]
export const controlActuator = async (payload) => {
  // payload mẫu: { zoneId, actuatorType, action, durationMinutes, reason }
  const response = await api.post('/greenhouse/actuators/control', payload);
  return response.data;
};

// 3. API Đăng nhập hệ thống (FR-1.2)[cite: 5]
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export default api;