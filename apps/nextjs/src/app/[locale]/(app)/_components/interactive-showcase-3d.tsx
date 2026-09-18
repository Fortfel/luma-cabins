'use client'

import type { RefObject } from 'react'
import type { Cabin, CabinExteriorFinishId } from '~/app/[locale]/(app)/_data/cabins'

import dynamic from 'next/dynamic'

interface PositionSyncRef {
  current: (() => void) | null
}

interface LiveSurfaceVisibility {
  readonly isVisible: boolean
  readonly revision: number
}

interface InteractiveShowcase3DProps {
  readonly activeCabin: Cabin
  readonly intentCabin: Cabin | null
  readonly isDesktop: boolean
  readonly isRequested: boolean
  readonly isSectionNear: boolean
  readonly mediaSlotRefs: RefObject<ReadonlyArray<HTMLDivElement | null>>
  readonly mediaViewportRef: RefObject<HTMLDivElement | null>
  readonly navigationDirection: 'next' | 'previous' | null
  readonly onLiveSurfaceVisibilityChange: (visibility: LiveSurfaceVisibility) => void
  readonly positionSyncRef: PositionSyncRef
  readonly selectedExterior: CabinExteriorFinishId
  readonly selectedInterior: 'dark-walnut' | 'light-oak' | 'warm-ash'
  readonly speculativeCabin: Cabin | null
  readonly shouldReduceMotion: boolean
  readonly surfaceCabin: Cabin
  readonly surfaceRevision: number
  readonly surfaceSlotIndex: number
  readonly labels: {
    readonly enter: string
    readonly error: string
    readonly exit: string
    readonly finishError: string
    readonly hintDesktop: string
    readonly hintMobile: string
    readonly loading: string
    readonly retry: string
    readonly updating: string
  }
}

const InteractiveShowcase3DRuntime = dynamic(
  () => import('./interactive-showcase-3d-runtime').then(({ InteractiveShowcase3DRuntime: Runtime }) => Runtime),
  {
    ssr: false,
    loading: () => null,
  },
)

function InteractiveShowcase3D(props: InteractiveShowcase3DProps) {
  if (!props.isRequested) {
    return null
  }

  return <InteractiveShowcase3DRuntime {...props} />
}

export type { InteractiveShowcase3DProps, LiveSurfaceVisibility, PositionSyncRef }
export { InteractiveShowcase3D }
