import './src/env'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ['@workspace/ui'],
  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
  reactCompiler: true,
}

export default nextConfig
