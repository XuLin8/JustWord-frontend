// src/config/index.ts
// ============================================
// 环境配置（只负责 BASE_URL）
// ============================================

export const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'//'http://192.168.31.221:3000'  // 开发环境：直接访问树莓派后端
  : ''  // 生产：同源部署，接口路径前缀 /api 已由 src/api/paths.ts 提供（避免 / + /api 拼成 // 协议相对 URL）

export const IS_DEV = import.meta.env.DEV
export const IS_PROD = import.meta.env.PROD