// src/components/Auth/Register.tsx
import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface RegisterProps {
  onClose: () => void
  onSwitchToLogin: () => void
}

export default function Register({ onClose, onSwitchToLogin }: RegisterProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位')
      return
    }

    setIsLoading(true)
    const success = await register(email, username, password)
    setIsLoading(false)

    if (success) {
      setSuccess('注册成功！请登录')
      setTimeout(() => {
        onSwitchToLogin()
      }, 1500)
    } else {
      setError('注册失败，请检查邮箱或用户名是否已被使用')
    }
  }

  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <button className="auth-close" onClick={onClose}>✕</button>
        <h2>注册 JustWord</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            id="register-email"        // ✅ 添加 id
            name="email"               // ✅ 添加 name
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            id="register-username"      // ✅ 添加 id
            name="username"            // ✅ 添加 name
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            id="register-password"     // ✅ 添加 id
            name="password"            // ✅ 添加 name
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            id="register-confirm-password"  // ✅ 添加 id
            name="confirmPassword"           // ✅ 添加 name
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="auth-switch">
          已有账号？{' '}
          <button className="auth-link" onClick={onSwitchToLogin}>
            去登录
          </button>
        </p>
      </div>
    </div>
  )
}