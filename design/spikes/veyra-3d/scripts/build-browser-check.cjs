// Build the isolated Veyra R3F validation harness using installed workspace packages.
const path = require('node:path')
const esbuild = require(process.argv[2])
const root = path.resolve(__dirname, '..')
const repo = path.resolve(root, '../../..')
esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'browser-check.tsx')],
  outfile: path.join(root, 'validation/browser-check.js'),
  bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic',
  nodePaths: [path.join(repo, 'apps/nextjs/node_modules')],
  define: { 'process.env.NODE_ENV': '"production"' },
})
console.log('Built isolated Veyra R3F check harness')
