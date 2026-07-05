import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

import {
  LandingSectionIntro,
  LandingSectionIntroBody,
  LandingSectionIntroEyebrow,
  LandingSectionIntroTitle,
} from '~/app/(app)/_components/landing-section-intro'

function AboutSection({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section className={cn('py-10', className)} {...props}>
      <LandingSectionIntro>
        <LandingSectionIntroEyebrow>Our approach</LandingSectionIntroEyebrow>
        <LandingSectionIntroTitle>A simpler path to a quiet retreat.</LandingSectionIntroTitle>
        <LandingSectionIntroBody>
          We design secluded luxury retreats for unforgettable stays in nature. Each cabin combines refined
          architecture, warm natural materials, panoramic views, and premium comforts for a peaceful escape without
          compromise. Slow down, reconnect, and experience the calm of modern cabin living.
        </LandingSectionIntroBody>
      </LandingSectionIntro>
    </section>
  )
}

export { AboutSection }
