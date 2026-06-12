import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

const LogoIcon = ({ className, ...props }: React.ComponentProps<'svg'>) => {
  return (
    <svg
      data-slot="logo-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={cn('h-6', className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M4 22l12-19 12 19z m6 0l6-11 6 11z m-9 2l30 0m-27 3l24 0"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export { LogoIcon }
