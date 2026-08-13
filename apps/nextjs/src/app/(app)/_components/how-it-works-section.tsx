import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

import { HowItWorksExperience } from '~/app/(app)/_components/how-it-works-experience'
import { processSteps } from '~/app/(app)/_data/process-steps'

function HowItWorksSection({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn('scroll-mt-(--nav-height) md:scroll-mt-[calc(var(--nav-height)+0.5rem)]', className)}
      aria-labelledby="process-title"
      {...props}
    >
      <div className="container-page-2xl mb-8 flex flex-col gap-2 text-center text-foreground sm:mb-12 md:mb-20">
        <h2 id="process-title" className="text-clamp-32-52 leading-tight font-medium text-balance">
          How it works
        </h2>
        <p className="text-clamp-16-20 leading-tight text-pretty">A guided path, start to finish.</p>
      </div>

      <HowItWorksExperience steps={processSteps} />
    </section>
  )
}

export { HowItWorksSection }
