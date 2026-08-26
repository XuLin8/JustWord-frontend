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
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface RefreshResponse {
  access_token: string
  refresh_token: string
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

  // 刷新令牌（用 refresh_token 换新 access_token，返回轮换后的新 refresh_token）
  refreshToken: (refreshToken: string) =>
    http.post<RefreshResponse>(API_PATH.auth.refresh, { refresh_token: refreshToken }, { requiresAuth: false }),

  // 获取当前用户信息
  getMe: () =>
    http.get<UserResponse>(API_PATH.auth.me),

  // 修改密码：校验原密码并更新为新密码
  changePassword: (oldPassword: string, newPassword: string) =>
    http.put<{ message: string }>(API_PATH.auth.password, { old_password: oldPassword, new_password: newPassword }),

  // 登出：通知后端撤销 refresh token，并清除本地登录态
  logout: (refreshToken?: string | null) => {
    if (refreshToken) {
      http.post(API_PATH.auth.logout, { refresh_token: refreshToken }, { requiresAuth: false }).catch(() => undefined)
    }
    localStorage.removeItem('justword_token')
    localStorage.removeItem('justword_user')
    localStorage.removeItem('justword_refresh_token')
  },
}