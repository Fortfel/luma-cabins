'use client'

import type * as React from 'react'
import type { CarouselApi } from '@workspace/ui/components/carousel'
import type { Cabin } from '~/app/(app)/_data/cabins'

import { useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

import { buttonVariants } from '@workspace/ui/components/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@workspace/ui/components/carousel'
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query'
import { usePrefersReducedMotion } from '@workspace/ui/hooks/use-prefers-reduced-motion'
import { cn } from '@workspace/ui/lib/utils'

import { cabins } from '~/app/(app)/_data/cabins'
import { PlayPauseButton } from '~/app/_components/layout/play-pause-button'

const AUTOPLAY_DELAY_MS = 4000
const AUTOPLAY_VISIBILITY_THRESHOLD = 0.35
const GESTURE_INTENT_THRESHOLD_PX = 8
type AutoplayPauseReason = 'explicit' | 'interaction' | null

interface CarouselPointerGesture {
  intent: 'horizontal' | 'pending' | 'vertical'
  pointerId: number
  startX: number
  startY: number
}

function ModelsOverviewSection({ className, ...props }: React.ComponentProps<'section'>) {
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isCarouselInView, setIsCarouselInView] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)
  const [autoplayPauseReason, setAutoplayPauseReason] = useState<AutoplayPauseReason>(null)
  const [autoplayProgressCycle, setAutoplayProgressCycle] = useState(0)
  const isDesktop = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false }) === true
  const shouldReduceMotion = usePrefersReducedMotion()

  const isAutoplayControlPointerInteractionRef = useRef(false)
  const autoplayTimerRef = useRef<number | null>(null)
  const carouselPointerGestureRef = useRef<CarouselPointerGesture | null>(null)

  const activeModel = cabins[activeIndex] ?? cabins[0]
  const activeSlideLabel = `${activeIndex + 1} of ${cabins.length} — ${activeModel.name}`
  // Autoplay requires motion consent, sufficient visibility, and no user-requested pause.
  const canAutoplay =
    Boolean(api) && !shouldReduceMotion && isCarouselInView && isDocumentVisible && autoplayPauseReason === null

  useEffect(() => {
    if (!api) {
      return undefined
    }

    const handleSelect = () => {
      setActiveIndex(api.selectedScrollSnap())
    }
    const handleReInit = () => {
      handleSelect()
      setAutoplayProgressCycle((cycle) => cycle + 1)
    }

    handleSelect()
    api.on('select', handleSelect)
    api.on('reInit', handleReInit)

    return () => {
      api.off('select', handleSelect)
      api.off('reInit', handleReInit)
    }
  }, [api])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === 'visible')
    }

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const section = api?.rootNode()

    if (!section) {
      return undefined
    }

    // Visibility gating prevents autoplay from running while the carousel is off-screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isInView = entry
          ? entry.isIntersecting && entry.intersectionRatio >= AUTOPLAY_VISIBILITY_THRESHOLD
          : false

        setIsCarouselInView(isInView)

        if (!isInView) {
          setAutoplayPauseReason((pauseReason) => (pauseReason === 'interaction' ? null : pauseReason))
        }
      },
      { threshold: AUTOPLAY_VISIBILITY_THRESHOLD },
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
    }
  }, [api])

  useEffect(() => {
    if (!api || !canAutoplay) {
      return undefined
    }

    const timerId = window.setTimeout(() => {
      autoplayTimerRef.current = null
      api.scrollNext()
    }, AUTOPLAY_DELAY_MS)
    autoplayTimerRef.current = timerId

    return () => {
      window.clearTimeout(timerId)

      if (autoplayTimerRef.current === timerId) {
        autoplayTimerRef.current = null
      }
    }
  }, [activeIndex, api, autoplayProgressCycle, canAutoplay])

  const stopAutoplayTimer = () => {
    if (autoplayTimerRef.current !== null) {
      window.clearTimeout(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }

  // Direct carousel navigation pauses autoplay without treating vertical scrolling or inert taps as intent.
  const stopAutoplayFromInteraction = () => {
    stopAutoplayTimer()
    setAutoplayPauseReason((pauseReason) => (pauseReason === 'explicit' ? pauseReason : 'interaction'))
  }

  const isAutoplayControlTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('[data-autoplay-control]'))

  const handlePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    isAutoplayControlPointerInteractionRef.current = isAutoplayControlTarget(event.target)

    if (
      isDesktop ||
      isAutoplayControlPointerInteractionRef.current ||
      (event.target instanceof Element && Boolean(event.target.closest('button'))) ||
      carouselPointerGestureRef.current
    ) {
      return
    }

    carouselPointerGestureRef.current = {
      intent: 'pending',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  const handlePointerMoveCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = carouselPointerGestureRef.current

    if (gesture?.pointerId !== event.pointerId || gesture.intent !== 'pending') {
      return
    }

    const horizontalDistance = Math.abs(event.clientX - gesture.startX)
    const verticalDistance = Math.abs(event.clientY - gesture.startY)

    if (Math.max(horizontalDistance, verticalDistance) < GESTURE_INTENT_THRESHOLD_PX) {
      return
    }

    if (verticalDistance >= horizontalDistance) {
      gesture.intent = 'vertical'
      return
    }

    gesture.intent = 'horizontal'
    stopAutoplayFromInteraction()
  }

  const clearPointerGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (carouselPointerGestureRef.current?.pointerId === event.pointerId) {
      carouselPointerGestureRef.current = null
    }
  }

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      !isAutoplayControlTarget(event.target) &&
      event.target instanceof Element &&
      Boolean(event.target.closest('button'))
    ) {
      stopAutoplayFromInteraction()
    }
  }

  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isAutoplayControlTarget(event.target)) {
      stopAutoplayFromInteraction()
    }
  }

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    // Clicking the play/pause control already updates its own explicit pause state.
    const shouldIgnorePointerFocus =
      isAutoplayControlPointerInteractionRef.current && isAutoplayControlTarget(event.target)

    isAutoplayControlPointerInteractionRef.current = false

    if (!shouldIgnorePointerFocus) {
      stopAutoplayFromInteraction()
    }
  }

  const handleToggleAutoplay = () => {
    if (canAutoplay) {
      stopAutoplayTimer()
      setAutoplayPauseReason('explicit')

      return
    }

    if (shouldReduceMotion) {
      return
    }

    setAutoplayPauseReason(null)
  }

  const handleThumbnailClick = (index: number) => {
    api?.scrollTo(index)
  }

  return (
    <section className={cn('4xl:px-4', className)} {...props}>
      <h2 className="sr-only">Cabin models</h2>
      <div
        className="container-page-4xl container-bleed"
        onPointerDownCapture={handlePointerDownCapture}
        onPointerMoveCapture={handlePointerMoveCapture}
        onPointerUpCapture={clearPointerGesture}
        onPointerCancelCapture={clearPointerGesture}
        onClickCapture={handleClickCapture}
        onKeyDownCapture={handleKeyDownCapture}
        onFocusCapture={handleFocusCapture}
      >
        <Carousel
          aria-label="Cabin models"
          setApi={setApi}
          opts={{ align: 'start' as const, loop: true, watchDrag: !isDesktop }}
          className={cn('4xl:rounded-xl relative overflow-hidden')}
        >
          <CarouselContent className="ms-0">
            {cabins.map((model, index) => (
              <CarouselItem
                key={model.name}
                aria-label={`${index + 1} of ${cabins.length} — ${model.name}`}
                className="ps-0"
              >
                <div
                  className={cn(
                    'relative aspect-square cursor-pointer',
                    'sm:aspect-4/3',
                    'lg:aspect-video',
                    isDesktop ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                  )}
                >
                  <Image
                    src={model.images.overview}
                    alt={model.images.overviewAlt}
                    fill
                    sizes="(max-width: 1919px) 100vw, 1920px"
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Gradient TOP */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_top,rgba(14,13,11,0)_0%,rgba(14,13,11,0.6)_100%)] md:h-45 lg:hidden" />
          {/* Gradient BOTTOM */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(14,13,11,0)_75%,rgba(14,13,11,0.5)_100%)] lg:bg-[linear-gradient(to_bottom,rgba(14,13,11,0)_45%,rgba(14,13,11,0.85)_100%)]" />

          <div className="absolute top-5 left-5 flex flex-col gap-1 md:top-3.5 md:left-6 lg:top-auto lg:bottom-12 lg:left-12 lg:gap-2">
            <h3 className="text-clamp-38-56 leading-none font-medium text-primary-foreground">{activeModel.name}</h3>
            <p className="hidden text-sm font-semibold text-primary-foreground md:block lg:text-base">
              {activeModel.specs.area}&nbsp;&nbsp; · &nbsp;&nbsp;{activeModel.specs.layout}
            </p>
          </div>

          <CarouselPrevious
            className={cn(
              'left-5 hidden size-12 cursor-pointer border-primary-foreground/20 bg-transparent text-primary-foreground backdrop-blur-xl',
              'hover:bg-primary-foreground/10 hover:text-primary-foreground',
              'active:-translate-y-1/2!',
              'md:inline-flex lg:hidden',
            )}
          />
          <CarouselNext
            className={cn(
              'right-5 hidden size-12 cursor-pointer border-primary-foreground/20 bg-transparent text-primary-foreground backdrop-blur-xl',
              'hover:bg-primary-foreground/10 hover:text-primary-foreground',
              'active:-translate-y-1/2!',
              'md:inline-flex lg:hidden',
            )}
          />

          <DesktopClickZone api={api} direction="previous" isDesktop={isDesktop} />
          <DesktopClickZone api={api} direction="next" isDesktop={isDesktop} />

          <div
            className={cn(
              'absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border/20 p-2 backdrop-blur-xl',
              'max-[450px]:left-[calc(50%-clamp(1px,calc(138.46px-30.769vw),40px))] max-[450px]:[&>button]:h-12',
              'md:gap-3 md:p-3',
            )}
          >
            {cabins.map((model, index) => (
              <CabinThumbnail
                key={model.name}
                model={model}
                isActive={index === activeIndex}
                shouldShowAutoplayProgress={canAutoplay}
                autoplayProgressCycle={autoplayProgressCycle}
                onClick={() => {
                  handleThumbnailClick(index)
                }}
              />
            ))}
          </div>

          <PlayPauseButton
            data-autoplay-control
            isPaused={!canAutoplay}
            playLabel="Play cabin models carousel"
            pauseLabel="Pause cabin models carousel"
            onClick={handleToggleAutoplay}
            aria-disabled={shouldReduceMotion}
            className="absolute right-3 bottom-8 z-20 border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground/80 sm:right-6"
          />

          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {activeSlideLabel}
          </div>
        </Carousel>
      </div>
    </section>
  )
}

function DesktopClickZone({
  api,
  direction,
  isDesktop,
}: {
  api?: CarouselApi
  direction: 'previous' | 'next'
  isDesktop: boolean
}) {
  const isPrevious = direction === 'previous'
  const isDisabled = api ? (isPrevious ? !api.canScrollPrev() : !api.canScrollNext()) : true
  const Icon = isPrevious ? ChevronLeft : ChevronRight

  const handleClick = () => {
    if (isPrevious) {
      api?.scrollPrev()
      return
    }

    api?.scrollNext()
  }

  return (
    <button
      type="button"
      aria-label={isPrevious ? 'Show previous cabin' : 'Show next cabin'}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'group/click-zone absolute inset-y-0 w-1/3 cursor-pointer items-center px-8 text-primary-foreground lg:flex xl:px-10',
        'focus-visible:outline-none',
        isPrevious ? 'left-0 justify-start' : 'right-0 justify-end',
        isDesktop ? 'flex' : 'hidden',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon-lg' }),
          'size-14 cursor-pointer border-primary-foreground/20 bg-transparent text-primary-foreground opacity-0 backdrop-blur-xl transition-[opacity,translate]',
          'hover:bg-primary-foreground/10 hover:text-primary-foreground',
          'group-hover/click-zone:translate-x-0 group-hover/click-zone:opacity-100 group-focus-visible/click-zone:translate-x-0 group-focus-visible/click-zone:opacity-100',
          'group-focus-visible/click-zone:ring-3 group-focus-visible/click-zone:ring-ring/80 group-focus-visible/click-zone:outline-none',
          isPrevious ? '-translate-x-2' : 'translate-x-2',
        )}
      >
        <Icon className="size-7" />
      </span>
    </button>
  )
}

function CabinThumbnail({
  model,
  isActive,
  shouldShowAutoplayProgress,
  autoplayProgressCycle,
  onClick,
}: {
  model: Cabin
  isActive: boolean
  shouldShowAutoplayProgress: boolean
  autoplayProgressCycle: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`Show ${model.name} cabin`}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        'relative aspect-5/3 h-14 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-border/20 opacity-50',
        'transition-[border-color,opacity,outline-color] focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:outline-none',
        isActive && 'border-border/75 opacity-100 outline-2 outline-border/75',
        'md:aspect-video md:h-18',
      )}
    >
      <Image src={model.images.overview} alt="" fill sizes="(max-width: 767px) 86px, 128px" className="object-cover" />
      {isActive && shouldShowAutoplayProgress ? <CabinAutoplayProgress key={autoplayProgressCycle} /> : null}
    </button>
  )
}

function CabinAutoplayProgress() {
  return (
    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-foreground/20">
      <span
        className="block h-full w-0 bg-primary-foreground"
        style={{ animation: `cabin-carousel-progress ${AUTOPLAY_DELAY_MS}ms linear forwards` }}
      />
    </span>
  )
}

export { ModelsOverviewSection }
