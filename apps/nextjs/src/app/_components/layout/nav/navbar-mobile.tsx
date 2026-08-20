'use client'

import type { LanguageSwitcherLanguage } from '@workspace/ui/components/language-switcher'
import type { NavigationLink } from '~/app/_components/layout/nav/data'
import type { Locale } from '~/i18n/routing'

import * as React from 'react'

import { Menu } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@workspace/ui/components/button'
import { LanguageSwitcherSimple } from '@workspace/ui/components/language-switcher'
import { Separator } from '@workspace/ui/components/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@workspace/ui/components/sheet'
import { cn } from '@workspace/ui/lib/utils'

import { homeLinkOptions } from '~/app/[locale]/(app)/_validations/app-link-options'
import { Logo } from '~/app/_components/layout/logo'

interface NavbarMobileProps extends React.ComponentProps<'div'> {
  readonly currentLocale: Locale
  readonly labelToggle: string
  readonly languages: ReadonlyArray<LanguageSwitcherLanguage<Locale>>
  readonly links: ReadonlyArray<NavigationLink>
  readonly menuAriaLabel: string
  readonly onLocalePrepare: (locale: Locale, event: React.SyntheticEvent<HTMLAnchorElement>) => void
  readonly onLocaleSelect: (locale: Locale, event: React.MouseEvent<HTMLAnchorElement>) => void
}

const NavbarMobile = ({
  currentLocale,
  labelToggle,
  languages,
  links,
  menuAriaLabel,
  onLocalePrepare,
  onLocaleSelect,
  className,
  ...props
}: NavbarMobileProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <div data-slot="navbar-mobile" className={cn(className)} {...props}>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="cursor-pointer rounded-full text-primary-foreground transition-colors hover:bg-primary-foreground/5! hover:text-primary-foreground"
            />
          }
        >
          <Menu className="size-5.5" />
          <span className="sr-only">{menuAriaLabel}</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-xs">
          <SheetHeader className="-mb-2">
            <SheetTitle>
              <Link
                {...homeLinkOptions({ withLabel: true, locale: currentLocale })}
                className="w-fit"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Logo aria-hidden="true" />
              </Link>
            </SheetTitle>
          </SheetHeader>
          <Separator />
          <div
            data-slot="navbar-mobile-content"
            className={cn(
              'flex flex-col gap-1 [&_a]:p-4 [&_a]:text-base [&_a]:transition-colors [&_a]:outline-none',
              '[&_a]:hover:bg-muted [&_a]:focus:bg-muted [&_a]:focus-visible:ring-3 [&_a]:focus-visible:ring-ring/50 [&_a]:focus-visible:outline-1',
              '[&_a.active]:bg-muted/50 [&_a.active]:hover:bg-muted [&_a.active]:focus:bg-muted',
            )}
          >
            {links.map((link) => (
              <Link
                key={link.label}
                {...link.linkOptions}
                className={cn(link.className, 'text-foreground')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Separator />
          <LanguageSwitcherSimple
            languages={languages}
            currentLocale={currentLocale}
            labelToggle={labelToggle}
            onLocalePrepare={onLocalePrepare}
            onLocaleSelect={onLocaleSelect}
            className="px-2 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:min-w-11 [&>a]:items-center [&>a]:justify-center [&>a]:rounded-md [&>a]:font-semibold [&>a]:outline-none [&>a]:focus-visible:ring-3 [&>a]:focus-visible:ring-ring/50 [&>a.active]:bg-muted"
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export { NavbarMobile }
