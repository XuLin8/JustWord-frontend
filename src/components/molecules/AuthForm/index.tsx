// src/components/molecules/AuthForm/index.tsx
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

  const { t } = useTranslation()
  const isLogin = mode === 'login'
  const title = isLogin ? t('auth.login') : t('auth.register')
  const switchText = isLogin ? t('auth.switchToRegister') : t('auth.switchToLogin')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'))
        setIsSubmitting(false)
        return
      }
      if (password.length < 6) {
        setError(t('auth.passwordTooShort'))
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
      if (!isLogin) setSuccess(t('auth.registerSuccess'))
    } else {
      setError(result.message || (isLogin ? t('auth.loginFailed') : t('auth.registerFailed')))
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <h2 className="text-center text-xl font-semibold">{title}</h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="auth-email">{t('auth.email')}</Label>
        <Input
          id="auth-email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {!isLogin && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-username">{t('auth.username')}</Label>
          <Input
            id="auth-username"
            type="text"
            placeholder={t('auth.usernamePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="auth-password">{t('auth.password')}</Label>
        <Input
          id="auth-password"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {!isLogin && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-confirm">{t('auth.confirmPassword')}</Label>
          <Input
            id="auth-confirm"
            type="password"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {success && <p className="text-center text-sm text-emerald-600">{success}</p>}

      <Button type="submit" loading={isSubmitting || loading} fullWidth>
        {isLogin ? t('auth.login') : t('auth.register')}
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