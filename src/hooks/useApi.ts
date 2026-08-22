// src/hooks/useApi.ts
import { useState, useCallback } from 'react'
import { api, ApiError, ErrorMessages } from '../services/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    body?: any
  ): Promise<T | null> => {
    setState({ data: null, loading: true, error: null })

    try {
      let result: T
      switch (method) {
        case 'get':
          result = await api.get<T>(url)
          break
        case 'post':
          result = await api.post<T>(url, body)
          break
        case 'put':
          result = await api.put<T>(url, body)
          break
        case 'delete':
          result = await api.delete<T>(url)
          break
        default:
          throw new Error(`不支持的请求方法: ${method}`)
      }

      setState({ data: result, loading: false, error: null })
      return result
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : '未知错误'
      
      setState({ data: null, loading: false, error: message })
      
      // 处理 401 自动跳转登录
      if (error instanceof ApiError && error.code === 401) {
        localStorage.removeItem('justword_token')
        localStorage.removeItem('justword_user')
        // 可以触发全局事件通知
        window.dispatchEvent(new CustomEvent('unauthorized'))
      }
      
      return null
    }
  }, [])

  // 便捷方法
  const get = useCallback((url: string) => execute('get', url), [execute])
  const post = useCallback((url: string, body?: any) => execute('post', url, body), [execute])
  const put = useCallback((url: string, body?: any) => execute('put', url, body), [execute])
  const del = useCallback((url: string) => execute('delete', url), [execute])

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
    execute,
  }
}

// 独立错误处理 Hook
export function useApiError() {
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<number | null>(null)

  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiError) {
      setError(e.message)
      setCode(e.code)
      
      // 401 自动跳转登录
      if (e.code === 401) {
        localStorage.removeItem('justword_token')
        localStorage.removeItem('justword_user')
        window.dispatchEvent(new CustomEvent('unauthorized'))
      }
    } else if (e instanceof Error) {
      setError(e.message)
      setCode(null)
    } else {
      setError('未知错误')
      setCode(null)
    }
    
    console.error('API Error:', e)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setCode(null)
  }, [])

  return { error, code, handleError, clearError }
}