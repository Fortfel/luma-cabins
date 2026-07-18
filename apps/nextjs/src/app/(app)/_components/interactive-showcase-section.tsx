'use client'

import type * as React from 'react'
import type { CarouselApi } from '@workspace/ui/components/carousel'
import type { Cabin, CabinExteriorFinishId } from '~/app/(app)/_data/cabins'

import { useEffect, useId, useState } from 'react'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button, buttonVariants } from '@workspace/ui/components/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@workspace/ui/components/carousel'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog'
import { Label } from '@workspace/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query'
import { cn } from '@workspace/ui/lib/utils'

import {
  LandingSectionIntro,
  LandingSectionIntroEyebrow,
  LandingSectionIntroTitle,
} from '~/app/(app)/_components/landing-section-intro'
import { cabinsById } from '~/app/(app)/_data/cabins'
import { contactLinkOptions } from '~/app/(app)/_validations/app-link-options'

const SHOWCASE_CABINS = [
  {
    cabin: cabinsById.niva,
    imageAspectRatio: 954 / 866,
  },
  {
    cabin: cabinsById.aster,
    imageAspectRatio: 1309 / 697,
  },
  {
    cabin: cabinsById.veyra,
    imageAspectRatio: 1358 / 553,
  },
] as const
const FEATURED_INDEX = 0
const FEATURED_CABIN = cabinsById.niva
const INACTIVE_IMAGE_OPACITY = 0.45
const OPTICAL_OFFSET_ANCHORS = [
  { viewportWidth: 360, firstActiveNextOffset: 40, secondActiveNeighborOffset: 15 },
  // { viewportWidth: 500, firstActiveNextOffset: 70, secondActiveNeighborOffset: 20 },
  // { viewportWidth: 1000, firstActiveNextOffset: 150, secondActiveNeighborOffset: 50 },
  { viewportWidth: 1279, firstActiveNextOffset: 200, secondActiveNeighborOffset: 70 },
] as const
const ZERO_OPTICAL_OFFSETS = [0, 0, 0] as const

const EXTERIOR_FINISHES = [
  { id: 'wood', label: 'Timber', color: '#C2A06B' },
  { id: 'black', label: 'Charred wood', color: '#2E2A26' },
  { id: 'white', label: 'Oyster', color: '#E3E0D3' },
] as const satisfies ReadonlyArray<{ id: CabinExteriorFinishId; label: string; color: string }>

const DEFAULT_EXTERIOR_FINISH = EXTERIOR_FINISHES[0]

const INTERIOR_PALETTES = [
  { id: 'light-oak', label: 'Light oak', color: '#DCC79E' },
  { id: 'warm-ash', label: 'Warm ash', color: '#C2A988' },
  { id: 'dark-walnut', label: 'Dark walnut', color: '#5A4636' },
] as const

const DEFAULT_INTERIOR_PALETTE = INTERIOR_PALETTES[0]

type ExteriorFinishId = (typeof EXTERIOR_FINISHES)[number]['id']
type InteriorPaletteId = (typeof INTERIOR_PALETTES)[number]['id']
type FinishId = ExteriorFinishId | InteriorPaletteId
type ShowcaseSlideStyle = React.CSSProperties & {
  '--showcase-image-opacity': number
  '--showcase-optical-offset': string
  '--showcase-summary-opacity': number
}

function InteractiveShowcaseSection({ className, ...props }: React.ComponentProps<'section'>) {
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(FEATURED_INDEX)
  const [selectedExterior, setSelectedExterior] = useState<ExteriorFinishId>(DEFAULT_EXTERIOR_FINISH.id)
  const [selectedInterior, setSelectedInterior] = useState<InteriorPaletteId>(DEFAULT_INTERIOR_PALETTE.id)
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1280px)', { initializeWithValue: false }) === true

  const activeCabin = getCabinByIndex(activeIndex)
  const activeExterior = getExteriorFinish(selectedExterior)

  // Keep the visible model summary synchronized with Embla's selected snap, including after reinitialization.
  useEffect(() => {
    if (!api) {
      return undefined
    }

    const handleSelect = () => {
      setActiveIndex(api.selectedScrollSnap())
    }

    handleSelect()
    api.on('select', handleSelect)
    api.on('reInit', handleSelect)

    return () => {
      api.off('select', handleSelect)
      api.off('reInit', handleSelect)
    }
  }, [api])

  // Update visual tween variables during drag; CSS consumes them for opacity and optical positioning.
  useEffect(() => {
    if (!api) {
      return undefined
    }

    const handleScroll = () => {
      updateSlideTweenStyles({ api, isDesktop })
    }

    handleScroll()
    api.on('scroll', handleScroll)
    api.on('reInit', handleScroll)
    api.on('resize', handleScroll)

    return () => {
      api.off('scroll', handleScroll)
      api.off('reInit', handleScroll)
      api.off('resize', handleScroll)
    }
  }, [api, isDesktop])

  return (
    <section
      className={cn('flex flex-col gap-[clamp(3rem,calc(2.247rem+3.441vw),5rem)] overflow-hidden', className)}
      {...props}
    >
      <LandingSectionIntro>
        <LandingSectionIntroEyebrow>Make it yours</LandingSectionIntroEyebrow>
        <LandingSectionIntroTitle className="max-w-2xl text-balance">
          Three models. <i>Unlimited</i> adventures.
        </LandingSectionIntroTitle>
      </LandingSectionIntro>

      <div
        className={cn(
          'container-page flex flex-col items-center gap-5 pt-8 max-xl:px-0',
          'md:gap-6 md:pt-10',
          'xl:flex-row xl:gap-15',
        )}
      >
        <ConfigurationPanel
          activeCabin={activeCabin}
          selectedExterior={selectedExterior}
          selectedInterior={selectedInterior}
          onExteriorSelect={setSelectedExterior}
          onInteriorSelect={setSelectedInterior}
          onOpenFloorPlan={() => {
            setIsFloorPlanOpen(true)
          }}
          className="order-2 pt-2 md:pt-3 lg:pt-4 xl:order-1"
        />

        <div className={cn('order-1 w-full', 'xl:order-2 xl:min-w-0')}>
          <Carousel
            aria-label="Cabin model showcase"
            setApi={setApi}
            opts={{
              align: 'center',
              loop: false,
              watchDrag: !isDesktop,
              startIndex: FEATURED_INDEX,
              containScroll: false,
            }}
            className={cn(
              'w-full',
              !isDesktop &&
                '**:data-[slot=carousel-content]:cursor-grab **:data-[slot=carousel-content]:select-none **:data-[slot=carousel-content]:active:cursor-grabbing',
            )}
          >
            <CarouselContent
              className={cn('ms-0 items-start', 'gap-[clamp(2rem,calc(-1.485rem+15.931vw),11.25rem)]', 'xl:py-12.5')}
            >
              {SHOWCASE_CABINS.map(({ cabin, imageAspectRatio }, index) => (
                <CarouselItem
                  key={cabin.id}
                  aria-label={`${index + 1} of ${SHOWCASE_CABINS.length} — ${cabin.name}`}
                  style={getShowcaseSlideStyle(index === activeIndex)}
                  className={cn('flex w-auto basis-auto flex-col items-center ps-0', 'xl:w-full xl:basis-full')}
                >
                  <div className="flex transform-[translate3d(var(--showcase-optical-offset),0,0)] flex-col items-center gap-5 will-change-transform xl:transform-none">
                    <div
                      aria-hidden={index !== activeIndex}
                      className="w-full opacity-(--showcase-summary-opacity) will-change-[opacity] xl:hidden"
                    >
                      <ModelSummary cabin={cabin} className="items-center text-center" />
                    </div>

                    <div
                      style={{ aspectRatio: imageAspectRatio }}
                      className={cn(
                        '',
                        'h-[clamp(6rem,calc(1.197rem+21.959vw),18.75rem)]',
                        'xl:h-[clamp(16.25rem,calc(-2.5rem+23.438vw),20rem)]',
                        'opacity-(--showcase-image-opacity) will-change-[opacity]',
                      )}
                    >
                      <CabinImageCard cabin={cabin} finishId={selectedExterior} />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious
              variant="default"
              size="icon-lg"
              className="start-[12%] top-[60%] hidden size-12 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/85 active:-translate-y-1/2! md:inline-flex xl:hidden"
            />
            <CarouselNext
              variant="default"
              size="icon-lg"
              className="end-[12%] top-[60%] hidden size-12 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/85 active:-translate-y-1/2! md:inline-flex xl:hidden"
            />
            <div
              className={cn(
                'flex items-center justify-center pt-[clamp(1.75rem,calc(1.28rem+2.151vw),3rem)]',
                'xl:justify-between',
              )}
            >
              <div className="hidden items-center gap-4 xl:flex">
                <CarouselButton
                  direction="prev"
                  className="size-16 bg-primary text-primary-foreground hover:bg-primary/85 active:translate-none! [&>svg]:size-6!"
                />
                <CarouselButton
                  direction="next"
                  className="size-16 bg-primary text-primary-foreground hover:bg-primary/85 active:translate-none! [&>svg]:size-6!"
                />
              </div>
              <CarouselDots
                activeIndex={activeIndex}
                className="xl:hidden"
                onSelect={(index) => {
                  api?.scrollTo(index)
                }}
              />
              <CarouselThumbnails
                activeIndex={activeIndex}
                finishId={selectedExterior}
                className="hidden xl:flex"
                onSelect={(index) => {
                  api?.scrollTo(index)
                }}
              />
            </div>
          </Carousel>
        </div>

        <p className="sr-only" aria-live="polite">
          Showing {activeCabin.name} with {activeExterior.label.toLowerCase()} exterior and{' '}
          {getInteriorPalette(selectedInterior).label.toLowerCase()} interior.
        </p>
      </div>

      <FloorPlanDialog cabin={activeCabin} isOpen={isFloorPlanOpen} onOpenChange={setIsFloorPlanOpen} />
    </section>
  )
}

function ConfigurationPanel({
  activeCabin,
  selectedExterior,
  selectedInterior,
  onExteriorSelect,
  onInteriorSelect,
  onOpenFloorPlan,
  className,
}: {
  activeCabin: Cabin
  selectedExterior: ExteriorFinishId
  selectedInterior: InteriorPaletteId
  onExteriorSelect: (finishId: ExteriorFinishId) => void
  onInteriorSelect: (paletteId: InteriorPaletteId) => void
  onOpenFloorPlan: () => void
  className?: string
}) {
  const exteriorFinishLabelId = useId()
  const interiorPaletteLabelId = useId()

  return (
    <div className={cn('max-xl:container-page', 'xl:w-[clamp(28rem,calc(8rem+25vw),32rem)] xl:shrink-0', className)}>
      <div
        className={cn(
          'mx-auto grid max-w-[clamp(24rem,calc(14.652rem+42.730vw),42rem)] grid-cols-[auto_minmax(0,1fr)] items-center rounded-lg border border-border bg-card p-[clamp(1.5rem,calc(1.204rem+1.349vw),2.5rem)]',
          'gap-x-[clamp(0.75rem,calc(0.231rem+2.374vw),1.75rem)]',
          'gap-y-[clamp(1.25rem,calc(0.990rem+1.187vw),1.75rem)]',

          'md:grid-cols-[clamp(9.5rem,22vw,11rem)_minmax(0,1fr)]',
          'xl:flex xl:flex-col xl:items-stretch',
          'xl:gap-[clamp(1.5rem,1.65vw,1.75rem)]',
        )}
      >
        <ModelSummary cabin={activeCabin} className="hidden xl:flex" isDesktop />

        <div className="contents xl:flex xl:flex-col xl:items-start xl:gap-3">
          <p id={exteriorFinishLabelId} className="text-xs font-bold tracking-[0.125rem] text-foreground uppercase">
            Exterior <span className="hidden sm:inline">finish</span>
          </p>
          <RadioGroup
            aria-labelledby={exteriorFinishLabelId}
            value={selectedExterior}
            onValueChange={onExteriorSelect}
            className="flex flex-wrap items-center gap-2.5"
          >
            {EXTERIOR_FINISHES.map((finish) => (
              <FinishRadioItem key={finish.id} label={finish.label} color={finish.color} value={finish.id} />
            ))}
          </RadioGroup>
        </div>

        <div className="contents xl:flex xl:flex-col xl:items-start xl:gap-3">
          <p id={interiorPaletteLabelId} className="text-xs font-bold tracking-[0.125rem] text-foreground uppercase">
            Interior <span className="hidden sm:inline">palette</span>
          </p>
          <RadioGroup
            aria-labelledby={interiorPaletteLabelId}
            value={selectedInterior}
            onValueChange={onInteriorSelect}
            className="flex flex-wrap items-center gap-2.5"
          >
            {INTERIOR_PALETTES.map((palette) => (
              <FinishRadioItem key={palette.id} label={palette.label} color={palette.color} value={palette.id} />
            ))}
          </RadioGroup>
        </div>

        <div className="contents xl:flex xl:flex-col xl:items-start xl:gap-3">
          <p className="hidden text-xs font-bold tracking-[0.125rem] text-foreground uppercase sm:block">Pricing</p>
          <p className="text-clamp-14-16 col-span-2 text-foreground sm:col-span-1">
            <span>Starting at </span>
            <strong>{activeCabin.showcase.price}</strong>
            <span> plus installation.</span>
          </p>
        </div>

        <div className={cn('col-span-2 flex flex-col gap-3 pt-1', 'sm:flex-row sm:gap-4', 'xl:gap-6')}>
          <Link
            {...contactLinkOptions()}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-auto flex-1 px-7 py-3.75 text-sm font-bold md:flex-1 lg:text-[15px]',
            )}
          >
            Explore {activeCabin.name}
          </Link>
          <Button
            aria-haspopup="dialog"
            onClick={onOpenFloorPlan}
            variant="outline"
            size="lg"
            className="h-auto cursor-pointer bg-transparent px-7 py-3.75 text-sm font-bold text-secondary-foreground lg:text-[15px]"
          >
            View floor plan
          </Button>
        </div>
      </div>
    </div>
  )
}

function ModelSummary({
  cabin,
  className,
  isDesktop = false,
}: {
  cabin: Cabin
  className?: string
  isDesktop?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-3 text-foreground', className)}>
      <h3 className="text-clamp-32-52 font-heading leading-none font-medium">{cabin.name}</h3>
      <div className="text-clamp-14-20 flex gap-2 font-semibold">
        <span>{cabin.specs.area}</span>
        <span className="hidden text-muted-foreground sm:inline">|</span>
        <span className="hidden sm:inline">{cabin.specs.layout}</span>
      </div>
      {isDesktop && (
        <div className="flex min-h-[3lh] items-center">
          <p className="text-base text-pretty text-muted-foreground">{cabin.showcase.description}</p>
        </div>
      )}
    </div>
  )
}

function FinishRadioItem({ label, color, value }: { label: string; color: string; value: FinishId }) {
  const radioId = useId()

  // The native radio remains the interactive control while the label provides the swatch-style UI.
  return (
    <div className="relative">
      <RadioGroupItem
        id={radioId}
        value={value}
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0 after:hidden"
      />
      <Label
        htmlFor={radioId}
        className={cn(
          'flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-transparent text-sm font-medium text-foreground transition-[border-color,background-color]',
          'peer-focus-visible:ring-3 peer-focus-visible:ring-ring/80 peer-focus-visible:outline-none',
          'lg:h-10 lg:w-auto lg:gap-2 lg:px-3',
          'peer-data-checked:font-bold peer-data-checked:ring-2 peer-data-checked:ring-primary',
        )}
      >
        <span aria-hidden="true" className="size-7 rounded-full lg:size-4" style={{ backgroundColor: color }} />
        <span className="hidden lg:inline">{label}</span>
      </Label>
    </div>
  )
}

function CabinImageCard({
  cabin,
  finishId,
  className,
}: {
  cabin: Cabin
  finishId: ExteriorFinishId
  className?: string
}) {
  return (
    <div className={cn('relative size-full', className)}>
      <Image
        src={cabin.images.exteriors[finishId]}
        alt={`${cabin.name} cabin exterior in ${getExteriorFinish(finishId).label.toLowerCase()}`}
        fill
        sizes="(max-width: 767px) 400px, (max-width: 1279px) 700px, 800px"
        className="object-contain"
      />
    </div>
  )
}

function CarouselButton({
  direction,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  direction: 'prev' | 'next'
}) {
  const { scrollPrev, canScrollPrev, scrollNext, canScrollNext } = useCarousel()

  const isPrevious = direction === 'prev'
  const canScroll = isPrevious ? canScrollPrev : canScrollNext
  const scroll = isPrevious ? scrollPrev : scrollNext

  return (
    <Button
      variant="default"
      size="icon-lg"
      className={cn('cursor-pointer touch-manipulation rounded-full', className)}
      disabled={!canScroll}
      onClick={scroll}
      {...props}
    >
      {isPrevious ? <ArrowLeft aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
      <span className="sr-only">{isPrevious ? 'Previous' : 'Next'} slide</span>
    </Button>
  )
}

function CarouselDots({
  activeIndex,
  onSelect,
  className,
}: {
  activeIndex: number
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div role="group" aria-label="Choose cabin model" className={cn('flex items-center gap-2', className)}>
      {SHOWCASE_CABINS.map(({ cabin }, index) => (
        <button
          key={cabin.name}
          type="button"
          aria-label={`Show ${cabin.name} cabin`}
          aria-pressed={index === activeIndex}
          onClick={() => {
            onSelect(index)
          }}
          className={cn(
            'size-2 cursor-pointer rounded-full bg-primary/25 transition-colors focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:outline-none',
            index === activeIndex && 'bg-primary',
          )}
        />
      ))}
    </div>
  )
}

function CarouselThumbnails({
  activeIndex,
  finishId,
  onSelect,
  className,
}: {
  activeIndex: number
  finishId: ExteriorFinishId
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div role="group" aria-label="Choose cabin model thumbnails" className={cn('items-center gap-3', className)}>
      {SHOWCASE_CABINS.map(({ cabin }, index) => (
        <button
          key={cabin.id}
          type="button"
          aria-label={`Show ${cabin.name} cabin`}
          aria-pressed={index === activeIndex}
          onClick={() => {
            onSelect(index)
          }}
          className={cn(
            'relative h-12 w-20 cursor-pointer overflow-hidden rounded-md border border-border bg-background opacity-55 transition-[border-color,opacity] hover:opacity-80',
            'focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:outline-none',
            index === activeIndex && 'border-primary opacity-100',
          )}
        >
          <Image src={cabin.images.exteriors[finishId]} alt="" fill sizes="80px" className="object-contain p-1.5" />
        </button>
      ))}
    </div>
  )
}

function FloorPlanDialog({
  cabin,
  isOpen,
  onOpenChange,
}: {
  cabin: Cabin
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'gap-4 rounded-xl bg-white p-4',
          '[&>button]:top-1 [&>button]:right-1',
          'sm:max-w-[calc(100%-4rem)] sm:p-6 sm:[&>button]:top-2 sm:[&>button]:right-2',
          'md:p-8 md:[&>button]:top-4 md:[&>button]:right-4',
          'xl:max-w-6xl',
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{cabin.name} floor plan</DialogTitle>
          <DialogDescription>Floor plan layout for the selected {cabin.name} cabin.</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video">
          <Image
            src={cabin.images.floorPlan}
            alt={cabin.images.floorPlanAlt}
            fill
            sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1279px) calc(100vw - 8rem), 68rem"
            className="object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function updateSlideTweenStyles({ api, isDesktop }: { api: NonNullable<CarouselApi>; isDesktop: boolean }) {
  // Translate Embla's scroll progress into CSS variables so slides fade and settle into place smoothly.
  const scrollProgress = api.scrollProgress()
  const scrollSnaps = api.scrollSnapList()
  const slideNodes = api.slideNodes()
  const opticalOffsets = getOpticalSlideOffsets({
    isDesktop,
    scrollProgress,
    scrollSnaps,
    viewportWidth: window.innerWidth,
  })

  slideNodes.forEach((slideNode, index) => {
    const slideProgress = getSlideTweenProgress({ index, scrollProgress, scrollSnaps })
    const imageOpacity = INACTIVE_IMAGE_OPACITY + slideProgress * (1 - INACTIVE_IMAGE_OPACITY)

    const easedProgress = slideProgress * slideProgress // quadratic — stays near 0 longer
    slideNode.style.setProperty('--showcase-summary-opacity', easedProgress.toFixed(3))
    slideNode.style.setProperty('--showcase-image-opacity', imageOpacity.toFixed(3))
    slideNode.style.setProperty('--showcase-optical-offset', `${opticalOffsets[index] ?? 0}px`)
  })
}

function getShowcaseSlideStyle(isActive: boolean): ShowcaseSlideStyle {
  return {
    '--showcase-image-opacity': isActive ? 1 : INACTIVE_IMAGE_OPACITY,
    '--showcase-optical-offset': '0px',
    '--showcase-summary-opacity': isActive ? 1 : 0,
  }
}

function getOpticalSlideOffsets({
  isDesktop,
  scrollProgress,
  scrollSnaps,
  viewportWidth,
}: {
  isDesktop: boolean
  scrollProgress: number
  scrollSnaps: ReadonlyArray<number>
  viewportWidth: number
}): ReadonlyArray<number> {
  if (isDesktop || scrollSnaps.length === 0) {
    return ZERO_OPTICAL_OFFSETS
  }

  // Interpolate between per-active-slide offset profiles to keep neighboring mobile slides visually centered.
  const { firstActiveNextOffset, secondActiveNeighborOffset } = getResponsiveOpticalOffsets(viewportWidth)

  // Each profile contains [Niva, Aster, Veyra] optical offsets
  // for the corresponding active cabin.
  const activeProfiles: ReadonlyArray<ReadonlyArray<number>> = [
    [0, firstActiveNextOffset, 0],
    [-secondActiveNeighborOffset, 0, secondActiveNeighborOffset],
    ZERO_OPTICAL_OFFSETS,
  ]
  const firstSnap = scrollSnaps[0] ?? 0
  const lastSnap = scrollSnaps.at(-1) ?? firstSnap
  const clampedScrollProgress = clamp(scrollProgress, firstSnap, lastSnap)
  const nextSnapIndex = scrollSnaps.findIndex((snap) => snap >= clampedScrollProgress)

  if (nextSnapIndex <= 0) {
    return activeProfiles[0] ?? ZERO_OPTICAL_OFFSETS
  }

  const previousSnapIndex = nextSnapIndex - 1
  const previousSnap = scrollSnaps[previousSnapIndex] ?? firstSnap
  const nextSnap = scrollSnaps[nextSnapIndex] ?? previousSnap
  const segmentProgress =
    nextSnap === previousSnap ? 0 : (clampedScrollProgress - previousSnap) / (nextSnap - previousSnap)
  const previousProfile = activeProfiles[previousSnapIndex] ?? ZERO_OPTICAL_OFFSETS
  const nextProfile = activeProfiles[nextSnapIndex] ?? previousProfile

  return SHOWCASE_CABINS.map((_, index) =>
    lerp(previousProfile.at(index) ?? 0, nextProfile.at(index) ?? 0, segmentProgress),
  )
}

function getResponsiveOpticalOffsets(viewportWidth: number): {
  firstActiveNextOffset: number
  secondActiveNeighborOffset: number
} {
  // Scale calibrated offsets between viewport widths instead of jumping at a breakpoint.
  const firstAnchor = OPTICAL_OFFSET_ANCHORS[0]
  const lastAnchor = OPTICAL_OFFSET_ANCHORS.at(-1) ?? firstAnchor
  const clampedViewportWidth = clamp(viewportWidth, firstAnchor.viewportWidth, lastAnchor.viewportWidth)
  const nextAnchorIndex = OPTICAL_OFFSET_ANCHORS.findIndex((anchor) => anchor.viewportWidth >= clampedViewportWidth)

  if (nextAnchorIndex <= 0) {
    return firstAnchor
  }

  const previousAnchor = OPTICAL_OFFSET_ANCHORS[nextAnchorIndex - 1]
  const nextAnchor = OPTICAL_OFFSET_ANCHORS[nextAnchorIndex]

  if (!previousAnchor || !nextAnchor) {
    return lastAnchor
  }

  const segmentProgress =
    (clampedViewportWidth - previousAnchor.viewportWidth) / (nextAnchor.viewportWidth - previousAnchor.viewportWidth)

  return {
    firstActiveNextOffset: lerp(
      previousAnchor.firstActiveNextOffset,
      nextAnchor.firstActiveNextOffset,
      segmentProgress,
    ),
    secondActiveNeighborOffset: lerp(
      previousAnchor.secondActiveNeighborOffset,
      nextAnchor.secondActiveNeighborOffset,
      segmentProgress,
    ),
  }
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function getSlideTweenProgress({
  index,
  scrollProgress,
  scrollSnaps,
}: {
  index: number
  scrollProgress: number
  scrollSnaps: ReadonlyArray<number>
}) {
  // Normalize a slide's distance from its nearest snap into a 0..1 weight for the visual tween.
  const slideSnap = scrollSnaps[index]

  if (slideSnap === undefined) {
    return 0
  }

  const distanceToSlide = scrollProgress - slideSnap
  const adjacentSnap = distanceToSlide < 0 ? scrollSnaps[index - 1] : scrollSnaps[index + 1]
  const fallbackSnap = distanceToSlide < 0 ? scrollSnaps[index + 1] : scrollSnaps[index - 1]
  const snapDistance = Math.abs((adjacentSnap ?? fallbackSnap ?? slideSnap) - slideSnap)

  if (snapDistance === 0) {
    return distanceToSlide === 0 ? 1 : 0
  }

  return Math.min(Math.max(1 - Math.abs(distanceToSlide) / snapDistance, 0), 1)
}

function getCabinByIndex(index: number): Cabin {
  return SHOWCASE_CABINS[index]?.cabin ?? FEATURED_CABIN
}

function getExteriorFinish(finishId: ExteriorFinishId) {
  return EXTERIOR_FINISHES.find((finish) => finish.id === finishId) ?? DEFAULT_EXTERIOR_FINISH
}

function getInteriorPalette(paletteId: InteriorPaletteId) {
  return INTERIOR_PALETTES.find((palette) => palette.id === paletteId) ?? DEFAULT_INTERIOR_PALETTE
}

export { InteractiveShowcaseSection }
