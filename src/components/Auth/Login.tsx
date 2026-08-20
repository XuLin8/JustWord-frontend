// src/components/Auth/Login.tsx
import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface LoginProps {
  onClose: () => void
  onSwitchToRegister: () => void
}

export default function Login({ onClose, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const success = await login(email, password)
    setIsLoading(false)

    if (success) {
      onClose()
    } else {
      setError('邮箱或密码错误，请重试')
    }
  }

  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <button className="auth-close" onClick={onClose}>✕</button>
        <h2>登录 JustWord</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            id="login-email"           // ✅ 添加 id
            name="email"               // ✅ 添加 name      
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"       // ✅ 建议保留，优化自动填充
          />
          <input
            type="password"
            id="login-password"        // ✅ 添加 id
            name="password"            // ✅ 添加 name
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="auth-switch">
          还没有账号？{' '}
          <button className="auth-link" onClick={onSwitchToRegister}>
            立即注册
          </button>
        </p>
      </div>
    </div>
  )
}