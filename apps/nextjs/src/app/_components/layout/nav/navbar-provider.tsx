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

  const contextValue = React.useMemo<NavbarContextValue>(
    () => ({ isMobile, isScrolled }),
    [isMobile, isScrolled],
  )

  return (
    <NavbarContext.Provider value={contextValue}>
      <header
        data-slot="navbar-wrapper"
        data-scrolled={isScrolled}
        className={cn(
          'group/navbar-wrapper border-border text-primary-foreground fixed inset-x-0 top-0 z-10 mr-(--removed-body-scroll-bar-size,0px) h-(--nav-height) max-w-(--breakpoint-2xl) border-none bg-transparent backdrop-blur-2xl transition-[background-color,border-color,box-shadow,backdrop-filter,color]',
          'md:inset-x-6 md:top-5 md:mx-auto md:h-[calc(var(--nav-height)+0.5rem)] md:rounded-md',
          // 'after:bg-border after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:opacity-0 after:brightness-[0.8] after:transition-opacity',
          // isScrolled && 'after:opacity-100',
          className,
        )}
        style={{ '--nav-height': height } as React.CSSProperties}
        {...props}
      >
        {children}
      </header>
    </NavbarContext.Provider>
  )
}

export { NavbarContext, NavbarProvider }
