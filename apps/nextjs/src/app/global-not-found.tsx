import type { Metadata } from 'next'

import localFont from 'next/font/local'

import { cn } from '@workspace/ui/lib/utils'

import { NotFoundPage } from '~/app/_components/layout/not-found-page'

import '~/styles.css'

const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/Satoshi-Variable.woff2',
      weight: '300 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Satoshi-VariableItalic.woff2',
      weight: '300 900',
      style: 'italic',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})

const cabinetGrotesk = localFont({
  src: [
    {
      path: '../../public/fonts/CabinetGrotesk-Variable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-cabinet-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Page not found',
  description: "Sorry, we couldn't find the page you're looking for.",
  robots: { index: false, follow: false },
}

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body
        className={cn(
          'min-h-dvh bg-background font-sans text-foreground antialiased',
          satoshi.variable,
          cabinetGrotesk.variable,
        )}
      >
        <NotFoundPage homeHref="/" />
      </body>
    </html>
  )
}
