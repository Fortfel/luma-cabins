'use client'

import type * as React from 'react'

import Link from 'next/link'

import { buttonVariants } from '@workspace/ui/components/button'
import { LanguageSwitcherSimple } from '@workspace/ui/components/language-switcher'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'

import { contactLinkOptions, homeLinkOptions } from '~/app/(app)/_validations/app-link-options'
import { Logo } from '~/app/_components/layout/logo'
import { NavbarDesktop } from '~/app/_components/layout/nav/navbar-desktop'
import { NavbarMobile } from '~/app/_components/layout/nav/navbar-mobile'
import { useNavbar } from '~/app/_components/layout/nav/use-navbar'

const AppNavbar = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { isMobile } = useNavbar()

  return (
    <div
      data-slot="navbar"
      className={cn(
        'mx-auto flex h-full items-center justify-between border-none bg-transparent px-6 text-inherit backdrop-blur-2xl transition-[background-color,backdrop-filter,color] duration-400 ease-out',
        'md:rounded-md md:px-[clamp(1.25rem,calc(0rem+2.6042vw),2.5rem)]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Link {...homeLinkOptions({ withLabel: true })} className="w-fit">
          <Logo
            aria-hidden="true"
            className="text-primary-foreground duration-400 ease-out group-data-[scrolled=true]/navbar-wrapper:text-foreground"
          />
        </Link>
      </div>

      <NavbarDesktop
        className={cn(
          'hidden md:block',
          '**:data-[slot=navigation-menu-link]:duration-400 **:data-[slot=navigation-menu-link]:ease-out',
          'group-data-[scrolled=true]/navbar-wrapper:**:data-[slot=navigation-menu-link]:text-foreground group-data-[scrolled=true]/navbar-wrapper:**:data-[slot=navigation-menu-link]:hover:bg-primary/5 group-data-[scrolled=true]/navbar-wrapper:**:data-[slot=navigation-menu-link]:focus-visible:bg-primary/5',
        )}
      />

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
              <Separator orientation="horizontal" className="hidden bg-muted-foreground md:max-lg:block" />
              <Separator
                orientation="vertical"
                className="hidden h-5 rotate-30 self-center! bg-muted-foreground lg:block"
              />
            </>
          }
          className={cn(
            'hidden h-7.5 gap-1 text-[13px] text-primary-foreground/50 transition-colors duration-400 ease-out',
            '[&>a.active]:text-primary-foreground [&>a:hover]:text-primary-foreground [&>a:hover]:underline',
            'group-data-[scrolled=true]/navbar-wrapper:text-foreground/60',
            'group-data-[scrolled=true]/navbar-wrapper:[&>a.active]:text-foreground group-data-[scrolled=true]/navbar-wrapper:[&>a:hover]:text-foreground',
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

        {isMobile && (
          <NavbarMobile
            className={cn(
              'md:hidden',
              '**:data-[slot=sheet-trigger]:duration-400 **:data-[slot=sheet-trigger]:ease-out',
              'group-data-[scrolled=true]/navbar-wrapper:**:data-[slot=sheet-trigger]:text-foreground group-data-[scrolled=true]/navbar-wrapper:**:data-[slot=sheet-trigger]:hover:bg-primary/5!  group-data-[scrolled=true]/navbar-wrapper:**:data-[slot=sheet-trigger]:hover:text-foreground',
            )}
          />
        )}
      </div>
    </div>
  )
}

export { AppNavbar }
