'use client'

import type { ComponentType, RefObject } from 'react'
import type { CabinInteriorPaletteId } from './interactive-showcase-configuration'
import type { Cabin, CabinExteriorFinishId } from '~/app/[locale]/(app)/_data/cabins'

import { useEffect, useState } from 'react'

import { Button } from '@workspace/ui/components/button'

interface LiveSurfaceVisibility {
  readonly isVisible: boolean
  readonly revision: number
  readonly cabinId: Cabin['id']
  readonly hasError: boolean
}

interface InteractiveShowcase3DProps {
  readonly activeCabin: Cabin
  readonly intentCabin: Cabin | null
  readonly isDesktop: boolean
  readonly isRequested: boolean
  readonly isSectionNear: boolean
  readonly hostRef: RefObject<HTMLDivElement | null>
  readonly onLiveSurfaceVisibilityChange: (visibility: LiveSurfaceVisibility) => void
  readonly selectedExterior: CabinExteriorFinishId
  readonly selectedInterior: CabinInteriorPaletteId
  readonly speculativeCabin: Cabin | null
  readonly shouldReduceMotion: boolean
  readonly surfaceCabin: Cabin
  readonly surfaceRevision: number
  readonly labels: {
    readonly enter: string
    readonly error: string
    readonly exit: string
    readonly finishError: string
    readonly hintDesktop: string
    readonly hintMobile: string
    readonly retry: string
  }
}

function InteractiveShowcase3D(props: InteractiveShowcase3DProps) {
  const [Runtime, setRuntime] = useState<ComponentType<InteractiveShowcase3DProps> | null>(null)
  const [hasBundleError, setHasBundleError] = useState(false)
  const [retryRevision, setRetryRevision] = useState(0)
  const { isRequested, onLiveSurfaceVisibilityChange, surfaceCabin, surfaceRevision } = props

  // Import only after client intent/proximity. Handle chunk failures here, outside
  // the runtime's scene boundary, so the poster and dialog close button survive.
  useEffect(() => {
    if (!isRequested) return undefined
    let isCurrent = true
    void import('./interactive-showcase-3d-runtime')
      .then((module) => {
        if (isCurrent) setRuntime(() => module.InteractiveShowcase3DRuntime)
      })
      .catch(() => {
        if (isCurrent) setHasBundleError(true)
      })
    return () => {
      isCurrent = false
    }
  }, [isRequested, retryRevision])

  useEffect(() => {
    if (hasBundleError) {
      onLiveSurfaceVisibilityChange({
        isVisible: false,
        hasError: true,
        cabinId: surfaceCabin.id,
        revision: surfaceRevision,
      })
    }
  }, [hasBundleError, onLiveSurfaceVisibilityChange, surfaceCabin.id, surfaceRevision])

  if (!props.isRequested) {
    return null
  }

  if (hasBundleError) {
    return (
      <div
        role="alert"
        className="absolute inset-x-3 bottom-3 z-30 flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
      >
        <span>{props.labels.error}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setHasBundleError(false)
            onLiveSurfaceVisibilityChange({
              isVisible: false,
              hasError: false,
              cabinId: surfaceCabin.id,
              revision: surfaceRevision,
            })
            setRetryRevision((revision) => revision + 1)
          }}
        >
          {props.labels.retry}
        </Button>
      </div>
    )
  }

  return Runtime ? <Runtime {...props} /> : null
}

export type { InteractiveShowcase3DProps, LiveSurfaceVisibility }
export { InteractiveShowcase3D }
