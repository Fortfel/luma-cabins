'use client'

import * as React from 'react'

import { ChevronDown, Languages } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'

interface LanguageSwitcherLanguage<TLocale extends string = string> {
  readonly key: TLocale
  readonly label: string
  readonly href: string
}

type ButtonVariants = Pick<React.ComponentProps<typeof Button>, 'variant'>['variant']
type ButtonSizes = Pick<React.ComponentProps<typeof Button>, 'size'>['size']

interface LanguageSwitcherDropdownProps<TLocale extends string = string> extends React.ComponentProps<'div'> {
  languages: ReadonlyArray<LanguageSwitcherLanguage<TLocale>>
  currentLocale: TLocale
  labelToggle: string
  buttonVariant?: ButtonVariants
  buttonSize?: ButtonSizes
  // if true shows current locale key as switcher icon, default true
  localeCodeAsIcon?: boolean
  // if true shows arrow pointing down next to switcher icon, default true
  showArrow?: boolean
  // if true shows shortcut key next to language name, default true
  showShortcut?: boolean
  // if true shows radio bullets as prefix to language name, default true
  showRadioBullets?: boolean
}

interface LanguageSwitcherSimpleProps<TLocale extends string = string> extends React.ComponentProps<'div'> {
  languages: ReadonlyArray<LanguageSwitcherLanguage<TLocale>>
  currentLocale: TLocale
  labelToggle: string
  onLocalePrepare?: (locale: TLocale, event: React.SyntheticEvent<HTMLAnchorElement>) => void
  onLocaleSelect?: (locale: TLocale, event: React.MouseEvent<HTMLAnchorElement>) => void
  showSeparator?: boolean
  separator?: React.ReactNode
}

const defaultLanguageSwitcherSeparator = <Separator orientation="vertical" className="h-4 self-center!" />

function LanguageSwitcherSimple<TLocale extends string = string>({
  languages,
  currentLocale,
  labelToggle,
  onLocalePrepare,
  onLocaleSelect,
  showSeparator = true,
  separator = defaultLanguageSwitcherSeparator,
  className,
  ...props
}: LanguageSwitcherSimpleProps<TLocale>) {
  return (
    <div
      data-slot="language-switcher-simple"
      aria-label={labelToggle}
      className={cn('flex items-center justify-center gap-3', className)}
      {...props}
    >
      {languages.map(({ key, label, href }, index) => {
        const isActive = key === currentLocale

        return (
          <React.Fragment key={key}>
            <a
              href={href}
              hrefLang={key}
              aria-current={isActive ? 'page' : undefined}
              className={cn(isActive && 'active')}
              onAuxClick={(event) => onLocalePrepare?.(key, event)}
              onClick={(event) => onLocaleSelect?.(key, event)}
              onContextMenu={(event) => onLocalePrepare?.(key, event)}
              onPointerDown={(event) => onLocalePrepare?.(key, event)}
            >
              {label.toUpperCase()}
            </a>

            {showSeparator && index < languages.length - 1 && separator}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function LanguageSwitcherDropdown<TLocale extends string = string>({
  languages,
  currentLocale,
  labelToggle,
  buttonVariant = 'outline',
  buttonSize = 'icon',
  localeCodeAsIcon = true,
  showArrow = true,
  showShortcut = true,
  className,
  ...props
}: LanguageSwitcherDropdownProps<TLocale>) {
  return (
    <div
      data-slot="language-switcher-dropdown"
      className={cn('[&_svg]:size-4.5 [&>button]:font-normal', className)}
      {...props}
    >
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant={buttonVariant} size={buttonSize} aria-label={labelToggle} />}>
          {localeCodeAsIcon ? (
            <div aria-hidden="true">{currentLocale.toUpperCase()}</div>
          ) : (
            <Languages className="size-4" aria-hidden="true" />
          )}

          {showArrow && <ChevronDown className="-mr-1 -ml-2 size-4" aria-hidden="true" />}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {languages.map(({ key, label, href }) => {
            const isActive = key === currentLocale

            return (
              <DropdownMenuItem
                key={key}
                render={
                  <a href={href} hrefLang={key} aria-current={isActive ? 'page' : undefined} aria-label={label} />
                }
                className={cn(showShortcut && 'gap-8', isActive && 'active')}
              >
                <span>{label}</span>

                {showShortcut && <DropdownMenuShortcut>{key.toUpperCase()}</DropdownMenuShortcut>}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
export { LanguageSwitcherDropdown, LanguageSwitcherSimple }
export type { LanguageSwitcherDropdownProps, LanguageSwitcherLanguage, LanguageSwitcherSimpleProps }
