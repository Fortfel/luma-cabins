import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

import { HowItWorksExperience } from '~/app/(app)/_components/how-it-works-experience'
import {
  LandingSectionIntro,
  LandingSectionIntroBody,
  LandingSectionIntroTitle,
} from '~/app/(app)/_components/landing-section-intro'
import { processSteps } from '~/app/(app)/_data/process-steps'

function HowItWorksSection({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'flex scroll-mt-(--nav-height) flex-col gap-(--section-gutter-y) md:scroll-mt-[calc(var(--nav-height)+0.5rem)]',
        className,
      )}
      aria-labelledby="process-title"
      {...props}
    >
      <LandingSectionIntro className="gap-2 md:mb-6">
        <LandingSectionIntroTitle>How it works</LandingSectionIntroTitle>
        <LandingSectionIntroBody>A guided path, start to finish.</LandingSectionIntroBody>
      </LandingSectionIntro>

      <HowItWorksExperience steps={processSteps} />
    </section>
  )
}

export { HowItWorksSection }
