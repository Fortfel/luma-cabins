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

const getNavbarHeight = (height: string) => {
  if (height.endsWith('rem')) {
    const remValue = Number(height.slice(0, -3))

    return Number.isFinite(remValue) ? remValue * 16 : 0
  }

  if (height.endsWith('px')) {
    const pixelValue = Number(height.slice(0, -2))

    return Number.isFinite(pixelValue) ? pixelValue : 0
  }

  return 0
}

const NavbarProvider = ({
  height = '4rem',
  className,
  children,
  ...props
}: React.ComponentProps<'header'> & { height?: string }) => {
  const isMobile = useIsMobile()
  const [scrollThreshold, setScrollThreshold] = React.useState(0)
  const isScrolled = useIsScrolled(scrollThreshold)

  React.useEffect(() => {
    const updateScrollThreshold = () => {
      setScrollThreshold(Math.max(window.innerHeight - getNavbarHeight(height), 0))
    }

    updateScrollThreshold()
    window.addEventListener('resize', updateScrollThreshold)

    return () => window.removeEventListener('resize', updateScrollThreshold)
  }, [height])

  const contextValue = React.useMemo<NavbarContextValue>(() => ({ isMobile, isScrolled }), [isMobile, isScrolled])

  return (
    <NavbarContext.Provider value={contextValue}>
      <header
        data-slot="navbar-wrapper"
        data-scrolled={isScrolled}
        className={cn(
          'group/navbar-wrapper fixed inset-x-0 top-0 z-101 mr-(--removed-body-scroll-bar-size,0px) h-(--nav-height) border-b border-transparent text-primary-foreground transition-[top,color] duration-400 ease-out',
          'data-[scrolled=true]:bg-background data-[scrolled=true]:text-foreground',
          'data-[scrolled=true]:border-border data-[scrolled=true]:shadow-xs',
          'md:top-4 md:h-[calc(var(--nav-height)+0.5rem)] md:data-[scrolled=true]:top-0',
          className,
        )}
        style={{ '--nav-height': height } as React.CSSProperties}
        {...props}
      >
        <div className="container-page-2xl max-md:container-bleed h-full">{children}</div>
      </header>
    </NavbarContext.Provider>
  )
}

export { NavbarContext, NavbarProvider }
