import { defineConfig } from 'eslint/config'

import { baseConfig } from '@workspace/eslint-config/base'
import { nextjsConfig } from '@workspace/eslint-config/nextjs'

export default defineConfig(
  {
    ignores: ['.next/**'],
  },
  baseConfig,
  nextjsConfig,
)
