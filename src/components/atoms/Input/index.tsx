// src/components/atoms/Input/index.tsx
import React from 'react'
import { Input as ShadcnInput } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
  const showLabel = Boolean(label)

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', !fullWidth && 'w-fit')}>
      {showLabel && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <ShadcnInput id={inputId} aria-invalid={Boolean(error)} className={cn(error && 'border-destructive focus-visible:ring-destructive/30', className)} {...props} />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}