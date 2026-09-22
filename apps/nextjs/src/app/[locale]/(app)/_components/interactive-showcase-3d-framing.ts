import type { CSSProperties } from 'react'
import type { CabinId } from '~/app/[locale]/(app)/_data/cabins'

// 300px @ 1280px -> 400px @ 1660px. Shared by the camera and its poster fallback.
const DESKTOP_FRAMING = { minHeight: 300, maxHeight: 400, intercept: -36.848, slope: 0.26316 } as const

// Projected mesh silhouettes from the production GLBs and canonical camera contracts.
// Desktop dimensions/offsets are relative to the projected world-bounds height, not the cropped PNG height.
const POSTER_FRAMING = {
  niva: {
    width: 0.875722,
    height: 0.898151,
    offsetX: 0.075794,
    offsetY: 0.017008,
    originX: 0.423455,
    originY: 0.482199,
    mobileWidth: 0.831983,
    mobileHeight: 0.94,
    mobileLeft: 0.495463,
    mobileTop: 0.5,
  },
  aster: {
    width: 1.712709,
    height: 0.893844,
    offsetX: -0.026019,
    offsetY: 0.026259,
    originX: 0.509647,
    originY: 0.497276,
    mobileWidth: 0.890708,
    mobileHeight: 0.873012,
    mobileLeft: 0.496116,
    mobileTop: 0.522923,
  },
  veyra: {
    width: 2.013483,
    height: 0.91659,
    offsetX: -0.033784,
    offsetY: 0.021871,
    originX: 0.5,
    originY: 0.470532,
    mobileWidth: 0.840942,
    mobileHeight: 0.940087,
    mobileLeft: 0.48589,
    mobileTop: 0.492963,
  },
} as const

function getShowcasePosterStyle(cabinId: CabinId): CSSProperties & Record<`--showcase-${string}`, string> {
  const framing = POSTER_FRAMING[cabinId]
  const { minHeight, maxHeight, intercept, slope } = DESKTOP_FRAMING

  return {
    '--showcase-frame-height': `clamp(${minHeight}px, calc(${intercept}px + ${slope * 100}vw), ${maxHeight}px)`,
    '--showcase-poster-width': `${framing.mobileWidth * 100}%`,
    '--showcase-poster-height': `${framing.mobileHeight * 100}%`,
    '--showcase-poster-left': `${framing.mobileLeft * 100}%`,
    '--showcase-poster-top': `${framing.mobileTop * 100}%`,
    '--showcase-poster-desktop-width': `calc(var(--showcase-frame-height) * ${framing.width})`,
    '--showcase-poster-desktop-height': `calc(var(--showcase-frame-height) * ${framing.height})`,
    '--showcase-poster-desktop-left': `calc(${framing.originX * 100}% + var(--showcase-frame-height) * ${framing.offsetX})`,
    '--showcase-poster-desktop-top': `calc(${framing.originY * 100}% + var(--showcase-frame-height) * ${framing.offsetY})`,
  }
}

export { DESKTOP_FRAMING, getShowcasePosterStyle }
