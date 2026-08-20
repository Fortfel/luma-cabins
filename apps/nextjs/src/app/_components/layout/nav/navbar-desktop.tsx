'use client'

import type * as React from 'react'
import type { NavigationLink } from '~/app/_components/layout/nav/data'

import Link from 'next/link'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@workspace/ui/components/navigation-menu'
import { cn } from '@workspace/ui/lib/utils'

const NavbarDesktop = ({
  links,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  links: ReadonlyArray<NavigationLink>
  viewport?: boolean
}) => {
  return (
    <div data-slot="navbar-desktop" className={cn(className)} {...props}>
      <NavigationMenu>
        <NavigationMenuList>
          {links.map((link) => (
            <NavigationMenuItem key={link.linkOptions.href}>
              <NavigationMenuLink
                render={<Link {...link.linkOptions} />}
                className={cn(
                  'px-[clamp(0.75rem,calc(0rem+1.5625vw),1rem)] text-[clamp(0.875rem,calc(0.5rem+0.78125vw),1rem)] font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/5 focus:bg-transparent focus-visible:bg-primary-foreground/5',
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
