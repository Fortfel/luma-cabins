import type * as React from 'react'
import type { Locale } from '~/i18n/routing'

import Image from 'next/image'

import {
  ImageComparison,
  ImageComparisonDivider,
  ImageComparisonHandle,
  ImageComparisonLabel,
  ImageComparisonLeft,
  ImageComparisonRight,
} from '@workspace/ui/components/image-comparison'
import { cn } from '@workspace/ui/lib/utils'

import { InteriorComparisonSlider } from '~/app/[locale]/(app)/_components/interior-comparison-slider'
import {
  interior_compare_label,
  interior_description,
  interior_focus,
  interior_focus_alt,
  interior_focus_finish,
  interior_focus_full,
  interior_title,
  interior_unwind,
  interior_unwind_alt,
  interior_unwind_finish,
  interior_unwind_full,
} from '~/paraglide/messages.js'

const COMPARISON_IMAGE_SIZES = '(max-width: 1919px) 100vw, 1920px'

interface InteriorComparisonSectionProps extends React.ComponentProps<'section'> {
  readonly locale: Locale
}

function InteriorComparisonSection({ locale, className, ...props }: InteriorComparisonSectionProps) {
  const messageOptions = { locale }
  const focusLabel = interior_focus({}, messageOptions)
  const unwindLabel = interior_unwind({}, messageOptions)

  return (
    <section className={className} {...props}>
      <div
        className={cn(
          'container-page-3xl mb-4 flex flex-col gap-3 text-left text-foreground',
          'sm:mb-5 md:mb-5',
          'md:grid md:grid-cols-16 md:items-end',
        )}
      >
        <h2 className="text-heading-md text-balance md:col-span-9">{interior_title({}, messageOptions)}</h2>
        <p className="text-body-sm max-w-sm leading-tight text-pretty md:col-span-full md:col-start-10">
          {interior_description({}, messageOptions)}
        </p>
      </div>

      <div className="container-page-4xl container-bleed 4xl:[--container-min-margin:1rem]">
        <ImageComparison defaultValue={56} className="4xl:rounded-xl aspect-3/2 md:aspect-video">
          <ImageComparisonLeft>
            <Image
              src="/images/huts/veyra/Veyra-interior-left-primary.jpg"
              alt={interior_focus_alt({}, messageOptions)}
              fill
              sizes={COMPARISON_IMAGE_SIZES}
              draggable={false}
              className="pointer-events-none object-cover object-center"
            />
            <ImageComparisonLabel className="bottom-4 left-4 md:bottom-6 md:left-6">
              <p className="text-sm leading-tight font-semibold md:text-base">{focusLabel}</p>
              <p className="mt-0.5 text-xs leading-tight opacity-80 md:text-sm">
                {interior_focus_finish({}, messageOptions)}
              </p>
            </ImageComparisonLabel>
          </ImageComparisonLeft>

          <ImageComparisonRight>
            <Image
              src="/images/huts/veyra/Veyra-interior-left-alternate.jpg"
              alt={interior_unwind_alt({}, messageOptions)}
              fill
              sizes={COMPARISON_IMAGE_SIZES}
              draggable={false}
              className="pointer-events-none object-cover object-center"
            />
            <ImageComparisonLabel className="right-4 bottom-4 md:right-6 md:bottom-6">
              <p className="text-sm leading-tight font-semibold md:text-base">{unwindLabel}</p>
              <p className="mt-0.5 text-xs leading-tight opacity-80 md:text-sm">
                {interior_unwind_finish({}, messageOptions)}
              </p>
            </ImageComparisonLabel>
          </ImageComparisonRight>

          <InteriorComparisonSlider
            locale={locale}
            focusFullLabel={interior_focus_full({}, messageOptions)}
            unwindFullLabel={interior_unwind_full({}, messageOptions)}
            comparisonLabel={interior_compare_label({}, messageOptions)}
          />
          <ImageComparisonDivider />
          <ImageComparisonHandle />
        </ImageComparison>
      </div>
    </section>
  )
}

export { InteriorComparisonSection }
