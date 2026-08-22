// src/api/endpoints/auth.api.ts
import { http } from '../client'
import { API_PATH } from '../paths'

// ============ 类型定义 ============
export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface UserResponse {
  id: string
  email: string
  username: string
  created_at: string
}

// ============ API 方法 ============
export const authApi = {
  // 注册
  register: (data: RegisterRequest) =>
    http.post<UserResponse>(API_PATH.auth.register, data, { requiresAuth: false }),

  // 登录
  login: (data: LoginRequest) =>
    http.post<LoginResponse>(API_PATH.auth.login, data, { requiresAuth: false }),

  // 获取当前用户信息
  getMe: () =>
    http.get<UserResponse>(API_PATH.auth.me),

  // 登出（客户端处理）
  logout: () => {
    localStorage.removeItem('justword_token')
    localStorage.removeItem('justword_user')
  },
}