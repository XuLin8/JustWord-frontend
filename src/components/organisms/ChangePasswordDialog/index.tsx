// src/components/organisms/ChangePasswordDialog/index.tsx
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, LockKeyhole } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUIStore } from '@/store/uiStore'
import { authApi } from '@/api/endpoints/auth.api'

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const showToast = useUIStore((s) => s.showToast)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 关闭时重置表单
  useEffect(() => {
    if (!open) {
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('account.formIncomplete'))
      return
    }
    if (newPassword.length < 6) {
      setError(t('account.newPasswordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('account.confirmMismatch'))
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword(oldPassword, newPassword)
      showToast(t('account.changeSuccess'), 'success')
      onClose()
    } catch (err: any) {
      setError(err?.message || t('account.changeFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole size={18} />
            {t('account.changePassword')}
          </DialogTitle>
          <DialogDescription>{t('account.changePasswordDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t('account.oldPassword')}</label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t('account.newPassword')}</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('account.newPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t('account.confirmPassword')}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('account.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t('account.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}