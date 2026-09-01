'use client'

import type * as React from 'react'
import type { CarouselApi } from '@workspace/ui/components/carousel'
import type { Cabin, CabinExteriorFinishId } from '~/app/[locale]/(app)/_data/cabins'
import type { Locale } from '~/i18n/routing'

import { useEffect, useId, useState } from 'react'

import { ParaglideMessage } from '@inlang/paraglide-js-react'
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
} from '~/app/[locale]/(app)/_components/landing-section-intro'
import { createCabinCatalog } from '~/app/[locale]/(app)/_data/cabins'
import { contactLinkOptions } from '~/app/[locale]/(app)/_validations/app-link-options'
import {
  carousel_next,
  carousel_previous,
  carousel_role,
  carousel_slide_role,
  dialog_close,
  models_show_cabin,
  models_slide_position,
  showcase_carousel_label,
  showcase_choose_model,
  showcase_choose_thumbnails,
  showcase_explore,
  showcase_exterior,
  showcase_exterior_alt,
  showcase_finish_charred_black_oil,
  showcase_finish_natural_timber,
  showcase_finish_whitewashed_timber,
  showcase_floor_plan_description,
  showcase_floor_plan_title,
  showcase_interior,
  showcase_palette_dark_walnut,
  showcase_palette_light_oak,
  showcase_palette_warm_ash,
  showcase_price,
  showcase_price_delta,
  showcase_pricing,
  showcase_status,
  showcase_title,
  showcase_view_floor_plan,
  showcase_eyebrow,
} from '~/paraglide/messages.js'

const FEATURED_INDEX = 0
const INACTIVE_IMAGE_OPACITY = 0.45
const OPTICAL_OFFSET_ANCHORS = [
  { viewportWidth: 360, firstActiveNextOffset: 40, secondActiveNeighborOffset: 15 },
  // { viewportWidth: 500, firstActiveNextOffset: 70, secondActiveNeighborOffset: 20 },
  // { viewportWidth: 1000, firstActiveNextOffset: 150, secondActiveNeighborOffset: 50 },
  { viewportWidth: 1279, firstActiveNextOffset: 200, secondActiveNeighborOffset: 70 },
] as const
const ZERO_OPTICAL_OFFSETS = [0, 0, 0] as const

const EXTERIOR_FINISH_DEFINITIONS = [
  {
    id: 'wood',
    swatchSrc: '/images/showcase/materials/exterior-natural-timber.jpg',
    fallbackColor: '#C2A06B',
  },
  {
    id: 'white',
    swatchSrc: '/images/showcase/materials/exterior-whitewashed-timber.jpg',
    fallbackColor: '#E3E0D3',
  },
  {
    id: 'black',
    swatchSrc: '/images/showcase/materials/exterior-charred-black-oil.jpg',
    fallbackColor: '#2E2A26',
    priceDeltaEur: 2_500,
  },
] as const satisfies ReadonlyArray<{
  readonly id: CabinExteriorFinishId
  readonly swatchSrc: string
  readonly fallbackColor: string
  readonly priceDeltaEur?: number
}>
const INTERIOR_PALETTE_DEFINITIONS = [
  {
    id: 'light-oak',
    swatchSrc: '/images/showcase/materials/interior-light-oak.jpg',
    fallbackColor: '#DCC79E',
  },
  {
    id: 'warm-ash',
    swatchSrc: '/images/showcase/materials/interior-warm-ash.jpg',
    fallbackColor: '#C2A988',
  },
  {
    id: 'dark-walnut',
    swatchSrc: '/images/showcase/materials/interior-dark-walnut.jpg',
    fallbackColor: '#5A4636',
    priceDeltaEur: 1_500,
  },
] as const

type ExteriorFinishId = (typeof EXTERIOR_FINISH_DEFINITIONS)[number]['id']
type InteriorPaletteId = (typeof INTERIOR_PALETTE_DEFINITIONS)[number]['id']
type FinishId = ExteriorFinishId | InteriorPaletteId
interface Finish<TId extends FinishId> {
  readonly id: TId
  readonly label: string
  readonly swatchSrc: string
  readonly fallbackColor: string
  readonly priceDeltaEur?: number
}
type ExteriorFinish = Finish<ExteriorFinishId>
type InteriorPalette = Finish<InteriorPaletteId>
interface ShowcaseCabin {
  readonly cabin: Cabin
  readonly imageAspectRatio: number
}
type ShowcaseSlideStyle = React.CSSProperties & {
  '--showcase-image-opacity': number
  '--showcase-optical-offset': string
  '--showcase-summary-opacity': number
}

const showcaseTitleMarkup = {
  em: ({ children }: { readonly children?: React.ReactNode }) => <em>{children}</em>,
}
const showcasePriceMarkup = {
  price: ({ children }: { readonly children?: React.ReactNode }) => <strong>{children}</strong>,
}

interface InteractiveShowcaseSectionProps extends React.ComponentProps<'section'> {
  readonly locale: Locale
}

function InteractiveShowcaseSection({ locale, className, ...props }: InteractiveShowcaseSectionProps) {
  const messageOptions = { locale }
  const { cabinsById } = createCabinCatalog(locale)
  const showcaseCabins = [
    { cabin: cabinsById.niva, imageAspectRatio: 954 / 866 },
    { cabin: cabinsById.aster, imageAspectRatio: 1309 / 697 },
    { cabin: cabinsById.veyra, imageAspectRatio: 1358 / 553 },
  ] as const satisfies ReadonlyArray<ShowcaseCabin>
  const exteriorFinishes = [
    {
      ...EXTERIOR_FINISH_DEFINITIONS[0],
      label: showcase_finish_natural_timber({}, messageOptions),
    },
    {
      ...EXTERIOR_FINISH_DEFINITIONS[1],
      label: showcase_finish_whitewashed_timber({}, messageOptions),
    },
    {
      ...EXTERIOR_FINISH_DEFINITIONS[2],
      label: showcase_finish_charred_black_oil({}, messageOptions),
    },
  ] as const satisfies ReadonlyArray<ExteriorFinish>
  const interiorPalettes = [
    {
      ...INTERIOR_PALETTE_DEFINITIONS[0],
      label: showcase_palette_light_oak({}, messageOptions),
    },
    {
      ...INTERIOR_PALETTE_DEFINITIONS[1],
      label: showcase_palette_warm_ash({}, messageOptions),
    },
    {
      ...INTERIOR_PALETTE_DEFINITIONS[2],
      label: showcase_palette_dark_walnut({}, messageOptions),
    },
  ] as const satisfies ReadonlyArray<InteriorPalette>

  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(FEATURED_INDEX)
  const [selectedExterior, setSelectedExterior] = useState<ExteriorFinishId>('wood')
  const [selectedInterior, setSelectedInterior] = useState<InteriorPaletteId>('light-oak')
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1280px)', { initializeWithValue: false }) === true

  const activeCabin = showcaseCabins[activeIndex]?.cabin ?? cabinsById.niva
  const activeExterior = getExteriorFinish(exteriorFinishes, selectedExterior)
  const activeInterior = getInteriorPalette(interiorPalettes, selectedInterior)
  const configuredPriceEur =
    activeCabin.showcase.priceEur + (activeExterior.priceDeltaEur ?? 0) + (activeInterior.priceDeltaEur ?? 0)

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
    <section className={cn('flex flex-col gap-(--section-gutter-y) overflow-hidden', className)} {...props}>
      <LandingSectionIntro>
        <LandingSectionIntroEyebrow>{showcase_eyebrow({}, messageOptions)}</LandingSectionIntroEyebrow>
        <LandingSectionIntroTitle className="max-w-2xl">
          <ParaglideMessage message={showcase_title} options={messageOptions} markup={showcaseTitleMarkup} />
        </LandingSectionIntroTitle>
      </LandingSectionIntro>

      <div
        className={cn(
          'container-page-2xl max-xl:container-bleed flex flex-col items-center gap-5 pt-6',
          'md:gap-6 md:pt-8',
          'xl:flex-row xl:gap-15',
        )}
      >
        <ConfigurationPanel
          activeCabin={activeCabin}
          locale={locale}
          exteriorFinishes={exteriorFinishes}
          interiorPalettes={interiorPalettes}
          selectedExterior={selectedExterior}
          selectedInterior={selectedInterior}
          configuredPriceEur={configuredPriceEur}
          onExteriorSelect={setSelectedExterior}
          onInteriorSelect={setSelectedInterior}
          onOpenFloorPlan={() => {
            setIsFloorPlanOpen(true)
          }}
          className="order-2 pt-2 md:pt-3 lg:pt-4 xl:order-1"
        />

        <div className={cn('order-1 w-full', 'xl:order-2 xl:min-w-0')}>
          <Carousel
            aria-label={showcase_carousel_label({}, messageOptions)}
            aria-roledescription={carousel_role({}, messageOptions)}
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
              {showcaseCabins.map(({ cabin, imageAspectRatio }, index) => (
                <CarouselItem
                  key={cabin.id}
                  aria-label={models_slide_position(
                    { current: index + 1, total: showcaseCabins.length, model: cabin.name },
                    messageOptions,
                  )}
                  aria-roledescription={carousel_slide_role({}, messageOptions)}
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
                      <CabinImageCard
                        cabin={cabin}
                        finishId={selectedExterior}
                        exteriorFinishes={exteriorFinishes}
                        locale={locale}
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious
              aria-label={carousel_previous({}, messageOptions)}
              variant="default"
              size="icon-lg"
              className="start-[12%] top-[60%] hidden size-12 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/85 active:-translate-y-1/2! md:inline-flex xl:hidden"
            />
            <CarouselNext
              aria-label={carousel_next({}, messageOptions)}
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
                  label={carousel_previous({}, messageOptions)}
                  className="size-16 bg-primary text-primary-foreground hover:bg-primary/85 active:translate-none! [&>svg]:size-6!"
                />
                <CarouselButton
                  direction="next"
                  label={carousel_next({}, messageOptions)}
                  className="size-16 bg-primary text-primary-foreground hover:bg-primary/85 active:translate-none! [&>svg]:size-6!"
                />
              </div>
              <CarouselDots
                activeIndex={activeIndex}
                cabins={showcaseCabins}
                locale={locale}
                className="xl:hidden"
                onSelect={(index) => {
                  api?.scrollTo(index)
                }}
              />
              <CarouselThumbnails
                activeIndex={activeIndex}
                cabins={showcaseCabins}
                finishId={selectedExterior}
                locale={locale}
                className="hidden xl:flex"
                onSelect={(index) => {
                  api?.scrollTo(index)
                }}
              />
            </div>
          </Carousel>
        </div>

        <p className="sr-only" aria-live="polite">
          {showcase_status(
            {
              model: activeCabin.name,
              exterior: activeExterior.label.toLocaleLowerCase(locale),
              interior: activeInterior.label.toLocaleLowerCase(locale),
              price: configuredPriceEur,
            },
            messageOptions,
          )}
        </p>
      </div>

      <FloorPlanDialog cabin={activeCabin} locale={locale} isOpen={isFloorPlanOpen} onOpenChange={setIsFloorPlanOpen} />
    </section>
  )
}

function ConfigurationPanel({
  activeCabin,
  locale,
  exteriorFinishes,
  interiorPalettes,
  selectedExterior,
  selectedInterior,
  configuredPriceEur,
  onExteriorSelect,
  onInteriorSelect,
  onOpenFloorPlan,
  className,
}: {
  activeCabin: Cabin
  locale: Locale
  exteriorFinishes: ReadonlyArray<ExteriorFinish>
  interiorPalettes: ReadonlyArray<InteriorPalette>
  selectedExterior: ExteriorFinishId
  selectedInterior: InteriorPaletteId
  configuredPriceEur: number
  onExteriorSelect: (finishId: ExteriorFinishId) => void
  onInteriorSelect: (paletteId: InteriorPaletteId) => void
  onOpenFloorPlan: () => void
  className?: string
}) {
  const messageOptions = { locale }
  const exteriorFinishLabelId = useId()
  const interiorPaletteLabelId = useId()

  return (
    <div
      className={cn(
        'max-xl:section-px max-xl:self-stretch',
        'xl:w-[clamp(28rem,calc(8rem+25vw),32rem)] xl:shrink-0',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto grid max-w-[clamp(24rem,calc(14.652rem+42.730vw),42rem)] grid-cols-[auto_minmax(0,1fr)] items-center rounded-lg border border-border bg-card p-[clamp(1.5rem,calc(1.204rem+1.349vw),2.5rem)]',
          'gap-x-[clamp(0.75rem,calc(0.231rem+2.374vw),1.75rem)]',
          'gap-y-[clamp(1.25rem,calc(0.990rem+1.187vw),1.75rem)]',

          'md:grid-cols-[clamp(9.5rem,22vw,11rem)_minmax(0,1fr)]',
          'xl:flex xl:flex-col xl:items-stretch',
          'xl:gap-[clamp(1.5rem,1.65vw,1.584rem)]',
        )}
      >
        <ModelSummary cabin={activeCabin} className="hidden xl:flex" isDesktop />

        <div className="col-span-2 grid gap-4 max-md:mb-2 md:contents xl:flex xl:flex-col xl:items-start xl:gap-3">
          <p
            id={exteriorFinishLabelId}
            className="text-body-xs font-bold tracking-[0.125rem] text-foreground uppercase"
          >
            {showcase_exterior({}, messageOptions)}
          </p>
          <RadioGroup
            aria-labelledby={exteriorFinishLabelId}
            value={selectedExterior}
            onValueChange={onExteriorSelect}
            className="grid w-full grid-cols-3 items-start gap-x-4 gap-y-4 max-[374px]:grid-cols-2"
          >
            {exteriorFinishes.map((finish) => (
              <FinishRadioItem
                key={finish.id}
                label={finish.label}
                swatchSrc={finish.swatchSrc}
                fallbackColor={finish.fallbackColor}
                priceDeltaEur={finish.priceDeltaEur}
                value={finish.id}
                isSelected={selectedExterior === finish.id}
                locale={locale}
              />
            ))}
          </RadioGroup>
        </div>

        <div className="col-span-2 grid gap-4 max-md:mb-2 md:contents xl:flex xl:flex-col xl:items-start xl:gap-3">
          <p
            id={interiorPaletteLabelId}
            className="text-body-xs font-bold tracking-[0.125rem] text-foreground uppercase"
          >
            {showcase_interior({}, messageOptions)}
          </p>
          <RadioGroup
            aria-labelledby={interiorPaletteLabelId}
            value={selectedInterior}
            onValueChange={onInteriorSelect}
            className="grid w-full grid-cols-3 items-start gap-x-4 gap-y-4 max-[374px]:grid-cols-2"
          >
            {interiorPalettes.map((palette) => (
              <FinishRadioItem
                key={palette.id}
                label={palette.label}
                swatchSrc={palette.swatchSrc}
                fallbackColor={palette.fallbackColor}
                priceDeltaEur={palette.priceDeltaEur}
                value={palette.id}
                isSelected={selectedInterior === palette.id}
                locale={locale}
              />
            ))}
          </RadioGroup>
        </div>

        <div className="contents xl:flex xl:flex-col xl:items-start xl:gap-3">
          <p className="text-body-xs hidden font-bold tracking-[0.125rem] text-foreground uppercase sm:block">
            {showcase_pricing({}, messageOptions)}
          </p>
          <p className="text-body-sm col-span-2 text-foreground sm:col-span-1">
            <ParaglideMessage
              message={showcase_price}
              inputs={{ price: configuredPriceEur }}
              options={messageOptions}
              markup={showcasePriceMarkup}
            />
          </p>
        </div>

        <div className={cn('col-span-2 flex flex-col gap-3 pt-1', 'sm:flex-row sm:gap-4', 'xl:gap-6')}>
          <Link
            {...contactLinkOptions(locale)}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-auto flex-1 px-7 py-3.75 text-sm font-bold md:flex-1 lg:text-[15px]',
            )}
          >
            {showcase_explore({ model: activeCabin.name }, messageOptions)}
          </Link>
          <Button
            aria-haspopup="dialog"
            onClick={onOpenFloorPlan}
            variant="outline"
            size="lg"
            className="h-auto cursor-pointer bg-transparent px-7 py-3.75 text-sm font-bold text-secondary-foreground lg:text-[15px]"
          >
            {showcase_view_floor_plan({}, messageOptions)}
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
      <h3 className="text-heading-xl">{cabin.name}</h3>
      <div className="text-body-lg flex gap-2 font-semibold">
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

function FinishRadioItem({
  label,
  swatchSrc,
  fallbackColor,
  priceDeltaEur,
  value,
  isSelected,
  locale,
}: {
  label: string
  swatchSrc: string
  fallbackColor: string
  priceDeltaEur?: number
  value: FinishId
  isSelected: boolean
  locale: Locale
}) {
  const radioId = useId()
  const labelId = useId()
  const priceDelta =
    priceDeltaEur === undefined ? undefined : showcase_price_delta({ price: priceDeltaEur }, { locale })

  // The native radio remains the interactive control while the label provides the swatch-style UI.
  return (
    <div className="relative">
      <RadioGroupItem
        id={radioId}
        aria-labelledby={labelId}
        value={value}
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0 after:hidden"
      />
      <Label
        id={labelId}
        htmlFor={radioId}
        className={cn(
          'text-body-xs flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-sm pt-2 text-center leading-tight font-medium text-foreground',
          'peer-focus-visible:ring-3 peer-focus-visible:ring-ring/80 peer-focus-visible:outline-none',
        )}
      >
        <span
          className={cn(
            'relative size-10 shrink-0 rounded-full border-none bg-transparent transition-shadow md:size-11',
            isSelected && 'ring-2 ring-primary ring-offset-3 ring-offset-background',
          )}
          style={{ backgroundColor: fallbackColor }}
        >
          <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-full">
            <Image src={swatchSrc} alt="" width={192} height={192} sizes="48px" className="size-full object-cover" />
          </span>
          {priceDelta !== undefined && (
            <span className="pointer-events-none absolute start-1/2 bottom-0 z-10 -translate-x-1/2 translate-y-1/2 rounded-[2px] bg-foreground px-1 py-0.5 text-xs leading-3 font-semibold whitespace-nowrap text-background">
              {priceDelta}
            </span>
          )}
        </span>
        <span
          className={cn('flex min-w-0 flex-col items-center justify-start text-center', isSelected && 'font-semibold')}
        >
          <span className="min-h-[2lh]">{label}</span>
        </span>
      </Label>
    </div>
  )
}

function CabinImageCard({
  cabin,
  finishId,
  exteriorFinishes,
  locale,
  className,
}: {
  cabin: Cabin
  finishId: ExteriorFinishId
  exteriorFinishes: ReadonlyArray<ExteriorFinish>
  locale: Locale
  className?: string
}) {
  const finish = getExteriorFinish(exteriorFinishes, finishId)

  return (
    <div className={cn('relative size-full', className)}>
      <Image
        src={cabin.images.exteriors[finishId]}
        alt={showcase_exterior_alt({ model: cabin.name, finish: finish.label.toLocaleLowerCase(locale) }, { locale })}
        fill
        sizes="(max-width: 767px) 400px, (max-width: 1279px) 700px, 800px"
        className="object-contain"
      />
    </div>
  )
}

function CarouselButton({
  direction,
  label,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  direction: 'prev' | 'next'
  label: string
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
      <span className="sr-only">{label}</span>
    </Button>
  )
}

function CarouselDots({
  activeIndex,
  cabins,
  locale,
  onSelect,
  className,
}: {
  activeIndex: number
  cabins: ReadonlyArray<ShowcaseCabin>
  locale: Locale
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={showcase_choose_model({}, { locale })}
      className={cn('flex items-center gap-2', className)}
    >
      {cabins.map(({ cabin }, index) => (
        <button
          key={cabin.name}
          type="button"
          aria-label={models_show_cabin({ model: cabin.name }, { locale })}
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
  cabins,
  finishId,
  locale,
  onSelect,
  className,
}: {
  activeIndex: number
  cabins: ReadonlyArray<ShowcaseCabin>
  finishId: ExteriorFinishId
  locale: Locale
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={showcase_choose_thumbnails({}, { locale })}
      className={cn('items-center gap-3', className)}
    >
      {cabins.map(({ cabin }, index) => (
        <button
          key={cabin.id}
          type="button"
          aria-label={models_show_cabin({ model: cabin.name }, { locale })}
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
  locale,
  isOpen,
  onOpenChange,
}: {
  cabin: Cabin
  locale: Locale
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={dialog_close({}, { locale })}
        className={cn(
          'gap-4 rounded-xl bg-white p-4',
          '[&>button]:top-1 [&>button]:right-1',
          'sm:max-w-[calc(100%-4rem)] sm:p-6 sm:[&>button]:top-2 sm:[&>button]:right-2',
          'md:p-8 md:[&>button]:top-4 md:[&>button]:right-4',
          'xl:max-w-6xl',
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{showcase_floor_plan_title({ model: cabin.name }, { locale })}</DialogTitle>
          <DialogDescription>{showcase_floor_plan_description({ model: cabin.name }, { locale })}</DialogDescription>
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

  // Produce one optical offset per Embla snap; this geometry calculation does not depend on the locale-scoped cabin data.
  return scrollSnaps.map((_, index) =>
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

function getExteriorFinish(finishes: ReadonlyArray<ExteriorFinish>, finishId: ExteriorFinishId) {
  return (
    finishes.find((finish) => finish.id === finishId) ??
    finishes[0] ?? {
      id: 'wood',
      label: '',
      swatchSrc: '',
      fallbackColor: '',
    }
  )
}

function getInteriorPalette(palettes: ReadonlyArray<InteriorPalette>, paletteId: InteriorPaletteId) {
  return (
    palettes.find((palette) => palette.id === paletteId) ??
    palettes[0] ?? {
      id: 'light-oak',
      label: '',
      swatchSrc: '',
      fallbackColor: '',
    }
  )
}

export { InteractiveShowcaseSection }
