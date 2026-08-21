// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { API } from '../config/api'
import { useWordStore } from '../store/wordStore'

interface User {
  id: string
  email: string
  username: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { loadWords, clearWords } = useWordStore()
  // 加载 Token
  useEffect(() => {
    const storedToken = localStorage.getItem('justword_token')
    const storedUser = localStorage.getItem('justword_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // ✅ 核心：token 变化时自动刷新/清空单词列表
  useEffect(() => {
    if (token && user) {
        // 有 token 且有用户 → 加载单词
        loadWords()
    } else {
        // 无 token → 清空单词
        clearWords()
    }
  }, [token, user, loadWords, clearWords])  // ← 依赖 token 和 user

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API.auth.login}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '登录失败')
      }
      
      const data = await response.json()
      setToken(data.access_token)
      localStorage.setItem('justword_token', data.access_token)
      
      // 获取用户信息
      const userResponse = await fetch(`${API.auth.me}`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      })
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
        localStorage.setItem('justword_user', JSON.stringify(userData))
      }
      
      return true
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }, [])

  const register = useCallback(async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API.auth.register}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '注册失败')
      }
      
      return true
    } catch (error) {
      console.error('注册失败:', error)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('justword_token')
    localStorage.removeItem('justword_user')
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isAuthenticated: !!token && !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}