import type { Locale } from '~/i18n/routing'

import {
  aboutLinkOptions,
  contactLinkOptions,
  homeLinkOptions,
} from '~/app/[locale]/(app)/_validations/app-link-options'

interface NavigationLink {
  className: string
  label: string
  linkOptions: { href: string }
}

interface NavigationLabels {
  readonly contact: string
  readonly faq: string
  readonly models: string
  readonly portfolio: string
  readonly process: string
}

const getNavigationDesktopLinks = (locale: Locale, labels: NavigationLabels) =>
  [
    { className: '', label: labels.models, linkOptions: homeLinkOptions({ fragment: '#models', locale }) },
    { className: '', label: labels.process, linkOptions: homeLinkOptions({ fragment: '#process', locale }) },
    { className: '', label: labels.portfolio, linkOptions: aboutLinkOptions(locale) },
    { className: '', label: labels.faq, linkOptions: homeLinkOptions({ fragment: '#faqs', locale }) },
  ] as const satisfies ReadonlyArray<NavigationLink>

const getNavigationMobileLinks = (locale: Locale, labels: NavigationLabels) =>
  [
    ...getNavigationDesktopLinks(locale, labels),
    { className: '', label: labels.contact, linkOptions: contactLinkOptions(locale) },
  ] as const satisfies ReadonlyArray<NavigationLink>

export { getNavigationDesktopLinks, getNavigationMobileLinks }
export type { NavigationLabels, NavigationLink }
