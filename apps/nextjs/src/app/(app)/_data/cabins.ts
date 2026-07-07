const cabinsById = {
  niva: {
    id: 'niva',
    name: 'Niva',
    specs: {
      area: '20 m²',
      layout: 'Sleeping loft',
    },
    images: {
      overview: '/images/huts/niva/Niva.jpg',
      blackExterior: '/images/huts/niva/Niva-black.png',
      overviewAlt: 'Niva cabin surrounded by forest',
    },
  },
  aster: {
    id: 'aster',
    name: 'Aster',
    specs: {
      area: '39 m²',
      layout: 'Studio',
    },
    images: {
      overview: '/images/huts/aster/Aster.jpg',
      blackExterior: '/images/huts/aster/Aster-black.png',
      overviewAlt: 'Aster cabin surrounded by forest',
    },
  },
  veyra: {
    id: 'veyra',
    name: 'Veyra',
    specs: {
      area: '56 m²',
      layout: '1 Bedroom',
    },
    images: {
      overview: '/images/huts/veyra/Veyra.jpg',
      blackExterior: '/images/huts/veyra/Veyra-black.png',
      overviewAlt: 'Veyra cabin surrounded by forest',
    },
  },
} as const

const cabins = [cabinsById.niva, cabinsById.aster, cabinsById.veyra] as const

type Cabin = (typeof cabins)[number]

export { cabins, cabinsById, type Cabin }
