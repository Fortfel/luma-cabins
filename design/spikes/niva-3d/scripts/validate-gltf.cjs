// Usage: node validate-gltf.cjs <absolute gltf-validator package directory> [package directory]
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const validator = require(process.argv[2])
const root = path.resolve(process.argv[3] ?? path.join(__dirname, '..'))
const bytes = fs.readFileSync(path.join(root, 'niva-configurator.glb'))
const doc = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'))

validator
  .validateBytes(new Uint8Array(bytes), { uri: 'niva-configurator.glb', format: 'glb', maxIssues: 0 })
  .then((report) => {
    const failures = []
    try {
      assert.equal(doc.images.length, 8)
      assert.ok(doc.images.every((image) => Number.isInteger(image.bufferView) && !image.uri))
      assert.ok(!doc.cameras?.length && !doc.animations?.length)
      for (const name of ['ExteriorCladding', 'InteriorJoinery', 'Glazing', 'FixedInteriorLining']) {
        assert.ok(
          doc.materials.some((material) => material.name === name),
          `Missing material: ${name}`,
        )
      }
      const presets = JSON.parse(fs.readFileSync(path.join(root, 'niva-presets.json'), 'utf8'))
      for (const item of presets.textureFiles) {
        const texture = fs.readFileSync(path.join(root, item.path))
        assert.equal(crypto.createHash('sha256').update(texture).digest('hex'), item.sha256)
        assert.equal(texture.length, item.bytes)
      }
    } catch (error) {
      failures.push(error.message)
    }
    report.assetSha256 = crypto.createHash('sha256').update(bytes).digest('hex')
    report.passed = report.issues.numErrors === 0 && failures.length === 0
    report.contractFailures = failures
    fs.mkdirSync(path.join(root, 'validation'), { recursive: true })
    fs.writeFileSync(path.join(root, 'validation/khronos-validator.json'), JSON.stringify(report, null, 2))
    console.log(
      JSON.stringify(
        { passed: report.passed, errors: report.issues.numErrors, warnings: report.issues.numWarnings, failures },
        null,
        2,
      ),
    )
    process.exitCode = report.passed ? 0 : 1
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
