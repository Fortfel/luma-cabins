import type * as React from 'react'

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

import { InteriorComparisonSlider } from '~/app/(app)/_components/interior-comparison-slider'

const COMPARISON_IMAGE_SIZES = '(max-width: 1919px) 100vw, 1920px'

function InteriorComparisonSection({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section className={cn('4xl:px-4', className)} {...props}>
      <div
        className={cn(
          'container-page-3xl mb-4 flex flex-col gap-5 text-left text-foreground',
          'sm:mb-5 md:mb-5',
          'md:grid md:grid-cols-16 md:items-end',
        )}
      >
        <h2 className="text-clamp-24-36 leading-tight font-medium text-balance md:col-span-9">
          Your space, your story.
        </h2>
        <p className="text-clamp-14-16 max-w-sm leading-tight text-pretty md:col-span-full md:col-start-10">
          Customize your cabin to match your lifestyle, from the way each room works to the details that make it yours.
        </p>
      </div>

      <div className="container-page-4xl container-bleed">
        <ImageComparison defaultValue={56} className="4xl:rounded-xl aspect-3/2 md:aspect-video">
          <ImageComparisonLeft>
            <Image
              src="/images/huts/veyra/Veyra-interior-left-primary.jpg"
              alt="Light-oak cabin interior arranged around a built-in workspace and living area."
              fill
              sizes={COMPARISON_IMAGE_SIZES}
              draggable={false}
              className="pointer-events-none object-cover object-center"
            />
            <ImageComparisonLabel className="bottom-4 left-4 md:bottom-6 md:left-6">
              <p className="text-sm leading-tight font-semibold md:text-base">Focus</p>
              <p className="mt-0.5 text-xs leading-tight opacity-80 md:text-sm">Light oak</p>
            </ImageComparisonLabel>
          </ImageComparisonLeft>

          <ImageComparisonRight>
            <Image
              src="/images/huts/veyra/Veyra-interior-left-alternate.jpg"
              alt="Lounge-oriented cabin interior with seating and dark-walnut built-in storage."
              fill
              sizes={COMPARISON_IMAGE_SIZES}
              draggable={false}
              className="pointer-events-none object-cover object-center"
            />
            <ImageComparisonLabel className="right-4 bottom-4 md:right-6 md:bottom-6">
              <p className="text-sm leading-tight font-semibold md:text-base">Unwind</p>
              <p className="mt-0.5 text-xs leading-tight opacity-80 md:text-sm">Dark walnut</p>
            </ImageComparisonLabel>
          </ImageComparisonRight>

          <InteriorComparisonSlider />
          <ImageComparisonDivider />
          <ImageComparisonHandle />
        </ImageComparison>
      </div>
    </section>
  )
}

export { InteriorComparisonSection }
