import './src/env'
import type { NextConfig } from 'next'

import { canonicalRedirects, publicRewrites } from '@workspace/i18n/routes'

const nextConfig: NextConfig = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ['@workspace/i18n', '@workspace/ui'],
  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
  reactCompiler: true,
  experimental: { globalNotFound: true },
  allowedDevOrigins: ['192.168.0.100'],
  redirects: () => Promise.resolve(canonicalRedirects),
  rewrites: () => Promise.resolve({ beforeFiles: publicRewrites }),
}

export default nextConfig
