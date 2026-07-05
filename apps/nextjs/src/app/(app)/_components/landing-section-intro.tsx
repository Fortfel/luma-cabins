import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

function LandingSectionIntro({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="landing-section-intro"
      className={cn('container-page flex flex-col items-center gap-6 text-center text-foreground', className)}
      {...props}
    />
  )
}

function LandingSectionIntroEyebrow({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="landing-section-intro-eyebrow"
      className={cn('text-xs font-bold tracking-[0.1875rem] uppercase', className)}
      {...props}
    />
  )
}

function LandingSectionIntroTitle({ children, className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="landing-section-intro-title"
      className={cn('text-4xl leading-[1.12] font-medium', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

function LandingSectionIntroBody({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="landing-section-intro-body" className={cn('text-base', className)} {...props} />
}

export { LandingSectionIntro, LandingSectionIntroEyebrow, LandingSectionIntroTitle, LandingSectionIntroBody }
