import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5137', // Thay đổi đường dẫn này thành URL Backend của nhóm bạn (hoặc giữ nguyên nếu chạy server local ở cổng 5137)
        changeOrigin: true,
        secure: false,
      }
    }
  }
})