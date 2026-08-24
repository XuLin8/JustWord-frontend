import React, { useState } from 'react'
import { useUIStore } from '../../../store/uiStore'
import { Button } from '../../atoms/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, closeConfirmDialog } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await confirmDialog?.onConfirm()
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
    <Dialog open={confirmDialog?.isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) handleCancel()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{confirmDialog?.title}</DialogTitle>
          {confirmDialog?.description && (
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {confirmDialog?.cancelText}
          </Button>
          <Button
            variant={confirmDialog?.confirmVariant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={isSubmitting}
          >
            {confirmDialog?.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}