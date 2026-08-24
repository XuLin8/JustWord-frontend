// src/components/molecules/AuthForm/index.tsx
import React, { useState } from 'react'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { LoginData, RegisterData } from '../../../types'

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
      if (!isLogin) setSuccess('注册成功！请登录')
    } else {
      setError(result.message || (isLogin ? '登录失败' : '注册失败'))
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <h2 className="text-center text-xl font-semibold">{title}</h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="auth-email">邮箱</Label>
        <Input
          id="auth-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {!isLogin && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-username">用户名</Label>
          <Input
            id="auth-username"
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="auth-password">密码</Label>
        <Input
          id="auth-password"
          type="password"
          placeholder="密码（至少 6 位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {!isLogin && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-confirm">确认密码</Label>
          <Input
            id="auth-confirm"
            type="password"
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {success && <p className="text-center text-sm text-emerald-600">{success}</p>}

      <Button type="submit" loading={isSubmitting || loading} fullWidth>
        {isLogin ? '登录' : '注册'}
      </Button>

      <button
        type="button"
        className={cn('mt-2 w-full cursor-pointer bg-transparent text-center text-sm text-primary hover:underline')}
        onClick={onSwitch}
      >
        {switchText}
      </button>
    </form>
  )
}