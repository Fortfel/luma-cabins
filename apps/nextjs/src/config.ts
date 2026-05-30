import type * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

const THEMES = ['system', 'light', 'dark'] as const
type ThemeKey = (typeof THEMES)[number]

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon } as const satisfies Record<
  ThemeKey,
  React.ComponentType<React.ComponentProps<'svg'>>
>

const THEME_LABELS = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
} as const satisfies Record<ThemeKey, string>

export interface Theme {
  key: ThemeKey
  icon: React.ComponentType<React.ComponentProps<'svg'>>
  label: string
  ariaLabel: string
}

export interface Config {
  themes: Array<Theme>
  themeDefault: ThemeKey
  themeStorageKey: string
}

export const config = {
  themes: THEMES.map((theme) => ({
    key: theme,
    icon: THEME_ICONS[theme],
    label: THEME_LABELS[theme],
    ariaLabel: `Switch to ${THEME_LABELS[theme]} theme`,
  })),
  themeDefault: 'system',
  themeStorageKey: 'app-theme',
} as const satisfies Config
