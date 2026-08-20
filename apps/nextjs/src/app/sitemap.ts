import type { MetadataRoute } from 'next'

import { routeKeys } from '@workspace/i18n/routes'

import { getLanguageAlternates, getLocalizedPath, locales } from '~/i18n/routing'
import { getBaseUrl } from '~/lib/url'

const toAbsoluteUrl = (path: string) => new URL(path, getBaseUrl()).toString()

export default function sitemap(): MetadataRoute.Sitemap {
  return routeKeys.flatMap((routeKey) => {
    const languages = Object.fromEntries(
      Object.entries(getLanguageAlternates(routeKey)).map(([locale, path]) => [locale, toAbsoluteUrl(path)]),
    )

    return locales.map((locale) => ({
      url: toAbsoluteUrl(getLocalizedPath(routeKey, locale)),
      alternates: { languages },
    }))
  })
}
