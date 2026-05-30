import type * as React from 'react'

import { AppNavbar } from '~/app/_components/layout/nav/app-navbar'
import { NavbarProvider } from '~/app/_components/layout/nav/navbar-provider'

const NAVBAR_HEIGHT = '4rem'

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <NavbarProvider height={NAVBAR_HEIGHT}>
        <AppNavbar />
      </NavbarProvider>
      <main
        className="mx-auto min-h-dvh max-w-7xl px-4 py-6 pt-[calc(var(--nav-height)+1.5rem)] sm:px-6 lg:px-8"
        style={{ '--nav-height': NAVBAR_HEIGHT } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}
