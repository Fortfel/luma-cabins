'use client'

import type * as React from 'react'
import type { CarouselApi } from '@workspace/ui/components/carousel'
import type { Cabin } from '~/app/(app)/_data/cabins'

import { useEffect, useMemo, useRef, useState } from 'react'

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
import { Progress } from '@workspace/ui/components/progress'
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query'
import { usePrefersReducedMotion } from '@workspace/ui/hooks/use-prefers-reduced-motion'
import { Autoplay } from '@workspace/ui/lib/embla-plugins'
import { cn } from '@workspace/ui/lib/utils'

import { cabins } from '~/app/(app)/_data/cabins'

const AUTOPLAY_DELAY_MS = 5000
const AUTOPLAY_VISIBILITY_THRESHOLD = 0.35
type AutoplayPlugin = ReturnType<typeof Autoplay>

function ModelsOverviewSection({ className, ...props }: React.ComponentProps<'section'>) {
  const [autoplay] = useState(() =>
    Autoplay({
      delay: AUTOPLAY_DELAY_MS,
      playOnInit: false,
      stopOnInteraction: false,
      stopOnFocusIn: true,
    }),
  )
  const [carouselPlugins] = useState(() => [autoplay])
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isCarouselInView, setIsCarouselInView] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false }) === true
  const shouldReduceMotion = usePrefersReducedMotion()
  const carouselOptions = useMemo(() => ({ align: 'start' as const, loop: true, watchDrag: !isDesktop }), [isDesktop])

  const sectionRef = useRef<HTMLDivElement>(null)

  const activeModel = cabins[activeIndex] ?? cabins[0]

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

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCarouselInView(
          entry ? entry.isIntersecting && entry.intersectionRatio >= AUTOPLAY_VISIBILITY_THRESHOLD : false,
        )
      },
      { threshold: AUTOPLAY_VISIBILITY_THRESHOLD },
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!api) {
      return undefined
    }

    const handleReInit = () => {
      if (!shouldReduceMotion && isCarouselInView) {
        autoplay.play()
      }
    }

    if (shouldReduceMotion || !isCarouselInView) {
      autoplay.stop()
    } else {
      autoplay.play()
    }

    api.on('reInit', handleReInit)

    return () => {
      api.off('reInit', handleReInit)
      autoplay.stop()
    }
  }, [api, autoplay, isCarouselInView, shouldReduceMotion])

  useEffect(() => {
    if (!api || shouldReduceMotion || !isCarouselInView || !autoplay.isPlaying()) {
      return
    }

    autoplay.reset()
  }, [api, autoplay, activeIndex, isCarouselInView, shouldReduceMotion])

  const handleThumbnailClick = (index: number) => {
    api?.scrollTo(index)
    autoplay.reset()
  }

  return (
    <section className={cn('', className)} {...props}>
      <div ref={sectionRef} className="container-page max-xl:px-0">
        <Carousel
          setApi={setApi}
          opts={carouselOptions}
          plugins={carouselPlugins}
          className={cn('group relative overflow-hidden xl:rounded-xl')}
        >
          <CarouselContent className="ms-0">
            {cabins.map((model) => (
              <CarouselItem key={model.name} className="ps-0">
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
                    sizes="(max-width: 1279px) 100vw, (max-width: 1535px) calc(100vw - 8rem), 1408px"
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
            <h2 className="text-clamp-38-56 leading-none font-medium text-primary-foreground" aria-live="polite">
              {activeModel.name}
            </h2>
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
              'md:gap-3 md:p-3',
            )}
          >
            {cabins.map((model, index) => (
              <CabinThumbnail
                key={model.name}
                model={model}
                isActive={index === activeIndex}
                api={api}
                autoplay={autoplay}
                shouldShowAutoplayProgress={!shouldReduceMotion && isCarouselInView}
                onClick={() => {
                  handleThumbnailClick(index)
                }}
              />
            ))}
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
          'group-hover/click-zone:opacity-100',
          isPrevious
            ? '-translate-x-2 group-hover/click-zone:translate-x-0 group-focus-visible/click-zone:translate-x-0'
            : 'translate-x-2 group-hover/click-zone:translate-x-0 group-focus-visible/click-zone:translate-x-0',
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
  api,
  autoplay,
  shouldShowAutoplayProgress,
  onClick,
}: {
  model: Cabin
  isActive: boolean
  api?: CarouselApi
  autoplay: AutoplayPlugin
  shouldShowAutoplayProgress: boolean
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
      {isActive && shouldShowAutoplayProgress ? (
        <CabinAutoplayProgress api={api} autoplay={autoplay} modelName={model.name} />
      ) : null}
    </button>
  )
}

function CabinAutoplayProgress({
  api,
  autoplay,
  modelName,
}: {
  api?: CarouselApi
  autoplay: AutoplayPlugin
  modelName: string
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!api) {
      return undefined
    }

    let frameId = 0

    const updateProgress = () => {
      const timeUntilNext = autoplay.timeUntilNext()

      if (timeUntilNext === null) {
        setProgress(0)

        return
      }

      setProgress(Math.max(0, Math.min(1, 1 - timeUntilNext / AUTOPLAY_DELAY_MS)))
      frameId = requestAnimationFrame(updateProgress)
    }

    const startProgress = () => {
      cancelAnimationFrame(frameId)
      setProgress(0)
      frameId = requestAnimationFrame(updateProgress)
    }

    const stopProgress = () => {
      cancelAnimationFrame(frameId)
      setProgress(0)
    }

    api.on('autoplay:timerset', startProgress)
    api.on('autoplay:timerstopped', stopProgress)

    if (autoplay.isPlaying()) {
      startProgress()
    }

    return () => {
      cancelAnimationFrame(frameId)
      api.off('autoplay:timerset', startProgress)
      api.off('autoplay:timerstopped', stopProgress)
    }
  }, [api, autoplay])

  return (
    <Progress
      value={progress * 100}
      aria-label={`${modelName} slide progress`}
      className={cn(
        'absolute inset-x-0 bottom-0 gap-0',
        '**:data-[slot=progress-track]:h-0.5 **:data-[slot=progress-track]:rounded-none **:data-[slot=progress-track]:bg-primary-foreground/20',
        '**:data-[slot=progress-indicator]:bg-primary-foreground **:data-[slot=progress-indicator]:transition-none',
      )}
    />
  )
}

export { ModelsOverviewSection }
