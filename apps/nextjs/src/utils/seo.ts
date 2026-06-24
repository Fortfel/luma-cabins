import type { Metadata, Viewport } from 'next'

import { getBaseUrl } from '~/lib/url'

interface SeoOptions {
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

export const createSeoMetadata = ({ title, description, image }: SeoOptions): Metadata => {
  const hasImage = typeof image === 'string' && image.length > 0

  return {
    metadataBase: getBaseUrl(),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
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
