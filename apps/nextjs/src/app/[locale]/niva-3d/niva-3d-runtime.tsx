'use client'

import type { ComponentRef, ReactNode, RefObject } from 'react'
import type { RootState } from '@react-three/fiber'
import type { BufferGeometry, Camera, Material, Object3D, Texture, WebGLRenderer } from 'three'

import {
  Component,
  Suspense,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import Image from 'next/image'
import { AgXToneMapping, Matrix4, Mesh, SRGBColorSpace, TextureLoader } from 'three'

import styles from './niva-3d-prototype.module.css'

const BACKGROUND_COLOR = '#f7f5f0'
const CANONICAL_ASPECT = 954 / 866
const CANONICAL_RESOLUTION = '954 x 866'
const POSTER_BYTES = 374_814
const CANONICAL_TARGET: [number, number, number] = [0, 3, 0.3]
const CANONICAL_POSITION: [number, number, number] = [-5.715943, 3.32287, 17.891865]
const GLB_TRIANGLES = 96_920
const GLB_MESHES = 478
const GLB_MATERIALS = 27
const GLB_TEXTURES = 8
const MODEL_LOAD_TIMEOUT_MS = 20_000
const CONFIGURATOR_ASSET = {
  label: 'Niva configurator',
  path: '/niva-3d/niva-configurator.glb',
  sizeBytes: 7_782_032,
  sizeLabel: '7.78 MB',
} as const
const PRESET_MANIFEST_URL = '/niva-3d/niva-presets.json'
const CANVAS_CAMERA_OPTIONS = {
  manual: true,
  near: 0.1,
  far: 1000,
  aspect: CANONICAL_ASPECT,
  position: CANONICAL_POSITION,
}
const CANVAS_GL_OPTIONS = {
  alpha: false,
  antialias: true,
  powerPreference: 'high-performance' as const,
  preserveDrawingBuffer: false,
}
const CANVAS_DPR: [number, number] = [1, 1.75]

interface DisposableTexture {
  readonly isTexture: true
  dispose: () => void
}

interface MeshLike extends Object3D {
  readonly geometry: BufferGeometry
  material: Material | Array<Material>
}

const readClock = () => performance.now()

const CANONICAL_WORLD_MATRIX_ROWS = [
  [0.95105654, 0.0053930911, -0.3089699447, -5.7159433365],
  [0.0000000053, 0.9998477101, 0.0174524244, 3.3228702545],
  [0.3090170026, -0.0165982433, 0.9509116411, 17.8918647766],
  [0, 0, 0, 1],
] as const

const CANONICAL_PROJECTION_ROWS = [
  [4.1402993202, 0, 0.153090477, 0],
  [0, 4.5610222816, -0.0356010534, 0],
  [0, 0, -1.000199914, -0.20002],
  [0, 0, -1, 0],
] as const

type FinishGroup = 'exterior' | 'interior'
type ExteriorPresetId = 'natural-timber' | 'whitewashed-timber' | 'charred-black-oil'
type InteriorPresetId = 'light-oak' | 'warm-ash' | 'dark-walnut'
type FinishPresetId = ExteriorPresetId | InteriorPresetId

interface FinishSelectionSnapshot {
  readonly exteriorId: ExteriorPresetId
  readonly interiorId: InteriorPresetId
}

let finishSelectionSnapshot: FinishSelectionSnapshot = {
  exteriorId: 'natural-timber',
  interiorId: 'light-oak',
}
const finishSelectionListeners = new Set<() => void>()

const finishSelectionStore = {
  getSnapshot: () => finishSelectionSnapshot,
  subscribe: (listener: () => void) => {
    finishSelectionListeners.add(listener)

    return () => finishSelectionListeners.delete(listener)
  },
}

function setFinishSelection(group: 'exterior', id: ExteriorPresetId): void
function setFinishSelection(group: 'interior', id: InteriorPresetId): void
function setFinishSelection(group: FinishGroup, id: FinishPresetId) {
  const nextSnapshot =
    group === 'exterior'
      ? { ...finishSelectionSnapshot, exteriorId: id as ExteriorPresetId }
      : { ...finishSelectionSnapshot, interiorId: id as InteriorPresetId }

  if (
    nextSnapshot.exteriorId === finishSelectionSnapshot.exteriorId &&
    nextSnapshot.interiorId === finishSelectionSnapshot.interiorId
  ) {
    return
  }

  finishSelectionSnapshot = nextSnapshot
  finishSelectionListeners.forEach((listener) => listener())
}

interface PresetDefinition {
  readonly id: FinishPresetId
  readonly label: string
  readonly baseColorTexture: {
    readonly source: 'embedded-default' | 'external'
    readonly uri?: string
  }
  readonly roughnessMultiplier: number
}

interface PresetGroup {
  readonly material: 'ExteriorCladding' | 'InteriorJoinery'
  readonly default: FinishPresetId
  readonly presets: ReadonlyArray<PresetDefinition>
}

interface PresetManifest {
  readonly defaults: {
    readonly exterior: ExteriorPresetId
    readonly interior: InteriorPresetId
  }
  readonly groups: {
    readonly exterior: PresetGroup
    readonly interior: PresetGroup
  }
}

interface PresetMaterial extends Material {
  map: Texture | null
  roughness: number
}

interface PreparedMaterialTarget {
  readonly material: PresetMaterial
  readonly originalMap: Texture | null
  readonly baselineRoughness: number
  requestVersion: number
}

interface PreparedMaterialTargets {
  readonly exterior: PreparedMaterialTarget
  readonly interior: PreparedMaterialTarget
}

type FinishTextureState = 'idle' | 'loading' | 'ready' | 'error'

interface FinishRuntimeStatus {
  readonly state: FinishTextureState
  readonly label: string
  readonly resourceMs: number | null
  readonly transferredBytes: number | null
}

const finishTexturePromises = new Map<string, Promise<Texture>>()
const finishTextureCache = new Map<string, Texture>()
const externalFinishTextures = new Set<DisposableTexture>()

interface SceneStats {
  readonly loadMs: number
  readonly resourceMs: number | null
  readonly transferredBytes: number | null
  readonly drawCalls: number | null
  readonly triangles: number
  readonly meshes: number
  readonly geometries: number
  readonly rendererGeometries: number
  readonly textures: number
  readonly rendererTextures: number
  readonly materials: number
  readonly programs: number | null
}

interface NivaModelProps {
  readonly url: string
  readonly loadStartedAt: number
  readonly manifest: PresetManifest | null
  readonly onReady: (stats: SceneStats) => void
  readonly onError: () => void
  readonly onFinishStatus: (group: FinishGroup, status: FinishRuntimeStatus) => void
}

interface NivaSceneProps {
  readonly modelKey: string
  readonly url: string
  readonly loadStartedAt: number | null
  readonly manifest: PresetManifest | null
  readonly isInteractive: boolean
  readonly controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>
  readonly onReady: (stats: SceneStats) => void
  readonly onError: () => void
  readonly onFinishStatus: (group: FinishGroup, status: FinishRuntimeStatus) => void
}

interface SceneErrorBoundaryProps {
  readonly children: ReactNode
  readonly onError: () => void
}

interface SceneErrorBoundaryState {
  readonly hasError: boolean
}

class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(_error: Error) {
    this.props.onError()
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}

export function NivaRuntime() {
  const finishSelection = useSyncExternalStore(
    finishSelectionStore.subscribe,
    finishSelectionStore.getSnapshot,
    finishSelectionStore.getSnapshot,
  )
  const [presetManifest, setPresetManifest] = useState<PresetManifest | null>(null)
  const [presetError, setPresetError] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [is3DActive, setIs3DActive] = useState(false)
  const [sceneError, setSceneError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [stats, setStats] = useState<SceneStats | null>(null)
  const [loadStartedAt, setLoadStartedAt] = useState<number | null>(null)
  const [finishStatus, setFinishStatus] = useState<Record<FinishGroup, FinishRuntimeStatus>>({
    exterior: {
      state: 'ready',
      label: 'Natural Timber',
      resourceMs: null,
      transferredBytes: 0,
    },
    interior: {
      state: 'ready',
      label: 'Light Oak',
      resourceMs: null,
      transferredBytes: 0,
    },
  })
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)
  const asset = CONFIGURATOR_ASSET
  const modelKey = `${asset.path}:${retryCount}`
  const isInteractive = isReady && (isMobile !== true || is3DActive)
  const showLiveScene = isReady && (isMobile !== true || is3DActive)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const updateViewport = () => setIsMobile(mediaQuery.matches)

    updateViewport()
    mediaQuery.addEventListener('change', updateViewport)

    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    void fetch(PRESET_MANIFEST_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Preset manifest request failed with ${response.status}`)

        return response.json() as Promise<PresetManifest>
      })
      .then((manifest) => {
        setPresetManifest(manifest)
        setFinishSelection('exterior', manifest.defaults.exterior)
        setFinishSelection('interior', manifest.defaults.interior)
        setPresetError(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return

        setPresetError(true)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLoadStartedAt(readClock()))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (isReady || sceneError) return undefined

    const timeout = window.setTimeout(() => setSceneError(true), MODEL_LOAD_TIMEOUT_MS)

    return () => window.clearTimeout(timeout)
  }, [isReady, modelKey, sceneError])

  const handleModelReady = useCallback((nextStats: SceneStats) => {
    setStats(nextStats)
    setSceneError(false)
    setIsReady(true)
  }, [])

  const handleSceneError = useCallback(() => {
    setStats(null)
    setIsReady(false)
    setSceneError(true)
  }, [])

  const retryModel = () => {
    useGLTF.clear(asset.path)
    setLoadStartedAt(readClock())
    setRetryCount((count) => count + 1)
    setIsReady(false)
    setStats(null)
    setSceneError(false)
  }

  const handleFinishStatus = useCallback((group: FinishGroup, status: FinishRuntimeStatus) => {
    setFinishStatus((current) => ({ ...current, [group]: status }))
  }, [])

  const selectFinish = (group: FinishGroup, id: FinishPresetId) => {
    if (group === 'exterior') {
      setFinishSelection('exterior', id as ExteriorPresetId)
      return
    }

    setFinishSelection('interior', id as InteriorPresetId)
  }

  const enter3D = () => {
    controlsRef.current?.reset()
    setIs3DActive(true)
  }

  const exit3D = () => {
    controlsRef.current?.reset()
    setIs3DActive(false)
  }

  const statusLabel = sceneError
    ? 'Poster fallback'
    : isReady
      ? isMobile === true && !is3DActive
        ? 'Ready to enter 3D'
        : 'Live model'
      : 'Loading live model'

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Private feasibility sandbox</p>
            <h1 className={styles.title}>Niva / browser gate</h1>
          </div>
          <span className={styles.privateBadge}>Unlinked / noindex</span>
        </header>

        <section className={styles.intro} aria-labelledby="niva-gate-title">
          <div>
            <p className={styles.eyebrow}>Blender -&gt; GLB -&gt; React Three Fiber</p>
            <h2 id="niva-gate-title" className={styles.introTitle}>
              Does the finalized Niva survive the browser?
            </h2>
            <p className={styles.introCopy}>
              One delivered configurator asset with authored exterior and interior finish controls. No production
              showcase integration is included in this gate.
            </p>
          </div>
          <dl className={styles.contractList}>
            <div>
              <dt>Default</dt>
              <dd>Natural Timber + Light Oak</dd>
            </div>
            <div>
              <dt>Camera</dt>
              <dd>Off-axis canonical projection</dd>
            </div>
            <div>
              <dt>Poster</dt>
              <dd>
                {CANONICAL_RESOLUTION}, {formatBytes(POSTER_BYTES)}
              </dd>
            </div>
          </dl>
        </section>

        <div className={styles.workspace}>
          <section className={styles.viewerPanel} aria-label="Niva browser viewer">
            <div className={styles.stage} data-interactive={isInteractive}>
              <div className={styles.canvasLayer} aria-hidden={!showLiveScene}>
                <NivaScene
                  modelKey={modelKey}
                  url={asset.path}
                  loadStartedAt={loadStartedAt}
                  manifest={presetManifest}
                  isInteractive={isInteractive}
                  controlsRef={controlsRef}
                  onReady={handleModelReady}
                  onError={handleSceneError}
                  onFinishStatus={handleFinishStatus}
                />
              </div>

              <Image
                src="/niva-3d/niva-configurator-poster.png"
                alt="Niva cabin canonical review render"
                fill
                priority
                unoptimized
                sizes="(max-width: 900px) 100vw, 70vw"
                className={`${styles.poster} ${showLiveScene ? styles.posterHidden : ''}`}
              />

              <div className={styles.stageStatus} aria-live="polite">
                <span className={`${styles.statusDot} ${isReady ? styles.statusDotReady : ''}`} />
                {statusLabel}
              </div>

              {!isReady && !sceneError ? (
                <div className={styles.loadingNote} aria-live="polite">
                  <span className={styles.loadingLine} />
                  <span>Loading {asset.label.toLowerCase()} behind poster</span>
                </div>
              ) : null}

              {sceneError ? (
                <div className={styles.errorCard} role="alert">
                  <strong>Live scene unavailable</strong>
                  <span>The supplied poster is still available while WebGL or GLB loading is unavailable.</span>
                  <button type="button" className={styles.secondaryButton} onClick={retryModel}>
                    Retry live scene
                  </button>
                </div>
              ) : null}

              {isMobile === true && isReady && !is3DActive ? (
                <button type="button" className={styles.enterButton} onClick={enter3D}>
                  View in 3D
                </button>
              ) : null}

              {isMobile === true && is3DActive ? (
                <button type="button" className={styles.exitButton} onClick={exit3D}>
                  Done
                </button>
              ) : null}
            </div>

            <div className={styles.viewerFooter}>
              <span>
                {isMobile === true
                  ? is3DActive
                    ? 'Drag to orbit / pinch to zoom'
                    : 'Static product view'
                  : 'Drag to orbit / scroll to zoom'}
              </span>
              <span>{showLiveScene ? 'Demand rendering while idle' : 'Poster-first loading'}</span>
            </div>
          </section>

          <aside className={styles.controlPanel} aria-label="Niva browser gate controls">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Finish control</p>
                <h2 className={styles.panelTitle}>Material presets</h2>
              </div>
              <span className={styles.panelIndex}>01</span>
            </div>

            {presetManifest ? (
              <div className={styles.finishControls}>
                <fieldset className={styles.qualityFieldset}>
                  <legend className={styles.finishGroupLabel}>Exterior</legend>
                  {presetManifest.groups.exterior.presets.map((preset) => {
                    const isActive = finishSelection.exteriorId === preset.id

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`${styles.qualityButton} ${isActive ? styles.qualityButtonActive : ''}`}
                        aria-pressed={isActive}
                        onClick={() => selectFinish('exterior', preset.id)}
                      >
                        <span>
                          <strong>{preset.label}</strong>
                          <small>ExteriorCladding</small>
                        </span>
                        <span className={styles.qualitySize}>{isActive ? 'Active' : 'Select'}</span>
                      </button>
                    )
                  })}
                </fieldset>
                <fieldset className={styles.qualityFieldset}>
                  <legend className={styles.finishGroupLabel}>Interior</legend>
                  {presetManifest.groups.interior.presets.map((preset) => {
                    const isActive = finishSelection.interiorId === preset.id

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`${styles.qualityButton} ${isActive ? styles.qualityButtonActive : ''}`}
                        aria-pressed={isActive}
                        onClick={() => selectFinish('interior', preset.id)}
                      >
                        <span>
                          <strong>{preset.label}</strong>
                          <small>InteriorJoinery</small>
                        </span>
                        <span className={styles.qualitySize}>{isActive ? 'Active' : 'Select'}</span>
                      </button>
                    )
                  })}
                </fieldset>
              </div>
            ) : (
              <p className={styles.devOnlyNote}>
                {presetError ? 'Preset manifest unavailable.' : 'Loading finish presets.'}
              </p>
            )}

            <dl className={styles.statsList} aria-live="polite">
              <div className={styles.statsHeading}>
                <dt>Active asset</dt>
                <dd>{asset.label}</dd>
              </div>
              <div>
                <dt>File size</dt>
                <dd>{asset.sizeLabel}</dd>
              </div>
              <div>
                <dt>Ready time</dt>
                <dd>{stats ? `${Math.round(stats.loadMs)} ms` : 'Waiting'}</dd>
              </div>
              <div>
                <dt>Resource timing</dt>
                <dd>{typeof stats?.resourceMs === 'number' ? `${Math.round(stats.resourceMs)} ms` : 'Not exposed'}</dd>
              </div>
              <div>
                <dt>Transferred</dt>
                <dd>{stats ? formatBytes(stats.transferredBytes) : 'Waiting'}</dd>
              </div>
              <div>
                <dt>Draw calls</dt>
                <dd>{stats?.drawCalls ?? 'Waiting'}</dd>
              </div>
              <div>
                <dt>Meshes / geometry</dt>
                <dd>{stats ? `${stats.meshes} / ${stats.geometries}` : `${GLB_MESHES} / waiting`}</dd>
              </div>
              <div>
                <dt>Materials / textures</dt>
                <dd>{stats ? `${stats.materials} / ${stats.textures}` : `${GLB_MATERIALS} / ${GLB_TEXTURES}`}</dd>
              </div>
              <div>
                <dt>Triangles</dt>
                <dd>{stats ? stats.triangles.toLocaleString() : GLB_TRIANGLES.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Exterior finish</dt>
                <dd>{finishStatus.exterior.label}</dd>
              </div>
              <div>
                <dt>Interior finish</dt>
                <dd>{finishStatus.interior.label}</dd>
              </div>
              <div>
                <dt>Finish texture load</dt>
                <dd>
                  {finishStatus.exterior.state === 'loading' || finishStatus.interior.state === 'loading'
                    ? 'Loading on demand'
                    : 'Cached / embedded'}
                </dd>
              </div>
            </dl>

            <div className={styles.contractNote}>
              <strong>Measured, not re-authored</strong>
              <p>
                The configurator retains {GLB_MESHES} meshes, {GLB_MATERIALS} materials and {GLB_TEXTURES} embedded
                images. Only ExteriorCladding and InteriorJoinery maps are switched at runtime.
              </p>
            </div>
          </aside>
        </div>

        <footer className={styles.footerNote}>
          <span>ExteriorCladding + InteriorJoinery are the only runtime finish boundaries.</span>
          <span>No HDRI / no Blender changes / no production showcase changes</span>
        </footer>
      </div>
    </main>
  )
}

const NivaScene = memo(function NivaScene({
  modelKey,
  url,
  loadStartedAt,
  manifest,
  isInteractive,
  controlsRef,
  onReady,
  onError,
  onFinishStatus,
}: NivaSceneProps) {
  return (
    <SceneErrorBoundary key={modelKey} onError={onError}>
      <Canvas
        camera={CANVAS_CAMERA_OPTIONS}
        dpr={CANVAS_DPR}
        frameloop="demand"
        resize={{ scroll: false }}
        gl={CANVAS_GL_OPTIONS}
        onCreated={configureRenderer}
      >
        <CameraResizeCalibration />
        <NivaLighting />
        <Suspense fallback={null}>
          {loadStartedAt === null ? null : (
            <NivaModel
              key={modelKey}
              url={url}
              loadStartedAt={loadStartedAt}
              manifest={manifest}
              onReady={onReady}
              onError={onError}
              onFinishStatus={onFinishStatus}
            />
          )}
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={isInteractive}
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          minDistance={12}
          maxDistance={21}
          minPolarAngle={1.25}
          maxPolarAngle={1.95}
          rotateSpeed={0.7}
          zoomSpeed={0.7}
          target={CANONICAL_TARGET}
        />
      </Canvas>
    </SceneErrorBoundary>
  )
})

function configureRenderer({ camera, gl, size }: RootState) {
  gl.outputColorSpace = SRGBColorSpace
  gl.toneMapping = AgXToneMapping
  gl.toneMappingExposure = 1
  setCanonicalCamera(camera, size.width / Math.max(size.height, 1))
}

function setCanonicalCamera(camera: Camera, aspect: number) {
  const worldMatrix = new Matrix4().set(
    CANONICAL_WORLD_MATRIX_ROWS[0][0],
    CANONICAL_WORLD_MATRIX_ROWS[0][1],
    CANONICAL_WORLD_MATRIX_ROWS[0][2],
    CANONICAL_WORLD_MATRIX_ROWS[0][3],
    CANONICAL_WORLD_MATRIX_ROWS[1][0],
    CANONICAL_WORLD_MATRIX_ROWS[1][1],
    CANONICAL_WORLD_MATRIX_ROWS[1][2],
    CANONICAL_WORLD_MATRIX_ROWS[1][3],
    CANONICAL_WORLD_MATRIX_ROWS[2][0],
    CANONICAL_WORLD_MATRIX_ROWS[2][1],
    CANONICAL_WORLD_MATRIX_ROWS[2][2],
    CANONICAL_WORLD_MATRIX_ROWS[2][3],
    CANONICAL_WORLD_MATRIX_ROWS[3][0],
    CANONICAL_WORLD_MATRIX_ROWS[3][1],
    CANONICAL_WORLD_MATRIX_ROWS[3][2],
    CANONICAL_WORLD_MATRIX_ROWS[3][3],
  )

  worldMatrix.decompose(camera.position, camera.quaternion, camera.scale)
  camera.matrixWorld.copy(worldMatrix)
  camera.matrixWorldInverse.copy(worldMatrix).invert()
  camera.matrixAutoUpdate = true
  applyOffAxisProjection(camera, aspect)
  camera.updateMatrixWorld(true)
}

function applyOffAxisProjection(camera: Camera, aspect: number) {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : CANONICAL_ASPECT
  const projection = new Matrix4().set(
    (CANONICAL_PROJECTION_ROWS[0][0] * CANONICAL_ASPECT) / safeAspect,
    CANONICAL_PROJECTION_ROWS[0][1],
    CANONICAL_PROJECTION_ROWS[0][2],
    CANONICAL_PROJECTION_ROWS[0][3],
    CANONICAL_PROJECTION_ROWS[1][0],
    CANONICAL_PROJECTION_ROWS[1][1],
    CANONICAL_PROJECTION_ROWS[1][2],
    CANONICAL_PROJECTION_ROWS[1][3],
    CANONICAL_PROJECTION_ROWS[2][0],
    CANONICAL_PROJECTION_ROWS[2][1],
    CANONICAL_PROJECTION_ROWS[2][2],
    CANONICAL_PROJECTION_ROWS[2][3],
    CANONICAL_PROJECTION_ROWS[3][0],
    CANONICAL_PROJECTION_ROWS[3][1],
    CANONICAL_PROJECTION_ROWS[3][2],
    CANONICAL_PROJECTION_ROWS[3][3],
  )

  camera.projectionMatrix.copy(projection)
  camera.projectionMatrixInverse.copy(projection).invert()
}

function CameraResizeCalibration() {
  const { camera, size } = useThree()

  useLayoutEffect(() => {
    applyOffAxisProjection(camera, size.width / Math.max(size.height, 1))
  }, [camera, size.height, size.width])

  return null
}

function NivaLighting() {
  return (
    <>
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <hemisphereLight args={['#fffaf0', '#8b938f', 0.8]} />
      <directionalLight position={[-5, 9, 6]} intensity={2.2} color="#fff2dd" />
      <directionalLight position={[5, 6, 4]} intensity={1.4} color="#e5efff" />
      <directionalLight position={[0, 8, -6]} intensity={1.8} color="#fff5e4" />
      <pointLight position={[-1.69, 2.77, 2.88]} intensity={5} distance={3} decay={2} color="#ffb267" />
      <pointLight position={[1.69, 2.77, 2.88]} intensity={5} distance={3} decay={2} color="#ffb267" />
      <pointLight position={[0.63, 3.45, 1.78]} intensity={1.1} distance={5} decay={2} color="#ffd69c" />
      <pointLight position={[0.63, 3.45, -0.03]} intensity={1.1} distance={5} decay={2} color="#ffd69c" />
      <pointLight position={[0.63, 3.45, -1.81]} intensity={1.25} distance={5} decay={2} color="#ffd69c" />
      <pointLight position={[1.2, 4.27, 1.56]} intensity={0.8} distance={3} decay={2} color="#ffbd72" />
    </>
  )
}

function NivaModel({ url, loadStartedAt, manifest, onReady, onError, onFinishStatus }: NivaModelProps) {
  const { scene } = useGLTF(url) as { scene: Object3D }
  const { gl, invalidate } = useThree()
  const { exteriorId, interiorId } = useSyncExternalStore(
    finishSelectionStore.subscribe,
    finishSelectionStore.getSnapshot,
    finishSelectionStore.getSnapshot,
  )
  const didReport = useRef(false)
  const didPreloadFinishTextures = useRef(false)
  const materialTargetsRef = useRef<PreparedMaterialTargets | null>(null)

  useEffect(() => {
    try {
      materialTargetsRef.current = prepareMaterialTargets(scene)
    } catch {
      materialTargetsRef.current = null
      onError()
    }

    return () => {
      materialTargetsRef.current = null
    }
  }, [onError, scene])

  useEffect(() => {
    const target = materialTargetsRef.current?.exterior
    const preset = manifest?.groups.exterior.presets.find((candidate) => candidate.id === exteriorId)

    if (!target || !preset) return undefined

    void applyFinishPreset({ group: 'exterior', target, preset, invalidate, onFinishStatus })

    return undefined
  }, [exteriorId, invalidate, manifest, onFinishStatus, scene])

  useEffect(() => {
    const target = materialTargetsRef.current?.interior
    const preset = manifest?.groups.interior.presets.find((candidate) => candidate.id === interiorId)

    if (!target || !preset) return undefined

    void applyFinishPreset({ group: 'interior', target, preset, invalidate, onFinishStatus })

    return undefined
  }, [interiorId, invalidate, manifest, onFinishStatus, scene])

  useEffect(() => {
    let firstFrame = 0
    let secondFrame = 0

    invalidate()
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (didReport.current) return

        didReport.current = true
        const resource = getResourceTiming(url)
        onReady({
          loadMs: performance.now() - loadStartedAt,
          resourceMs: resource.durationMs,
          transferredBytes: resource.transferredBytes,
          ...collectSceneStats(scene, gl),
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [gl, invalidate, loadStartedAt, onReady, scene, url])

  useEffect(() => {
    if (didPreloadFinishTextures.current || !didReport.current || !manifest) return undefined

    const targets = materialTargetsRef.current
    if (!targets) return undefined

    didPreloadFinishTextures.current = true
    void preloadFinishTextures(manifest, targets)

    return undefined
  }, [manifest, scene])

  useEffect(() => {
    return () => {
      disposeScene(scene)
      useGLTF.clear(url)
    }
  }, [scene, url])

  return <primitive object={scene} dispose={null} />
}

interface ApplyFinishPresetOptions {
  readonly group: FinishGroup
  readonly target: PreparedMaterialTarget
  readonly preset: PresetDefinition
  readonly invalidate: () => void
  readonly onFinishStatus: (group: FinishGroup, status: FinishRuntimeStatus) => void
}

async function applyFinishPreset({ group, target, preset, invalidate, onFinishStatus }: ApplyFinishPresetOptions) {
  const requestVersion = target.requestVersion + 1
  target.requestVersion = requestVersion
  const baseMap = target.originalMap

  if (preset.baseColorTexture.source === 'embedded-default') {
    applyFinishMaterialState(target, baseMap, target.baselineRoughness * preset.roughnessMultiplier, invalidate)
    onFinishStatus(group, createFinishStatus('ready', preset.label, null, 0))
    return
  }

  const uri = preset.baseColorTexture.uri
  if (uri === undefined || uri.length === 0) {
    onFinishStatus(group, createFinishStatus('error', preset.label, null, null))
    return
  }

  const url = resolveFinishTextureUrl(uri)
  const cachedTexture = finishTextureCache.get(url)

  if (!cachedTexture) onFinishStatus(group, createFinishStatus('loading', preset.label, null, null))

  try {
    const texture = cachedTexture ?? (await loadFinishTexture(url, baseMap))
    if (target.requestVersion !== requestVersion) return

    applyFinishMaterialState(target, texture, target.baselineRoughness * preset.roughnessMultiplier, invalidate)

    const resource = getResourceTiming(url)
    onFinishStatus(group, createFinishStatus('ready', preset.label, resource.durationMs, resource.transferredBytes))
  } catch {
    if (target.requestVersion !== requestVersion) return

    onFinishStatus(group, createFinishStatus('error', preset.label, null, null))
  }
}

function applyFinishMaterialState(
  target: PreparedMaterialTarget,
  map: Texture | null,
  roughness: number,
  invalidate: () => void,
) {
  const hadMap = target.material.map !== null
  target.material.map = map
  target.material.roughness = roughness

  if (hadMap !== (map !== null)) target.material.needsUpdate = true

  invalidate()
}

function preloadFinishTextures(manifest: PresetManifest, targets: PreparedMaterialTargets) {
  const requests: Array<Promise<Texture>> = []
  const groups: ReadonlyArray<readonly [FinishGroup, PreparedMaterialTarget]> = [
    ['exterior', targets.exterior],
    ['interior', targets.interior],
  ]

  for (const [group, target] of groups) {
    for (const preset of manifest.groups[group].presets) {
      if (preset.baseColorTexture.source !== 'external') continue

      const uri = preset.baseColorTexture.uri
      if (uri === undefined || uri.length === 0) continue

      requests.push(loadFinishTexture(resolveFinishTextureUrl(uri), target.originalMap))
    }
  }

  return Promise.allSettled(requests)
}

function resolveFinishTextureUrl(uri: string) {
  return new URL(uri, new URL(PRESET_MANIFEST_URL, window.location.href)).href
}

function createFinishStatus(
  state: FinishTextureState,
  label: string,
  resourceMs: number | null,
  transferredBytes: number | null,
): FinishRuntimeStatus {
  return { state, label, resourceMs, transferredBytes }
}

function loadFinishTexture(url: string, originalMap: Texture | null): Promise<Texture> {
  const cachedTexture = finishTextureCache.get(url)
  if (cachedTexture) return Promise.resolve(cachedTexture)

  const pendingTexture = finishTexturePromises.get(url)
  if (pendingTexture) return pendingTexture

  const texturePromise = new Promise<Texture>((resolve, reject) => {
    new TextureLoader().load(
      url,
      (texture) => {
        configureFinishTexture(texture, originalMap)
        finishTextureCache.set(url, texture)
        externalFinishTextures.add(texture)
        resolve(texture)
      },
      undefined,
      reject,
    )
  }).catch((error: unknown) => {
    finishTexturePromises.delete(url)
    throw error
  })

  finishTexturePromises.set(url, texturePromise)
  return texturePromise
}

function configureFinishTexture(texture: Texture, originalMap: Texture | null) {
  if (originalMap) {
    texture.channel = originalMap.channel
    texture.wrapS = originalMap.wrapS
    texture.wrapT = originalMap.wrapT
    texture.magFilter = originalMap.magFilter
    texture.minFilter = originalMap.minFilter
    texture.anisotropy = originalMap.anisotropy
    texture.repeat.copy(originalMap.repeat)
    texture.offset.copy(originalMap.offset)
    texture.center.copy(originalMap.center)
    texture.rotation = originalMap.rotation
    texture.matrix.copy(originalMap.matrix)
    texture.matrixAutoUpdate = originalMap.matrixAutoUpdate
  }

  texture.colorSpace = SRGBColorSpace
  texture.flipY = false
  texture.needsUpdate = true
}

function prepareMaterialTargets(scene: Object3D): PreparedMaterialTargets {
  const clones = new Map<'ExteriorCladding' | 'InteriorJoinery', PresetMaterial>()
  const targets = new Map<'ExteriorCladding' | 'InteriorJoinery', PreparedMaterialTarget>()

  scene.traverse((object) => {
    if (!isMeshLike(object)) return

    const hasMaterialArray = Array.isArray(object.material)
    const currentMaterials = getMaterials(object.material)
    const nextMaterials = currentMaterials.map((material) => {
      if (!isTargetMaterialName(material.name)) return material

      let clone = clones.get(material.name)
      if (!clone) {
        const original = asPresetMaterial(material)
        clone = asPresetMaterial(material.clone())
        clone.name = material.name
        clones.set(material.name, clone)
        targets.set(material.name, {
          material: clone,
          originalMap: original.map,
          baselineRoughness: original.roughness,
          requestVersion: 0,
        })
      }

      return clone
    })

    if (nextMaterials.some((material, index) => material !== currentMaterials[index])) {
      object.material = hasMaterialArray ? nextMaterials : (nextMaterials[0] ?? object.material)
    }
  })

  const exterior = targets.get('ExteriorCladding')
  const interior = targets.get('InteriorJoinery')
  if (!exterior || !interior) throw new Error('Niva finish material boundary is missing from the GLB')

  return { exterior, interior }
}

function collectSceneStats(
  scene: Object3D,
  gl: WebGLRenderer,
): Omit<SceneStats, 'loadMs' | 'resourceMs' | 'transferredBytes'> {
  const geometries = new Set<BufferGeometry>()
  const textures = new Set<DisposableTexture>()
  let meshes = 0
  let triangles = 0

  scene.traverse((object) => {
    if (!isMeshLike(object)) return

    meshes += 1
    geometries.add(object.geometry)

    const position = object.geometry.getAttribute('position') as { readonly count?: number } | undefined
    const count = object.geometry.index ? object.geometry.index.count : (position?.count ?? 0)
    triangles += count / 3

    const objectMaterials = getMaterials(object.material)
    objectMaterials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (isDisposableTexture(value)) textures.add(value)
      })
    })
  })

  return {
    drawCalls: gl.info.render.calls,
    triangles: Math.round(triangles),
    meshes,
    geometries: geometries.size,
    rendererGeometries: gl.info.memory.geometries,
    textures: textures.size,
    rendererTextures: gl.info.memory.textures,
    materials: GLB_MATERIALS,
    programs: gl.info.programs?.length ?? null,
  }
}

function disposeScene(scene: Object3D) {
  const disposedMaterials = new Set<Material>()
  const disposedTextures = new Set<DisposableTexture>()

  scene.traverse((object) => {
    if (!isMeshLike(object)) return

    object.geometry.dispose()
    const objectMaterials = getMaterials(object.material)
    objectMaterials.forEach((material) => {
      if (disposedMaterials.has(material)) return

      disposedMaterials.add(material)
      Object.values(material).forEach((value) => {
        if (!isDisposableTexture(value) || externalFinishTextures.has(value) || disposedTextures.has(value)) return

        disposedTextures.add(value)
        value.dispose()
      })
      material.dispose()
    })
  })
}

function isMeshLike(object: Object3D): object is MeshLike {
  return object instanceof Mesh
}

function isTargetMaterialName(name: string): name is 'ExteriorCladding' | 'InteriorJoinery' {
  return name === 'ExteriorCladding' || name === 'InteriorJoinery'
}

function asPresetMaterial(material: Material): PresetMaterial {
  return material as PresetMaterial
}

function getMaterials(material: Material | ReadonlyArray<Material>): ReadonlyArray<Material> {
  if (isMaterialArray(material)) return material

  return [material]
}

function isMaterialArray(material: Material | ReadonlyArray<Material>): material is ReadonlyArray<Material> {
  return Array.isArray(material)
}

function isDisposableTexture(value: unknown): value is DisposableTexture {
  if (typeof value !== 'object' || value === null) return false

  return 'isTexture' in value && value.isTexture === true && 'dispose' in value && typeof value.dispose === 'function'
}

function getResourceTiming(path: string) {
  const absolutePath = new URL(path, window.location.href).href
  const resourceEntry = performance.getEntriesByName(absolutePath, 'resource').at(-1)

  if (!resourceEntry || resourceEntry.entryType !== 'resource') {
    return { durationMs: null, transferredBytes: null }
  }

  const resource = resourceEntry as PerformanceResourceTiming
  const transferredBytes = resource.transferSize || resource.encodedBodySize || null

  return {
    durationMs: resource.duration || null,
    transferredBytes,
  }
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return 'Not exposed'

  return `${(bytes / 1_000_000).toFixed(2)} MB`
}
