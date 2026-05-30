import type { Metadata, Viewport } from 'next'

import { getBaseUrl } from '~/lib/url'

interface SeoOptions {
  title: string
  description?: string
  image?: string
}

export const defaultViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export const createSeoMetadata = ({ title, description, image }: SeoOptions): Metadata => ({
  metadataBase: getBaseUrl(),
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    images: image ? [image] : undefined,
  },
  twitter: {
    title,
    description,
    card: image ? 'summary_large_image' : 'summary',
    images: image ? [image] : undefined,
  },
})
