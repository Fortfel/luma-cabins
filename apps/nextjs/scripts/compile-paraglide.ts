import { fileURLToPath } from 'node:url'
import { compile } from '@inlang/paraglide-js'

import { paraglideUrlPatterns } from '@workspace/i18n/routes'

const project = fileURLToPath(new URL('../../../packages/i18n/project.inlang', import.meta.url))
const outdir = fileURLToPath(new URL('../src/paraglide', import.meta.url))

await compile({
  project,
  outdir,
  emitTsDeclarations: true,
  strategy: ['url', 'baseLocale'],
  trailingSlash: 'never',
  urlPatterns: paraglideUrlPatterns.map(({ pattern, localized }) => ({
    pattern,
    localized: localized.map(([locale, localizedPattern]) => [locale, localizedPattern]),
  })),
})
