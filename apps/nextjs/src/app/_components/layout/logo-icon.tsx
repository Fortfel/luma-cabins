import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

const LogoIcon = ({ className, ...props }: React.ComponentProps<'svg'>) => {
  return (
    <svg
      data-slot="logo-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 59 92"
      className={cn('h-6', className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M 11 14 C 3 14 -6 14 -13 14 C -13 7 -13 7 -13 7 C -7 0 -13 7 -7 0 L 0 0 C -6 7 0 0 -6 7 C 5.24 7 14.48 7 24 7 C 6 32 24 7 6 32 C 3 32 2 32 0 32 S -2 32 -4 32 C -5 32 -6 32 -8 32 C -9 32 -10 32 -12 32 C -15 32 -19 32 -21 32 C -21 39 -21 46 -21 54 C -13 47 -13 47 -13 47 C -13 42 -13 41 -13 39 C -13 38 -13 37 -13 36 C -13 35 -13 34 -13 34 C -11 34 -9 34 -6 34 C -6 50 -6 50 -6 50 C -17 60 -6 50 -17 60 C -18.6744 61.3446 -20.3417 62.6981 -22 64.0625 C -25.7302 67 -25.7302 67 -28 67 C -28 53.14 -28 39.28 -28 25 C -12 25 -17 25 -7 25 C -6 25 -5 25 -4 25 C -2 25 -2 25 3 25 C 11 14 3 25 11 14"
        fill="currentColor"
        transform="translate(28,25)"
      />
      <path
        d="M 0 -1 C 17 -1 34 -1 51 -1 C 34 23 51 -1 34 23 C 29 23 25 23 20 23 C 18 23 17 23 16 23 C 13 23 9 23 6 23 C 6 20.02 6 18.04 6 16 C 14 16 22 16 31 16 C 38 6 31 16 38 6 C 37 6 36 6 34 6 C 30 6 27 6 23 6 C 21 6 19 6 17 6 C 14 6 12 6 9 6 C 8 6 8 6 7 6 C 5 6 3 6 1 6 C 0 6 0 6 0 6 C 0 3 0 1 0 -1 Z"
        fill="currentColor"
        transform="translate(8,0)"
      />
      <path
        d="M 0 0 C 0 0 7 0 7 0 C 7 38 7 0 7 38 C 0 38 7 38 0 38 C 0 0 0 38 0 0 Z"
        fill="currentColor"
        transform="translate(0,9)"
      />
    </svg>
  )
}

export { LogoIcon }
