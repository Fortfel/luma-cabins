const cabinsById = {
  niva: {
    id: 'niva',
    name: 'Niva',
    specs: {
      area: '20 m²',
      layout: 'Sleeping loft',
    },
    showcase: {
      description:
        'A compact loft cabin for focused escapes. Tall glass, efficient storage, and everything needed for two.',
      price: '€130,000',
    },
    images: {
      overview: '/images/huts/niva/Niva.jpg',
      exteriors: {
        wood: '/images/huts/niva/Niva-wood.png',
        black: '/images/huts/niva/Niva-black.png',
        white: '/images/huts/niva/Niva-white.png',
      },
      floorPlan: '/images/huts/niva/Niva-floorplan.jpg',
      overviewAlt: 'Niva cabin surrounded by forest',
      floorPlanAlt: 'Niva cabin floor plan',
    },
  },
  aster: {
    id: 'aster',
    name: 'Aster',
    specs: {
      area: '39 m²',
      layout: 'Studio',
    },
    showcase: {
      description:
        'A one-bedroom retreat for weekends and couples. Open living, a quiet bedroom, and a deck that opens to the view.',
      price: '€170,000',
    },
    images: {
      overview: '/images/huts/aster/Aster.jpg',
      exteriors: {
        wood: '/images/huts/aster/Aster-wood.png',
        black: '/images/huts/aster/Aster-black.png',
        white: '/images/huts/aster/Aster-white.png',
      },
      floorPlan: '/images/huts/aster/Aster-floorplan.jpg',
      overviewAlt: 'Aster cabin surrounded by forest',
      floorPlanAlt: 'Aster cabin floor plan',
    },
  },
  veyra: {
    id: 'veyra',
    name: 'Veyra',
    specs: {
      area: '56 m²',
      layout: '1 Bedroom',
    },
    showcase: {
      description:
        'A larger hideaway with room to host. Separate sleep zones, generous living space, and a strong indoor-outdoor flow.',
      price: '€210,000',
    },
    images: {
      overview: '/images/huts/veyra/Veyra.jpg',
      exteriors: {
        wood: '/images/huts/veyra/Veyra-wood.png',
        black: '/images/huts/veyra/Veyra-black.png',
        white: '/images/huts/veyra/Veyra-white.png',
      },
      floorPlan: '/images/huts/veyra/Veyra-floorplan.jpg',
      overviewAlt: 'Veyra cabin surrounded by forest',
      floorPlanAlt: 'Veyra cabin floor plan',
    },
  },
} as const

const cabins = [cabinsById.niva, cabinsById.aster, cabinsById.veyra] as const

type Cabin = (typeof cabins)[number]
type CabinExteriorFinishId = keyof Cabin['images']['exteriors']

export type { Cabin, CabinExteriorFinishId }
export { cabins, cabinsById }
