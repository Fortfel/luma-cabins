import type * as React from 'react'

import { AppNavbar } from '~/app/_components/layout/nav/app-navbar'
import { NavbarProvider } from '~/app/_components/layout/nav/navbar-provider'
import { resolveLocale } from '~/i18n/server'
import {
  nav_contact,
  nav_faq,
  nav_get_started,
  nav_language_aria,
  nav_menu_aria,
  nav_models,
  nav_portfolio,
  nav_process,
} from '~/paraglide/messages.js'

const NAVBAR_HEIGHT = '4.5rem'

interface AppLayoutProps {
  readonly children: React.ReactNode
  readonly params: Promise<{ locale: string }>
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = resolveLocale((await params).locale)
  const messageOptions = { locale }

  return (
    <>
      <NavbarProvider height={NAVBAR_HEIGHT}>
        <AppNavbar
          locale={locale}
          labels={{
            contact: nav_contact({}, messageOptions),
            faq: nav_faq({}, messageOptions),
            getStarted: nav_get_started({}, messageOptions),
            languageAria: nav_language_aria({}, messageOptions),
            menuAria: nav_menu_aria({}, messageOptions),
            models: nav_models({}, messageOptions),
            portfolio: nav_portfolio({}, messageOptions),
            process: nav_process({}, messageOptions),
          }}
        />
      </NavbarProvider>
      <main className="mx-auto min-h-dvh" style={{ '--nav-height': NAVBAR_HEIGHT } as React.CSSProperties}>
        {children}
      </main>
    </>
  )
}
