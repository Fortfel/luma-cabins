import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

function LandingSectionIntro({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="landing-section-intro"
      className={cn(
        'container-page flex flex-col items-center gap-[clamp(24px,calc(14.73px+2.473vw),40px)] text-center text-foreground',
        className,
      )}
      {...props}
    />
  )
}

function LandingSectionIntroEyebrow({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="landing-section-intro-eyebrow"
      className={cn('text-clamp-12-14 font-bold tracking-[3px] uppercase', className)}
      {...props}
    />
  )
}

function LandingSectionIntroTitle({ children, className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="landing-section-intro-title"
      className={cn('text-clamp-36-64 leading-[1.12] font-medium', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

function LandingSectionIntroBody({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="landing-section-intro-body"
      className={cn('text-clamp-16-20 leading-snug text-pretty md:leading-tight lg:mt-2.5', className)}
      {...props}
    />
  )
}

export { LandingSectionIntro, LandingSectionIntroEyebrow, LandingSectionIntroTitle, LandingSectionIntroBody }
