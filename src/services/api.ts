// src/services/api.ts
import { API } from '../config/api'

interface Word {
  id: string
  english: string
  chinese: string
  created_at: string
}

export const wordService = {
  // 获取所有单词
  async getWords(): Promise<Word[]> {
    const response = await fetch(API.words)
    if (!response.ok) throw new Error('获取单词失败')
    const data = await response.json()
    return data.words
  },

  // 添加单词
  async addWord(english: string, chinese: string): Promise<Word> {
    const response = await fetch(API.words, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ english, chinese })
    })
    if (!response.ok) throw new Error('添加失败')
    const data = await response.json()
    return data.word
  },

  // AI 判断
  async judgeTranslation(
    word: string,
    userAnswer: string,
    correctAnswer: string,
    mode: 'en2zh' | 'zh2en'
  ) {
    const response = await fetch(API.ai.judge, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        mode
      })
    })
    if (!response.ok) throw new Error('AI 判断失败')
    return response.json()
  }
}

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

// ============ 错误码映射 ============
export const ErrorMessages: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '权限不足',
  404: '请求的资源不存在',
  422: '数据验证失败',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误，请稍后重试',
  502: '服务暂时不可用',
  503: '服务维护中',
}

// ============ 统一请求函数 ============
export const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('justword_token')
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  // 解析响应
  let data: any
  try {
    data = await response.json()
  } catch {
    // 如果响应不是 JSON，抛出网络错误
    throw new ApiError(500, '服务器响应异常')
  }

  // 处理业务错误
  if (!response.ok) {
    // 后端返回统一错误格式: { success: false, error: { code, message, detail } }
    if (data?.error) {
      throw new ApiError(
        data.error.code || response.status,
        data.error.message || ErrorMessages[response.status] || '请求失败',
        data.error.detail
      )
    }
    
    // 非标准错误格式，使用状态码
    throw new ApiError(
      response.status,
      ErrorMessages[response.status] || `请求失败 (${response.status})`
    )
  }

  return data as T
}

// ============ 快捷方法 ============
export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  
  post: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  put: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  delete: <T>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
}