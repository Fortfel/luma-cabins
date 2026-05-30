import { env } from '~/env'

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  if (env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`
  }

  // eslint-disable-next-line
  return `http://localhost:${process.env.PORT ?? 3000}`
}
