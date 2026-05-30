'use client'

import * as React from 'react'

import { useIsScrolled } from '@workspace/ui/hooks/use-is-scrolled'
import { useIsMobile } from '@workspace/ui/hooks/use-mobile'
import { cn } from '@workspace/ui/lib/utils'

interface NavbarContextValue {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  isMobile: boolean
  isScrolled: boolean
  toggleMobileMenu: () => void
}

const NavbarContext = React.createContext<NavbarContextValue | null>(null)

const NavbarProvider = ({
  height = '4rem',
  className,
  children,
  ...props
}: React.ComponentProps<'header'> & { height?: string }) => {
  const [isMobileMenuOpenState, setIsMobileMenuOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const isScrolled = useIsScrolled()
  const isMobileMenuOpen = isMobile && isMobileMenuOpenState

  const toggleMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const contextValue = React.useMemo<NavbarContextValue>(
    () => ({ isMobileMenuOpen, setIsMobileMenuOpen, isMobile, isScrolled, toggleMobileMenu }),
    [isMobileMenuOpen, isMobile, isScrolled, toggleMobileMenu],
  )

  return (
    <NavbarContext.Provider value={contextValue}>
      <header
        data-slot="navbar-wrapper"
        data-scrolled={isScrolled}
        className={cn(
          'group/navbar-wrapper fixed inset-x-0 top-0 z-10 w-full',
          'border-border bg-background/80 mr-(--removed-body-scroll-bar-size,0px) h-(--nav-height) border-b backdrop-blur-md',
          'after:bg-border after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:opacity-0 after:brightness-[0.8] after:transition-opacity',
          isScrolled && 'after:opacity-100',
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
