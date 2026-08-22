// src/api/paths.ts
// ============================================
// API 路径常量（与 BASE_URL 拼接使用）
// ============================================

export const API_PATH = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
  },
  words: {
    root: '/api/words',
    detail: (id: string) => `/api/words/${id}`,
  },
  learning: {
    records: '/api/learning/records',
    stats: '/api/learning/stats',
  },
  ai: {
    judge: '/api/ai/judge',
  },
  health: '/api/health',
} as const