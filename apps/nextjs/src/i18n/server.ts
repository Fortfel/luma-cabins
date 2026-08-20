import type { Locale } from '~/paraglide/runtime.js'

import { cache } from 'react'

import { notFound } from 'next/navigation'

import { baseLocale, isLocale, overwriteGetLocale } from '~/paraglide/runtime.js'

const localeState = cache((): { locale: Locale } => ({ locale: baseLocale }))

overwriteGetLocale(() => localeState().locale)

const resolveLocale = (value: string): Locale => {
  if (!isLocale(value)) {
    notFound()
  }

  return value
}

const setRenderLocale = (value: string): Locale => {
  const locale = resolveLocale(value)
  localeState().locale = locale
  return locale
}

export { resolveLocale, setRenderLocale }
