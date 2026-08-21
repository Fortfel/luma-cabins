import type * as React from 'react'
import type { Locale } from '~/i18n/routing'

import { cn } from '@workspace/ui/lib/utils'

import { HowItWorksExperience } from '~/app/[locale]/(app)/_components/how-it-works-experience'
import {
  LandingSectionIntro,
  LandingSectionIntroBody,
  LandingSectionIntroTitle,
} from '~/app/[locale]/(app)/_components/landing-section-intro'
import { createProcessSteps } from '~/app/[locale]/(app)/_data/process-steps'
import {
  carousel_role,
  carousel_slide_role,
  process_carousel_label,
  process_intro,
  process_navigation_label,
  process_timeline_label,
  process_title,
} from '~/paraglide/messages.js'

interface HowItWorksSectionProps extends React.ComponentProps<'section'> {
  readonly locale: Locale
}

function HowItWorksSection({ locale, className, ...props }: HowItWorksSectionProps) {
  const messageOptions = { locale }
  const processSteps = createProcessSteps(locale)

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
        <LandingSectionIntroTitle id="process-title">{process_title({}, messageOptions)}</LandingSectionIntroTitle>
        <LandingSectionIntroBody>{process_intro({}, messageOptions)}</LandingSectionIntroBody>
      </LandingSectionIntro>

      <HowItWorksExperience
        steps={processSteps}
        labels={{
          carousel: process_carousel_label({}, messageOptions),
          carouselRole: carousel_role({}, messageOptions),
          navigation: process_navigation_label({}, messageOptions),
          slideRole: carousel_slide_role({}, messageOptions),
          timeline: process_timeline_label({}, messageOptions),
        }}
      />
    </section>
  )
}

export { HowItWorksSection }
