'use client'

import type * as React from 'react'
import type { InteractiveShowcase3DProps, LiveSurfaceVisibility } from './interactive-showcase-3d'
import type { PosterLabels } from './interactive-showcase-poster'
import type { CarouselApi } from '@workspace/ui/components/carousel'
import type { Cabin, CabinExteriorFinishId, CabinId } from '~/app/[locale]/(app)/_data/cabins'
import type { Locale } from '~/i18n/routing'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { ParaglideMessage } from '@inlang/paraglide-js-react'
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react'
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
import { Label } from '@workspace/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'
import { SwirlingSpinner } from '@workspace/ui/components/spinner-variants'
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query'
import { usePrefersReducedMotion } from '@workspace/ui/hooks/use-prefers-reduced-motion'
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
  showcase_preview_updating,
  showcase_preview_error,
  showcase_preview_retry,
  showcase_3d_enter,
  showcase_3d_error,
  showcase_3d_exit,
  showcase_3d_finish_error,
  showcase_3d_hint_desktop,
  showcase_3d_hint_mobile,
  showcase_3d_loading,
  showcase_3d_retry,
  showcase_status,
  showcase_title,
  showcase_view_floor_plan,
  showcase_eyebrow,
} from '~/paraglide/messages.js'

import { InteractiveShowcase3D } from './interactive-showcase-3d'
import { getShowcasePosterStyle } from './interactive-showcase-3d-framing'
import { REVEAL_EASING, REVEAL_FADE_DURATION_MS } from './interactive-showcase-3d-timing'
import { getConfigurationPoster } from './interactive-showcase-configuration'
import { InteractiveShowcasePoster } from './interactive-showcase-poster'

const FEATURED_INDEX = 0
const SHOWCASE_PRELOAD_MARGIN = '600px 0px'
const INACTIVE_IMAGE_OPACITY = 0.45
const OPTICAL_OFFSET_ANCHORS = [
  { viewportWidth: 360, firstActiveNextOffset: 25, secondActiveNeighborOffset: 5 },
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
    swatchSrc: '/cabin-3d/finishes/textures/interior-warm-ash-basecolor.jpg',
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
  readonly mobilePosterAspectRatio: number
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
    { cabin: cabinsById.niva, mobilePosterAspectRatio: 954 / 866 },
    { cabin: cabinsById.aster, mobilePosterAspectRatio: 1309 / 697 },
    { cabin: cabinsById.veyra, mobilePosterAspectRatio: 1358 / 553 },
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
  const [surfaceRevision, setSurfaceRevision] = useState(0)
  const [liveSurfaceVisibility, setLiveSurfaceVisibility] = useState<LiveSurfaceVisibility | null>(null)
  const [selectedExterior, setSelectedExterior] = useState<ExteriorFinishId>('wood')
  const [selectedInterior, setSelectedInterior] = useState<InteriorPaletteId>('light-oak')
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false)
  const [hasRequested3D, setHasRequested3D] = useState(false)
  const [isSectionNear, setIsSectionNear] = useState(false)
  const [intentCabinId, setIntentCabinId] = useState<CabinId | null>(null)
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'previous' | null>(null)
  const isDesktop = useMediaQuery('(min-width: 1280px)', { initializeWithValue: false }) === true
  const shouldReduceMotion = usePrefersReducedMotion()
  const sectionRef = useRef<HTMLElement | null>(null)
  const mediaViewportRef = useRef<HTMLDivElement | null>(null)
  const previousActiveIndexRef = useRef(FEATURED_INDEX)

  const activeCabin = showcaseCabins[activeIndex]?.cabin ?? cabinsById.niva
  const surfaceCabin = activeCabin
  const isLiveSurfaceRevealed =
    liveSurfaceVisibility?.isVisible === true &&
    liveSurfaceVisibility.revision === surfaceRevision &&
    liveSurfaceVisibility.cabinId === surfaceCabin.id
  const isDesktop3DLoading =
    isDesktop &&
    !isLiveSurfaceRevealed &&
    !(
      liveSurfaceVisibility?.hasError === true &&
      liveSurfaceVisibility.cabinId === surfaceCabin.id &&
      liveSurfaceVisibility.revision === surfaceRevision
    )
  const intentCabin =
    intentCabinId === null ? null : (showcaseCabins.find(({ cabin }) => cabin.id === intentCabinId)?.cabin ?? null)
  const speculativeCabin = showcaseCabins[activeIndex + (navigationDirection === 'previous' ? -1 : 1)]?.cabin ?? null
  const activeExterior = getExteriorFinish(exteriorFinishes, selectedExterior)
  const activeInterior = getInteriorPalette(interiorPalettes, selectedInterior)
  const configuredPriceEur =
    activeCabin.showcase.priceEur + (activeExterior.priceDeltaEur ?? 0) + (activeInterior.priceDeltaEur ?? 0)
  const viewerLabels = {
    enter: showcase_3d_enter({}, messageOptions),
    error: showcase_3d_error({ model: activeCabin.name }, messageOptions),
    exit: showcase_3d_exit({}, messageOptions),
    finishError: showcase_3d_finish_error({}, messageOptions),
    hintDesktop: showcase_3d_hint_desktop({}, messageOptions),
    hintMobile: showcase_3d_hint_mobile({}, messageOptions),
    loading: showcase_3d_loading({ model: activeCabin.name }, messageOptions),
    retry: showcase_3d_retry({}, messageOptions),
  }
  const posterLabels = {
    updating: showcase_preview_updating({}, messageOptions),
    error: showcase_preview_error({}, messageOptions),
    retry: showcase_preview_retry({}, messageOptions),
  }

  const requestCabinIntent = (index: number) => {
    if (!isDesktop) return
    const cabin = showcaseCabins[index]?.cabin

    if (!cabin) return

    setIntentCabinId(cabin.id)
    setHasRequested3D(true)
  }

  const requestAdjacentCabinIntent = (direction: 'next' | 'previous') => {
    const currentIndex = api?.selectedScrollSnap() ?? activeIndex
    const destinationIndex = currentIndex + (direction === 'previous' ? -1 : 1)

    requestCabinIntent(destinationIndex)
  }

  const handleLiveSurfaceVisibilityChange = useCallback((visibility: LiveSurfaceVisibility) => {
    setLiveSurfaceVisibility(visibility)
  }, [])

  // Keep the visible model summary synchronized with Embla's selected snap, including after reinitialization.
  useEffect(() => {
    if (!api) {
      return undefined
    }

    const handleSelect = () => {
      const nextActiveIndex = api.selectedScrollSnap()
      const previousActiveIndex = previousActiveIndexRef.current

      if (nextActiveIndex !== previousActiveIndex) {
        setNavigationDirection(nextActiveIndex > previousActiveIndex ? 'next' : 'previous')
        previousActiveIndexRef.current = nextActiveIndex
        setSurfaceRevision((revision) => revision + 1)
      }

      setActiveIndex(nextActiveIndex)
    }
    const handleReInit = () => {
      const preservedIndex = previousActiveIndexRef.current

      if (api.selectedScrollSnap() !== preservedIndex) {
        api.scrollTo(preservedIndex, true)
      }

      handleSelect()
    }

    handleSelect()
    api.on('select', handleSelect)
    api.on('reInit', handleReInit)

    return () => {
      api.off('select', handleSelect)
      api.off('reInit', handleReInit)
    }
  }, [api])

  // Desktop uses proximity loading; mobile only mounts a renderer inside the open dialog.
  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return undefined
    }

    if (typeof IntersectionObserver === 'undefined') {
      const fallbackTimer = window.setTimeout(() => {
        setIsSectionNear(true)
        setHasRequested3D(true)
      }, 0)

      return () => window.clearTimeout(fallbackTimer)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isNear = entry?.isIntersecting === true

        setIsSectionNear(isNear)
        if (isNear) setHasRequested3D(true)
      },
      { rootMargin: SHOWCASE_PRELOAD_MARGIN },
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Own the tween variables imperatively, including the final settled frame.
  useLayoutEffect(() => {
    if (!api) {
      return undefined
    }

    const handleScroll = () => {
      updateSlideTweenStyles({ api, isDesktop })
    }

    handleScroll()
    api.on('scroll', handleScroll)
    api.on('settle', handleScroll)
    api.on('reInit', handleScroll)
    api.on('resize', handleScroll)

    return () => {
      api.off('scroll', handleScroll)
      api.off('settle', handleScroll)
      api.off('reInit', handleScroll)
      api.off('resize', handleScroll)
    }
  }, [api, isDesktop])

  return (
    <section
      ref={sectionRef}
      className={cn('flex flex-col gap-(--section-gutter-y) overflow-hidden', className)}
      {...props}
    >
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

        <div className={cn('order-1 w-full', 'lg:pt-4 xl:order-2 xl:min-w-0')}>
          <Carousel
            aria-label={showcase_carousel_label({}, messageOptions)}
            aria-roledescription={carousel_role({}, messageOptions)}
            setApi={setApi}
            opts={{
              align: 'center',
              loop: false,
              watchDrag: isDesktop ? false : canDragShowcase,
              startIndex: FEATURED_INDEX,
              containScroll: false,
            }}
            className={cn(
              'w-full',
              !isDesktop &&
                '**:data-[slot=carousel-content]:cursor-grab **:data-[slot=carousel-content]:touch-pan-y **:data-[slot=carousel-content]:touch-pinch-zoom **:data-[slot=carousel-content]:select-none **:data-[slot=carousel-content]:active:cursor-grabbing',
            )}
          >
            <div
              ref={mediaViewportRef}
              aria-busy={isDesktop ? isDesktop3DLoading : undefined}
              className="relative w-full overflow-hidden xl:h-[31.25rem] xl:**:data-[slot=carousel-content]:h-full"
            >
              <CarouselContent
                className={cn(
                  'ms-0 items-start',
                  'gap-[clamp(0.5rem,calc(-2.24rem+12.19vw),8rem)]',
                  'xl:h-full xl:py-0',
                )}
              >
                {showcaseCabins.map(({ cabin, mobilePosterAspectRatio }, index) => {
                  return (
                    <CarouselItem
                      key={cabin.id}
                      aria-label={models_slide_position(
                        { current: index + 1, total: showcaseCabins.length, model: cabin.name },
                        messageOptions,
                      )}
                      aria-roledescription={carousel_slide_role({}, messageOptions)}
                      style={getShowcaseSlideStyle(index === FEATURED_INDEX)}
                      className={cn(
                        'flex w-auto basis-auto flex-col items-center ps-0',
                        'xl:h-full xl:w-full xl:basis-full',
                      )}
                    >
                      <div className="flex transform-[translate3d(var(--showcase-optical-offset),0,0)] flex-col items-center gap-5 will-change-transform xl:h-full xl:w-full xl:transform-none">
                        <div
                          aria-hidden={index !== activeIndex}
                          className="w-full opacity-(--showcase-summary-opacity) will-change-[opacity] xl:hidden"
                        >
                          <ModelSummary cabin={cabin} className="items-center text-center" />
                        </div>

                        <div
                          style={{ aspectRatio: isDesktop ? 'auto' : mobilePosterAspectRatio }}
                          className={cn(
                            'relative h-[clamp(6rem,calc(1.197rem+23.5vw),20rem)]',
                            'xl:aspect-auto! xl:h-full xl:w-full',
                            'opacity-(--showcase-image-opacity) will-change-[opacity]',
                          )}
                        >
                          {isDesktop ? null : (
                            <CabinImageCard
                              cabin={cabin}
                              selectedExterior={selectedExterior}
                              selectedInterior={selectedInterior}
                              className="xl:hidden"
                              isLiveSurfaceRevealed={false}
                              isLoading={false}
                              shouldLoad={isSectionNear}
                              posterLabels={index === activeIndex ? posterLabels : undefined}
                              shouldReduceMotion={shouldReduceMotion}
                            />
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>

              {isDesktop ? (
                <div className="pointer-events-none absolute inset-0 z-20 hidden xl:block">
                  <CabinImageCard
                    key={surfaceCabin.id}
                    cabin={surfaceCabin}
                    selectedExterior={selectedExterior}
                    selectedInterior={selectedInterior}
                    isLiveSurfaceRevealed={isLiveSurfaceRevealed}
                    isLoading={
                      liveSurfaceVisibility?.hasError !== true ||
                      liveSurfaceVisibility.cabinId !== surfaceCabin.id ||
                      liveSurfaceVisibility.revision !== surfaceRevision
                    }
                    shouldLoad={isSectionNear}
                    posterLabels={posterLabels}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                </div>
              ) : null}

              {isDesktop ? (
                <InteractiveShowcase3D
                  activeCabin={activeCabin}
                  intentCabin={intentCabin}
                  isDesktop={isDesktop}
                  isRequested={hasRequested3D}
                  isSectionNear={isSectionNear}
                  hostRef={mediaViewportRef}
                  onLiveSurfaceVisibilityChange={handleLiveSurfaceVisibilityChange}
                  selectedExterior={selectedExterior}
                  selectedInterior={selectedInterior}
                  speculativeCabin={speculativeCabin}
                  shouldReduceMotion={shouldReduceMotion}
                  surfaceCabin={surfaceCabin}
                  surfaceRevision={surfaceRevision}
                  labels={viewerLabels}
                />
              ) : null}
            </div>
            {isDesktop ? (
              <p role="status" className="sr-only">
                {isDesktop3DLoading ? viewerLabels.loading : null}
              </p>
            ) : null}

            <CarouselPrevious
              aria-label={carousel_previous({}, messageOptions)}
              variant="default"
              size="icon-lg"
              onFocus={() => {
                requestAdjacentCabinIntent('previous')
              }}
              onMouseEnter={() => {
                requestAdjacentCabinIntent('previous')
              }}
              className="start-[12%] top-[60%] z-20 hidden size-12 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/85 active:-translate-y-1/2! md:inline-flex xl:hidden"
            />
            <CarouselNext
              aria-label={carousel_next({}, messageOptions)}
              variant="default"
              size="icon-lg"
              onFocus={() => {
                requestAdjacentCabinIntent('next')
              }}
              onMouseEnter={() => {
                requestAdjacentCabinIntent('next')
              }}
              className="end-[12%] top-[60%] z-20 hidden size-12 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/85 active:-translate-y-1/2! md:inline-flex xl:hidden"
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
                  onFocus={() => {
                    requestAdjacentCabinIntent('previous')
                  }}
                  onMouseEnter={() => {
                    requestAdjacentCabinIntent('previous')
                  }}
                  className="size-16 bg-primary text-primary-foreground hover:bg-primary/85 active:translate-none! [&>svg]:size-6!"
                />
                <CarouselButton
                  direction="next"
                  label={carousel_next({}, messageOptions)}
                  onFocus={() => {
                    requestAdjacentCabinIntent('next')
                  }}
                  onMouseEnter={() => {
                    requestAdjacentCabinIntent('next')
                  }}
                  className="size-16 bg-primary text-primary-foreground hover:bg-primary/85 active:translate-none! [&>svg]:size-6!"
                />
              </div>
              <CarouselDots
                activeIndex={activeIndex}
                cabins={showcaseCabins}
                locale={locale}
                className="xl:hidden"
                onSelect={(index) => {
                  requestCabinIntent(index)
                  api?.scrollTo(index)
                }}
                onIntent={requestCabinIntent}
              />
              {isDesktop ? (
                <CarouselThumbnails
                  activeIndex={activeIndex}
                  cabins={showcaseCabins}
                  locale={locale}
                  selectedExterior={selectedExterior}
                  selectedInterior={selectedInterior}
                  className="hidden xl:flex"
                  onSelect={(index) => {
                    requestCabinIntent(index)
                    api?.scrollTo(index)
                  }}
                  onIntent={requestCabinIntent}
                />
              ) : null}
            </div>
          </Carousel>
          {isDesktop ? null : (
            <Showcase3DDialog
              cabin={activeCabin}
              locale={locale}
              exteriorFinishes={exteriorFinishes}
              interiorPalettes={interiorPalettes}
              selectedExterior={selectedExterior}
              selectedInterior={selectedInterior}
              onExteriorSelect={setSelectedExterior}
              onInteriorSelect={setSelectedInterior}
              shouldReduceMotion={shouldReduceMotion}
              labels={viewerLabels}
            />
          )}
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
        <span className="text-muted-foreground">|</span>
        <span>{cabin.specs.layout}</span>
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
  selectedExterior,
  selectedInterior,
  isLoading,
  shouldLoad,
  isModal = false,
  posterLabels,
  isLiveSurfaceRevealed,
  shouldReduceMotion,
  className,
}: {
  cabin: Cabin
  selectedExterior: ExteriorFinishId
  selectedInterior: InteriorPaletteId
  isLoading: boolean
  shouldLoad: boolean
  isModal?: boolean
  posterLabels?: PosterLabels
  isLiveSurfaceRevealed: boolean
  shouldReduceMotion: boolean
  className?: string
}) {
  return (
    <div
      className={cn('pointer-events-none relative size-full', className)}
      inert={isLiveSurfaceRevealed}
      style={{
        ...getShowcasePosterStyle(cabin.id, isModal),
        opacity: isLiveSurfaceRevealed ? 0 : 1,
        transition:
          shouldReduceMotion || !isLiveSurfaceRevealed
            ? 'none'
            : `opacity ${REVEAL_FADE_DURATION_MS}ms ${REVEAL_EASING}`,
      }}
    >
      <div
        className={cn(
          'absolute top-(--showcase-poster-top) left-(--showcase-poster-left) h-(--showcase-poster-height) w-(--showcase-poster-width) -translate-1/2',
          'xl:top-(--showcase-poster-desktop-top) xl:left-(--showcase-poster-desktop-left) xl:h-(--showcase-poster-desktop-height) xl:w-(--showcase-poster-desktop-width)',
          isModal &&
            'top-(--showcase-poster-desktop-top)! left-(--showcase-poster-desktop-left)! h-(--showcase-poster-desktop-height)! w-(--showcase-poster-desktop-width)!',
        )}
      >
        <InteractiveShowcasePoster
          labels={posterLabels}
          key={cabin.id}
          draggable={false}
          src={getConfigurationPoster({ cabinId: cabin.id, exterior: selectedExterior, interior: selectedInterior })}
          alt={cabin.images.modelOverviewAlt}
          fill
          loading={shouldLoad ? 'eager' : 'lazy'}
          sizes={
            isModal ? '(max-width: 767px) 90vw, 80vw' : '(max-width: 767px) 400px, (max-width: 1279px) 700px, 800px'
          }
          className={cn('object-contain', isLoading && 'opacity-45')}
        />
      </div>
      {isLoading ? (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <SwirlingSpinner
            className={cn('text-foreground/80', shouldReduceMotion && '[&_.spin2]:animate-none')}
            size="xl"
          />
        </div>
      ) : null}
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
  onIntent,
  onSelect,
  className,
}: {
  activeIndex: number
  cabins: ReadonlyArray<ShowcaseCabin>
  locale: Locale
  onIntent: (index: number) => void
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
          onFocus={() => {
            onIntent(index)
          }}
          onMouseEnter={() => {
            onIntent(index)
          }}
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
  locale,
  selectedExterior,
  selectedInterior,
  onSelect,
  onIntent,
  className,
}: {
  activeIndex: number
  cabins: ReadonlyArray<ShowcaseCabin>
  locale: Locale
  selectedExterior: ExteriorFinishId
  selectedInterior: InteriorPaletteId
  onSelect: (index: number) => void
  onIntent: (index: number) => void
  className?: string
}) {
  const hoverIntentTimersRef = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    const timers = hoverIntentTimersRef.current

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const cancelHoverIntent = (index: number) => {
    const timer = hoverIntentTimersRef.current.get(index)
    if (timer === undefined) return

    window.clearTimeout(timer)
    hoverIntentTimersRef.current.delete(index)
  }

  const scheduleHoverIntent = (index: number) => {
    cancelHoverIntent(index)

    const timer = window.setTimeout(() => {
      hoverIntentTimersRef.current.delete(index)
      onIntent(index)
    }, 100)

    hoverIntentTimersRef.current.set(index, timer)
  }

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
          onMouseEnter={() => {
            scheduleHoverIntent(index)
          }}
          onMouseLeave={() => {
            cancelHoverIntent(index)
          }}
          onFocus={() => {
            cancelHoverIntent(index)
            onIntent(index)
          }}
          onClick={() => {
            onSelect(index)
          }}
          className={cn(
            'relative h-12 w-20 cursor-pointer overflow-hidden rounded-md border border-border bg-background opacity-55 transition-[border-color,opacity] hover:opacity-80',
            'focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:outline-none',
            index === activeIndex && 'border-primary opacity-100',
          )}
        >
          <InteractiveShowcasePoster
            src={getConfigurationPoster({ cabinId: cabin.id, exterior: selectedExterior, interior: selectedInterior })}
            alt=""
            fill
            sizes="80px"
            className="object-contain p-1.5"
          />
        </button>
      ))}
    </div>
  )
}

function Showcase3DDialog({
  cabin,
  locale,
  exteriorFinishes,
  interiorPalettes,
  selectedExterior,
  selectedInterior,
  onExteriorSelect,
  onInteriorSelect,
  shouldReduceMotion,
  labels,
}: {
  readonly cabin: Cabin
  readonly locale: Locale
  readonly exteriorFinishes: ReadonlyArray<ExteriorFinish>
  readonly interiorPalettes: ReadonlyArray<InteriorPalette>
  readonly selectedExterior: ExteriorFinishId
  readonly selectedInterior: InteriorPaletteId
  readonly onExteriorSelect: (value: ExteriorFinishId) => void
  readonly onInteriorSelect: (value: InteriorPaletteId) => void
  readonly shouldReduceMotion: boolean
  readonly labels: InteractiveShowcase3DProps['labels']
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibility, setVisibility] = useState<LiveSurfaceVisibility | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const isRevealed = visibility?.cabinId === cabin.id && visibility.isVisible
  const isLoading = !isRevealed && visibility?.hasError !== true

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setVisibility(null)
        setIsOpen(open)
      }}
    >
      <div className="flex justify-center pt-5 xl:hidden">
        <DialogTrigger render={<Button variant="outline" size="lg" />}>
          <Maximize2 data-icon="inline-start" />
          {labels.enter}
        </DialogTrigger>
      </div>
      <DialogContent
        showCloseButton={false}
        initialFocus={closeRef}
        className="flex h-dvh max-h-dvh max-w-none flex-col gap-0 overflow-hidden rounded-none bg-background p-0 motion-reduce:animate-none sm:h-[92dvh] sm:max-w-[calc(100%-3rem)] sm:rounded-xl"
      >
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-4 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <div className="flex flex-col gap-2">
            <DialogTitle>
              {cabin.name} · {labels.enter}
            </DialogTitle>
            <DialogDescription>{labels.hintMobile}</DialogDescription>
          </div>
          <DialogClose render={<Button ref={closeRef} variant="ghost" size="icon-lg" />}>
            <X />
            <span className="sr-only">{dialog_close({}, { locale })}</span>
          </DialogClose>
        </DialogHeader>
        <div
          ref={hostRef}
          aria-busy={isLoading}
          className="[container-type:size] relative min-h-0 flex-1 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 z-20">
            <CabinImageCard
              key={cabin.id}
              cabin={cabin}
              selectedExterior={selectedExterior}
              selectedInterior={selectedInterior}
              isLoading={isLoading}
              isLiveSurfaceRevealed={isRevealed}
              isModal
              posterLabels={{
                updating: showcase_preview_updating({}, { locale }),
                error: showcase_preview_error({}, { locale }),
                retry: showcase_preview_retry({}, { locale }),
              }}
              shouldLoad
              shouldReduceMotion={shouldReduceMotion}
            />
          </div>
          {isOpen ? (
            <InteractiveShowcase3D
              activeCabin={cabin}
              surfaceCabin={cabin}
              surfaceRevision={0}
              intentCabin={null}
              speculativeCabin={null}
              isDesktop={false}
              isRequested
              isSectionNear
              hostRef={hostRef}
              selectedExterior={selectedExterior}
              selectedInterior={selectedInterior}
              shouldReduceMotion={shouldReduceMotion}
              onLiveSurfaceVisibilityChange={setVisibility}
              labels={labels}
            />
          ) : null}
        </div>
        <p role="status" className="sr-only">
          {isLoading ? labels.loading : null}
        </p>
        <div className="grid shrink-0 gap-2 border-t border-border px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:gap-6">
          <CompactFinishControl
            label={showcase_exterior({}, { locale })}
            finishes={exteriorFinishes}
            value={selectedExterior}
            onValueChange={onExteriorSelect}
          />
          <CompactFinishControl
            label={showcase_interior({}, { locale })}
            finishes={interiorPalettes}
            value={selectedInterior}
            onValueChange={onInteriorSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CompactFinishControl<TId extends FinishId>({
  label,
  finishes,
  value,
  onValueChange,
}: {
  readonly label: string
  readonly finishes: ReadonlyArray<Finish<TId>>
  readonly value: TId
  readonly onValueChange: (value: TId) => void
}) {
  const labelId = useId()
  const selected = finishes.find((finish) => finish.id === value)

  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p id={labelId} className="text-xs font-bold">
          {label}
        </p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {selected?.label}
        </p>
      </div>
      <RadioGroup
        aria-labelledby={labelId}
        value={value}
        onValueChange={onValueChange}
        className="flex w-auto shrink-0 gap-1"
      >
        {finishes.map((finish) => (
          <div key={finish.id} className="relative grid size-11 place-items-center">
            <RadioGroupItem
              value={finish.id}
              aria-label={finish.label}
              title={finish.label}
              className="absolute inset-0 z-10 size-full cursor-pointer opacity-0 after:hidden"
            />
            <span
              aria-hidden
              className={cn(
                'pointer-events-none relative size-8 overflow-hidden rounded-full ring-offset-2 ring-offset-background peer-focus-visible:ring-3 peer-focus-visible:ring-ring',
                finish.id === value && 'ring-2 ring-primary',
              )}
              style={{ backgroundColor: finish.fallbackColor }}
            >
              <Image src={finish.swatchSrc} alt="" fill sizes="32px" className="object-cover" />
            </span>
          </div>
        ))}
      </RadioGroup>
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

function canDragShowcase(_api: NonNullable<CarouselApi>, event: MouseEvent | TouchEvent) {
  return !(event.target instanceof Element && event.target.closest('[data-showcase-live-surface]'))
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
  // Mount/SSR defaults only. React must not overwrite Embla's interpolated values on selection changes.
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
