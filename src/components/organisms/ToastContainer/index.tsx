import React from 'react'
import { useUIStore, type ToastType } from '../../../store/uiStore'
import { cn } from '@/lib/utils'

const TYPE_CONFIG: Record<ToastType, { icon: string; className: string }> = {
  success: { icon: '✅', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  error: { icon: '❌', className: 'border-red-200 bg-red-50 text-red-800' },
  warning: { icon: '⚠️', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  info: { icon: 'ℹ️', className: 'border-sky-200 bg-sky-50 text-sky-800' },
}

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed right-4 top-4 z-[1100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const cfg = TYPE_CONFIG[toast.type]
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => removeToast(toast.id)}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all cursor-pointer hover:opacity-90 animate-in slide-in-from-top-4 fade-in',
              cfg.className,
            )}
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">{cfg.icon}</span>
            <span>{toast.message}</span>
          </button>
        )
      })}
    </div>
  )
}