'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@workspace/ui/components/sheet'
import { cn } from '@workspace/ui/lib/utils'

import { Logo } from '~/app/_components/layout/logo'
import { navigationMobileLinks } from '~/app/_components/layout/nav/data'
import { useNavbar } from '~/app/_components/layout/nav/use-navbar'
import { homeLinkOptions } from '~/app/(app)/_validations/app-link-options'

const NavbarMobile = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useNavbar()
  const pathname = usePathname()

  // Automatically close the sheet when navigating to a new route
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname, setIsMobileMenuOpen])

  return (
    <div data-slot="navbar-mobile" className={cn(className)} {...props}>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" />}>
          <Menu />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-xs">
          <SheetHeader className="-mb-2">
            <SheetTitle>
              <Link {...homeLinkOptions({ withLabel: true })} className="w-fit">
                <Logo aria-hidden="true" />
              </Link>
            </SheetTitle>
          </SheetHeader>
          <Separator />
          <div
            data-slot="navbar-mobile-content"
            className={cn(
              'flex flex-col gap-1 [&_a]:p-4 [&_a]:text-base [&_a]:transition-all [&_a]:outline-none',
              '[&_a]:hover:bg-muted [&_a]:focus:bg-muted [&_a]:focus-visible:ring-ring/50 [&_a]:focus-visible:ring-3 [&_a]:focus-visible:outline-1',
              '[&_a.active]:bg-muted/50 [&_a.active]:hover:bg-muted [&_a.active]:focus:bg-muted',
            )}
          >
            {navigationMobileLinks.map((link) => (
              <Link key={link.label} {...link.linkOptions} className={link.className}>
                {link.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export { NavbarMobile }
