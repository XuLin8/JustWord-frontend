import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',  // 监听所有网络接口
    port: 5173,       // 端口
    strictPort: false, // 如果端口被占用，自动尝试下一个
    proxy: {
      // 代理 API 请求到后端（避免跨域）
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
