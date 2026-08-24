// src/components/organisms/AuthModal/index.tsx
import React, { useState } from 'react'
import { AuthForm } from '../../molecules/AuthForm'
import { useAuth } from '../../../context/AuthContext'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface AuthModalProps {
  isLoginOpen: boolean
  isRegisterOpen: boolean
  onCloseLogin: () => void
  onCloseRegister: () => void
  onSwitchToRegister: () => void
  onSwitchToLogin: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isLoginOpen,
  isRegisterOpen,
  onCloseLogin,
  onCloseRegister,
  onSwitchToRegister,
  onSwitchToLogin,
}) => {
  const { login, register } = useAuth()
  const [loading, setLoading] = useState(false)

  // ✅ 直接匹配 useAuth 的签名
  const handleLogin = async (data: { email: string; password: string }) => {
    setLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (result.success) onCloseLogin()
      return result
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data: { email: string; username: string; password: string }) => {
    setLoading(true)
    try {
      const result = await register(data.email, data.username, data.password)
      if (result.success) onSwitchToLogin()
      return result
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isLoginOpen} onOpenChange={(open) => !open && onCloseLogin()}>
        <DialogContent className="sm:max-w-sm">
          <AuthForm
            mode="login"
            onSubmit={handleLogin}
            onSwitch={onSwitchToRegister}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isRegisterOpen} onOpenChange={(open) => !open && onCloseRegister()}>
        <DialogContent className="sm:max-w-sm">
          <AuthForm
            mode="register"
            onSubmit={handleRegister}
            onSwitch={onSwitchToLogin}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}