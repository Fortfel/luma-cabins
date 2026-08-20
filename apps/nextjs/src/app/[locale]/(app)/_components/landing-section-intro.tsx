import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

function LandingSectionIntro({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="landing-section-intro"
      className={cn(
        'container-page-2xl flex flex-col items-center gap-[clamp(24px,calc(14.73px+2.473vw),40px)] text-center text-foreground',
        className,
      )}
      {...props}
    />
  )
}

function LandingSectionIntroEyebrow({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="landing-section-intro-eyebrow" className={cn('text-eyebrow', className)} {...props} />
}

function LandingSectionIntroTitle({ children, className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2 data-slot="landing-section-intro-title" className={cn('text-display-lg text-balance', className)} {...props}>
      {children}
    </h2>
  )
}

function LandingSectionIntroBody({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="landing-section-intro-body"
      className={cn('text-body-lg text-pretty lg:mt-2.5', className)}
      {...props}
    />
  )
}

export { LandingSectionIntro, LandingSectionIntroEyebrow, LandingSectionIntroTitle, LandingSectionIntroBody }
