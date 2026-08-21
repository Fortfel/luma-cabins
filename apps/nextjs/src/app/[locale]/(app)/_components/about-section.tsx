import type * as React from 'react'
import type { Locale } from '~/i18n/routing'

import { ParaglideMessage } from '@inlang/paraglide-js-react'

import {
  LandingSectionIntro,
  LandingSectionIntroBody,
  LandingSectionIntroEyebrow,
  LandingSectionIntroTitle,
} from '~/app/[locale]/(app)/_components/landing-section-intro'
import { about_body, about_eyebrow, about_title } from '~/paraglide/messages.js'

interface AboutSectionProps extends React.ComponentProps<'section'> {
  readonly locale: Locale
}

const aboutTitleMarkup = {
  em: ({ children }: { readonly children?: React.ReactNode }) => <em>{children}</em>,
}

function AboutSection({ locale, className, ...props }: AboutSectionProps) {
  const messageOptions = { locale }

  return (
    <section className={className} {...props}>
      <LandingSectionIntro>
        <LandingSectionIntroEyebrow>{about_eyebrow({}, messageOptions)}</LandingSectionIntroEyebrow>
        <LandingSectionIntroTitle className="max-w-xl xl:max-w-3xl">
          <ParaglideMessage message={about_title} options={messageOptions} markup={aboutTitleMarkup} />
        </LandingSectionIntroTitle>
        <LandingSectionIntroBody className="max-w-5xl">{about_body({}, messageOptions)}</LandingSectionIntroBody>
      </LandingSectionIntro>
    </section>
  )
}

export { AboutSection }
