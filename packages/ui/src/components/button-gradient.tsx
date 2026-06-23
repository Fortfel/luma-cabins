import type * as React from 'react'
import type { VariantProps } from 'class-variance-authority'

import { cva } from 'class-variance-authority'

import { Button as ButtonPrimitive } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

const buttonGradientVariants = cva('', {
  variants: {
    gradient: {
      default: '',
      normal:
        'relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/20 before:opacity-80 before:transition-opacity after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:bg-gradient-to-b after:from-white/10 after:to-transparent after:mix-blend-overlay',
      intense:
        'relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/30 before:opacity-80 before:transition-opacity after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:bg-gradient-to-b after:from-white/15 after:to-transparent after:mix-blend-overlay',
    },
  },
  defaultVariants: {
    gradient: 'default',
  },
})

type ButtonGradientProps = React.ComponentProps<typeof ButtonPrimitive> & VariantProps<typeof buttonGradientVariants>

function ButtonGradient({ className, gradient = 'default', ...props }: ButtonGradientProps) {
  return <ButtonPrimitive className={cn(buttonGradientVariants({ gradient }), className)} {...props} />
}

export { ButtonGradient, buttonGradientVariants }
export type { ButtonGradientProps }
