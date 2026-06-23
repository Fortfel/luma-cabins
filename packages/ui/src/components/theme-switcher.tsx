'use client'

import type * as React from 'react'

import { useCallback, useRef } from 'react'

import { motion } from 'motion/react'
import { flushSync } from 'react-dom'

import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { useControllableState } from '@workspace/ui/hooks/use-controllable-state'
import { useIsSSR } from '@workspace/ui/hooks/use-is-ssr'
import { cn } from '@workspace/ui/lib/utils'

interface Theme {
  key: string
  icon: React.ComponentType<React.ComponentProps<'svg'>>
  label: string
  ariaLabel: string
}

type ButtonVariants = Pick<React.ComponentProps<typeof Button>, 'variant'>['variant']
type ButtonSizes = Pick<React.ComponentProps<typeof Button>, 'size'>['size']

interface ThemeSwitcherProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  themes: Array<Theme>
  defaultValue: string
  value?: string
  onChange?: (value: string) => void
  labelToggle: string
  enableAnimation?: boolean
  animationDuration?: number
}

type ThemeSwitcherToggleProps = ThemeSwitcherProps

interface ThemeSwitcherDropdownProps extends ThemeSwitcherProps {
  resolvedTheme?: string
  buttonVariant?: ButtonVariants
  buttonSize?: ButtonSizes
}

interface ThemeSwitcherSwapProps extends ThemeSwitcherProps {
  buttonVariant?: ButtonVariants
  buttonSize?: ButtonSizes
}

// Utility function to check if View Transitions API is supported
const supportsViewTransitions = () => {
  const hasAPI = typeof document !== 'undefined' && 'startViewTransition' in document
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return hasAPI && !isReducedMotion
}

// Hook for handling animated theme changes
// CSS needed for animation is added in global style.css
// @see https://magicui.design/docs/components/animated-theme-toggler
const useAnimatedThemeChange = (enableAnimation = false, animationDuration = 700) => {
  const animateThemeChange = useCallback(
    async (themeChangeCallback: () => void, element: HTMLElement | null) => {
      if (!enableAnimation || !supportsViewTransitions() || !element) {
        // Fallback to immediate change if animation is disabled or unsupported
        themeChangeCallback()
        return
      }

      try {
        // Start the view transition
        await document.startViewTransition(() => {
          flushSync(() => {
            themeChangeCallback()
          })
        }).ready

        // Calculate starting position for circular animation
        const { top, left, width, height } = element.getBoundingClientRect()
        const x = left + width / 2
        const y = top + height / 2
        const maxRadius = Math.hypot(Math.max(left, window.innerWidth - left), Math.max(top, window.innerHeight - top))

        // Animate the circular reveal
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x.toString()}px ${y.toString()}px)`,
              `circle(${maxRadius.toString()}px at ${x.toString()}px ${y.toString()}px)`,
            ],
          },
          {
            duration: animationDuration,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      } catch (error) {
        // Fallback if animation fails
        console.warn('Theme animation failed, falling back to immediate change:', error)
        themeChangeCallback()
      }
    },
    [enableAnimation, animationDuration],
  )

  return { animateThemeChange }
}

// https://www.kibo-ui.com/components/theme-switcher
const ThemeSwitcherToggle = ({
  themes,
  defaultValue,
  value,
  onChange,
  labelToggle,
  enableAnimation = true,
  animationDuration = 700,
  className,
  ...props
}: ThemeSwitcherToggleProps) => {
  const [theme, setTheme] = useControllableState({
    defaultProp: defaultValue,
    prop: value,
    onChange,
  })
  const isSSR = useIsSSR()
  const { animateThemeChange } = useAnimatedThemeChange(enableAnimation, animationDuration)

  const buttonRefs = useRef<Map<string, HTMLButtonElement> | null>(null)
  // Lazy initialization of the button map
  const getButtonMap = useCallback(() => (buttonRefs.current ??= new Map<string, HTMLButtonElement>()), [])

  const handleThemeClick = useCallback(
    (themeKey: string) => {
      void animateThemeChange(
        () => {
          setTheme(themeKey)
        },
        getButtonMap().get(themeKey) ?? null,
      )
    },
    [animateThemeChange, getButtonMap, setTheme],
  )

  return (
    <div
      data-slot="theme-switcher-toggle"
      className={cn(
        'relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border [&_div]:inset-0 [&_div]:rounded-full [&_div]:bg-secondary [&_svg]:z-10 [&_svg]:m-auto [&_svg]:size-4 [&>button]:size-6 [&>button]:rounded-full',
        className,
      )}
      aria-label={labelToggle}
      role="radiogroup"
      tabIndex={-1}
      {...props}
    >
      {themes.map(({ key, icon: Icon, ariaLabel }) => {
        // Prevent hydration mismatch
        const isActive = !isSSR && theme === key

        return (
          <Button
            ref={(node) => {
              if (!node) return

              const buttonMap = getButtonMap()
              buttonMap.set(key, node)

              return () => {
                buttonMap.delete(key)
              }
            }}
            variant="ghost"
            size="icon"
            aria-checked={isActive}
            aria-label={ariaLabel}
            key={key}
            onClick={() => handleThemeClick(key)}
            role="radio"
            type="button"
            className="relative"
          >
            {isActive ? (
              <motion.div
                className="absolute"
                layoutId="activeTheme"
                transition={{ type: 'spring', duration: 0.5 }}
                aria-hidden="true"
              />
            ) : null}
            <Icon
              className={cn('relative size-4', isActive ? 'text-foreground' : 'text-muted-foreground')}
              aria-hidden="true"
            />
          </Button>
        )
      })}
    </div>
  )
}

function ThemeSwitcherDropdown({
  themes,
  defaultValue,
  value,
  onChange,
  labelToggle,
  resolvedTheme,
  buttonVariant = 'outline',
  buttonSize = 'icon',
  enableAnimation = true,
  animationDuration = 700,
  className,
  ...props
}: ThemeSwitcherDropdownProps) {
  const [theme, setTheme] = useControllableState({
    defaultProp: defaultValue,
    prop: value,
    onChange,
  })
  const isSSR = useIsSSR()
  const { animateThemeChange } = useAnimatedThemeChange(enableAnimation, animationDuration)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleThemeClick = useCallback(
    (themeKey: string) => {
      void animateThemeChange(() => {
        setTheme(themeKey)
      }, buttonRef.current)
    },
    [setTheme, animateThemeChange],
  )

  // Use resolved theme when system is selected, otherwise use the selected theme
  const currentTheme = theme === 'system' && resolvedTheme ? resolvedTheme : theme

  return (
    <div data-slot="theme-switcher-dropdown" className={cn('[&_svg]:size-4.5', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button ref={buttonRef} variant={buttonVariant} size={buttonSize} aria-label={labelToggle} />}
        >
          {themes.map(({ key, icon: Icon }) => {
            const isActive = !isSSR && key === currentTheme

            return (
              <Icon
                key={key}
                className={cn('absolute size-4 transition-all', isActive ? 'scale-100 rotate-0' : 'scale-0 -rotate-90')}
                aria-hidden="true"
              />
            )
          })}
          {/* Need this div for proper positioning (all icons are absolute) */}
          <div></div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map(({ key, icon: Icon, label }) => (
            <DropdownMenuItem key={key} onClick={() => handleThemeClick(key)}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ThemeSwitcherSwap({
  themes,
  defaultValue,
  value,
  onChange,
  labelToggle,
  buttonVariant = 'outline',
  buttonSize = 'icon',
  enableAnimation = true,
  animationDuration = 700,
  className,
  ...props
}: ThemeSwitcherSwapProps) {
  const [theme, setTheme] = useControllableState({
    defaultProp: defaultValue,
    prop: value,
    onChange,
  })
  const { animateThemeChange } = useAnimatedThemeChange(enableAnimation, animationDuration)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const themeLight = themes.find((theme) => theme.key === 'light')
  const themeDark = themes.find((theme) => theme.key === 'dark')

  if (!themeLight || !themeDark) throw new Error('ThemeSwitcherSwap: Theme "light" or "dark" not found')

  const handleThemeClick = useCallback(
    (themeKey: string) => {
      void animateThemeChange(() => {
        setTheme(themeKey)
      }, buttonRef.current)
    },
    [setTheme, animateThemeChange],
  )

  return (
    <div data-slot="theme-switcher-swap" className={cn('[&_svg]:size-4.5', className)} {...props}>
      <Button
        ref={buttonRef}
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => handleThemeClick(theme === themeLight.key ? themeDark.key : themeLight.key)}
        aria-label={labelToggle}
      >
        <themeLight.icon
          className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          aria-hidden="true"
        />
        <themeDark.icon
          className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          aria-hidden="true"
        />
      </Button>
    </div>
  )
}

export { ThemeSwitcherToggle, ThemeSwitcherDropdown, ThemeSwitcherSwap }
export type { ThemeSwitcherProps, ThemeSwitcherToggleProps, ThemeSwitcherDropdownProps, ThemeSwitcherSwapProps }
