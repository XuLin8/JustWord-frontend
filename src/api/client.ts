// src/api/client.ts
import { BASE_URL } from '../config'  // 从 config 导入，不是 config/api
import i18n from '@/i18n'

// ============ 错误类型 ============
export class ApiError extends Error {
  code: number
  detail?: string

  constructor(code: number, message: string, detail?: string) {
    super(message)
    this.code = code
    this.detail = detail
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = i18n.t('api.networkError')) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthError extends Error {
  constructor(message: string = i18n.t('api.authExpired')) {
    super(message)
    this.name = 'AuthError'
  }
}

// ============ 错误码映射 ============
export function getErrorMessage(status: number): string {
  const key = `api.status.${status}`
  if (i18n.exists(key)) {
    return i18n.t(key)
  }
  return i18n.t('api.requestFailedWithStatus', { status })
}

// ============ 请求配置 ============
export interface RequestConfig extends RequestInit {
  requiresAuth?: boolean
  timeout?: number
}

// ============ 响应类型 ============
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: number
    message: string
    detail?: string
  }
}

// ============ 核心请求函数 ============
export async function request<T>(
  url: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    requiresAuth = true,
    timeout = 30000,
    headers = {},
    ...restConfig
  } = config

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`  // ✅ 用 BASE_URL

  // 安全构建请求头
  const requestHeaders: Record<string, string> = {}

  // 1. 处理各种 headers 类型，统一转为 Record<string, string>
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        requestHeaders[key] = value
      })
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        requestHeaders[key] = value
      })
    } else if (typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          requestHeaders[key] = String(value)
        }
      })
    }
  }

  // 2. 默认 Content-Type（用户没指定才设置）
  if (!requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  // 3. 需要认证时注入 Token
  if (requiresAuth) {
    const token = localStorage.getItem('justword_token')
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    } else {
      throw new AuthError(i18n.t('api.notLoggedIn'))
    }
  }

  // 超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(fullUrl, {
      ...restConfig,
      headers: requestHeaders,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // 解析响应
    let data: any
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // 处理 HTTP 错误
    if (!response.ok) {
      // 后端统一错误格式
      if (data?.error) {
        throw new ApiError(
          data.error.code || response.status,
          data.error.message || getErrorMessage(response.status),
          data.error.detail
        )
      }

      // 401 特殊处理
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        throw new AuthError()
      }

      throw new ApiError(
        response.status,
        getErrorMessage(response.status)
      )
    }

    return data as T
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof ApiError || error instanceof AuthError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new NetworkError(i18n.t('api.timeout'))
    }

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new NetworkError()
    }

    throw new NetworkError(error instanceof Error ? error.message : i18n.t('api.networkAbnormal'))
  }
}

// ============ 快捷方法 ============
export const http = {
  get: <T>(url: string, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'GET' }),

  post: <T>(url: string, body?: any, config?: RequestConfig) =>
    request<T>(url, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: any, config?: RequestConfig) =>
    request<T>(url, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(url: string, body?: any, config?: RequestConfig) =>
    request<T>(url, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'DELETE' }),
}

// ============ 监听 401 事件 ============
export function setupAuthListener() {
  const handleUnauthorized = () => {
    localStorage.removeItem('justword_token')
    localStorage.removeItem('justword_user')
  }

  window.addEventListener('auth:unauthorized', handleUnauthorized)
  return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
}
