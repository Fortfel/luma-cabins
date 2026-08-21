'use client'

import type { ImageComparisonValueTextContext } from '@workspace/ui/components/image-comparison'
import type { Locale } from '~/i18n/routing'

import { ImageComparisonSlider } from '@workspace/ui/components/image-comparison'

import { interior_position } from '~/paraglide/messages.js'

interface InteriorComparisonSliderProps {
  readonly locale: Locale
  readonly focusFullLabel: string
  readonly unwindFullLabel: string
  readonly comparisonLabel: string
}

function InteriorComparisonSlider({
  locale,
  focusFullLabel,
  unwindFullLabel,
  comparisonLabel,
}: InteriorComparisonSliderProps) {
  const formatPercentage = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const getValueText = ({ announcedPosition, position }: ImageComparisonValueTextContext) => {
    if (position === 0) {
      return unwindFullLabel
    }

    if (position === 100) {
      return focusFullLabel
    }

    return interior_position(
      {
        focusPercent: formatPercentage.format(announcedPosition),
        unwindPercent: formatPercentage.format(100 - announcedPosition),
      },
      { locale },
    )
  }

  return <ImageComparisonSlider aria-label={comparisonLabel} getValueText={getValueText} />
}

export { InteriorComparisonSlider }
