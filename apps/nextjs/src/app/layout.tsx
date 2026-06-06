import type { ReactNode } from 'react'

import { Toaster } from '@workspace/ui/components/sonner'
import { TooltipProvider } from '@workspace/ui/components/tooltip'

import { createSeoMetadata } from '~/utils/seo'

import '~/styles.css'

import type { Metadata } from 'next'

export { defaultViewport as viewport } from '~/utils/seo'

export const metadata: Metadata = createSeoMetadata({
  title: 'Luma Cabins',
  description: 'Premium modular cabins for quiet, refined escapes.',
})

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-dvh font-sans antialiased">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
