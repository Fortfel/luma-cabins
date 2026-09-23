import type { CabinExteriorFinishId, CabinId } from '~/app/[locale]/(app)/_data/cabins'

type CabinInteriorPaletteId = 'light-oak' | 'warm-ash' | 'dark-walnut'

interface InteractiveShowcaseConfiguration {
  readonly cabinId: CabinId
  readonly exterior: CabinExteriorFinishId
  readonly interior: CabinInteriorPaletteId
}

function getConfigurationPoster({ cabinId, exterior, interior }: InteractiveShowcaseConfiguration) {
  return `/images/showcase/configurations/${cabinId}/${exterior}-${interior}.jpg`
}

export type { CabinInteriorPaletteId, InteractiveShowcaseConfiguration }
export { getConfigurationPoster }
