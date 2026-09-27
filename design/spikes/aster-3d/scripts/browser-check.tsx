import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type Group = 'exterior' | 'interior'
interface Preset { id: string; baseColorTexture: { source: string; uri?: string }; roughnessMultiplier: number }
interface Manifest { groups: Record<Group, { material: string; presets: Array<Preset> }> }
interface Target { material: THREE.MeshStandardMaterial; map: THREE.Texture; roughness: number }
const groups: Array<Group> = ['exterior', 'interior']
const report: Record<string, unknown> = { status: 'loading', failures: [] }
let output: (value: string) => void = () => undefined
let state: RootState
let asset: THREE.Group
let contract: { matrix_world_gltf: Array<Array<number>>; projection_matrix: Array<Array<number>>; target_gltf: Array<number> }
let manifest: Manifest
let controls: OrbitControls
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
function fingerprint(m: THREE.MeshStandardMaterial) {
  return JSON.stringify({ color: m.color.toArray(), metalness: m.metalness, roughness: m.roughness,
    map: m.map?.uuid, normal: m.normalMap?.uuid, normalScale: m.normalScale.toArray(),
    orm: m.roughnessMap?.uuid, alpha: m.opacity, transparent: m.transparent, side: m.side,
    emissive: m.emissive.toArray(), type: m.type })
}
function assert(value: unknown, message: string) {
  if (!value) throw new Error(message)
}
async function choose(group: Group, id: string) {
  const epoch = ++epochs[group]
  const target = targets[group]
  const preset = manifest.groups[group].presets.find((p) => p.id === id)
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
    const matrix = new THREE.Matrix4().set(...contract.matrix_world_gltf.flat() as Parameters<THREE.Matrix4['set']>)
    matrix.decompose(camera.position, camera.quaternion, camera.scale)
    camera.projectionMatrix.set(...contract.projection_matrix.flat() as Parameters<THREE.Matrix4['set']>)
    const projection = camera.projectionMatrix.elements
    const originalAspect = projection[5] / projection[0]
    const size = state.get().size
    const aspect = size.width / size.height
    // Contain the authored frustum: wider diagnostic canvases must not crop the
    // roof/base, while portrait canvases retain the complete horizontal extent.
    const scaleX = Math.min(1, originalAspect / aspect)
    const scaleY = Math.min(1, aspect / originalAspect)
    projection[0] *= scaleX; projection[8] *= scaleX
    projection[5] *= scaleY; projection[9] *= scaleY
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    controls.target.fromArray(contract.target_gltf)
  } else {
    const poses: Record<string, [Array<number>, Array<number>]> = {
      Front: [[0, 4.1, 17], [0, 2.3, 0]], Left: [[-15, 5, 0], [0, 2.3, 0]],
      Rear: [[0, 5, -17], [0, 2.3, 0]], Right: [[15, 5, 0], [0, 2.3, 0]],
      Kitchen: [[-1.4, 2.05, 0.8], [0.55, 1.85, -1.6]],
      Roof: [[-7, 7.3, -6], [-2.7, 4.25, -1.0]],
      Chimney: [[-4.6, 4.8, -3.1], [-3.55, 4.0, -1.64]],
      Ridge: [[-5.7, 5.6, -1.7], [-4.35, 4.85, 0]],
      Eave: [[-5.3, 4.1, -3.4], [-4.36, 3.27, -2.53]],
      Bedroom: [[0.0, 2.4, -0.3], [-2.6, 1.4, 1.7]],
    }
    const pose = poses[name]
    if (!pose) return
    camera.position.fromArray(pose[0]); controls.target.fromArray(pose[1])
    camera.fov = name === 'Kitchen' || name === 'Bedroom' ? 70 : 42
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
      fetch('/asset/aster-configurator.glb', { cache: 'no-store' }).then((r) => r.arrayBuffer()),
      fetch('/asset/aster-presets.json', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/asset/aster-camera.json', { cache: 'no-store' }).then((r) => r.json()),
    ])
    manifest = presets; contract = cameraData
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    report.assetSha256 = [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('')
    const gltf = await new GLTFLoader().parseAsync(bytes, '/asset/')
    asset = gltf.scene
    const mats = new Map<string, THREE.MeshStandardMaterial>()
    asset.traverse((obj) => {
      if (obj instanceof THREE.Mesh) for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) mats.set(mat.name, mat)
    })
    for (const group of groups) {
      const original = mats.get(manifest.groups[group].material)
      assert(original?.map, `Missing target ${group}`)
      const material = (original as THREE.MeshStandardMaterial).clone()
      targets[group] = { material, map: material.map as THREE.Texture, roughness: material.roughness }
      asset.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.material = Array.isArray(obj.material)
          ? obj.material.map((m) => m === original ? material : m) : obj.material === original ? material : obj.material
      })
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
    s.gl.toneMapping = THREE.AgXToneMapping
    s.gl.outputColorSpace = THREE.SRGBColorSpace
    controls = new OrbitControls(s.camera, s.gl.domElement)
    controls.addEventListener('change', s.invalidate)
    view('Canonical')
    s.gl.render(s.scene, s.camera)
    report.status = 'ready'; report.readyMs = clock() - start
    report.assetBytes = bytes.byteLength; report.threeRevision = THREE.REVISION
    report.renderer = s.gl.getContext().getParameter(s.gl.getContext().RENDERER)
    report.render = { ...s.gl.info.render }; report.memory = { ...s.gl.info.memory }
    publish(); await persist()
  } catch (error) { report.status = 'failed'; report.error = String(error); publish(); await persist() }
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
      for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        if (m !== targets.exterior.material && m !== targets.interior.material) fixed.set(m, fingerprint(m))
      }
    })
    const retained = groups.map((g) => [targets[g].material.normalMap, targets[g].material.roughnessMap])
    const combinations: Array<string> = []
    const pixelHashes: Array<number> = []
    const sampleTarget = new THREE.WebGLRenderTarget(256, 192)
    const pixels = new Uint8Array(256 * 192 * 4)
    view('Canonical')
    for (const exterior of manifest.groups.exterior.presets) for (const interior of manifest.groups.interior.presets) {
      await Promise.all([choose('exterior', exterior.id), choose('interior', interior.id)])
      await nextFrame(); state.gl.render(state.scene, state.camera)
      state.gl.setRenderTarget(sampleTarget)
      state.gl.render(state.scene, state.camera)
      state.gl.readRenderTargetPixels(sampleTarget, 0, 0, 256, 192, pixels)
      state.gl.setRenderTarget(null)
      let hash = 2166136261
      for (const value of pixels) hash = Math.imul(hash ^ value, 16777619) >>> 0
      pixelHashes.push(hash)
      for (const [m, snapshot] of fixed) assert(fingerprint(m) === snapshot, `Fixed material changed: ${m.name}`)
      for (const [mesh, original] of geometry) assert(mesh.geometry === original, 'Geometry changed during selection')
      for (const [i, group] of groups.entries()) {
        const mat = targets[group].material
        assert(mat.map?.colorSpace === THREE.SRGBColorSpace && mat.map?.flipY === false, `Texture convention: ${group}`)
        assert(mat.normalMap === retained[i][0] && mat.roughnessMap === retained[i][1], `Normal/ORM retained: ${group}`)
        const preset = group === 'exterior' ? exterior : interior
        assert(Math.abs(mat.roughness - targets[group].roughness * preset.roughnessMultiplier) < 1e-7, 'Roughness compounded')
      }
      combinations.push(`${exterior.id}/${interior.id}`)
    }
    sampleTarget.dispose()
    assert(new Set(pixelHashes).size === 9, 'Finish combinations did not produce nine distinct rendered images')
    report.finishPixelHashes = pixelHashes
    await Promise.all([choose('exterior', 'charred-black-oil'), choose('exterior', 'natural-timber'), choose('interior', 'light-oak')])
    assert(targets.exterior.material.map === targets.exterior.map, 'Default exterior restore/race failed')
    assert(targets.interior.material.map === targets.interior.map, 'Default interior restore failed')
    view('Front')
    const frameTimes: Array<number> = []
    const camera = state.camera as THREE.PerspectiveCamera
    for (let i = 0; i < 120; i++) {
      const a = i * Math.PI * 2 / 120
      camera.position.set(Math.sin(a) * 16, 5, Math.cos(a) * 16)
      camera.lookAt(0, 2.2, 0); camera.updateMatrixWorld()
      const start = clock(); state.gl.render(state.scene, camera); frameTimes.push(clock() - start)
      assert(state.gl.getContext().getError() === 0, `WebGL error at orbit frame ${i}`)
      await nextFrame()
    }
    view('Canonical')
    report.status = 'passed'; report.combinations = combinations
    report.fixedMaterialsChecked = fixed.size; report.geometryObjectsChecked = geometry.size
    report.orbitFrames = frameTimes.length
    report.cpuSubmitMedianMs = frameTimes.sort((a, b) => a - b)[60]
    report.performanceNote = 'CPU render submission timing only, not GPU/mobile performance.'
    report.render = { ...state.gl.info.render }; report.memory = { ...state.gl.info.memory }
    publish(); await persist()
  } catch (error) { report.status = 'failed'; report.error = String(error); publish(); await persist() }
}
function App() {
  const [text, setText] = useState('Loading Aster / React Three Fiber')
  output = setText
  return <main><h1>Aster / isolated asset validation</h1>
    <div className="controls">{['Canonical', 'Front', 'Left', 'Rear', 'Right', 'Kitchen', 'Roof', 'Chimney', 'Ridge', 'Eave', 'Bedroom'].map((name) =>
      <button key={name} onClick={() => view(name)}>{name}</button>)}<button onClick={() => void runChecks()}>Run all checks</button>
      <button onClick={() => { state.gl.render(state.scene, state.camera); void fetch('/diagnostic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${report.view}-${selected.exterior}-${selected.interior}-${state.get().size.width}`,
          image: state.gl.domElement.toDataURL('image/png') }),
      }) }}>Save diagnostic view</button></div>
    <div className="controls">{groups.flatMap((group) => (group === 'exterior'
      ? ['natural-timber', 'whitewashed-timber', 'charred-black-oil'] : ['light-oak', 'warm-ash', 'dark-walnut'])
      .map((id) => <button key={id} onClick={() => void choose(group, id)}>{id}</button>))}</div>
    <div id="view"><Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ near: 0.1, far: 1000 }}
      onCreated={(s) => void initialize(s)} fallback={<p className="error">WebGL unavailable</p>} /></div>
    <pre aria-live="polite">{text}</pre></main>
}
const root = document.getElementById('root')
if (root) createRoot(root).render(<App />)
