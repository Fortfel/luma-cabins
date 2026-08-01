'use client'

import type { ImageComparisonValueTextContext } from '@workspace/ui/components/image-comparison'

import { ImageComparisonSlider } from '@workspace/ui/components/image-comparison'

const getValueText = ({ announcedPosition, position }: ImageComparisonValueTextContext) => {
  if (position === 0) {
    return 'Unwind fully shown'
  }

  if (position === 100) {
    return 'Focus fully shown'
  }

  return `${announcedPosition}% Focus, ${100 - announcedPosition}% Unwind`
}

function InteriorComparisonSlider() {
  return <ImageComparisonSlider aria-label="Compare Focus and Unwind interior directions" getValueText={getValueText} />
}

export { InteriorComparisonSlider }
