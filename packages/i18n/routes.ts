const localeValues = ['en', 'pl'] as const
const routeKeyValues = ['home', 'about', 'contact'] as const

type Locale = (typeof localeValues)[number]
type RouteKey = (typeof routeKeyValues)[number]

interface RouteDefinition {
  readonly canonicalPath: string
  readonly publicPaths: Readonly<Record<Locale, string>>
  readonly internalPaths: Readonly<Record<Locale, string>>
}

const routes = {
  home: {
    canonicalPath: '/',
    publicPaths: { en: '/', pl: '/pl' },
    internalPaths: { en: '/en', pl: '/pl' },
  },
  about: {
    canonicalPath: '/about',
    publicPaths: { en: '/about', pl: '/pl/o-nas' },
    internalPaths: { en: '/en/about', pl: '/pl/about' },
  },
  contact: {
    canonicalPath: '/contact',
    publicPaths: { en: '/contact', pl: '/pl/kontakt' },
    internalPaths: { en: '/en/contact', pl: '/pl/contact' },
  },
} as const satisfies Readonly<Record<RouteKey, RouteDefinition>>

const validateRoutes = () => {
  const publicPaths = new Set<string>()

  for (const routeKey of routeKeyValues) {
    const route = routes[routeKey]

    for (const locale of localeValues) {
      const publicPath = route.publicPaths[locale]

      if (publicPaths.has(publicPath)) {
        throw new Error(`Duplicate localized route: ${publicPath}`)
      }

      publicPaths.add(publicPath)
    }
  }
}

validateRoutes()

const canonicalRedirects = routeKeyValues.flatMap((routeKey) =>
  localeValues.flatMap((locale) => {
    const route = routes[routeKey]
    const source = route.internalPaths[locale]
    const destination = route.publicPaths[locale]

    return source === destination ? [] : [{ source, destination, permanent: true as const }]
  }),
)

const publicRewrites = routeKeyValues.flatMap((routeKey) =>
  localeValues.flatMap((locale) => {
    const route = routes[routeKey]
    const source = route.publicPaths[locale]
    const destination = route.internalPaths[locale]

    return source === destination ? [] : [{ source, destination }]
  }),
)

const paraglideUrlPatterns = [
  ...routeKeyValues.map((routeKey) => ({
    pattern: routes[routeKey].canonicalPath,
    localized: localeValues.map((locale) => [locale, routes[routeKey].publicPaths[locale]] as const),
  })),
  {
    pattern: '/:path(.*)?',
    localized: [
      ['pl', '/pl/:path(.*)?'],
      ['en', '/:path(.*)?'],
    ],
  },
] as const

const isLocale = (value: string): value is Locale => localeValues.some((locale) => locale === value)

export {
  canonicalRedirects,
  isLocale,
  localeValues as locales,
  paraglideUrlPatterns,
  publicRewrites,
  routeKeyValues as routeKeys,
  routes,
}
export type { Locale, RouteDefinition, RouteKey }
