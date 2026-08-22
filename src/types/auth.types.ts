// src/types/auth.types.ts

// ============================================
// 认证相关类型
// ============================================

/** 登录请求数据 */
export interface LoginData {
  email: string
  password: string
}

/** 注册请求数据 */
export interface RegisterData {
  email: string
  username: string
  password: string
}

/** 认证操作结果 */
export interface AuthResult {
  success: boolean
  message?: string
}

/** 用户信息 */
export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

/** 登录响应 */
export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

/** 用户响应 */
export interface UserResponse {
  id: string
  email: string
  username: string
  created_at: string
}