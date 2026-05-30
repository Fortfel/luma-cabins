import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

import { LogoIcon } from '~/app/_components/layout/logo-icon'

const Logo = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot="logo"
      role="img"
      aria-label="Luma Cabins logo"
      className={cn('flex w-fit items-center gap-2 text-2xl', className)}
      {...props}
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-red-500 text-white">
        <LogoIcon aria-hidden="true" />
      </div>
      <span className="leading-5 font-semibold tracking-tighter">Luma Cabins</span>
    </div>
  )
}

export { Logo }
