// src/components/molecules/AuthForm/index.tsx
import React, { useState } from 'react'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import type { LoginData, RegisterData } from '../../../types'
import './AuthForm.css'

type AuthFormProps =
  | {
      mode: 'login'
      onSubmit: (data: LoginData) => Promise<{ success: boolean; message?: string }>
      onSwitch: () => void
      loading?: boolean
    }
  | {
      mode: 'register'
      onSubmit: (data: RegisterData) => Promise<{ success: boolean; message?: string }>
      onSwitch: () => void
      loading?: boolean
    }

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onSwitch,
  loading = false,
}) => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLogin = mode === 'login'
  const title = isLogin ? '登录' : '注册'
  const switchText = isLogin ? '还没有账号？立即注册' : '已有账号？去登录'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('两次密码输入不一致')
        setIsSubmitting(false)
        return
      }
      if (password.length < 6) {
        setError('密码长度至少为 6 位')
        setIsSubmitting(false)
        return
      }
    }

    let result: { success: boolean; message?: string }

    // ✅ 用 if 分支区分，TypeScript 自动收窄类型
    if (mode === 'login') {
      result = await onSubmit({ email, password })
    } else {
      result = await onSubmit({ email, username, password })
    }

    setIsSubmitting(false)

    if (result.success) {
      if (isLogin) {
        // 登录成功，由父组件处理
      } else {
        setSuccess('注册成功！请登录')
      }
    } else {
      setError(result.message || (isLogin ? '登录失败' : '注册失败'))
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>

      <Input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
      />

      {!isLogin && (
        <Input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          fullWidth
        />
      )}

      <Input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
      />

      {!isLogin && (
        <Input
          type="password"
          placeholder="确认密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
        />
      )}

      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      <Button type="submit" loading={isSubmitting || loading} fullWidth>
        {isLogin ? '登录' : '注册'}
      </Button>

      <button type="button" className="auth-switch" onClick={onSwitch}>
        {switchText}
      </button>
    </form>
  )
}