// src/config/index.ts
// ============================================
// 环境配置（只负责 BASE_URL）
// ============================================

export const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'//'http://192.168.31.221:3000'  // 开发环境：直接访问树莓派后端
  : '/api'

export const IS_DEV = import.meta.env.DEV
export const IS_PROD = import.meta.env.PROD