'use client'

import type * as React from 'react'
import Link from 'next/link'

import { Separator } from '@workspace/ui/components/separator'
import { useTheme } from '@workspace/ui/components/theme-provider'
import { ThemeSwitcherSwap, ThemeSwitcherToggle } from '@workspace/ui/components/theme-switcher'
import { useIsMobile } from '@workspace/ui/hooks/use-mobile'
import { cn } from '@workspace/ui/lib/utils'

import { Logo } from '~/app/_components/layout/logo'
import { NavbarDesktop } from '~/app/_components/layout/nav/navbar-desktop'
import { NavbarMobile } from '~/app/_components/layout/nav/navbar-mobile'
import { useNavbar } from '~/app/_components/layout/nav/use-navbar'
import { homeLinkOptions } from '~/app/(app)/_validations/app-link-options'
import { config } from '~/config'

const AppNavbar = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { theme, setTheme } = useTheme()
  const shouldShowThemeChangeAnimation = !useIsMobile()
  const { isMobileMenuOpen } = useNavbar()

  return (
    <div
      data-slot="navbar"
      data-open={isMobileMenuOpen}
      className={cn(
        'mx-auto my-0 flex h-full max-w-(--breakpoint-xl) items-center justify-between px-2 **:data-[slot="separator"]:h-6 **:data-[slot="separator"]:self-center sm:px-6',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <NavbarMobile className="sm:hidden" />
        <Link {...homeLinkOptions({ withLabel: true })} className="w-fit">
          <Logo aria-hidden="true" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <NavbarDesktop className="hidden sm:block" />
        <Separator orientation="vertical" className="hidden sm:block" />
        <ThemeSwitcherToggle
          themes={config.themes}
          defaultValue={config.themeDefault}
          onChange={setTheme}
          value={theme}
          labelToggle="Toggle theme"
          enableAnimation={shouldShowThemeChangeAnimation}
          className="hidden lg:block"
        />
        <ThemeSwitcherSwap
          themes={config.themes}
          defaultValue={config.themeDefault}
          onChange={setTheme}
          value={theme}
          buttonVariant="ghost"
          labelToggle="Toggle theme"
          enableAnimation={shouldShowThemeChangeAnimation}
          className="-mx-1 lg:hidden"
        />
      </div>
    </div>
  )
}

export { AppNavbar }
