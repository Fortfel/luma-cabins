// Usage: node validate-gltf.cjs <absolute gltf-validator package path>
// This combines Khronos validation with Veyra's delivery/material contracts.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const validator = require(process.argv[2])
const root = path.resolve(process.argv[3] ?? path.join(__dirname, '..'))
const assetPath = path.join(root, 'veyra-configurator.glb')
const bytes = fs.readFileSync(assetPath)
const assetSha256 = crypto.createHash('sha256').update(bytes).digest('hex')

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
}

function parseGlb(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2) {
    throw new Error('Not a glTF 2.0 binary asset')
  }
  const jsonLength = buffer.readUInt32LE(12)
  return JSON.parse(
    buffer
      .subarray(20, 20 + jsonLength)
      .toString('utf8')
      .trim(),
  )
}

function isMatrix(value) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((row) => Array.isArray(row) && row.length === 4 && row.every(Number.isFinite))
  )
}

function close(a, b, tolerance = 1e-5) {
  return Math.abs(a - b) <= tolerance
}

function addFailure(failures, issue, details = {}) {
  failures.push({ issue, ...details })
}

function contractChecks(doc) {
  const failures = []
  const notices = []
  const presets = readJson('veyra-presets.json')
  const camera = readJson('veyra-camera.json')
  const delivery = readJson('veyra-delivery.json')
  const materialNames = new Set((doc.materials ?? []).map((material) => material.name))
  const materials = new Map((doc.materials ?? []).map((material, index) => [material.name, { material, index }]))
  const meshes = doc.meshes ?? []
  const nodes = doc.nodes ?? []
  const images = doc.images ?? []
  const textures = doc.textures ?? []

  for (const name of ['ExteriorCladding', 'InteriorJoinery', 'Glazing']) {
    if (!materialNames.has(name)) addFailure(failures, 'missing required material', { name })
  }

  const nodesByMaterial = new Map()
  for (const node of nodes) {
    if (node.mesh === undefined || !meshes[node.mesh]) continue
    const used = new Set()
    for (const primitive of meshes[node.mesh].primitives ?? []) {
      if (primitive.material === undefined || !doc.materials[primitive.material]) continue
      used.add(doc.materials[primitive.material].name)
      const accessors = [primitive.indices, ...Object.values(primitive.attributes ?? {})].filter(
        (index) => index !== undefined,
      )
      for (const index of accessors)
        if (!doc.accessors?.[index]) addFailure(failures, 'invalid accessor reference', { node: node.name, index })
    }
    for (const name of used) {
      if (!nodesByMaterial.has(name)) nodesByMaterial.set(name, [])
      nodesByMaterial.get(name).push(node.name)
    }
    if (node.children)
      for (const child of node.children)
        if (!nodes[child]) addFailure(failures, 'invalid child node reference', { node: node.name, child })
  }

  const exteriorNodes = [...new Set(nodesByMaterial.get('ExteriorCladding') ?? [])].sort()
  const expectedExterior = ['Cladding_Front', 'Cladding_LeftGable', 'Cladding_Rear', 'Cladding_RightGable']
  if (JSON.stringify(exteriorNodes) !== JSON.stringify(expectedExterior)) {
    addFailure(failures, 'ExteriorCladding boundary is not exactly the four cladding objects', {
      actual: exteriorNodes,
      expected: expectedExterior,
    })
  }
  const interiorNodes = [...new Set(nodesByMaterial.get('InteriorJoinery') ?? [])].sort()
  if (!interiorNodes.length) addFailure(failures, 'InteriorJoinery has no runtime geometry')

  const excluded = nodes
    .map((node) => node.name)
    .filter((name) =>
      /Archive|ReviewStaging|(?:^|_)Lights?(?:_|$)|CanonicalCamera|InteriorReview|BedroomReview|GuitarDetail/.test(
        name,
      ),
    )
  if (excluded.length) addFailure(failures, 'archive, staging, light or review object exported', { objects: excluded })

  const glazing = materials.get('Glazing')?.material
  const glazingAlpha = glazing?.pbrMetallicRoughness?.baseColorFactor?.[3]
  if (!close(glazingAlpha, 0.085, 1e-6))
    addFailure(failures, 'Glazing alpha contract', { actual: glazingAlpha, expected: 0.085 })
  if (glazing?.alphaMode !== 'BLEND')
    addFailure(failures, 'Glazing alpha mode', { actual: glazing?.alphaMode, expected: 'BLEND' })

  const targetMaterials = ['ExteriorCladding', 'InteriorJoinery']
  for (const name of targetMaterials) {
    const material = materials.get(name)?.material
    const textureIndex = material?.pbrMetallicRoughness?.baseColorTexture?.index
    if (textureIndex === undefined || !textures[textureIndex])
      addFailure(failures, 'target material lacks embedded base-color map', { name })
    if (material?.normalTexture?.index !== undefined && !textures[material.normalTexture.index])
      addFailure(failures, 'invalid normal texture reference', { name })
    if (material?.occlusionTexture?.index !== undefined && !textures[material.occlusionTexture.index])
      addFailure(failures, 'invalid ORM texture reference', { name })
  }
  const semanticTextureRefs = new Map()
  for (const material of doc.materials ?? []) {
    for (const [semantic, entry] of [
      ['baseColor', material.pbrMetallicRoughness?.baseColorTexture],
      ['normal', material.normalTexture],
      ['occlusion', material.occlusionTexture],
    ]) {
      if (entry?.index === undefined) continue
      const key = `${entry.index}:${semantic}`
      semanticTextureRefs.set(key, true)
      const texture = textures[entry.index]
      if (texture?.source === undefined || !images[texture.source])
        addFailure(failures, 'texture source reference is invalid', {
          material: material.name,
          semantic,
          texture: entry.index,
        })
    }
  }
  if (images.length !== 7) addFailure(failures, 'embedded image count', { actual: images.length, expected: 7 })
  const externalImages = images.filter((image) => image.bufferView === undefined && image.uri)
  if (externalImages.length)
    addFailure(failures, 'default images are not fully embedded', {
      images: externalImages.map((image) => image.name ?? image.uri),
    })
  for (const image of images)
    if (image.bufferView === undefined && !image.uri)
      addFailure(failures, 'image has neither bufferView nor URI', { image: image.name })

  const actualTriangles = meshes.reduce(
    (sum, mesh) =>
      sum +
      (mesh.primitives ?? []).reduce(
        (inner, primitive) =>
          inner + (primitive.indices === undefined ? 0 : (doc.accessors[primitive.indices]?.count ?? 0) / 3),
        0,
      ),
    0,
  )
  const counts = {
    triangles: actualTriangles,
    meshes: meshes.length,
    nodes: nodes.length,
    materials: (doc.materials ?? []).length,
    embeddedImages: images.length,
  }
  for (const [key, actual] of Object.entries(counts)) {
    const expectedKey = key === 'embeddedImages' ? 'embedded_images' : key
    if (delivery.geometry?.[expectedKey] !== undefined && delivery.geometry[expectedKey] !== actual)
      addFailure(failures, 'declared delivery count mismatch', {
        key,
        actual,
        declared: delivery.geometry[expectedKey],
      })
  }
  if (delivery.embedded_images !== undefined && delivery.embedded_images !== images.length)
    addFailure(failures, 'declared embedded image count mismatch', {
      actual: images.length,
      declared: delivery.embedded_images,
    })
  if (doc.extensionsUsed?.includes('KHR_materials_unlit'))
    addFailure(failures, 'unlit extension is not allowed for this PBR delivery')
  if (doc.scenes?.[doc.scene ?? 0]?.nodes?.some((index) => !nodes[index]))
    addFailure(failures, 'scene contains an invalid root node reference')

  const expectedGroups = { exterior: 'ExteriorCladding', interior: 'InteriorJoinery' }
  for (const [group, expectedMaterial] of Object.entries(expectedGroups)) {
    const config = presets.groups?.[group]
    if (!config || config.material !== expectedMaterial || config.presets?.length !== 3)
      addFailure(failures, 'preset group contract', { group })
    const ids = new Set((config?.presets ?? []).map((preset) => preset.id))
    if (ids.size !== 3 || !ids.has(presets.defaults?.[group]))
      addFailure(failures, 'preset IDs/default contract', { group, ids: [...ids] })
    for (const preset of config?.presets ?? []) {
      if (!Number.isFinite(preset.roughnessMultiplier) || preset.roughnessMultiplier <= 0)
        addFailure(failures, 'invalid roughness multiplier', { group, id: preset.id })
      if (preset.baseColorTexture?.source === 'external' && !preset.baseColorTexture.uri)
        addFailure(failures, 'external preset lacks URI', { group, id: preset.id })
      if (preset.id !== config.default && preset.baseColorTexture?.source === 'embedded-default')
        notices.push({ issue: 'non-default preset uses embedded cache', group, id: preset.id })
    }
  }
  const optionalFiles = new Map((delivery.optional_finish_files ?? []).map((item) => [item.path, item]))
  const textureFileIds = new Set()
  for (const item of presets.textureFiles ?? []) {
    const file = root && path.join(root, item.path)
    if (!fs.existsSync(file)) {
      addFailure(failures, 'optional texture missing', { file: item.path })
      continue
    }
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    if (actualHash !== item.sha256)
      addFailure(failures, 'optional texture checksum', { file: item.path, actualHash, expected: item.sha256 })
    if (optionalFiles.get(item.path)?.sha256 !== actualHash)
      addFailure(failures, 'delivery optional texture accounting', { file: item.path })
    const id = `${item.derived_from_material}:${item.path}`
    if (textureFileIds.has(id)) addFailure(failures, 'optional finish texture is not independent', { file: item.path })
    textureFileIds.add(id)
  }
  if (presets.textureSettings?.colorSpace !== 'srgb' || presets.textureSettings?.flipY !== false)
    addFailure(failures, 'replacement texture settings contract')
  for (const group of Object.values(presets.groups ?? {})) {
    for (const preset of group.presets ?? [])
      if (
        preset.baseColorTexture?.source === 'external' &&
        !textureFileIds.has(`${group.material}:${preset.baseColorTexture.uri}`)
      )
        addFailure(failures, 'external preset is not represented by an independent texture', { id: preset.id })
  }

  if (
    camera.matrixStorage !== 'row arrays' ||
    !isMatrix(camera.matrix_world_blender) ||
    !isMatrix(camera.matrix_world_gltf) ||
    !isMatrix(camera.projection_matrix)
  )
    addFailure(failures, 'camera row-matrix contract')
  if (
    camera.coordinateConvention?.blender !== '+Z up, -Y front' ||
    camera.coordinateConvention?.gltf !== '+Y up, +Z front' ||
    camera.coordinateConvention?.conversion !== '[x, y, z] Blender -> [x, z, -y] glTF'
  )
    addFailure(failures, 'camera coordinate convention')
  if (
    !camera.position_blender ||
    !camera.position_gltf ||
    !close(camera.position_gltf[0], camera.position_blender[0]) ||
    !close(camera.position_gltf[1], camera.position_blender[2]) ||
    !close(camera.position_gltf[2], -camera.position_blender[1])
  )
    addFailure(failures, 'camera position conversion')
  if (
    !close(camera.matrix_world_gltf?.[0]?.[3], camera.position_gltf?.[0]) ||
    !close(camera.matrix_world_gltf?.[1]?.[3], camera.position_gltf?.[1]) ||
    !close(camera.matrix_world_gltf?.[2]?.[3], camera.position_gltf?.[2])
  )
    addFailure(failures, 'camera matrix translation')
  if (
    camera.lens_mm !== 73 ||
    camera.sensor_width_mm !== 36 ||
    camera.sensor_fit !== 'HORIZONTAL' ||
    camera.shift_x !== 0 ||
    !close(camera.shift_y, -0.012, 1e-6)
  )
    addFailure(failures, 'canonical camera projection settings')

  return {
    passed: failures.length === 0,
    failures,
    notices,
    counts,
    exteriorNodes,
    interiorJoineryObjects: interiorNodes.length,
    semanticTextureRefs: semanticTextureRefs.size,
  }
}

validator
  .validateBytes(new Uint8Array(bytes), { uri: 'veyra-configurator.glb', format: 'glb', maxIssues: 0 })
  .then((report) => {
    const contract = contractChecks(parseGlb(bytes))
    report.assetSha256 = assetSha256
    report.passed = report.issues.numErrors === 0 && contract.passed
    report.contract = contract
    fs.mkdirSync(path.join(root, 'validation'), { recursive: true })
    fs.writeFileSync(path.join(root, 'validation/khronos-validator.json'), JSON.stringify(report, null, 2))
    const codes = {}
    for (const item of report.issues.messages) codes[item.code] = (codes[item.code] ?? 0) + 1
    console.log(
      JSON.stringify(
        {
          validator: validator.version(),
          assetSha256,
          passed: report.passed,
          errors: report.issues.numErrors,
          warnings: report.issues.numWarnings,
          infos: report.issues.numInfos,
          contractFailures: contract.failures.length,
          codes,
        },
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
