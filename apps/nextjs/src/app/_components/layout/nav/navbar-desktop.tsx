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
                render={
                  <Link
                    {...link.linkOptions}
                    // Blur the link after clicking to remove focus styles
                    onClick={(e) => {
                      e.currentTarget.blur()
                    }}
                  />
                }
                className={cn(link.className)}
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
