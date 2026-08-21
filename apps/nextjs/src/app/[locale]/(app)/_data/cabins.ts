import type { Locale } from '~/i18n/routing'

import {
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
    readonly area: string
    readonly layout: string
  }
  readonly showcase: {
    readonly description: string
    readonly price: string
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
  const formatArea = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const formatPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
  const cabinsById = {
    niva: {
      id: 'niva',
      name: 'Niva',
      specs: {
        area: `${formatArea.format(20)} m²`,
        layout: cabin_niva_layout({}, messageOptions),
      },
      showcase: {
        description: cabin_niva_description({}, messageOptions),
        price: formatPrice.format(130_000),
      },
      images: {
        overview: '/images/huts/niva/Niva.jpg',
        exteriors: {
          wood: '/images/huts/niva/Niva-wood.png',
          black: '/images/huts/niva/Niva-black.png',
          white: '/images/huts/niva/Niva-white.png',
        },
        floorPlan: '/images/huts/niva/Niva-floorplan.jpg',
        overviewAlt: cabin_niva_overview_alt({}, messageOptions),
        floorPlanAlt: cabin_niva_floor_plan_alt({}, messageOptions),
      },
    },
    aster: {
      id: 'aster',
      name: 'Aster',
      specs: {
        area: `${formatArea.format(39)} m²`,
        layout: cabin_aster_layout({}, messageOptions),
      },
      showcase: {
        description: cabin_aster_description({}, messageOptions),
        price: formatPrice.format(170_000),
      },
      images: {
        overview: '/images/huts/aster/Aster.jpg',
        exteriors: {
          wood: '/images/huts/aster/Aster-wood.png',
          black: '/images/huts/aster/Aster-black.png',
          white: '/images/huts/aster/Aster-white.png',
        },
        floorPlan: '/images/huts/aster/Aster-floorplan.jpg',
        overviewAlt: cabin_aster_overview_alt({}, messageOptions),
        floorPlanAlt: cabin_aster_floor_plan_alt({}, messageOptions),
      },
    },
    veyra: {
      id: 'veyra',
      name: 'Veyra',
      specs: {
        area: `${formatArea.format(56)} m²`,
        layout: cabin_veyra_layout({}, messageOptions),
      },
      showcase: {
        description: cabin_veyra_description({}, messageOptions),
        price: formatPrice.format(210_000),
      },
      images: {
        overview: '/images/huts/veyra/Veyra.jpg',
        exteriors: {
          wood: '/images/huts/veyra/Veyra-wood.png',
          black: '/images/huts/veyra/Veyra-black.png',
          white: '/images/huts/veyra/Veyra-white.png',
        },
        floorPlan: '/images/huts/veyra/Veyra-floorplan.jpg',
        overviewAlt: cabin_veyra_overview_alt({}, messageOptions),
        floorPlanAlt: cabin_veyra_floor_plan_alt({}, messageOptions),
      },
    },
  } as const satisfies Record<CabinId, Cabin>

  return {
    cabinsById,
    cabins: [cabinsById.niva, cabinsById.aster, cabinsById.veyra],
  }
}

export type { Cabin, CabinCatalog, CabinExteriorFinishId, CabinId }
export { createCabinCatalog }
