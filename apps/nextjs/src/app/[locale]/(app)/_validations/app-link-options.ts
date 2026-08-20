import type { LinkFragment, Locale } from '~/i18n/routing'

import { getLocalizedHref } from '~/i18n/routing'
import { nav_home_aria } from '~/paraglide/messages.js'
import { getLocale } from '~/paraglide/runtime.js'

export const homeLinkOptions = ({
  fragment,
  withLabel = false,
  locale = getLocale(),
}: { fragment?: LinkFragment; withLabel?: boolean; locale?: Locale } = {}) => ({
  href: getLocalizedHref('home', locale, fragment),
  'aria-label': withLabel ? nav_home_aria({}, { locale }) : undefined,
})

export const aboutLinkOptions = (locale: Locale = getLocale()) => ({ href: getLocalizedHref('about', locale) })

export const contactLinkOptions = (locale: Locale = getLocale()) => ({ href: getLocalizedHref('contact', locale) })
