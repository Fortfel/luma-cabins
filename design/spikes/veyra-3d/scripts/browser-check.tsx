import { Canvas, useFrame } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type Group = 'exterior' | 'interior'
interface Preset { id: string; baseColorTexture: { source: string; uri?: string }; roughnessMultiplier: number }
interface Manifest { groups: Record<Group, { material: string; default: string; presets: Array<Preset> }>; defaults: Record<Group, string> }
interface CameraContract { matrix_world_gltf: Array<Array<number>>; projection_matrix: Array<Array<number>>; target_gltf: Array<number>; defaults: Record<Group, string> }
interface Target { material: THREE.MeshStandardMaterial; map: THREE.Texture; roughness: number; baseline: string }

const groups: Array<Group> = ['exterior', 'interior']
const report: Record<string, unknown> = { status: 'loading', failures: [], checks: {} }
let output: (value: string) => void = () => undefined
let state: RootState
let asset: THREE.Group
let contract: CameraContract
let manifest: Manifest
let controls: OrbitControls
let canonicalMode = false
const guardedSizes = new Set<string>()
const targets = {} as Record<Group, Target>
const selected: Record<Group, string> = { exterior: 'natural-timber', interior: 'light-oak' }
const epochs: Record<Group, number> = { exterior: 0, interior: 0 }
const cache = new Map<string, Promise<THREE.Texture>>()
const clock = () => performance.now()
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
function publish() { output(JSON.stringify({ ...report, selected }, null, 2)) }
async function persist() {
  await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) })
}
function fingerprint(material: THREE.MeshStandardMaterial) {
  return JSON.stringify({ color: material.color.toArray(), metalness: material.metalness, roughness: material.roughness,
    map: material.map?.uuid, normal: material.normalMap?.uuid, normalScale: material.normalScale.toArray(),
    orm: material.roughnessMap?.uuid, alpha: material.opacity, transparent: material.transparent, side: material.side,
    emissive: material.emissive.toArray(), type: material.type })
}
function assert(value: unknown, message: string) {
  if (!value) throw new Error(message)
}
function rowMatrix(rows: Array<Array<number>>) {
  return new THREE.Matrix4().set(...rows.flat() as Parameters<THREE.Matrix4['set']>)
}
function canonicalProjection(aspect: number) {
  const projection = rowMatrix(contract.projection_matrix)
  const originalAspect = projection.elements[5] / projection.elements[0]
  const scaleY = aspect / originalAspect
  projection.elements[5] *= scaleY
  projection.elements[9] *= scaleY
  return projection
}
function applyCanonicalCamera(camera: THREE.PerspectiveCamera, size: { width: number; height: number }) {
  const world = rowMatrix(contract.matrix_world_gltf)
  const projection = canonicalProjection(size.width / size.height)
  world.decompose(camera.position, camera.quaternion, camera.scale)
  camera.matrixAutoUpdate = false
  camera.manual = true
  camera.near = 0.05
  camera.far = 300
  camera.aspect = size.width / size.height
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(1 / projection.elements[5]))
  camera.filmGauge = 36
  camera.filmOffset = 0
  camera.matrix.copy(world)
  camera.matrixWorld.copy(world)
  camera.matrixWorldInverse.copy(world).invert()
  camera.projectionMatrix.copy(projection)
  camera.projectionMatrixInverse.copy(projection).invert()
}
function matrixError(actual: THREE.Matrix4, expected: THREE.Matrix4) {
  return Math.max(...actual.elements.map((value, index) => Math.abs(value - expected.elements[index])))
}
function assertCanonicalCamera(size: { width: number; height: number }, label: string) {
  const camera = state.camera as THREE.PerspectiveCamera
  const expectedWorld = rowMatrix(contract.matrix_world_gltf)
  const expectedProjection = canonicalProjection(size.width / size.height)
  const worldError = matrixError(camera.matrixWorld, expectedWorld)
  const projectionError = matrixError(camera.projectionMatrix, expectedProjection)
  assert(worldError < 2e-5, `${label}: canonical world matrix overwritten (${worldError})`)
  assert(projectionError < 2e-5, `${label}: canonical projection matrix overwritten (${projectionError})`)
  assert(camera.manual === true, `${label}: R3F camera manual guard missing`)
  return { width: size.width, height: size.height, worldError, projectionError, fov: camera.fov, aspect: camera.aspect, manual: camera.manual }
}
function guardCanonicalFrame(size: { width: number; height: number }) {
  if (!canonicalMode || !contract) return
  const camera = state.camera as THREE.PerspectiveCamera
  applyCanonicalCamera(camera, size)
  const key = `${size.width.toFixed(2)}x${size.height.toFixed(2)}`
  if (guardedSizes.has(key)) return
  guardedSizes.add(key)
  const check = assertCanonicalCamera(size, `resize ${key}`)
  const entries = (report.cameraResizeChecks as Array<unknown> | undefined) ?? []
  report.cameraResizeChecks = [...entries, check]
  report.checks = { ...(report.checks as Record<string, unknown>), responsiveCanonicalCamera: true }
  publish()
  if (report.status === 'ready' || report.status === 'passed') void persist()
}
async function choose(group: Group, id: string) {
  const epoch = ++epochs[group]
  const target = targets[group]
  const preset = manifest.groups[group].presets.find((item) => item.id === id)
  if (!preset) throw new Error(`Unknown preset ${id}`)
  let map = target.map
  if (preset.baseColorTexture.source === 'external') {
    const uri = `/asset/${preset.baseColorTexture.uri}`
    if (!cache.has(uri)) cache.set(uri, new THREE.TextureLoader().loadAsync(uri).then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      for (const key of ['channel', 'wrapS', 'wrapT', 'magFilter', 'minFilter', 'anisotropy', 'rotation', 'matrixAutoUpdate'] as const) {
        Object.assign(texture, { [key]: target.map[key] })
      }
      texture.repeat.copy(target.map.repeat); texture.offset.copy(target.map.offset)
      texture.center.copy(target.map.center); texture.matrix.copy(target.map.matrix)
      texture.needsUpdate = true
      return texture
    }))
    map = await cache.get(uri) as THREE.Texture
  }
  if (epochs[group] !== epoch) return
  target.material.map = map
  target.material.roughness = target.roughness * preset.roughnessMultiplier
  target.material.needsUpdate = true
  selected[group] = id
  state.invalidate()
  publish()
}
function view(name: string) {
  const camera = state.camera as THREE.PerspectiveCamera
  if (name === 'Canonical') {
    canonicalMode = true
    controls.enabled = false
    const size = state.get().size
    applyCanonicalCamera(camera, size)
    controls.target.fromArray(contract.target_gltf)
  } else {
    canonicalMode = false
    controls.enabled = true
    camera.matrixAutoUpdate = true
    camera.manual = true
    const poses: Record<string, { position: Array<number>; target: Array<number>; fov?: number; lens?: number }> = {
      Front: { position: [0, 4.1, 17], target: [0, 2.3, 0], fov: 42 },
      Left: { position: [-15, 5, 0], target: [0, 2.3, 0], fov: 42 },
      Rear: { position: [0, 5, -17], target: [0, 2.3, 0], fov: 42 },
      Right: { position: [15, 5, 0], target: [0, 2.3, 0], fov: 42 },
      Kitchen: { position: [-3.25, 1.95, 0.85], target: [-.65, 1.55, -1.12], lens: 25 },
      Roof: { position: [-7, 7.3, -6], target: [-2.7, 4.25, -1.0], fov: 42 },
      Bedroom: { position: [2.73, 1.92, 2.0], target: [4.42, 1.1, 0.5], lens: 21 },
    }
    const pose = poses[name]
    if (!pose) return
    camera.position.fromArray(pose.position); controls.target.fromArray(pose.target)
    camera.filmGauge = 36
    if (pose.lens) camera.setFocalLength(pose.lens)
    else if (pose.fov) camera.fov = pose.fov
    const size = state.get().size
    camera.aspect = size.width / size.height
    camera.updateProjectionMatrix(); camera.lookAt(controls.target)
  }
  camera.updateMatrixWorld(); controls.update(); state.invalidate()
  report.view = name; publish()
}
async function initialize(s: RootState) {
  state = s
  const start = clock()
  try {
    const [bytes, presets, cameraData] = await Promise.all([
      fetch('/asset/veyra-configurator.glb', { cache: 'no-store' }).then((response) => response.arrayBuffer()),
      fetch('/asset/veyra-presets.json', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/asset/veyra-camera.json', { cache: 'no-store' }).then((response) => response.json()),
    ])
    manifest = presets; contract = cameraData
    s.camera.manual = true
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    report.assetSha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
    const gltf = await new GLTFLoader().parseAsync(bytes, '/asset/')
    asset = gltf.scene
    assert(asset.position.length() === 0 && asset.scale.x === 1 && asset.scale.y === 1 && asset.scale.z === 1, 'GLB was recentered or rescaled')
    const mats = new Map<string, THREE.MeshStandardMaterial>()
    const materialUse = new Map<string, number>()
    asset.traverse((obj) => {
      if (obj instanceof THREE.Mesh) for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        const standard = material as THREE.MeshStandardMaterial
        mats.set(standard.name, standard)
        materialUse.set(standard.name, (materialUse.get(standard.name) ?? 0) + 1)
      }
    })
    for (const group of groups) {
      const original = mats.get(manifest.groups[group].material)
      assert(original?.map, `Missing target ${group}`)
      const material = (original as THREE.MeshStandardMaterial).clone()
      targets[group] = { material, map: material.map as THREE.Texture, roughness: material.roughness, baseline: fingerprint(material) }
      asset.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.material = Array.isArray(obj.material)
          ? obj.material.map((item) => item === original ? material : item) : obj.material === original ? material : obj.material
      })
      assert((materialUse.get(manifest.groups[group].material) ?? 0) > 0, `Unused target ${group}`)
    }
    s.scene.add(asset)
    s.scene.background = new THREE.Color('#f7f5f0')
    const pmrem = new THREE.PMREMGenerator(s.gl)
    const room = new RoomEnvironment()
    s.scene.environment = pmrem.fromScene(room).texture
    room.dispose(); pmrem.dispose()
    s.scene.environmentIntensity = 0.55
    s.scene.add(new THREE.HemisphereLight(0xffffff, 0xb2a48a, 1.2))
    for (const [x, y, z, power] of [[-5, 10, 8, 3], [6, 7, 3, 1.5], [1, 9, -6, 2]]) {
      const light = new THREE.DirectionalLight(0xffffff, power); light.position.set(x, y, z); s.scene.add(light)
    }
    s.gl.toneMapping = THREE.AgXToneMapping; s.gl.outputColorSpace = THREE.SRGBColorSpace
    controls = new OrbitControls(s.camera, s.gl.domElement)
    controls.addEventListener('change', s.invalidate)
    view('Canonical')
    s.gl.render(s.scene, s.camera)
    report.status = 'ready'; report.readyMs = clock() - start
    report.assetBytes = bytes.byteLength; report.threeRevision = THREE.REVISION
    report.renderer = s.gl.getContext().getParameter(s.gl.getContext().RENDERER)
    report.layout = { width: s.get().size.width, height: s.get().size.height, dpr: s.get().viewport.dpr }
    report.render = { ...s.gl.info.render }; report.memory = { ...s.gl.info.memory }
    report.checks = { load: true, exactTargetMaterials: true, canonicalCamera: false, coordinateConvention: 'GLB +Y up / +Z front' }
    assertCanonicalCamera(s.get().size, 'initial rendered camera')
    report.checks = { ...(report.checks as Record<string, unknown>), canonicalCamera: true }
    publish(); await persist()
  } catch (error) { report.status = 'failed'; report.passed = false; report.error = String(error); publish(); await persist() }
}
async function runChecks() {
  try {
    assert(report.status === 'ready' || report.status === 'passed', 'Scene is not ready')
    report.status = 'checking'; publish()
    const fixed = new Map<THREE.MeshStandardMaterial, string>()
    const geometry = new Map<THREE.Mesh, THREE.BufferGeometry>()
    asset.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      geometry.set(obj, obj.geometry)
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        if (material !== targets.exterior.material && material !== targets.interior.material) fixed.set(material as THREE.MeshStandardMaterial, fingerprint(material as THREE.MeshStandardMaterial))
      }
    })
    const retained = groups.map((group) => [targets[group].material.normalMap, targets[group].material.roughnessMap])
    const combinations: Array<string> = []
    const pixelHashes: Array<number> = []
    const sampleTarget = new THREE.WebGLRenderTarget(256, 192)
    const pixels = new Uint8Array(256 * 192 * 4)
    view('Canonical')
    await nextFrame()
    state.gl.render(state.scene, state.camera)
    const beforeChecksCamera = assertCanonicalCamera(state.get().size, 'before finish checks')
    for (const exterior of manifest.groups.exterior.presets) for (const interior of manifest.groups.interior.presets) {
      await Promise.all([choose('exterior', exterior.id), choose('interior', interior.id)])
      await nextFrame(); state.gl.render(state.scene, state.camera)
      state.gl.setRenderTarget(sampleTarget); state.gl.render(state.scene, state.camera)
      state.gl.readRenderTargetPixels(sampleTarget, 0, 0, 256, 192, pixels); state.gl.setRenderTarget(null)
      let hash = 2166136261
      for (const value of pixels) hash = Math.imul(hash ^ value, 16777619) >>> 0
      pixelHashes.push(hash)
      for (const [material, snapshot] of fixed) assert(fingerprint(material) === snapshot, `Fixed material changed: ${material.name}`)
      for (const [mesh, original] of geometry) assert(mesh.geometry === original, 'Geometry changed during selection')
      for (const [index, group] of groups.entries()) {
        const material = targets[group].material
        assert(material.map?.colorSpace === THREE.SRGBColorSpace && material.map?.flipY === false, `Texture convention: ${group}`)
        assert(material.normalMap === retained[index][0] && material.roughnessMap === retained[index][1], `Normal/ORM retained: ${group}`)
        const preset = group === 'exterior' ? exterior : interior
        assert(Math.abs(material.roughness - targets[group].roughness * preset.roughnessMultiplier) < 1e-7, 'Roughness compounded')
      }
      combinations.push(`${exterior.id}/${interior.id}`)
    }
    sampleTarget.dispose()
    assert(new Set(pixelHashes).size === 9, 'Finish combinations did not produce nine distinct rendered images')
    await Promise.all(groups.map((group) => choose(group, manifest.defaults[group])))
    assert(targets.exterior.material.map === targets.exterior.map && targets.interior.material.map === targets.interior.map, 'Embedded default restore failed')
    assert(Math.abs(targets.exterior.material.roughness - targets.exterior.roughness) < 1e-7 && Math.abs(targets.interior.material.roughness - targets.interior.roughness) < 1e-7, 'Default roughness restore failed')
    view('Front')
    const frameTimes: Array<number> = []
    const camera = state.camera as THREE.PerspectiveCamera
    for (let index = 0; index < 120; index++) {
      const angle = index * Math.PI * 2 / 120
      camera.position.set(Math.sin(angle) * 16, 5, Math.cos(angle) * 16)
      camera.lookAt(0, 2.2, 0); camera.updateMatrixWorld()
      const start = clock(); state.gl.render(state.scene, camera); frameTimes.push(clock() - start)
      assert(state.gl.getContext().getError() === 0, `WebGL error at orbit frame ${index}`)
      await nextFrame()
    }
    view('Canonical')
    await nextFrame()
    state.gl.render(state.scene, state.camera)
    const afterOrbitCamera = assertCanonicalCamera(state.get().size, 'after orbit')
    report.status = 'passed'; report.passed = true; report.combinations = combinations; report.finishPixelHashes = pixelHashes
    report.fixedMaterialsChecked = fixed.size; report.geometryObjectsChecked = geometry.size; report.orbitFrames = frameTimes.length
    report.cpuSubmitMedianMs = frameTimes.sort((a, b) => a - b)[60]
    report.performanceNote = 'CPU render submission timing only, not GPU/mobile performance.'
    report.checks = { ...(report.checks as Record<string, unknown>), finishCombinations: 9, defaultRestore: true, textureConventions: true, fixedMaterialSnapshots: fixed.size, geometryIdentity: true, orbit: 120, webglErrors: 0, canonicalBeforeFinishChecks: beforeChecksCamera.projectionError < 2e-5, canonicalAfterOrbit: afterOrbitCamera.projectionError < 2e-5 }
    report.render = { ...state.gl.info.render }; report.memory = { ...state.gl.info.memory }
    publish(); await persist()
  } catch (error) { report.status = 'failed'; report.passed = false; report.error = String(error); publish(); await persist() }
}
function CameraGuard() {
  useFrame((frame) => guardCanonicalFrame(frame.size))
  return null
}
function App() {
  const [text, setText] = useState('Loading Veyra / React Three Fiber')
  output = setText
  return <main><h1>Veyra / isolated asset validation</h1>
    <div className="controls">{['Canonical', 'Front', 'Left', 'Rear', 'Right', 'Kitchen', 'Roof', 'Bedroom'].map((name) =>
      <button key={name} onClick={() => view(name)}>{name}</button>)}<button onClick={() => void runChecks()}>Run all checks</button></div>
    <div className="controls">{groups.flatMap((group) => manifest?.groups[group]?.presets.map((preset) => <button key={preset.id} onClick={() => void choose(group, preset.id)}>{preset.id}</button>) ?? [])}</div>
    <div id="view"><Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ near: 0.05, far: 300, fov: 11.5 }} onCreated={(created) => void initialize(created)} fallback={<p className="error">WebGL unavailable</p>}><CameraGuard /></Canvas></div>
    <pre aria-live="polite">{text}</pre></main>
}
const root = document.getElementById('root')
if (root) createRoot(root).render(<App />)
