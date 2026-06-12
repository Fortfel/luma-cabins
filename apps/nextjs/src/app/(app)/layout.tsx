import type * as React from 'react'

import { AppNavbar } from '~/app/_components/layout/nav/app-navbar'
import { NavbarProvider } from '~/app/_components/layout/nav/navbar-provider'

const NAVBAR_HEIGHT = '4.5rem'

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <NavbarProvider height={NAVBAR_HEIGHT}>
        <AppNavbar />
      </NavbarProvider>
      <main className="mx-auto min-h-dvh" style={{ '--nav-height': NAVBAR_HEIGHT } as React.CSSProperties}>
        {children}
      </main>
    </>
  )
}
