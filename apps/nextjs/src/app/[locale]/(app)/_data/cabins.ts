import type { Locale } from '~/i18n/routing'

import {
  cabin_area,
  cabin_aster_description,
  cabin_aster_floor_plan_alt,
  cabin_aster_layout,
  cabin_aster_overview_alt,
  cabin_niva_description,
  cabin_niva_floor_plan_alt,
  cabin_niva_layout,
  cabin_niva_overview_alt,
  cabin_veyra_description,
  cabin_veyra_floor_plan_alt,
  cabin_veyra_layout,
  cabin_veyra_overview_alt,
} from '~/paraglide/messages.js'

type CabinId = 'aster' | 'niva' | 'veyra'
type CabinExteriorFinishId = 'black' | 'white' | 'wood'

interface Cabin {
  readonly id: CabinId
  readonly name: string
  readonly specs: {
    readonly areaSquareMeters: number
    readonly area: string
    readonly layout: string
  }
  readonly showcase: {
    readonly description: string
    readonly priceEur: number
  }
  readonly threeD: {
    readonly assetUrl: string
    readonly manifestUrl: string
    readonly cameraUrl: string
    readonly minDistance: number
    readonly maxDistance: number
  }
  readonly images: {
    readonly overview: string
    readonly exteriors: Record<CabinExteriorFinishId, string>
    readonly overviewAlt: string
    readonly floorPlan: string
    readonly floorPlanAlt: string
  }
}

interface CabinCatalog {
  readonly cabins: ReadonlyArray<Cabin>
  readonly cabinsById: Record<CabinId, Cabin>
}

const createCabinCatalog = (locale: Locale): CabinCatalog => {
  const messageOptions = { locale }
  const cabinsById = {
    niva: {
      id: 'niva',
      name: 'Niva',
      specs: {
        areaSquareMeters: 20,
        area: cabin_area({ area: 20 }, messageOptions),
        layout: cabin_niva_layout({}, messageOptions),
      },
      showcase: {
        description: cabin_niva_description({}, messageOptions),
        priceEur: 130_000,
      },
      threeD: {
        assetUrl: '/cabin-3d/niva/niva-configurator.glb',
        manifestUrl: '/cabin-3d/niva/niva-presets.json',
        cameraUrl: '/cabin-3d/niva/niva-camera.json',
        minDistance: 12,
        maxDistance: 21,
      },
      images: {
        overview: '/images/cabins/niva/Niva.jpg',
        exteriors: {
          wood: '/images/cabins/niva/Niva-wood.png',
          black: '/images/cabins/niva/Niva-black.png',
          white: '/images/cabins/niva/Niva-white.png',
        },
        floorPlan: '/images/cabins/niva/Niva-floorplan.jpg',
        overviewAlt: cabin_niva_overview_alt({}, messageOptions),
        floorPlanAlt: cabin_niva_floor_plan_alt({}, messageOptions),
      },
    },
    aster: {
      id: 'aster',
      name: 'Aster',
      specs: {
        areaSquareMeters: 39,
        area: cabin_area({ area: 39 }, messageOptions),
        layout: cabin_aster_layout({}, messageOptions),
      },
      showcase: {
        description: cabin_aster_description({}, messageOptions),
        priceEur: 170_000,
      },
      threeD: {
        assetUrl: '/cabin-3d/aster/aster-configurator.glb',
        manifestUrl: '/cabin-3d/aster/aster-presets.json',
        cameraUrl: '/cabin-3d/aster/aster-camera.json',
        minDistance: 16,
        maxDistance: 42,
      },
      images: {
        overview: '/images/cabins/aster/Aster.jpg',
        exteriors: {
          wood: '/images/cabins/aster/Aster-wood.png',
          black: '/images/cabins/aster/Aster-black.png',
          white: '/images/cabins/aster/Aster-white.png',
        },
        floorPlan: '/images/cabins/aster/Aster-floorplan.jpg',
        overviewAlt: cabin_aster_overview_alt({}, messageOptions),
        floorPlanAlt: cabin_aster_floor_plan_alt({}, messageOptions),
      },
    },
    veyra: {
      id: 'veyra',
      name: 'Veyra',
      specs: {
        areaSquareMeters: 56,
        area: cabin_area({ area: 56 }, messageOptions),
        layout: cabin_veyra_layout({}, messageOptions),
      },
      showcase: {
        description: cabin_veyra_description({}, messageOptions),
        priceEur: 210_000,
      },
      threeD: {
        assetUrl: '/cabin-3d/veyra/veyra-configurator.glb',
        manifestUrl: '/cabin-3d/veyra/veyra-presets.json',
        cameraUrl: '/cabin-3d/veyra/veyra-camera.json',
        minDistance: 18,
        maxDistance: 46,
      },
      images: {
        overview: '/images/cabins/veyra/Veyra.jpg',
        exteriors: {
          wood: '/images/cabins/veyra/Veyra-wood.png',
          black: '/images/cabins/veyra/Veyra-black.png',
          white: '/images/cabins/veyra/Veyra-white.png',
        },
        floorPlan: '/images/cabins/veyra/Veyra-floorplan.jpg',
        overviewAlt: cabin_veyra_overview_alt({}, messageOptions),
        floorPlanAlt: cabin_veyra_floor_plan_alt({}, messageOptions),
      },
    },
  } as const satisfies Record<CabinId, Cabin>

  return {
    cabinsById,
    cabins: [cabinsById.veyra, cabinsById.aster, cabinsById.niva],
  }
}

export type { Cabin, CabinCatalog, CabinExteriorFinishId, CabinId }
export { createCabinCatalog }
