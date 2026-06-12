'use client'

import type * as React from 'react'
import Link from 'next/link'

import { buttonVariants } from '@workspace/ui/components/button'
import { LanguageSwitcherSimple } from '@workspace/ui/components/language-switcher'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'

import { Logo } from '~/app/_components/layout/logo'
import { NavbarDesktop } from '~/app/_components/layout/nav/navbar-desktop'
import { NavbarMobile } from '~/app/_components/layout/nav/navbar-mobile'
import { useNavbar } from '~/app/_components/layout/nav/use-navbar'
import { contactLinkOptions, homeLinkOptions } from '~/app/(app)/_validations/app-link-options'

const AppNavbar = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { isMobile } = useNavbar()

  return (
    <div
      data-slot="navbar"
      className={cn(
        'mx-auto my-0 flex h-full items-center justify-between px-6 md:px-[clamp(1.25rem,calc(0rem+2.6042vw),2.5rem)]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Link {...homeLinkOptions({ withLabel: true })} className="w-fit">
          <Logo aria-hidden="true" />
        </Link>
      </div>

      <NavbarDesktop className="hidden md:block" />

      <div className="flex items-center gap-4 lg:gap-5">
        <LanguageSwitcherSimple
          languages={[
            { key: 'en', label: 'EN', href: '#' },
            { key: 'pl', label: 'PL', href: '#' },
          ]}
          currentLocale="en"
          labelToggle="Language switcher"
          showSeparator={true}
          separator={
            <>
              <Separator orientation="horizontal" className="bg-muted-foreground hidden md:max-lg:block" />
              <Separator
                orientation="vertical"
                className="bg-muted-foreground hidden h-5 rotate-30 self-center! lg:block"
              />
            </>
          }
          className={cn(
            'text-muted-foreground hidden h-7.5 gap-1 text-[13px] transition-colors',
            '[&>a:hover]:text-primary-foreground [&>a.active]:text-primary-foreground [&>a:hover]:underline',
            'md:flex md:flex-col',
            'lg:flex-row lg:[&>a:first-child]:self-start lg:[&>a:last-child]:self-end',
          )}
        />

        <Link
          {...contactLinkOptions()}
          className={cn(
            buttonVariants({ variant: 'default', size: 'default' }),
            'hidden h-12 px-[clamp(1.25rem,calc(1.0897rem+0.641vw),1.5rem)] font-bold min-[400px]:inline-flex',
          )}
        >
          Get started
        </Link>

        {isMobile && <NavbarMobile className="md:hidden" />}
      </div>
    </div>
  )
}

export { AppNavbar }
