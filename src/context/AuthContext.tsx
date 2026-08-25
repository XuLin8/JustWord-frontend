// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import i18n from '../i18n'
import { authApi } from '../api'
import { useWordStore } from '../store/wordStore'

// ============ 类型定义 ============
interface User {
  id: string
  email: string
  username: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  refreshUser: () => Promise<void>
}

// ============ Context ============
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { clearWords } = useWordStore()
  
  // 防止 token 变化时重复加载
  const isInitialized = useRef(false)

  // ============ 初始化：从 localStorage 恢复登录状态 ============
  useEffect(() => {
    const storedToken = localStorage.getItem('justword_token')
    const storedUser = localStorage.getItem('justword_user')
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        // 用户数据损坏，清除
        localStorage.removeItem('justword_token')
        localStorage.removeItem('justword_user')
      }
    }
    setIsLoading(false)
    isInitialized.current = true
  }, [])

  // ============ token/user 变化：登出时清空本地单词（加载与同步由 App 层统一编排） ============
  useEffect(() => {
    // 跳过初始化前的执行
    if (!isInitialized.current) return

    // 无 token → 清空单词
    if (!token || !user) {
      clearWords()
    }
  }, [token, user, clearWords])

  // ============ 监听全局 401 事件 ============
  useEffect(() => {
    const handleUnauthorized = () => {
      // 清除本地状态
      setToken(null)
      setUser(null)
      localStorage.removeItem('justword_token')
      localStorage.removeItem('justword_user')
      localStorage.removeItem('justword_refresh_token')
      clearWords()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [clearWords])

  // ============ 刷新用户信息 ============
  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe()
      const userData: User = {
        id: data.id,
        email: data.email,
        username: data.username,
        created_at: data.created_at,
      }
      setUser(userData)
      localStorage.setItem('justword_user', JSON.stringify(userData))
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      // 如果获取用户信息失败，可能是 token 无效
      setToken(null)
      setUser(null)
      localStorage.removeItem('justword_token')
      localStorage.removeItem('justword_user')
    }
  }, [])

  // ============ 登录 ============
  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email, password })

      // 保存 token（access + refresh，供 401 自动续期）
      setToken(data.access_token)
      localStorage.setItem('justword_token', data.access_token)
      localStorage.setItem('justword_refresh_token', data.refresh_token)
      
      // 获取用户信息
      try {
        const userData = await authApi.getMe()
        const userInfo: User = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          created_at: userData.created_at,
        }
        setUser(userInfo)
        localStorage.setItem('justword_user', JSON.stringify(userInfo))
      } catch {
        // 如果获取用户信息失败，可能是 token 无效
        setToken(null)
        localStorage.removeItem('justword_token')
        localStorage.removeItem('justword_refresh_token')
        return { success: false, message: i18n.t('auth.fetchUserFailed') }
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { 
        success: false, 
        message: error.message || i18n.t('auth.loginErrorHint') 
      }
    }
  }, [])

  // ============ 注册 ============
  const register = useCallback(async (email: string, username: string, password: string) => {
    try {
      await authApi.register({ email, username, password })
      return { success: true }
    } catch (error: any) {
      console.error('注册失败:', error)
      return { 
        success: false, 
        message: error.message || i18n.t('auth.registerErrorHint') 
      }
    }
  }, [])

  // ============ 登出 ============
  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    // 通知后端撤销 refresh token 并清除本地登录态
    authApi.logout(localStorage.getItem('justword_refresh_token'))
    clearWords()
  }, [clearWords])

  // ============ Provider ============
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============ Hook ============
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}