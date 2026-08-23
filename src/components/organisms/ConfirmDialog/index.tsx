import React, { useEffect, useState } from 'react'
import { useUIStore } from '../../../store/uiStore'
import { Button } from '../../atoms/Button'
import './ConfirmDialog.css'

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, closeConfirmDialog } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && confirmDialog?.isOpen && !isSubmitting) {
      closeConfirmDialog()
    }
  }

  useEffect(() => {
    if (confirmDialog?.isOpen) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [confirmDialog?.isOpen, isSubmitting])

  if (!confirmDialog?.isOpen) return null

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await confirmDialog.onConfirm()
    } finally {
      setIsSubmitting(false)
      // 操作完成后自动关闭（若调用方未手动关闭）
      setTimeout(() => {
        if (useUIStore.getState().confirmDialog?.isOpen) {
          useUIStore.getState().closeConfirmDialog()
        }
      }, 50)
    }
  }

  const handleCancel = () => {
    if (!isSubmitting) closeConfirmDialog()
  }

  return (
    <div
      className="confirm-overlay"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="confirm-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="confirm-title">
          {confirmDialog.title}
        </h3>

        {confirmDialog.description && (
          <p className="confirm-description">{confirmDialog.description}</p>
        )}

        <div className="confirm-actions">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {confirmDialog.cancelText}
          </Button>
          <Button
            variant={confirmDialog.confirmVariant}
            onClick={handleConfirm}
            loading={isSubmitting}
          >
            {confirmDialog.confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
