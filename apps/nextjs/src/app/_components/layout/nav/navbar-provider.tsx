'use client'

import * as React from 'react'

import { useIsScrolled } from '@workspace/ui/hooks/use-is-scrolled'
import { useIsMobile } from '@workspace/ui/hooks/use-mobile'
import { cn } from '@workspace/ui/lib/utils'

interface NavbarContextValue {
  isMobile: boolean
  isScrolled: boolean
}

const NavbarContext = React.createContext<NavbarContextValue | null>(null)

const NavbarProvider = ({
  height = '4rem',
  className,
  children,
  ...props
}: React.ComponentProps<'header'> & { height?: string }) => {
  const isMobile = useIsMobile()
  const isScrolled = useIsScrolled()

  const contextValue = React.useMemo<NavbarContextValue>(() => ({ isMobile, isScrolled }), [isMobile, isScrolled])

  return (
    <NavbarContext.Provider value={contextValue}>
      <header
        data-slot="navbar-wrapper"
        data-scrolled={isScrolled}
        className={cn(
          'group/navbar-wrapper fixed inset-x-0 top-0 z-50 mr-(--removed-body-scroll-bar-size,0px) h-(--nav-height) text-primary-foreground',
          'md:top-5 md:h-[calc(var(--nav-height)+0.5rem)]',
          className,
        )}
        style={{ '--nav-height': height } as React.CSSProperties}
        {...props}
      >
        <div className="container-page h-full max-md:px-0">{children}</div>
      </header>
    </NavbarContext.Provider>
  )
}

export { NavbarContext, NavbarProvider }
