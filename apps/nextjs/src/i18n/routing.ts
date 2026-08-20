import type { Locale, RouteKey } from '@workspace/i18n/routes'

import { locales, routeKeys, routes } from '@workspace/i18n/routes'

type LinkFragment = `#${string}`

const getLocalizedPath = (routeKey: RouteKey, locale: Locale) => routes[routeKey].publicPaths[locale]

const getLocalizedHref = (routeKey: RouteKey, locale: Locale, fragment?: LinkFragment) => {
  const path = getLocalizedPath(routeKey, locale)
  return fragment === undefined ? path : `${path}${fragment}`
}

const getLanguageAlternates = (routeKey: RouteKey) => ({
  en: getLocalizedPath(routeKey, 'en'),
  pl: getLocalizedPath(routeKey, 'pl'),
  'x-default': getLocalizedPath(routeKey, 'en'),
})

const getRouteKeyFromSegments = (segments: ReadonlyArray<string>): RouteKey => {
  const segment = segments.find((value) => !value.startsWith('(') && !value.startsWith('@'))

  if (segment === undefined) {
    return 'home'
  }

  return routeKeys.find((routeKey) => routeKey !== 'home' && routes[routeKey].canonicalPath === `/${segment}`) ?? 'home'
}

export { getLanguageAlternates, getLocalizedHref, getLocalizedPath, getRouteKeyFromSegments, locales }
export type { LinkFragment, Locale, RouteKey }
