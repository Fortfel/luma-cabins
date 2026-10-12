import { env } from '~/env'

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  if (env.VERCEL_ENV === 'production') {
    const hostname = env.VERCEL_PROJECT_PRODUCTION_URL
    if (hostname === undefined || hostname === '') {
      throw new Error('VERCEL_PROJECT_PRODUCTION_URL is required when VERCEL_ENV is production')
    }

    const origin = `https://${hostname}`
    if (!URL.canParse(origin) || new URL(origin).origin !== origin) {
      throw new Error('VERCEL_PROJECT_PRODUCTION_URL must be a valid hostname without a protocol or path')
    }

    return origin
  }
  if (env.VERCEL_ENV === 'preview') {
    const hostname = env.VERCEL_URL
    if (hostname === undefined || hostname === '') {
      throw new Error('VERCEL_URL is required when VERCEL_ENV is preview')
    }

    const origin = `https://${hostname}`
    if (!URL.canParse(origin) || new URL(origin).origin !== origin) {
      throw new Error('VERCEL_URL must be a valid hostname without a protocol or path')
    }

    return origin
  }

  // oxlint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`
}
