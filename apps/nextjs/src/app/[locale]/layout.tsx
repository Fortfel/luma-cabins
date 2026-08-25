import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { SpeedInsights } from '@vercel/speed-insights/next'
import localFont from 'next/font/local'

import { Toaster } from '@workspace/ui/components/sonner'
import { TooltipProvider } from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'

import '~/styles.css'

import { resolveLocale, setRenderLocale } from '~/i18n/server'
import { metadata_home_description, metadata_home_title } from '~/paraglide/messages.js'
import { locales, getTextDirection } from '~/paraglide/runtime.js'
import { createSeoMetadata } from '~/utils/seo'

const satoshi = localFont({
  src: [
    {
      path: '../../../public/fonts/Satoshi-Variable.woff2',
      weight: '300 900',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/Satoshi-VariableItalic.woff2',
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
      path: '../../../public/fonts/CabinetGrotesk-Variable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-cabinet-grotesk',
  display: 'swap',
})

export { defaultViewport as viewport } from '~/utils/seo'

interface RootLayoutProps {
  readonly children: ReactNode
  readonly params: Promise<{ locale: string }>
}

export const dynamicParams = false

export const generateStaticParams = () => locales.map((locale) => ({ locale }))

export const generateMetadata = async ({ params }: RootLayoutProps): Promise<Metadata> => {
  const locale = resolveLocale((await params).locale)

  return createSeoMetadata({
    routeKey: 'home',
    locale,
    title: metadata_home_title({}, { locale }),
    description: metadata_home_description({}, { locale }),
  })
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const locale = setRenderLocale((await params).locale)

  return (
    <html lang={locale} dir={getTextDirection(locale)} suppressHydrationWarning>
      <body
        className={cn(
          'min-h-dvh bg-background font-sans text-foreground antialiased',
          satoshi.variable,
          cabinetGrotesk.variable,
        )}
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
