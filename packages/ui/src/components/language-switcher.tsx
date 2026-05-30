'use client'

import type * as React from 'react'
import { useCallback } from 'react'
import { ChevronDown, Languages } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { cn } from '@workspace/ui/lib/utils'

interface Language {
  key: string
  label: string
}

type ButtonVariants = Pick<React.ComponentProps<typeof Button>, 'variant'>['variant']
type ButtonSizes = Pick<React.ComponentProps<typeof Button>, 'size'>['size']

interface LanguageSwitcherProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  languages: Array<Language>
  currentLocale: string
  onChange: (value: string) => void
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

function LanguageSwitcher({
  languages,
  currentLocale,
  onChange,
  labelToggle,
  buttonVariant = 'outline',
  buttonSize = 'icon',
  localeCodeAsIcon = true,
  showArrow = true,
  showShortcut = true,
  showRadioBullets = true,
  className,
  ...props
}: LanguageSwitcherProps) {
  const handleLanguageChange = useCallback(
    (languageKey: string) => {
      onChange(languageKey) // It ll reload the page
    },
    [onChange],
  )

  return (
    <div data-slot="language-switcher" className={cn('[&_svg]:size-4.5 [&>button]:font-normal', className)} {...props}>
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
          <DropdownMenuRadioGroup value={currentLocale} onValueChange={handleLanguageChange}>
            {languages.map(({ key, label }) => (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                className={cn(showShortcut && 'gap-8', !showRadioBullets && '[&>span:first-child]:hidden')}
              >
                <span className={cn(!showRadioBullets && '-ml-5')}>{label}</span>
                {showShortcut && <DropdownMenuShortcut>{key.toUpperCase()}</DropdownMenuShortcut>}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { LanguageSwitcher }
