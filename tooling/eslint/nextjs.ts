import nextPlugin from '@next/eslint-plugin-next'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'

import { reactConfig } from '@workspace/eslint-config/react'

export const nextjsConfig = defineConfig(reactConfig, pluginReactRefresh.configs.next, {
  files: ['**/*.ts', '**/*.tsx'],
  plugins: {
    '@next/next': nextPlugin,
  },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
    // TypeError: context.getAncestors is not a function
    '@next/next/no-duplicate-head': 'off',
  },
})
