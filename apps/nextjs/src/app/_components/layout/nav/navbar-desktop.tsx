'use client'

import type * as React from 'react'
import Link from 'next/link'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@workspace/ui/components/navigation-menu'
import { cn } from '@workspace/ui/lib/utils'

import { navigationDesktopLinks } from '~/app/_components/layout/nav/data'

const NavbarDesktop = ({
  className,
  ...props
}: React.ComponentProps<'div'> & {
  viewport?: boolean
}) => {
  return (
    <div data-slot="navbar-desktop" className={cn(className)} {...props}>
      <NavigationMenu>
        <NavigationMenuList>
          {navigationDesktopLinks.map((link) => (
            <NavigationMenuItem key={link.label}>
              <NavigationMenuLink
                render={<Link {...link.linkOptions} />}
                className={cn(
                  'text-primary-foreground hover:bg-primary-foreground/5 focus-visible:bg-primary-foreground/5 px-[clamp(0.75rem,calc(0rem+1.5625vw),1rem)] text-[clamp(0.875rem,calc(0.5rem+0.78125vw),1rem)] font-medium transition-colors focus:bg-transparent',
                  link.className,
                )}
              >
                {link.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

export { NavbarDesktop }
