// Usage: node validate-gltf.cjs <absolute gltf-validator package directory>
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const validator = require(process.argv[2])
const root = path.resolve(__dirname, '..')
const bytes = fs.readFileSync(path.join(root, 'aster-configurator.glb'))
validator.validateBytes(new Uint8Array(bytes), {
  uri: 'aster-configurator.glb', format: 'glb', maxIssues: 0,
}).then((report) => {
  report.assetSha256 = crypto.createHash('sha256').update(bytes).digest('hex')
  fs.mkdirSync(path.join(root, 'validation'), { recursive: true })
  fs.writeFileSync(path.join(root, 'validation/khronos-validator.json'), JSON.stringify(report, null, 2))
  const codes = {}
  for (const item of report.issues.messages) codes[item.code] = (codes[item.code] ?? 0) + 1
  console.log(JSON.stringify({ validator: validator.version(), errors: report.issues.numErrors,
    warnings: report.issues.numWarnings, infos: report.issues.numInfos, codes }, null, 2))
  process.exitCode = report.issues.numErrors ? 1 : 0
}).catch((error) => { console.error(error); process.exitCode = 1 })
