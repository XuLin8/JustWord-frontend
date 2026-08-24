// src/components/atoms/Button/index.tsx
import React, { useRef } from 'react'
import { Spinner } from '../Spinner'
import './Button.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  onPointerDown,
  style,
  ...props
}) => {
  const hostRef = useRef<HTMLButtonElement | null>(null)

  const baseClass = 'btn shine'
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  const widthClass = fullWidth ? 'btn-full' : ''

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    const el = hostRef.current ?? (e.currentTarget as HTMLButtonElement)
    const rect = el.getBoundingClientRect()
    const rx = Math.round((e.clientX - rect.left) * (200 / rect.width))
    const ry = Math.round((e.clientY - rect.top)  * (200 / rect.height))
    el.style.setProperty('--rx', String(rx))
    el.style.setProperty('--ry', String(ry))
    el.classList.remove('is-rippling')
    // force reflow to restart animation
    void el.offsetWidth
    el.classList.add('is-rippling')
    onPointerDown?.(e)
  }

  return (
    <button
      ref={hostRef}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      disabled={disabled || loading}
      onPointerDown={handlePointerDown}
      style={style}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}
