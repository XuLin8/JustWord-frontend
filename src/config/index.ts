// src/config/index.ts
// ============================================
// 环境配置（只负责 BASE_URL）
// ============================================

// 统一走同源请求：开发时由 Vite 代理把 /api 转发到 localhost:3000（局域网内 iPad 等设备可直接访问），生产同源部署
export const BASE_URL = ''

export const IS_DEV = import.meta.env.DEV
export const IS_PROD = import.meta.env.PROD