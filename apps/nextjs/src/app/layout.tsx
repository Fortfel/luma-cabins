import type { ReactNode } from 'react'
import localFont from 'next/font/local'

import { Toaster } from '@workspace/ui/components/sonner'
import { TooltipProvider } from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'

import { createSeoMetadata } from '~/utils/seo'

import '~/styles.css'

import type { Metadata } from 'next'

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

export { defaultViewport as viewport } from '~/utils/seo'

export const metadata: Metadata = createSeoMetadata({
  title: 'Luma Cabins',
  description: 'Premium modular cabins for quiet, refined escapes.',
})

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-background text-foreground min-h-dvh font-sans antialiased',
          satoshi.variable,
          cabinetGrotesk.variable,
        )}
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
