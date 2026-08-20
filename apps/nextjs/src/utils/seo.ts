import type { Metadata, Viewport } from 'next'
import type { Locale, RouteKey } from '~/i18n/routing'

import { getLanguageAlternates, getLocalizedPath } from '~/i18n/routing'
import { getBaseUrl } from '~/lib/url'

interface SeoOptions {
  readonly routeKey: RouteKey
  readonly locale: Locale
  readonly title: string
  readonly description?: string
  readonly image?: string
}

export const defaultViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

const openGraphLocales = { en: 'en_US', pl: 'pl_PL' } as const satisfies Record<Locale, string>

export const createSeoMetadata = ({ routeKey, locale, title, description, image }: SeoOptions): Metadata => {
  const hasImage = typeof image === 'string' && image.length > 0
  const canonicalPath = getLocalizedPath(routeKey, locale)

  return {
    metadataBase: getBaseUrl(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getLanguageAlternates(routeKey),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalPath,
      locale: openGraphLocales[locale],
      alternateLocale: locale === 'en' ? [openGraphLocales.pl] : [openGraphLocales.en],
      images: hasImage ? [image] : undefined,
    },
    twitter: {
      title,
      description,
      card: hasImage ? 'summary_large_image' : 'summary',
      images: hasImage ? [image] : undefined,
    },
  }
}
