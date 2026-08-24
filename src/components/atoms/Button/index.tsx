// src/components/atoms/Button/index.tsx
import React from 'react'
import { Button as ShadcnButton, buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

type ShadcnVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
type ShadcnSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

const VARIANT_MAP: Record<NonNullable<ButtonProps['variant']>, ShadcnVariant> = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  ghost: 'ghost',
}

const SIZE_MAP: Record<NonNullable<ButtonProps['size']>, ShadcnSize> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <ShadcnButton
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      disabled={disabled || loading}
      className={cn(fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </ShadcnButton>
  )
}