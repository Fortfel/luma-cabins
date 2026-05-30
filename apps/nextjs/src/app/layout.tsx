import type { ReactNode } from 'react'

import { Toaster } from '@workspace/ui/components/sonner'
import { ThemeProvider } from '@workspace/ui/components/theme-provider'
import { TooltipProvider } from '@workspace/ui/components/tooltip'

import { config } from '~/config'
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
        <ThemeProvider
          attribute="class"
          defaultTheme={config.themeDefault}
          themes={config.themes.filter((theme) => theme.key !== 'system').map((theme) => theme.key)}
          storageKey={config.themeStorageKey}
          enableSystem
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
