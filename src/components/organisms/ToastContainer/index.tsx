import React from 'react'
import { useUIStore, type ToastType } from '../../../store/uiStore'
import './ToastContainer.css'

const TYPE_CONFIG: Record<ToastType, { icon: string; class: string }> = {
  success: { icon: '✅', class: 'toast-success' },
  error: { icon: '❌', class: 'toast-error' },
  warning: { icon: '⚠️', class: 'toast-warning' },
  info: { icon: 'ℹ️', class: 'toast-info' },
}

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map((toast) => {
        const cfg = TYPE_CONFIG[toast.type]
        return (
          <div
            key={toast.id}
            className={`toast-item ${cfg.class}`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="toast-icon" aria-hidden="true">{cfg.icon}</span>
            <span className="toast-message">{toast.message}</span>
          </div>
        )
      })}
    </div>
  )
}
