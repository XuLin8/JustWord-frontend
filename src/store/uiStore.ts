import { create } from 'zustand'
import i18n from '../i18n'

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

export type ThemeMode = 'light' | 'dark' | 'system'

interface UIStore {
  // ===== Toast =====
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void

  // ===== Confirm Dialog =====
  confirmDialog: ConfirmDialogOptions | null
  openConfirmDialog: (options: Omit<ConfirmDialogOptions, 'isOpen'>) => void
  closeConfirmDialog: () => void

  // ===== Theme =====
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  /** 实际生效的主题（system 解析后的落定值）。由 useTheme hook 维护。 */
  resolvedTheme: 'light' | 'dark'
  setResolvedTheme: (resolved: 'light' | 'dark') => void
}

const genId = () => Math.random().toString(36).slice(2, 10)

const THEME_STORAGE_KEY = 'justword.theme'

/** 读取持久化主题，无则默认 system（跟随系统）。 */
function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved
  }
  return 'system'
}

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
        confirmText: i18n.t('common.confirm'),
        cancelText: i18n.t('common.cancel'),
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

  // ===== Theme =====
  theme: getInitialTheme(),
  resolvedTheme: 'light', // 初值由 useTheme 挂载后校正

  setTheme: (mode) => {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
    set({ theme: mode })
  },

  setResolvedTheme: (resolved) => {
    if (get().resolvedTheme !== resolved) set({ resolvedTheme: resolved })
  },
}))
