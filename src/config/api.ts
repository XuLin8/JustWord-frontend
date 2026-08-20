// src/config/api.ts

// 根据环境自动切换
export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'//'http://192.168.31.221:3000'  // 开发环境：直接访问树莓派后端
  : '/api'  // 生产环境：通过 Nginx 代理

// API 端点
export const API = {
  health: `${API_BASE_URL}/health`,
  words: `${API_BASE_URL}/api/words`,
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
    logout: `${API_BASE_URL}/api/auth/logout`,
  },
  ai: {
    judge: `${API_BASE_URL}/api/ai/judge`,
  },
  learning: {
    records: `${API_BASE_URL}/api/learning/records`,
  },
}