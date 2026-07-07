import type * as React from 'react'

import {
  LandingSectionIntro,
  LandingSectionIntroBody,
  LandingSectionIntroEyebrow,
  LandingSectionIntroTitle,
} from '~/app/(app)/_components/landing-section-intro'

function AboutSection({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section className={className} {...props}>
      <LandingSectionIntro>
        <LandingSectionIntroEyebrow>Our approach</LandingSectionIntroEyebrow>
        <LandingSectionIntroTitle className="max-w-xl lg:max-w-2xl xl:max-w-3xl">
          A simpler path to a quiet <i>retreat</i>.
        </LandingSectionIntroTitle>
        <LandingSectionIntroBody className="max-w-5xl">
          We design secluded luxury retreats for unforgettable stays in nature. Each cabin combines refined
          architecture, warm natural materials, panoramic views, and premium comforts for a peaceful escape without
          compromise. Slow down, reconnect, and experience the calm of modern cabin living.
        </LandingSectionIntroBody>
      </LandingSectionIntro>
    </section>
  )
}

export { AboutSection }
