'use client'

import type { ComponentRef, ReactNode, RefObject } from 'react'
import type { InteractiveShowcase3DProps, LiveSurfaceVisibility } from './interactive-showcase-3d'
import type { RootState } from '@react-three/fiber'
import type {
  Camera,
  Group,
  Material,
  Object3D,
  PerspectiveCamera,
  SpotLight,
  Texture,
  WebGLRendererParameters,
} from 'three'
import type { Cabin, CabinExteriorFinishId } from '~/app/[locale]/(app)/_data/cabins'

import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { createPortal } from 'react-dom'
import {
  AgXToneMapping,
  Box3,
  MathUtils,
  Matrix4,
  Mesh,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'

import { Button } from '@workspace/ui/components/button'

import { DESKTOP_FRAMING } from './interactive-showcase-3d-framing'
import { REVEAL_EASING, REVEAL_FADE_DURATION_MS } from './interactive-showcase-3d-timing'

const BACKGROUND_COLOR = '#f7f5f0'
const CANVAS_DPR: [number, number] = [1, 1.75]
const CANVAS_CAMERA_OPTIONS = {
  manual: true,
  near: 0.05,
  far: 1000,
  aspect: 1,
} as const
const CANVAS_GL_OPTIONS = {
  alpha: false,
  antialias: true,
  powerPreference: 'high-performance' as const,
  preserveDrawingBuffer: false,
}
const MODEL_ROTATION_DAMPING = 7
const MODEL_ROTATION_DRAG_SENSITIVITY = 0.01
const MODEL_ROTATION_SETTLE_EPSILON = 0.0001
const CAMERA_ELEVATION_DAMPING = 7
const CAMERA_ELEVATION_DRAG_SENSITIVITY = 0.005
const CAMERA_ELEVATION_LIMIT = 0.32
const CAMERA_ELEVATION_SETTLE_EPSILON = 0.0001
const SHOWCASE_SHADOW_MAP_SIZE = 512
type LightPosition = readonly [number, number, number]

interface ExteriorSpotlightDefinition {
  readonly position: LightPosition
  readonly target: LightPosition
}

interface InteriorLightDefinitionBase {
  readonly position: LightPosition
  readonly intensity: number
  readonly distance: number
  readonly decay: number
  readonly color: string
}

interface PointLightDefinition extends InteriorLightDefinitionBase {
  readonly kind: 'point'
}

interface InteriorSpotlightDefinition extends InteriorLightDefinitionBase {
  readonly kind: 'spot'
  readonly target: LightPosition
  readonly angle: number
  readonly penumbra: number
}

type InteriorLightDefinition = PointLightDefinition | InteriorSpotlightDefinition

const EXTERIOR_LAMP_LIGHTS = [
  {
    position: [-1.69, 2.77, 2.88] as const,
    target: [-1.69, 1.7, 3.02] as const,
  },
  {
    position: [1.69, 2.77, 2.88] as const,
    target: [1.69, 1.7, 3.02] as const,
  },
] as const satisfies ReadonlyArray<ExteriorSpotlightDefinition>
const ASTER_EXTERIOR_LAMP_LIGHTS = [
  {
    // Blender's FrontSconce_ReviewLight, converted to GLTF axes.
    position: [3.48, 2.055, 2.405] as const,
    target: [3.48, 0.102, 1.976] as const,
  },
  {
    // Blender's LeftSconce_ReviewLight, converted to GLTF axes.
    position: [-4.28, 2.055, 0.5] as const,
    target: [-3.851, 0.102, 0.5] as const,
  },
] as const satisfies ReadonlyArray<ExteriorSpotlightDefinition>
const VEYRA_EXTERIOR_LAMP_LIGHTS = [
  {
    // Blender's SconceLight_-1.27_-2.64, converted to GLTF axes.
    position: [-1.81, 2.399, 2.64] as const,
    target: [-1.81, 1.3, 2.64] as const,
  },
  {
    // Blender's SconceLight_3.43_-2.64, converted to GLTF axes.
    position: [3.43, 2.399, 2.64] as const,
    target: [3.43, 1.3, 2.64] as const,
  },
  {
    // Blender's SconceLight_-5.74_-1.43, converted to GLTF axes.
    position: [-5.74, 2.399, 1.43] as const,
    target: [-5.74, 1.3, 1.43] as const,
  },
  {
    // Blender's SconceLight_-5.74_0.63, converted to GLTF axes.
    position: [-5.74, 2.399, -0.63] as const,
    target: [-5.74, 1.3, -0.63] as const,
  },
] as const satisfies ReadonlyArray<ExteriorSpotlightDefinition>
const NIVA_INTERIOR_LIGHTS = [
  { kind: 'point', position: [0.63, 3.45, 1.78] as const, intensity: 1.1, distance: 5, decay: 2, color: '#ffd69c' },
  { kind: 'point', position: [0.63, 3.45, -0.03] as const, intensity: 1.1, distance: 5, decay: 2, color: '#ffd69c' },
  { kind: 'point', position: [0.63, 3.45, -1.81] as const, intensity: 1.25, distance: 5, decay: 2, color: '#ffd69c' },
] as const satisfies ReadonlyArray<PointLightDefinition>
const VEYRA_INTERIOR_LIGHTS = [
  {
    // Dining_PendantDiffuser, converted to GLTF axes. The authoring light targets the floor.
    kind: 'spot',
    position: [-2.1, 2.073, 0.6] as const,
    target: [-2.1, 0.42, 0.6] as const,
    intensity: 1.4,
    distance: 4,
    decay: 2,
    color: '#ffd69c',
    angle: 0.95,
    penumbra: 0.65,
  },
] as const satisfies ReadonlyArray<InteriorLightDefinition>
const EXTERIOR_PRESET_IDS = {
  wood: 'natural-timber',
  white: 'whitewashed-timber',
  black: 'charred-black-oil',
} as const satisfies Record<CabinExteriorFinishId, ExteriorPresetId>

type ExteriorPresetId = 'natural-timber' | 'whitewashed-timber' | 'charred-black-oil'
type InteriorPresetId = 'light-oak' | 'warm-ash' | 'dark-walnut'
type FinishPresetId = ExteriorPresetId | InteriorPresetId
type FinishTextureSource = 'embedded-default' | 'external'
type MatrixRows = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
]

interface PresetDefinition {
  readonly id: FinishPresetId
  readonly label: string
  readonly baseColorTexture: {
    readonly source: FinishTextureSource
    readonly uri?: string
  }
  readonly roughnessMultiplier: number
}

interface PresetGroup {
  readonly material: string
  readonly default: FinishPresetId
  readonly presets: ReadonlyArray<PresetDefinition>
}

interface PresetManifest {
  readonly schemaVersion: number
  readonly asset: string
  readonly defaults: {
    readonly exterior: ExteriorPresetId
    readonly interior: InteriorPresetId
  }
  readonly groups: {
    readonly exterior: PresetGroup
    readonly interior: PresetGroup
  }
}

interface CameraContract {
  readonly aspect_ratio?: number
  readonly image?: {
    readonly width: number
    readonly height: number
  }
  readonly matrix_world_gltf: MatrixRows
  readonly projection_matrix: MatrixRows
  readonly target_gltf: [number, number, number]
  readonly near: number
  readonly far: number
}

interface CabinMetadata {
  readonly manifest: PresetManifest
  readonly camera: CameraContract
}

interface PresetMaterial extends Material {
  map: Texture | null
  roughness: number
}

interface PreparedMaterialTarget {
  readonly material: PresetMaterial
  readonly originalMap: Texture | null
  readonly baselineRoughness: number
}

interface PreparedMaterialTargets {
  readonly exterior: PreparedMaterialTarget
  readonly interior: PreparedMaterialTarget
}

interface SurfaceFrameIdentity {
  readonly surfaceToken: string
  readonly cabinId: Cabin['id']
  readonly exteriorId: ExteriorPresetId
  readonly interiorId: InteriorPresetId
}

interface SurfaceSize {
  readonly width: number
  readonly height: number
}

interface CabinModelProps {
  readonly surfaceRef: RefObject<HTMLDivElement | null>
  readonly cabin: Cabin
  readonly cameraRestoreRef: RefObject<(() => void) | null>
  readonly controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>
  readonly modelRotationResetRef: RefObject<(() => void) | null>
  readonly metadata: CabinMetadata
  readonly finishRetryRevision: number
  readonly isDesktop: boolean
  readonly isInteractive: boolean
  readonly selectedExteriorId: ExteriorPresetId
  readonly selectedInteriorId: InteriorPresetId
  readonly surfaceToken: string
  readonly onError: () => void
  readonly onFinishStatus: (status: FinishPairStatus) => void
  readonly onFrameReady: (frame: SurfaceFrameIdentity) => void
}

interface SceneErrorBoundaryProps {
  readonly children: ReactNode
  readonly onError: () => void
}

interface SceneErrorBoundaryState {
  readonly hasError: boolean
}

type SurfaceLoadState = 'loading' | 'ready' | 'error'
type FinishPairState = 'loading' | 'ready' | 'error'

interface FinishPairStatus {
  readonly revision: string
  readonly state: FinishPairState
}

interface SurfaceLoadStatus {
  readonly resourceKey: string
  readonly state: SurfaceLoadState
}

const cabinMetadataPromises = new Map<string, Promise<CabinMetadata>>()
const cabinMetadataCache = new Map<string, CabinMetadata>()
const finishTexturePromises = new Map<string, Promise<Texture>>()
const finishTextureCache = new Map<string, Texture>()
const preparedMaterialTargetsCache = new WeakMap<Object3D, PreparedMaterialTargets>()
const preloadedCabinResourceKeys = new Set<string>()

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

function InteractiveShowcase3DRuntime({
  activeCabin,
  intentCabin,
  isDesktop,
  isRequested,
  isSectionNear,
  mediaSlotRefs,
  mediaViewportRef,
  onLiveSurfaceVisibilityChange,
  selectedExterior,
  selectedInterior,
  speculativeCabin,
  shouldReduceMotion,
  surfaceCabin,
  surfaceRevision,
  surfaceSlotIndex,
  labels,
}: InteractiveShowcase3DProps) {
  const [surfaceHost] = useState(() => {
    const host = document.createElement('div')
    host.className = 'pointer-events-none absolute inset-0 z-10'
    host.dataset.showcaseLiveSurface = ''
    return host
  })
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)
  const cameraRestoreRef = useRef<(() => void) | null>(null)
  const modelRotationResetRef = useRef<(() => void) | null>(null)
  const [revealedSurfaceFrame, setRevealedSurfaceFrame] = useState<SurfaceFrameIdentity | null>(null)
  const [loadedSurfaceMetadata, setLoadedSurfaceMetadata] = useState<{
    readonly resourceKey: string
    readonly metadata: CabinMetadata
  } | null>(null)
  const [surfaceLoadStatus, setSurfaceLoadStatus] = useState<SurfaceLoadStatus | null>(null)
  const [finishPairStatus, setFinishPairStatus] = useState<FinishPairStatus | null>(null)
  const [sceneRetryRevision, setSceneRetryRevision] = useState(0)
  const [finishRetryRevision, setFinishRetryRevision] = useState(0)
  const [touchInteractionRevision, setTouchInteractionRevision] = useState<number | null>(null)
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)

  const activeAssetUrl = activeCabin.threeD.assetUrl
  const activeManifestUrl = activeCabin.threeD.manifestUrl
  const activeCameraUrl = activeCabin.threeD.cameraUrl
  const surfaceAssetUrl = surfaceCabin.threeD.assetUrl
  const surfaceManifestUrl = surfaceCabin.threeD.manifestUrl
  const surfaceCameraUrl = surfaceCabin.threeD.cameraUrl
  const normalizedExteriorId = normalizeExteriorFinishId(selectedExterior)
  const surfaceResourceKey = getCabinResourceKey(surfaceCabin.id, surfaceAssetUrl, surfaceManifestUrl, surfaceCameraUrl)
  const surfaceToken = `${surfaceRevision}:${surfaceResourceKey}`
  const surfaceMaterialRevision = `${surfaceAssetUrl}:${normalizedExteriorId}:${selectedInterior}`
  const isTouchInteraction = touchInteractionRevision === surfaceRevision
  const intentCabinId = intentCabin?.id
  const intentAssetUrl = intentCabin?.threeD.assetUrl
  const intentManifestUrl = intentCabin?.threeD.manifestUrl
  const intentCameraUrl = intentCabin?.threeD.cameraUrl
  const speculativeCabinId = speculativeCabin?.id
  const speculativeAssetUrl = speculativeCabin?.threeD.assetUrl
  const speculativeManifestUrl = speculativeCabin?.threeD.manifestUrl
  const speculativeCameraUrl = speculativeCabin?.threeD.cameraUrl
  const isSurfaceVisible =
    revealedSurfaceFrame !== null &&
    revealedSurfaceFrame.surfaceToken === surfaceToken &&
    revealedSurfaceFrame.cabinId === surfaceCabin.id
  const currentSurfaceLoadState =
    surfaceLoadStatus?.resourceKey === surfaceResourceKey ? surfaceLoadStatus.state : 'loading'
  const currentFinishPairState =
    finishPairStatus?.revision === surfaceMaterialRevision ? finishPairStatus.state : 'loading'
  const isSurfaceCurrent = surfaceCabin.id === activeCabin.id
  const canInteract =
    isSurfaceVisible && isSurfaceCurrent && isSectionNear && isDocumentVisible && (isDesktop || isTouchInteraction)
  const showSurfaceError = currentSurfaceLoadState === 'error'
  const showFinishError = currentFinishPairState === 'error'
  const showEnterInteraction = !isDesktop && isSurfaceVisible && !isTouchInteraction
  const currentSurfaceFrameRef = useRef<SurfaceFrameIdentity>({
    surfaceToken,
    cabinId: surfaceCabin.id,
    exteriorId: normalizedExteriorId,
    interiorId: selectedInterior,
  })

  // Clear only stale cabin readiness; palette updates keep the previously rendered finishes visible.
  if (revealedSurfaceFrame !== null && !isSurfaceVisible) {
    setRevealedSurfaceFrame(null)
  }

  // Returning from desktop to mobile requires a fresh touch opt-in.
  if (isDesktop && touchInteractionRevision !== null) {
    setTouchInteractionRevision(null)
  }

  useLayoutEffect(() => {
    const visibility: LiveSurfaceVisibility = {
      isVisible: isSurfaceVisible,
      revision: surfaceRevision,
      cabinId: surfaceCabin.id,
    }

    onLiveSurfaceVisibilityChange(visibility)
  }, [isSurfaceVisible, onLiveSurfaceVisibilityChange, surfaceCabin.id, surfaceRevision])

  useLayoutEffect(() => {
    currentSurfaceFrameRef.current = {
      surfaceToken,
      cabinId: surfaceCabin.id,
      exteriorId: normalizedExteriorId,
      interiorId: selectedInterior,
    }
  }, [normalizedExteriorId, selectedInterior, surfaceCabin.id, surfaceToken])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === 'visible')
    }

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!isRequested) return undefined

    const surfaceResource = preloadCabinResource({
      cabinId: surfaceCabin.id,
      assetUrl: surfaceAssetUrl,
      manifestUrl: surfaceManifestUrl,
      cameraUrl: surfaceCameraUrl,
    })
    let isCurrent = true

    void surfaceResource
      .then((metadata) => {
        if (!isCurrent) return

        setLoadedSurfaceMetadata({ resourceKey: surfaceResourceKey, metadata })
      })
      .catch(() => {
        if (!isCurrent) return

        setLoadedSurfaceMetadata(null)
        setSurfaceLoadStatus({ resourceKey: surfaceResourceKey, state: 'error' })
      })

    return () => {
      isCurrent = false
    }
  }, [
    isRequested,
    sceneRetryRevision,
    surfaceCabin.id,
    surfaceAssetUrl,
    surfaceCameraUrl,
    surfaceManifestUrl,
    surfaceResourceKey,
  ])

  useEffect(() => {
    if (!isRequested) return undefined

    preloadCabinResources({
      cabinId: activeCabin.id,
      assetUrl: activeAssetUrl,
      manifestUrl: activeManifestUrl,
      cameraUrl: activeCameraUrl,
      selectedExterior,
      selectedInterior,
    })

    return undefined
  }, [
    activeCabin.id,
    activeAssetUrl,
    activeCameraUrl,
    activeManifestUrl,
    isRequested,
    selectedExterior,
    selectedInterior,
  ])

  useEffect(() => {
    if (
      !isRequested ||
      intentCabinId === undefined ||
      intentAssetUrl === undefined ||
      intentManifestUrl === undefined ||
      intentCameraUrl === undefined
    ) {
      return undefined
    }

    preloadCabinResources({
      cabinId: intentCabinId,
      assetUrl: intentAssetUrl,
      manifestUrl: intentManifestUrl,
      cameraUrl: intentCameraUrl,
      selectedExterior,
      selectedInterior,
    })

    return undefined
  }, [
    intentAssetUrl,
    intentCameraUrl,
    intentCabinId,
    intentManifestUrl,
    isRequested,
    selectedExterior,
    selectedInterior,
  ])

  useEffect(() => {
    if (
      !isRequested ||
      !isSectionNear ||
      !isDocumentVisible ||
      !isSurfaceVisible ||
      !isSurfaceCurrent ||
      speculativeCabinId === undefined ||
      speculativeAssetUrl === undefined ||
      speculativeManifestUrl === undefined ||
      speculativeCameraUrl === undefined ||
      !canSpeculativelyPreload()
    ) {
      return undefined
    }

    const resourceKey = getCabinResourceKey(
      speculativeCabinId,
      speculativeAssetUrl,
      speculativeManifestUrl,
      speculativeCameraUrl,
    )

    // Only consider the single direction-aware candidate chosen by the section.
    if (preloadedCabinResourceKeys.has(resourceKey)) return undefined

    return scheduleIdleWork(() => {
      if (!canSpeculativelyPreload()) return

      preloadCabinResources({
        cabinId: speculativeCabinId,
        assetUrl: speculativeAssetUrl,
        manifestUrl: speculativeManifestUrl,
        cameraUrl: speculativeCameraUrl,
        selectedExterior,
        selectedInterior,
      })
    })
  }, [
    isDocumentVisible,
    isRequested,
    isSectionNear,
    isSurfaceCurrent,
    isSurfaceVisible,
    selectedExterior,
    selectedInterior,
    speculativeAssetUrl,
    speculativeCameraUrl,
    speculativeCabinId,
    speculativeManifestUrl,
  ])

  const handleFrameReady = useCallback(
    (frame: SurfaceFrameIdentity) => {
      const currentFrame = currentSurfaceFrameRef.current

      if (
        frame.surfaceToken !== currentFrame.surfaceToken ||
        frame.cabinId !== currentFrame.cabinId ||
        frame.exteriorId !== currentFrame.exteriorId ||
        frame.interiorId !== currentFrame.interiorId
      ) {
        return
      }

      setSurfaceLoadStatus({ resourceKey: surfaceResourceKey, state: 'ready' })
      setFinishPairStatus({ revision: surfaceMaterialRevision, state: 'ready' })
      setRevealedSurfaceFrame(frame)
    },
    [surfaceMaterialRevision, surfaceResourceKey],
  )

  const handleSceneError = useCallback(() => {
    if (currentSurfaceFrameRef.current.surfaceToken !== surfaceToken) return

    setSurfaceLoadStatus({ resourceKey: surfaceResourceKey, state: 'error' })
    setRevealedSurfaceFrame((currentFrame) => (currentFrame?.surfaceToken === surfaceToken ? null : currentFrame))
  }, [surfaceResourceKey, surfaceToken])

  const handleFinishStatus = useCallback(
    (status: FinishPairStatus) => {
      if (status.revision !== surfaceMaterialRevision) return

      setFinishPairStatus(status)
    },
    [surfaceMaterialRevision],
  )

  const handleRetry = useCallback(() => {
    if (currentSurfaceLoadState === 'error') {
      preloadedCabinResourceKeys.delete(surfaceResourceKey)
      useGLTF.clear(surfaceAssetUrl)
      setLoadedSurfaceMetadata(null)
      setSurfaceLoadStatus({ resourceKey: surfaceResourceKey, state: 'loading' })
      setFinishPairStatus({ revision: surfaceMaterialRevision, state: 'loading' })
      setRevealedSurfaceFrame((currentFrame) => (currentFrame?.surfaceToken === surfaceToken ? null : currentFrame))
      setSceneRetryRevision((revision) => revision + 1)
      return
    }

    if (currentFinishPairState === 'error') {
      setFinishPairStatus({ revision: surfaceMaterialRevision, state: 'loading' })
      setFinishRetryRevision((revision) => revision + 1)
    }
  }, [
    currentFinishPairState,
    currentSurfaceLoadState,
    surfaceAssetUrl,
    surfaceMaterialRevision,
    surfaceResourceKey,
    surfaceToken,
  ])

  const enterTouchInteraction = useCallback(() => {
    cameraRestoreRef.current?.()
    modelRotationResetRef.current?.()
    setTouchInteractionRevision(surfaceRevision)
  }, [cameraRestoreRef, modelRotationResetRef, surfaceRevision])

  const exitTouchInteraction = useCallback(() => {
    cameraRestoreRef.current?.()
    modelRotationResetRef.current?.()
    setTouchInteractionRevision(null)
  }, [cameraRestoreRef, modelRotationResetRef])

  useLayoutEffect(() => {
    const parent = isDesktop ? mediaViewportRef.current : mediaSlotRefs.current[surfaceSlotIndex]
    if (!parent) return undefined

    // Move one stable portal container, never change the portal target/remount its Canvas.
    // On mobile the browser now moves/composites the live frame and poster as one slide.
    parent.append(surfaceHost)
    return () => {
      surfaceHost.remove()
    }
  }, [isDesktop, mediaSlotRefs, mediaViewportRef, surfaceHost, surfaceSlotIndex])

  const surfaceMetadata =
    loadedSurfaceMetadata?.resourceKey === surfaceResourceKey ? loadedSurfaceMetadata.metadata : null

  const createRenderer = useCallback(
    (defaultProps: WebGLRendererParameters) => {
      try {
        return new WebGLRenderer({ ...defaultProps, ...CANVAS_GL_OPTIONS })
      } catch (error: unknown) {
        handleSceneError()
        throw error
      }
    },
    [handleSceneError],
  )

  return createPortal(
    <div ref={surfaceRef} className="relative size-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          opacity: isSurfaceVisible ? 1 : 0,
          transition:
            shouldReduceMotion || !isSurfaceVisible ? 'none' : `opacity ${REVEAL_FADE_DURATION_MS}ms ${REVEAL_EASING}`,
        }}
      >
        <SceneErrorBoundary key={sceneRetryRevision} onError={handleSceneError}>
          <Canvas
            camera={CANVAS_CAMERA_OPTIONS}
            className="block size-full"
            dpr={CANVAS_DPR}
            frameloop="demand"
            gl={createRenderer}
            onCreated={configureRenderer}
            resize={{ scroll: false, offsetSize: !isDesktop }}
            shadows
            style={{ pointerEvents: canInteract ? 'auto' : 'none', touchAction: canInteract ? 'none' : 'auto' }}
          >
            <ShowcaseLighting />
            <SceneErrorBoundary key={surfaceToken} onError={handleSceneError}>
              <Suspense fallback={null}>
                {surfaceMetadata ? (
                  <CabinModel
                    cabin={surfaceCabin}
                    cameraRestoreRef={cameraRestoreRef}
                    controlsRef={controlsRef}
                    finishRetryRevision={finishRetryRevision}
                    isDesktop={isDesktop}
                    isInteractive={canInteract}
                    metadata={surfaceMetadata}
                    modelRotationResetRef={modelRotationResetRef}
                    onError={handleSceneError}
                    onFinishStatus={handleFinishStatus}
                    onFrameReady={handleFrameReady}
                    selectedExteriorId={normalizedExteriorId}
                    selectedInteriorId={selectedInterior}
                    surfaceRef={surfaceRef}
                    surfaceToken={surfaceToken}
                  />
                ) : null}
              </Suspense>
            </SceneErrorBoundary>
          </Canvas>
        </SceneErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        {showSurfaceError || showFinishError ? (
          <div
            role="alert"
            className="text-body-xs pointer-events-auto absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-card/95 px-3 py-2 text-foreground shadow-sm backdrop-blur-sm"
          >
            <span>{showFinishError ? labels.finishError : labels.error}</span>
            <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
              {labels.retry}
            </Button>
          </div>
        ) : null}

        {showEnterInteraction ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={`${labels.enter}. ${labels.hintMobile}`}
            className="pointer-events-auto absolute end-3 bottom-3 shadow-sm"
            onClick={enterTouchInteraction}
          >
            {labels.enter}
          </Button>
        ) : null}

        {!isDesktop && isTouchInteraction && isSurfaceVisible ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={labels.exit}
            className="pointer-events-auto absolute end-3 top-3 shadow-sm"
            onClick={exitTouchInteraction}
          >
            {labels.exit}
          </Button>
        ) : null}

        {isDesktop && isSurfaceVisible && !showFinishError ? (
          <span className="text-body-xs absolute start-3 bottom-3 rounded-md bg-card/75 px-2 py-1 text-foreground/80 backdrop-blur-sm">
            {labels.hintDesktop}
          </span>
        ) : null}
      </div>
    </div>,
    surfaceHost,
  )
}

function ShowcaseLighting() {
  return (
    <>
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <hemisphereLight args={['#fffaf0', '#8b938f', 1.2]} />
      <directionalLight position={[-5, 9, 6]} intensity={2.2} color="#fff2dd" />
      <directionalLight position={[5, 6, 4]} intensity={1.4} color="#e5efff" />
      <directionalLight position={[0, 8, -6]} intensity={1.8} color="#fff5e4" />
    </>
  )
}

function CabinMountedLighting({ cabinId }: { readonly cabinId: Cabin['id'] }) {
  const lighting =
    cabinId === 'aster'
      ? { exterior: ASTER_EXTERIOR_LAMP_LIGHTS, interior: [] as const }
      : cabinId === 'veyra'
        ? { exterior: VEYRA_EXTERIOR_LAMP_LIGHTS, interior: VEYRA_INTERIOR_LIGHTS }
        : { exterior: EXTERIOR_LAMP_LIGHTS, interior: NIVA_INTERIOR_LIGHTS }

  return (
    <>
      {lighting.exterior.map((light) => (
        <MountedSpotlight
          key={light.position.join(',')}
          angle={1.2}
          color="#ffb267"
          decay={2}
          distance={3}
          intensity={5}
          penumbra={0.75}
          position={light.position}
          target={light.target}
        />
      ))}
      {lighting.interior.map((light) =>
        light.kind === 'spot' ? (
          <MountedSpotlight
            key={light.position.join(',')}
            angle={light.angle}
            color={light.color}
            decay={light.decay}
            distance={light.distance}
            intensity={light.intensity}
            penumbra={light.penumbra}
            position={light.position}
            target={light.target}
          />
        ) : (
          <pointLight
            key={light.position.join(',')}
            position={light.position}
            intensity={light.intensity}
            distance={light.distance}
            decay={light.decay}
            color={light.color}
          />
        ),
      )}
    </>
  )
}

interface MountedSpotlightProps {
  readonly angle: number
  readonly color: string
  readonly decay: number
  readonly distance: number
  readonly intensity: number
  readonly penumbra: number
  readonly position: LightPosition
  readonly target: LightPosition
}

function MountedSpotlight({
  angle,
  color,
  decay,
  distance,
  intensity,
  penumbra,
  position,
  target,
}: MountedSpotlightProps) {
  const { invalidate } = useThree()
  const lightRef = useRef<SpotLight | null>(null)
  const targetRef = useRef<Object3D | null>(null)

  useLayoutEffect(() => {
    configureSpotlight(lightRef.current, targetRef.current)
    invalidate()
  }, [invalidate])

  return (
    <>
      <spotLight
        ref={lightRef}
        angle={angle}
        color={color}
        decay={decay}
        distance={distance}
        intensity={intensity}
        penumbra={penumbra}
        position={position}
        castShadow
        shadow-bias={-0.0001}
        shadow-camera-far={distance}
        shadow-camera-near={0.01}
        shadow-mapSize={[SHOWCASE_SHADOW_MAP_SIZE, SHOWCASE_SHADOW_MAP_SIZE]}
        shadow-normalBias={0.01}
      />
      <object3D ref={targetRef} position={target} />
    </>
  )
}

function configureRenderer({ gl }: RootState) {
  gl.outputColorSpace = SRGBColorSpace
  gl.toneMapping = AgXToneMapping
  gl.toneMappingExposure = 1.4
}

function configureSpotlight(light: SpotLight | null, target: Object3D | null) {
  if (!light || !target) return

  light.target = target
  light.target.updateMatrixWorld()
  light.shadow.camera.near = 0.01
  light.shadow.camera.far = 3
  light.shadow.camera.updateProjectionMatrix()
}

function configureSceneShadows(scene: Object3D) {
  scene.traverse((object) => {
    if (!isMeshLike(object)) return

    const materials = getMaterials(object.material)
    const isOpaque = materials.every((material) => !isTransparentShadowMaterial(material))

    object.castShadow = isOpaque
    object.receiveShadow = isOpaque
  })
}

function isTransparentShadowMaterial(material: Material) {
  const physicalMaterial = material as Material & { readonly transmission?: number }

  return (
    material.name.toLowerCase().includes('glazing') ||
    material.transparent ||
    material.opacity < 1 ||
    (physicalMaterial.transmission ?? 0) > 0
  )
}

function CabinModel({
  cabin,
  cameraRestoreRef,
  controlsRef,
  finishRetryRevision,
  isDesktop,
  isInteractive,
  metadata,
  modelRotationResetRef,
  onError,
  onFinishStatus,
  onFrameReady,
  selectedExteriorId,
  selectedInteriorId,
  surfaceRef,
  surfaceToken,
}: CabinModelProps) {
  const { scene } = useGLTF(cabin.threeD.assetUrl) as { scene: Object3D }
  const { camera, get, gl, invalidate } = useThree()
  const materialTargetsRef = useRef<PreparedMaterialTargets | null>(null)
  const calibratedSizeRef = useRef<SurfaceSize | null>(null)
  const appliedRevisionRef = useRef<string | null>(null)
  const reportedRevisionRef = useRef<string | null>(null)
  const modelRotationGroupRef = useRef<Group | null>(null)
  const targetModelRotationYRef = useRef(0)
  const currentCameraElevationRef = useRef(0)
  const targetCameraElevationRef = useRef(0)
  const canonicalCameraPositionRef = useRef(new Vector3())
  const canonicalCameraQuaternionRef = useRef(new Quaternion())
  const cameraTargetRef = useRef(new Vector3())
  const canonicalCameraOffsetRef = useRef(new Vector3())
  const cameraOrbitAxisRef = useRef(new Vector3())
  const cameraOrbitQuaternionRef = useRef(new Quaternion())
  const cameraOrbitOffsetRef = useRef(new Vector3())
  const materialRevision = `${cabin.threeD.assetUrl}:${selectedExteriorId}:${selectedInteriorId}`
  const manifestUrl = cabin.threeD.manifestUrl

  const resetCameraElevation = useCallback(() => {
    currentCameraElevationRef.current = 0
    targetCameraElevationRef.current = 0
    invalidate()
  }, [invalidate])

  const applyCameraElevation = useCallback(() => {
    const cameraTarget = cameraTargetRef.current
    const canonicalCameraOffset = canonicalCameraOffsetRef.current
    const cameraDistance = camera.position.distanceTo(cameraTarget)

    if (canonicalCameraOffset.lengthSq() === 0 || cameraDistance <= Number.EPSILON) return

    const orbitQuaternion = cameraOrbitQuaternionRef.current.setFromAxisAngle(
      cameraOrbitAxisRef.current,
      currentCameraElevationRef.current,
    )
    const orbitOffset = cameraOrbitOffsetRef.current
      .copy(canonicalCameraOffset)
      .applyQuaternion(orbitQuaternion)
      .setLength(cameraDistance)

    camera.position.copy(cameraTarget).add(orbitOffset)
    camera.quaternion.copy(canonicalCameraQuaternionRef.current).premultiply(orbitQuaternion)
    camera.updateMatrixWorld(true)
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
  }, [camera])

  const resetModelRotation = useCallback(() => {
    targetModelRotationYRef.current = 0
    if (modelRotationGroupRef.current) modelRotationGroupRef.current.rotation.set(0, 0, 0)
    resetCameraElevation()
    invalidate()
  }, [invalidate, resetCameraElevation])

  useLayoutEffect(() => {
    const worldMatrix = matrixFromRows(metadata.camera.matrix_world_gltf)
    worldMatrix.decompose(canonicalCameraPositionRef.current, canonicalCameraQuaternionRef.current, new Vector3())
    cameraTargetRef.current.fromArray(metadata.camera.target_gltf)
    canonicalCameraOffsetRef.current.copy(canonicalCameraPositionRef.current).sub(cameraTargetRef.current)
    cameraOrbitAxisRef.current.set(1, 0, 0).applyQuaternion(canonicalCameraQuaternionRef.current).normalize()
    resetCameraElevation()
  }, [metadata.camera, resetCameraElevation])

  useFrame((_, delta) => {
    const modelRotationGroup = modelRotationGroupRef.current
    if (!modelRotationGroup) return

    const currentRotationY = modelRotationGroup.rotation.y
    const nextRotationY = MathUtils.damp(
      currentRotationY,
      targetModelRotationYRef.current,
      MODEL_ROTATION_DAMPING,
      delta,
    )
    const nextCameraElevation = MathUtils.damp(
      currentCameraElevationRef.current,
      targetCameraElevationRef.current,
      CAMERA_ELEVATION_DAMPING,
      delta,
    )
    const modelRotationSettled =
      Math.abs(nextRotationY - targetModelRotationYRef.current) <= MODEL_ROTATION_SETTLE_EPSILON
    const cameraElevationSettled =
      Math.abs(nextCameraElevation - targetCameraElevationRef.current) <= CAMERA_ELEVATION_SETTLE_EPSILON

    if (modelRotationSettled) {
      modelRotationGroup.rotation.y = targetModelRotationYRef.current
    } else {
      modelRotationGroup.rotation.y = nextRotationY
      invalidate()
    }

    if (cameraElevationSettled) {
      if (currentCameraElevationRef.current !== targetCameraElevationRef.current) {
        currentCameraElevationRef.current = targetCameraElevationRef.current
        applyCameraElevation()
        invalidate()
      }
    } else {
      currentCameraElevationRef.current = nextCameraElevation
      applyCameraElevation()
      invalidate()
    }
  })

  useEffect(() => {
    if (!isInteractive) return undefined

    const canvas = gl.domElement
    const pointerIds = new Set<number>()
    let activePointerId: number | null = null
    let lastPointerPosition: { readonly x: number; readonly y: number } | null = null
    const clearActivePointer = (pointerId: number) => {
      pointerIds.delete(pointerId)
      if (activePointerId === pointerId) {
        activePointerId = null
        lastPointerPosition = null
      }

      if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId)
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.target !== canvas) return

      pointerIds.add(event.pointerId)
      if (!event.isPrimary || pointerIds.size > 1) {
        // OrbitControls owns pinch zoom. Do not also turn the model with the primary finger.
        activePointerId = null
        lastPointerPosition = null
        return
      }

      activePointerId = event.pointerId
      lastPointerPosition = { x: event.clientX, y: event.clientY }
      canvas.setPointerCapture(event.pointerId)
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId || lastPointerPosition === null) return

      const previousPointerPosition = lastPointerPosition
      lastPointerPosition = { x: event.clientX, y: event.clientY }

      targetModelRotationYRef.current += (event.clientX - previousPointerPosition.x) * MODEL_ROTATION_DRAG_SENSITIVITY
      targetCameraElevationRef.current = MathUtils.clamp(
        targetCameraElevationRef.current -
          (event.clientY - previousPointerPosition.y) * CAMERA_ELEVATION_DRAG_SENSITIVITY,
        -CAMERA_ELEVATION_LIMIT,
        CAMERA_ELEVATION_LIMIT,
      )
      // Let OrbitControls' document listeners receive movement and pointer-up for zoom/cleanup.
      invalidate()
    }
    const handlePointerEnd = (event: PointerEvent) => {
      if (!pointerIds.has(event.pointerId)) return

      clearActivePointer(event.pointerId)
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerEnd)
    canvas.addEventListener('pointercancel', handlePointerEnd)
    canvas.addEventListener('lostpointercapture', handlePointerEnd)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerEnd)
      canvas.removeEventListener('pointercancel', handlePointerEnd)
      canvas.removeEventListener('lostpointercapture', handlePointerEnd)

      pointerIds.forEach((pointerId) => clearActivePointer(pointerId))
    }
  }, [gl, invalidate, isInteractive])

  useLayoutEffect(() => {
    cameraRestoreRef.current?.()
    modelRotationResetRef.current = resetModelRotation
    resetModelRotation()

    return () => {
      if (modelRotationResetRef.current === resetModelRotation) modelRotationResetRef.current = null
    }
  }, [cameraRestoreRef, modelRotationResetRef, resetModelRotation, surfaceToken])

  useLayoutEffect(() => {
    try {
      configureSceneShadows(scene)
      materialTargetsRef.current = prepareMaterialTargets(scene, metadata.manifest)
    } catch {
      materialTargetsRef.current = null
      onError()
    }

    return () => {
      materialTargetsRef.current = null
    }
  }, [metadata.manifest, onError, scene])

  const handleCameraConfigured = useCallback(
    (size: SurfaceSize) => {
      calibratedSizeRef.current = size
      invalidate()
    },
    [invalidate],
  )

  useEffect(() => {
    const targets = materialTargetsRef.current
    const exteriorPreset = findPreset(metadata.manifest.groups.exterior.presets, selectedExteriorId)
    const interiorPreset = findPreset(metadata.manifest.groups.interior.presets, selectedInteriorId)
    const currentRevision = materialRevision

    appliedRevisionRef.current = null
    reportedRevisionRef.current = null

    if (!targets || !exteriorPreset || !interiorPreset) {
      onFinishStatus({ revision: currentRevision, state: 'error' })
      onError()
      return undefined
    }

    let isCurrent = true
    onFinishStatus({ revision: currentRevision, state: 'loading' })

    void applyFinishPair({
      exterior: { preset: exteriorPreset, target: targets.exterior },
      interior: { preset: interiorPreset, target: targets.interior },
      manifestUrl,
      isCurrent: () => isCurrent,
    })
      .then(() => {
        if (!isCurrent) return

        appliedRevisionRef.current = currentRevision
        onFinishStatus({ revision: currentRevision, state: 'ready' })
        invalidate()
      })
      .catch(() => {
        if (isCurrent) onFinishStatus({ revision: currentRevision, state: 'error' })
      })

    return () => {
      isCurrent = false
    }
  }, [
    invalidate,
    finishRetryRevision,
    manifestUrl,
    materialRevision,
    metadata.manifest,
    onError,
    onFinishStatus,
    scene,
    selectedExteriorId,
    selectedInteriorId,
  ])

  const handleAfterRender = useCallback(() => {
    const appliedRevision = appliedRevisionRef.current
    const surface = surfaceRef.current
    const calibratedSize = calibratedSizeRef.current
    const { size } = get()

    if (
      !surface ||
      !calibratedSize ||
      size.width <= 0 ||
      size.height <= 0 ||
      Math.round(size.width) !== surface.clientWidth ||
      Math.round(size.height) !== surface.clientHeight ||
      calibratedSize.width !== size.width ||
      calibratedSize.height !== size.height ||
      appliedRevision !== materialRevision ||
      reportedRevisionRef.current === appliedRevision
    ) {
      return
    }

    reportedRevisionRef.current = appliedRevision
    onFrameReady({
      surfaceToken,
      cabinId: cabin.id,
      exteriorId: selectedExteriorId,
      interiorId: selectedInteriorId,
    })
  }, [cabin.id, get, materialRevision, onFrameReady, selectedExteriorId, selectedInteriorId, surfaceRef, surfaceToken])

  return (
    <>
      <CameraResizeCalibration
        cameraRestoreRef={cameraRestoreRef}
        contract={metadata.camera}
        controlsRef={controlsRef}
        isDesktop={isDesktop}
        model={scene}
        onBeforeRestore={resetCameraElevation}
        onConfigured={handleCameraConfigured}
      />
      <group ref={modelRotationGroupRef}>
        <primitive object={scene} dispose={null} />
        <CabinMountedLighting cabinId={cabin.id} />
      </group>
      <RenderReadinessProbe onAfterRender={handleAfterRender} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={isInteractive}
        enableRotate={false}
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.08}
        minDistance={cabin.threeD.minDistance}
        maxDistance={cabin.threeD.maxDistance}
        minPolarAngle={1.15}
        maxPolarAngle={2.05}
        rotateSpeed={0.7}
        zoomSpeed={0.7}
        target={metadata.camera.target_gltf}
      />
    </>
  )
}

function CameraResizeCalibration({
  cameraRestoreRef,
  contract,
  controlsRef,
  isDesktop,
  model,
  onBeforeRestore,
  onConfigured,
}: {
  readonly cameraRestoreRef: RefObject<(() => void) | null>
  readonly contract: CameraContract
  readonly controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>
  readonly isDesktop: boolean
  readonly model: Object3D
  readonly onBeforeRestore: () => void
  readonly onConfigured: (size: SurfaceSize) => void
}) {
  const { camera, invalidate, size } = useThree()
  const restoreCanonicalCamera = useCallback(() => {
    const aspect = size.width / Math.max(size.height, 1)
    const perspectiveCamera = camera as PerspectiveCamera

    onBeforeRestore()
    setCanonicalCamera(perspectiveCamera, aspect, contract)

    const controls = controlsRef.current
    if (controls) {
      controls.target.fromArray(contract.target_gltf)
      controls.update()
    }

    const framingScale = isDesktop
      ? getDesktopFramingScale({
          camera: perspectiveCamera,
          canvasHeight: size.height,
          model,
          viewportWidth: getDesktopViewportWidth(),
        })
      : 1

    applyOffAxisProjection(perspectiveCamera, aspect, contract, framingScale)
    invalidate()
  }, [camera, contract, controlsRef, invalidate, isDesktop, model, onBeforeRestore, size.height, size.width])

  useEffect(() => {
    if (!isDesktop) return undefined

    const handleViewportResize = () => {
      restoreCanonicalCamera()
    }

    window.addEventListener('resize', handleViewportResize)

    return () => {
      window.removeEventListener('resize', handleViewportResize)
    }
  }, [isDesktop, restoreCanonicalCamera])

  useLayoutEffect(() => {
    cameraRestoreRef.current = restoreCanonicalCamera
    restoreCanonicalCamera()
    onConfigured({ width: size.width, height: size.height })

    return () => {
      if (cameraRestoreRef.current === restoreCanonicalCamera) {
        cameraRestoreRef.current = null
      }
    }
  }, [cameraRestoreRef, onConfigured, restoreCanonicalCamera, size.height, size.width])

  return null
}

function RenderReadinessProbe({ onAfterRender }: { readonly onAfterRender: () => void }) {
  const callbackRef = useRef(onAfterRender)

  useLayoutEffect(() => {
    callbackRef.current = onAfterRender
  }, [onAfterRender])

  return (
    <mesh frustumCulled={false} renderOrder={10_000} onAfterRender={() => callbackRef.current()}>
      <planeGeometry args={[0.001, 0.001]} />
      <meshBasicMaterial colorWrite={false} depthTest={false} depthWrite={false} opacity={0} transparent />
    </mesh>
  )
}

async function applyFinishPair({
  exterior,
  interior,
  isCurrent,
  manifestUrl,
}: {
  readonly exterior: { readonly preset: PresetDefinition; readonly target: PreparedMaterialTarget }
  readonly interior: { readonly preset: PresetDefinition; readonly target: PreparedMaterialTarget }
  readonly isCurrent: () => boolean
  readonly manifestUrl: string
}) {
  const [exteriorMap, interiorMap] = await Promise.all([
    resolveFinishMap(exterior.preset, exterior.target, manifestUrl),
    resolveFinishMap(interior.preset, interior.target, manifestUrl),
  ])

  if (!isCurrent()) return

  applyFinishMaterialState(exterior.target, exteriorMap, exterior.preset.roughnessMultiplier)
  applyFinishMaterialState(interior.target, interiorMap, interior.preset.roughnessMultiplier)
}

async function resolveFinishMap(
  preset: PresetDefinition,
  target: PreparedMaterialTarget,
  manifestUrl: string,
): Promise<Texture | null> {
  if (preset.baseColorTexture.source === 'embedded-default') {
    return target.originalMap
  }

  const uri = preset.baseColorTexture.uri
  if (uri === undefined || uri.length === 0) {
    throw new Error(`Finish preset ${preset.id} has no texture URI`)
  }

  const texture = await loadFinishTexture(resolveFinishTextureUrl(uri, manifestUrl), target.originalMap)
  configureFinishTexture(texture, target.originalMap)
  return texture
}

function applyFinishMaterialState(target: PreparedMaterialTarget, map: Texture | null, roughnessMultiplier: number) {
  const hadMap = target.material.map !== null
  target.material.map = map
  target.material.roughness = target.baselineRoughness * roughnessMultiplier

  if (hadMap !== (map !== null)) target.material.needsUpdate = true
}

function preloadSelectedFinishTextures(
  manifestUrl: string,
  metadata: CabinMetadata,
  selectedExterior: CabinExteriorFinishId,
  selectedInterior: InteriorPresetId,
) {
  const exteriorPreset = findPreset(
    metadata.manifest.groups.exterior.presets,
    normalizeExteriorFinishId(selectedExterior),
  )
  const interiorPreset = findPreset(metadata.manifest.groups.interior.presets, selectedInterior)
  const requests: Array<Promise<Texture>> = []

  for (const preset of [exteriorPreset, interiorPreset]) {
    if (preset?.baseColorTexture.source !== 'external') continue

    const uri = preset.baseColorTexture.uri
    if (uri === undefined || uri.length === 0) continue

    requests.push(loadFinishTexture(resolveFinishTextureUrl(uri, manifestUrl)))
  }

  void Promise.allSettled(requests)
}

function preloadCabinResources({
  cabinId,
  assetUrl,
  manifestUrl,
  cameraUrl,
  selectedExterior,
  selectedInterior,
}: {
  readonly cabinId: Cabin['id']
  readonly assetUrl: string
  readonly manifestUrl: string
  readonly cameraUrl: string
  readonly selectedExterior: CabinExteriorFinishId
  readonly selectedInterior: InteriorPresetId
}) {
  void preloadCabinResource({ cabinId, assetUrl, manifestUrl, cameraUrl })
    .then((metadata) => {
      preloadSelectedFinishTextures(manifestUrl, metadata, selectedExterior, selectedInterior)
    })
    .catch(() => undefined)
}

function preloadCabinResource({
  cabinId,
  assetUrl,
  manifestUrl,
  cameraUrl,
}: {
  readonly cabinId: Cabin['id']
  readonly assetUrl: string
  readonly manifestUrl: string
  readonly cameraUrl: string
}): Promise<CabinMetadata> {
  const resourceKey = getCabinResourceKey(cabinId, assetUrl, manifestUrl, cameraUrl)

  if (!preloadedCabinResourceKeys.has(resourceKey)) {
    preloadedCabinResourceKeys.add(resourceKey)
    useGLTF.preload(assetUrl)
  }

  const metadata = getCabinMetadata(cabinId, assetUrl, manifestUrl, cameraUrl)
  void metadata.catch(() => {
    preloadedCabinResourceKeys.delete(resourceKey)
  })

  return metadata
}

function getCabinMetadata(
  cabinId: Cabin['id'],
  assetUrl: string,
  manifestUrl: string,
  cameraUrl: string,
): Promise<CabinMetadata> {
  const resourceKey = getCabinResourceKey(cabinId, assetUrl, manifestUrl, cameraUrl)
  const cachedMetadata = cabinMetadataCache.get(resourceKey)
  if (cachedMetadata) return Promise.resolve(cachedMetadata)

  const pendingMetadata = cabinMetadataPromises.get(resourceKey)
  if (pendingMetadata) return pendingMetadata

  const metadataPromise = Promise.all([fetchJson(manifestUrl), fetchJson(cameraUrl)])
    .then(([manifestValue, cameraValue]) => {
      const manifest = parsePresetManifest(manifestValue, cabinId, assetUrl)
      const camera = parseCameraContract(cameraValue, cabinId)
      const metadata = { manifest, camera }
      cabinMetadataCache.set(resourceKey, metadata)
      return metadata
    })
    .catch((error: unknown) => {
      cabinMetadataPromises.delete(resourceKey)
      throw error
    })

  cabinMetadataPromises.set(resourceKey, metadataPromise)
  return metadataPromise
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Cabin metadata request failed with ${response.status}`)

  return response.json()
}

function parsePresetManifest(value: unknown, cabinId: Cabin['id'], assetUrl: string): PresetManifest {
  const assetName = assetUrl.split('/').at(-1)

  if (
    !isRecord(value) ||
    !isPositiveInteger(value.schemaVersion) ||
    !isNonEmptyString(value.asset) ||
    assetName === undefined ||
    value.asset !== assetName ||
    !isRecord(value.defaults) ||
    !isRecord(value.groups)
  ) {
    throwInvalidMetadata(cabinId, 'preset manifest')
  }

  const exterior = parsePresetGroup(value.groups.exterior, 'exterior', cabinId)
  const interior = parsePresetGroup(value.groups.interior, 'interior', cabinId)
  const exteriorDefault = value.defaults.exterior
  const interiorDefault = value.defaults.interior

  if (
    !isExteriorPresetId(exteriorDefault) ||
    !isInteriorPresetId(interiorDefault) ||
    exteriorDefault !== exterior.default ||
    interiorDefault !== interior.default
  ) {
    throwInvalidMetadata(cabinId, 'preset defaults')
  }

  return {
    schemaVersion: value.schemaVersion,
    asset: value.asset,
    defaults: {
      exterior: exteriorDefault,
      interior: interiorDefault,
    },
    groups: { exterior, interior },
  }
}

function parsePresetGroup(value: unknown, group: 'exterior' | 'interior', cabinId: Cabin['id']): PresetGroup {
  if (!isRecord(value) || !isNonEmptyString(value.material) || !isPresetIdForGroup(value.default, group)) {
    throwInvalidMetadata(cabinId, `${group} preset group`)
  }

  if (!Array.isArray(value.presets) || value.presets.length === 0) {
    throwInvalidMetadata(cabinId, `${group} preset definitions`)
  }

  const presets = value.presets.map((preset) => parsePresetDefinition(preset, group, cabinId))
  if (!presets.some((preset) => preset.id === value.default)) {
    throwInvalidMetadata(cabinId, `${group} preset default`)
  }

  return {
    material: value.material,
    default: value.default,
    presets,
  }
}

function parsePresetDefinition(value: unknown, group: 'exterior' | 'interior', cabinId: Cabin['id']): PresetDefinition {
  if (
    !isRecord(value) ||
    !isPresetIdForGroup(value.id, group) ||
    !isNonEmptyString(value.label) ||
    !isRecord(value.baseColorTexture) ||
    !isFinishTextureSource(value.baseColorTexture.source) ||
    !isPositiveFiniteNumber(value.roughnessMultiplier)
  ) {
    throwInvalidMetadata(cabinId, `${group} preset definition`)
  }

  if (value.baseColorTexture.source === 'external') {
    if (!isNonEmptyString(value.baseColorTexture.uri)) {
      throwInvalidMetadata(cabinId, `${group} external preset texture`)
    }

    return {
      id: value.id,
      label: value.label,
      baseColorTexture: { source: 'external', uri: value.baseColorTexture.uri },
      roughnessMultiplier: value.roughnessMultiplier,
    }
  }

  return {
    id: value.id,
    label: value.label,
    baseColorTexture: { source: 'embedded-default' },
    roughnessMultiplier: value.roughnessMultiplier,
  }
}

function parseCameraContract(value: unknown, cabinId: Cabin['id']): CameraContract {
  if (
    !isRecord(value) ||
    !isMatrixRows(value.matrix_world_gltf) ||
    !isMatrixRows(value.projection_matrix) ||
    !isVector3(value.target_gltf) ||
    !isPositiveFiniteNumber(value.near) ||
    !isPositiveFiniteNumber(value.far) ||
    value.far <= value.near
  ) {
    throwInvalidMetadata(cabinId, 'camera contract')
  }

  const imageValue = value.image
  let image: CameraContract['image']
  if (imageValue !== undefined) {
    if (!isRecord(imageValue) || !isPositiveInteger(imageValue.width) || !isPositiveInteger(imageValue.height)) {
      throwInvalidMetadata(cabinId, 'camera image dimensions')
    }

    image = { width: imageValue.width, height: imageValue.height }
  }

  const aspectRatio = value.aspect_ratio
  if (aspectRatio !== undefined && !isPositiveFiniteNumber(aspectRatio)) {
    throwInvalidMetadata(cabinId, 'camera aspect ratio')
  }

  return {
    matrix_world_gltf: value.matrix_world_gltf,
    projection_matrix: value.projection_matrix,
    target_gltf: value.target_gltf,
    near: value.near,
    far: value.far,
    ...(image === undefined ? {} : { image }),
    ...(aspectRatio === undefined ? {} : { aspect_ratio: aspectRatio }),
  }
}

function throwInvalidMetadata(cabinId: Cabin['id'], resource: string): never {
  throw new Error(`Invalid ${resource} metadata for ${cabinId}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && isPositiveFiniteNumber(value)
}

function isMatrixRows(value: unknown): value is MatrixRows {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((row) => Array.isArray(row) && row.length === 4 && row.every((entry) => isFiniteNumber(entry)))
  )
}

function isVector3(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every((entry) => isFiniteNumber(entry))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isFinishTextureSource(value: unknown): value is FinishTextureSource {
  return value === 'embedded-default' || value === 'external'
}

function isPresetIdForGroup(value: unknown, group: 'exterior' | 'interior'): value is FinishPresetId {
  return group === 'exterior' ? isExteriorPresetId(value) : isInteriorPresetId(value)
}

function isExteriorPresetId(value: unknown): value is ExteriorPresetId {
  return value === 'natural-timber' || value === 'whitewashed-timber' || value === 'charred-black-oil'
}

function isInteriorPresetId(value: unknown): value is InteriorPresetId {
  return value === 'light-oak' || value === 'warm-ash' || value === 'dark-walnut'
}

function getCabinResourceKey(cabinId: Cabin['id'], assetUrl: string, manifestUrl: string, cameraUrl: string) {
  return `${cabinId}:${assetUrl}:${manifestUrl}:${cameraUrl}`
}

function canSpeculativelyPreload() {
  if (document.visibilityState !== 'visible') return false

  const connection = (
    navigator as Navigator & {
      readonly connection?: {
        readonly effectiveType?: string
        readonly saveData?: boolean
      }
    }
  ).connection

  return connection?.saveData !== true && connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g'
}

function scheduleIdleWork(callback: () => void) {
  const idleWindow = window as unknown as {
    requestIdleCallback?: (callback: () => void) => number
    cancelIdleCallback?: (handle: number) => void
  }

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const handle = idleWindow.requestIdleCallback(callback)

    return () => {
      if (typeof idleWindow.cancelIdleCallback === 'function') idleWindow.cancelIdleCallback(handle)
    }
  }

  const handle = window.setTimeout(callback, 200)

  return () => window.clearTimeout(handle)
}

function findPreset(presets: ReadonlyArray<PresetDefinition>, id: FinishPresetId) {
  return presets.find((preset) => preset.id === id)
}

function loadFinishTexture(url: string, originalMap: Texture | null = null): Promise<Texture> {
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

function prepareMaterialTargets(scene: Object3D, manifest: PresetManifest): PreparedMaterialTargets {
  const cachedTargets = preparedMaterialTargetsCache.get(scene)
  if (cachedTargets) return cachedTargets

  const targetNames = new Set([manifest.groups.exterior.material, manifest.groups.interior.material])
  const clones = new Map<string, PresetMaterial>()
  const targets = new Map<string, PreparedMaterialTarget>()

  scene.traverse((object) => {
    if (!isMeshLike(object)) return

    const hasMaterialArray = Array.isArray(object.material)
    const currentMaterials = getMaterials(object.material)
    const nextMaterials = currentMaterials.map((material) => {
      if (!targetNames.has(material.name)) return material

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
        })
      }

      return clone
    })

    if (nextMaterials.some((material, index) => material !== currentMaterials[index])) {
      object.material = hasMaterialArray ? [...nextMaterials] : (nextMaterials[0] ?? object.material)
    }
  })

  const exterior = targets.get(manifest.groups.exterior.material)
  const interior = targets.get(manifest.groups.interior.material)
  if (!exterior || !interior) throw new Error(`Cabin finish material boundary is missing from ${manifest.asset}`)

  const preparedTargets = { exterior, interior }
  preparedMaterialTargetsCache.set(scene, preparedTargets)
  return preparedTargets
}

function setCanonicalCamera(camera: PerspectiveCamera, aspect: number, contract: CameraContract) {
  const worldMatrix = matrixFromRows(contract.matrix_world_gltf)
  worldMatrix.decompose(camera.position, camera.quaternion, camera.scale)
  camera.near = contract.near
  camera.far = contract.far
  camera.matrixWorld.copy(worldMatrix)
  camera.matrixWorldInverse.copy(worldMatrix).invert()
  camera.matrixAutoUpdate = true
  applyOffAxisProjection(camera, aspect, contract)
  camera.updateMatrixWorld(true)
}

function applyOffAxisProjection(camera: Camera, aspect: number, contract: CameraContract, framingScale = 1) {
  const canonicalAspect = getCanonicalAspect(contract)
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : canonicalAspect
  const safeFramingScale = Number.isFinite(framingScale) && framingScale > 0 ? framingScale : 1
  const rows = contract.projection_matrix
  const projection = new Matrix4().set(
    ((rows[0][0] * canonicalAspect) / safeAspect) * safeFramingScale,
    rows[0][1],
    rows[0][2],
    rows[0][3],
    rows[1][0],
    rows[1][1] * safeFramingScale,
    rows[1][2],
    rows[1][3],
    rows[2][0],
    rows[2][1],
    rows[2][2],
    rows[2][3],
    rows[3][0],
    rows[3][1],
    rows[3][2],
    rows[3][3],
  )

  camera.projectionMatrix.copy(projection)
  camera.projectionMatrixInverse.copy(projection).invert()
}

function getCanonicalAspect(contract: CameraContract) {
  if (typeof contract.aspect_ratio === 'number' && contract.aspect_ratio > 0) return contract.aspect_ratio
  if (contract.image && contract.image.width > 0 && contract.image.height > 0)
    return contract.image.width / contract.image.height

  return 1
}

function getDesktopProjectedHeight(viewportWidth: number) {
  return MathUtils.clamp(
    DESKTOP_FRAMING.intercept + viewportWidth * DESKTOP_FRAMING.slope,
    DESKTOP_FRAMING.minHeight,
    DESKTOP_FRAMING.maxHeight,
  )
}

function getDesktopViewportWidth() {
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth

  return Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 1280
}

function getDesktopFramingScale({
  camera,
  canvasHeight,
  model,
  viewportWidth,
}: {
  readonly camera: PerspectiveCamera
  readonly canvasHeight: number
  readonly model: Object3D
  readonly viewportWidth: number
}) {
  if (canvasHeight <= 0 || viewportWidth <= 0) return 1

  const boundingBoxCorners = getModelBoundingBoxCorners(model)
  if (boundingBoxCorners === null) return 1

  const measuredHeight = getProjectedModelHeight(boundingBoxCorners, camera, canvasHeight)
  if (measuredHeight === null || measuredHeight <= Number.EPSILON) return 1

  const framingScale = getDesktopProjectedHeight(viewportWidth) / measuredHeight

  return Number.isFinite(framingScale) && framingScale > 0 ? framingScale : 1
}

function getModelBoundingBoxCorners(model: Object3D): ReadonlyArray<Vector3> | null {
  model.updateWorldMatrix(true, true)

  const bounds = new Box3().setFromObject(model)
  if (bounds.isEmpty()) return null

  const { min, max } = bounds

  return [
    new Vector3(min.x, min.y, min.z),
    new Vector3(min.x, min.y, max.z),
    new Vector3(min.x, max.y, min.z),
    new Vector3(min.x, max.y, max.z),
    new Vector3(max.x, min.y, min.z),
    new Vector3(max.x, min.y, max.z),
    new Vector3(max.x, max.y, min.z),
    new Vector3(max.x, max.y, max.z),
  ]
}

function getProjectedModelHeight(
  boundingBoxCorners: ReadonlyArray<Vector3>,
  camera: PerspectiveCamera,
  canvasHeight: number,
) {
  const projectedPoint = new Vector3()
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const corner of boundingBoxCorners) {
    projectedPoint.copy(corner).project(camera)
    if (!Number.isFinite(projectedPoint.y)) return null

    minY = Math.min(minY, projectedPoint.y)
    maxY = Math.max(maxY, projectedPoint.y)
  }

  return ((maxY - minY) * canvasHeight) / 2
}

function matrixFromRows(rows: MatrixRows) {
  return new Matrix4().set(
    rows[0][0],
    rows[0][1],
    rows[0][2],
    rows[0][3],
    rows[1][0],
    rows[1][1],
    rows[1][2],
    rows[1][3],
    rows[2][0],
    rows[2][1],
    rows[2][2],
    rows[2][3],
    rows[3][0],
    rows[3][1],
    rows[3][2],
    rows[3][3],
  )
}

function normalizeExteriorFinishId(id: CabinExteriorFinishId): ExteriorPresetId {
  return EXTERIOR_PRESET_IDS[id]
}

function resolveFinishTextureUrl(uri: string, manifestUrl: string) {
  return new URL(uri, new URL(manifestUrl, window.location.href)).href
}

function isMeshLike(object: Object3D): object is Mesh {
  return object instanceof Mesh
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

export { InteractiveShowcase3DRuntime }
