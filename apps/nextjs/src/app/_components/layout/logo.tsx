import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

import { LogoIcon } from '~/app/_components/layout/logo-icon'

const Logo = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot="logo"
      role="img"
      aria-label="Luma Cabins logo"
      className={cn('flex w-fit items-center gap-3 font-heading', className)}
      {...props}
    >
      <div className="flex items-center justify-center text-primary-foreground">
        <LogoIcon aria-hidden="true" className="size-8" />
      </div>
      <span className="flex flex-col leading-tight font-semibold tracking-widest uppercase">
        <span className="text-base font-bold text-primary-foreground">Luma</span>
        <span className="text-xs font-medium text-primary-foreground/75">Cabins</span>
      </span>
    </div>
  )
}

export { Logo }
