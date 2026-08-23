import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface ConfirmDialogOptions {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

interface UIStore {
  // ===== Toast =====
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void

  // ===== Confirm Dialog =====
  confirmDialog: ConfirmDialogOptions | null
  openConfirmDialog: (options: Omit<ConfirmDialogOptions, 'isOpen'>) => void
  closeConfirmDialog: () => void
}

const genId = () => Math.random().toString(36).slice(2, 10)

export const useUIStore = create<UIStore>((set, get) => ({
  // ===== Toast =====
  toasts: [],

  showToast: (message, type = 'info', duration = 3000) => {
    const id = genId()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  // ===== Confirm Dialog =====
  confirmDialog: null,

  openConfirmDialog: (options) => {
    set({
      confirmDialog: {
        isOpen: true,
        confirmText: '确认',
        cancelText: '取消',
        confirmVariant: 'primary',
        ...options,
      },
    })
  },

  closeConfirmDialog: () => {
    const dialog = get().confirmDialog
    if (dialog?.onCancel) dialog.onCancel()
    set({ confirmDialog: null })
  },
}))
