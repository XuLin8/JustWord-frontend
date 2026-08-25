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
    refresh: '/api/auth/refresh',
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
    sessions: '/api/learning/sessions',
    statsDaily: '/api/learning/stats/daily',
    statsSnapshots: '/api/learning/stats/snapshots',
  },
  progress: '/api/progress',
  achievements: '/api/achievements',
  wordbooks: {
    root: '/api/wordbooks',
    detail: (id: number) => `/api/wordbooks/${id}`,
    word: (bookId: number, wordId: string) => `/api/wordbooks/${bookId}/words/${wordId}`,
  },
  textbooks: {
    // 后端「内置词库」走 /api/library（真实四级词库已由 load_cet4.py 载入）
    root: '/api/library/',
    detail: (id: number) => `/api/library/${id}`,
    words: (id: number) => `/api/library/${id}`,
    enroll: (id: number) => `/api/library/${id}/import`,
    enrolled: '/api/library/enrolled',
    unsubscribe: (id: number) => `/api/library/${id}/subscribe`,
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
    due: '/api/learning/reviews/due',
    summary: '/api/learning/reviews/summary',
    submit: '/api/learning/reviews',
  },
  analysis: {
    forgetting: '/api/analysis/forgetting',
    mastery: '/api/analysis/mastery',
    efficiency: '/api/analysis/efficiency',
  },
  ai: {
    judge: '/api/ai/judge',
  },
  preferences: {
    root: '/api/preferences',
  },
  health: '/api/health',
} as const