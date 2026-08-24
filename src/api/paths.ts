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
    dashboard: '/api/learning/dashboard',
    checkinStatus: '/api/learning/checkin/status',
    checkinHistory: '/api/learning/checkin/history',
    checkin: '/api/learning/checkin',
  },
  achievements: '/api/achievements',
  wordbooks: {
    root: '/api/wordbooks',
    detail: (id: number) => `/api/wordbooks/${id}`,
    word: (bookId: number, wordId: string) => `/api/wordbooks/${bookId}/words/${wordId}`,
  },
  textbooks: {
    root: '/api/textbooks',
    detail: (id: number) => `/api/textbooks/${id}`,
    words: (id: number) => `/api/textbooks/${id}/words`,
    enroll: (id: number) => `/api/textbooks/${id}/enroll`,
  },
  sync: {
    words: '/api/sync/words',
    records: '/api/sync/records',
  },
  library: {
    root: '/api/library',
    detail: (id: number) => `/api/library/${id}`,
    import: (id: number) => `/api/library/${id}/import`,
  },
  export: {
    backup: '/api/export/backup',
    restore: '/api/export/restore',
  },
  wrongWords: {
    root: '/api/learning/wrong-words',
    summary: '/api/learning/wrong-words/summary',
    restore: (wordId: string) => `/api/learning/wrong-words/${wordId}/restore`,
  },
  review: {
    summary: '/api/learning/reviews/summary',
    next: '/api/learning/reviews/next',
    submit: '/api/learning/reviews/submit',
  },
  analysis: {
    forgetting: '/api/analysis/forgetting',
    mastery: '/api/analysis/mastery',
    efficiency: '/api/analysis/efficiency',
  },
  ai: {
    judge: '/api/ai/judge',
  },
  health: '/api/health',
} as const