import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-sm', className)}
      {...props}
    />
  )
}

export { Label }