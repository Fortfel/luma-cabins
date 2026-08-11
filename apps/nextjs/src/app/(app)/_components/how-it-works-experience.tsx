'use client'

import type * as React from 'react'
import type { CarouselApi } from '@workspace/ui/components/carousel'
import type { ProcessStep } from '~/app/(app)/_data/process-steps'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { buttonVariants } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { Carousel, CarouselContent, CarouselItem } from '@workspace/ui/components/carousel'
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query'
import { usePrefersReducedMotion } from '@workspace/ui/hooks/use-prefers-reduced-motion'
import { cn } from '@workspace/ui/lib/utils'

const ACTIVATION_LINE_RATIO = 0.5
const GESTURE_INTENT_THRESHOLD_PX = 10
const TRIGGER_POSITION_TOLERANCE_PX = 0.5
const DESKTOP_MEDIA_SIZES = '(min-width: 1728px) 756px, (min-width: 1280px) 42vw'
const TABLET_MEDIA_SIZES = '(min-width: 1024px) 60vw, (min-width: 768px) 66vw'
const MOBILE_MEDIA_SIZES = '(min-width: 640px) calc(87vw - 3.125rem), calc(87vw - 2.625rem)'

interface ProcessScrollState {
  activeIndex: number
  progress: number
}

interface MobilePointerGesture {
  intent: 'horizontal' | 'pending' | 'vertical'
  pointerId: number
  startX: number
  startY: number
}

function getProcessScrollState(
  activationY: number,
  triggerPositions: ReadonlyArray<number>,
): ProcessScrollState | null {
  if (triggerPositions.length < 2) {
    return null
  }

  const firstPosition = triggerPositions[0]
  const finalPosition = triggerPositions.at(-1)

  if (firstPosition === undefined || finalPosition === undefined) {
    return null
  }

  const finalIndex = triggerPositions.length - 1

  if (activationY <= firstPosition) {
    return { activeIndex: 0, progress: 0 }
  }

  if (activationY >= finalPosition) {
    return { activeIndex: finalIndex, progress: 1 }
  }

  let activeIndex = 0

  for (let index = 1; index < triggerPositions.length; index += 1) {
    const triggerPosition = triggerPositions[index]

    if (triggerPosition !== undefined && triggerPosition <= activationY) {
      activeIndex = index
    }
  }

  const activePosition = triggerPositions[activeIndex]
  const nextPosition = triggerPositions[activeIndex + 1]

  if (activePosition === undefined || nextPosition === undefined) {
    return null
  }

  const segmentProgress =
    nextPosition > activePosition
      ? Math.min(1, Math.max(0, (activationY - activePosition) / (nextPosition - activePosition)))
      : 0

  return {
    activeIndex,
    progress: (activeIndex + segmentProgress) / finalIndex,
  }
}

function HowItWorksExperience({ steps }: { steps: ReadonlyArray<ProcessStep> }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)', { initializeWithValue: false }) === true
  const shouldReduceMotion = usePrefersReducedMotion()

  const experienceRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<Array<HTMLHeadingElement | null>>([])
  const triggerPositionsRef = useRef<ReadonlyArray<number>>([])
  const activeStepRef = useRef(0)
  const scrollFrameRef = useRef<number | null>(null)
  const measurementFrameRef = useRef<number | null>(null)
  const mobilePointerGestureRef = useRef<MobilePointerGesture | null>(null)
  const lastMobileGestureIntentRef = useRef<'horizontal' | 'vertical' | null>(null)

  useEffect(() => {
    if (!carouselApi) {
      return undefined
    }

    const handleSelection = () => {
      if (isTabletOrDesktop) {
        return
      }

      const nextIndex = carouselApi.selectedScrollSnap()

      activeStepRef.current = nextIndex
      setActiveStepIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex))
    }

    handleSelection()
    carouselApi.on('select', handleSelection)
    carouselApi.on('reInit', handleSelection)

    return () => {
      carouselApi.off('select', handleSelection)
      carouselApi.off('reInit', handleSelection)
    }
  }, [carouselApi, isTabletOrDesktop])

  useEffect(() => {
    if (!isTabletOrDesktop) {
      return undefined
    }

    const experience = experienceRef.current
    const rail = railRef.current

    if (!experience || !rail) {
      return undefined
    }

    const syncTriggerPositions = () => {
      const measuredPositions: Array<number> = []

      for (const trigger of triggerRefs.current) {
        if (!trigger) {
          return
        }

        measuredPositions.push(trigger.getBoundingClientRect().top + window.scrollY)
      }

      if (measuredPositions.length !== steps.length) {
        return
      }

      const cachedPositions = triggerPositionsRef.current
      const hasPositionChange =
        cachedPositions.length !== measuredPositions.length ||
        measuredPositions.some((position, index) => {
          const cachedPosition = cachedPositions[index]

          return cachedPosition === undefined || Math.abs(position - cachedPosition) > TRIGGER_POSITION_TOLERANCE_PX
        })

      if (hasPositionChange) {
        triggerPositionsRef.current = measuredPositions
      }
    }

    const updateScrollState = () => {
      syncTriggerPositions()

      const scrollState = getProcessScrollState(
        window.scrollY + window.innerHeight * ACTIVATION_LINE_RATIO,
        triggerPositionsRef.current,
      )

      if (!scrollState) {
        return
      }

      rail.style.setProperty('--process-progress', String(scrollState.progress))

      if (activeStepRef.current !== scrollState.activeIndex) {
        activeStepRef.current = scrollState.activeIndex
        setActiveStepIndex(scrollState.activeIndex)
      }
    }

    const scheduleMeasurement = () => {
      if (measurementFrameRef.current !== null) {
        return
      }

      measurementFrameRef.current = window.requestAnimationFrame(() => {
        measurementFrameRef.current = null
        updateScrollState()
      })
    }

    const scheduleScrollUpdate = () => {
      if (scrollFrameRef.current !== null) {
        return
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null
        updateScrollState()
      })
    }

    const handleScroll = () => {
      scheduleScrollUpdate()
    }

    const handleViewportResize = () => {
      scheduleMeasurement()
    }

    const resizeObserver = new ResizeObserver(scheduleMeasurement)

    resizeObserver.observe(experience)

    for (const trigger of triggerRefs.current) {
      if (trigger) {
        resizeObserver.observe(trigger)
      }
    }

    // Upstream content can move the triggers without resizing this section.
    resizeObserver.observe(document.documentElement)
    resizeObserver.observe(document.body)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleViewportResize)
    window.visualViewport?.addEventListener('resize', handleViewportResize)
    scheduleMeasurement()

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleViewportResize)
      window.visualViewport?.removeEventListener('resize', handleViewportResize)

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
        scrollFrameRef.current = null
      }

      if (measurementFrameRef.current !== null) {
        window.cancelAnimationFrame(measurementFrameRef.current)
        measurementFrameRef.current = null
      }
    }
  }, [isTabletOrDesktop, steps.length])

  const handleTimelineClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus({ preventScroll: true })

    const trigger = triggerRefs.current[index]

    if (!trigger) {
      return
    }

    const desiredScrollY =
      trigger.getBoundingClientRect().top + window.scrollY - window.innerHeight * ACTIVATION_LINE_RATIO
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

    window.scrollTo({
      top: Math.min(maxScrollY, Math.max(0, desiredScrollY)),
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    })
  }

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('a, button'))

  const handleMobilePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    lastMobileGestureIntentRef.current = null

    if (isInteractiveTarget(event.target)) {
      mobilePointerGestureRef.current = null
      return
    }

    mobilePointerGestureRef.current = {
      intent: 'pending',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  const handleMobilePointerMoveCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = mobilePointerGestureRef.current

    if (!gesture || gesture.pointerId !== event.pointerId || gesture.intent !== 'pending') {
      return
    }

    const horizontalDistance = Math.abs(event.clientX - gesture.startX)
    const verticalDistance = Math.abs(event.clientY - gesture.startY)

    if (Math.max(horizontalDistance, verticalDistance) < GESTURE_INTENT_THRESHOLD_PX) {
      return
    }

    gesture.intent = verticalDistance >= horizontalDistance ? 'vertical' : 'horizontal'
  }

  const handleMobilePointerUpCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = mobilePointerGestureRef.current

    if (!gesture || gesture.pointerId !== event.pointerId) {
      return
    }

    lastMobileGestureIntentRef.current = gesture.intent === 'pending' ? null : gesture.intent
    mobilePointerGestureRef.current = null
  }

  const handleMobilePointerCancelCapture = () => {
    mobilePointerGestureRef.current = null
    lastMobileGestureIntentRef.current = null
  }

  const handleMobileClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const lastGestureIntent = lastMobileGestureIntentRef.current
    lastMobileGestureIntentRef.current = null

    if (lastGestureIntent) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (isInteractiveTarget(event.target)) {
      return
    }

    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const slide = target.closest<HTMLElement>('[data-process-slide]')
    const slideIndex = slide?.dataset.processSlide
    const index = slideIndex === undefined ? Number.NaN : Number(slideIndex)

    if (!Number.isInteger(index) || index < 0 || index >= steps.length || index === activeStepIndex) {
      return
    }

    carouselApi?.scrollTo(index)
  }

  const activeStepLabel = steps[activeStepIndex]?.label ?? steps[0]?.label ?? ''

  return (
    <div ref={experienceRef} className="container-page-2xl max-md:container-bleed">
      <div className="hidden items-start md:grid md:grid-cols-12 md:gap-x-6 xl:grid-cols-16 xl:gap-x-8">
        <ProcessRail
          steps={steps}
          activeStepIndex={activeStepIndex}
          railRef={railRef}
          onTimelineClick={handleTimelineClick}
        />

        <div className="col-span-8 col-start-5 xl:col-span-5">
          <div className="flex flex-col">
            {steps.map((step, index) => (
              <ProcessStepCopy
                key={step.id}
                step={step}
                isLast={index === steps.length - 1}
                isActive={index === activeStepIndex}
                shouldReduceMotion={shouldReduceMotion}
                triggerRef={(node) => {
                  triggerRefs.current[index] = node
                }}
              />
            ))}
          </div>
        </div>

        <ProcessDesktopMedia steps={steps} activeStepIndex={activeStepIndex} shouldReduceMotion={shouldReduceMotion} />
      </div>

      <div className="md:hidden">
        <Carousel
          aria-label="How it works steps"
          tabIndex={0}
          setApi={setCarouselApi}
          opts={{
            align: 'center' as const,
            containScroll: false,
            dragFree: false,
            dragThreshold: GESTURE_INTENT_THRESHOLD_PX,
            loop: false,
          }}
          className="touch-pan-y overflow-hidden focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:outline-none"
          onPointerDownCapture={handleMobilePointerDownCapture}
          onPointerMoveCapture={handleMobilePointerMoveCapture}
          onPointerUpCapture={handleMobilePointerUpCapture}
          onPointerCancelCapture={handleMobilePointerCancelCapture}
          onClickCapture={handleMobileClickCapture}
        >
          <CarouselContent className="ms-0 gap-3 py-px">
            {steps.map((step, index) => (
              <CarouselItem
                key={step.id}
                data-process-slide={index}
                aria-label={`Step ${step.number}: ${step.label}`}
                className="flex basis-[87%] cursor-grab ps-0 active:cursor-grabbing"
              >
                <ProcessMobileCard
                  step={step}
                  isActive={index === activeStepIndex}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <nav aria-label="How it works steps" className="mt-4 flex justify-center">
          <ol className="flex items-center gap-2">
            {steps.map((step, index) => (
              <li key={step.id}>
                <button
                  type="button"
                  aria-label={`Show step ${index + 1}: ${step.label}`}
                  aria-current={index === activeStepIndex ? 'step' : undefined}
                  onClick={() => {
                    carouselApi?.scrollTo(index)
                  }}
                  className={cn(
                    'size-2 cursor-pointer rounded-full bg-primary/25 transition-colors focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:outline-none',
                    index === activeStepIndex && 'bg-primary',
                  )}
                ></button>
              </li>
            ))}
          </ol>
        </nav>

        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          Step {activeStepIndex + 1} of {steps.length}: {activeStepLabel}.
        </p>
      </div>
    </div>
  )
}

function ProcessRail({
  steps,
  activeStepIndex,
  railRef,
  onTimelineClick,
}: {
  steps: ReadonlyArray<ProcessStep>
  activeStepIndex: number
  railRef: React.RefObject<HTMLDivElement | null>
  onTimelineClick: (index: number, event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <aside
      className="sticky top-[calc(var(--nav-height)_+_0.5rem)] col-span-4 h-[calc(100svh_-_var(--nav-height)_-_0.5rem)]"
      aria-label="Process timeline"
    >
      <div
        ref={railRef}
        className="relative flex h-full flex-col border-e border-border/70 pe-6"
        style={{ '--process-progress': 0 } as React.CSSProperties}
      >
        <div className="relative h-1/2 shrink-0">
          <span aria-hidden="true" className="absolute inset-y-6 start-6 w-px bg-border">
            <span
              className="absolute inset-x-0 top-0 h-full origin-top bg-primary"
              style={{ transform: 'scaleY(var(--process-progress))' }}
            />
          </span>

          <ol className="relative flex h-full flex-col justify-between">
            {steps.map((step, index) => {
              const isActive = index === activeStepIndex
              const isReached = index <= activeStepIndex

              return (
                <li key={step.id}>
                  <button
                    type="button"
                    aria-label={`Step ${step.number}: ${step.label}`}
                    aria-current={isActive ? 'step' : undefined}
                    onClick={(event) => {
                      onTimelineClick(index, event)
                    }}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'lg' }),
                      'relative z-10 h-auto min-h-12 w-full justify-start gap-4 rounded-lg px-0 text-left hover:bg-transparent',
                      'transition-none focus-visible:ring-3 focus-visible:ring-ring/60',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-12 shrink-0 place-items-center rounded-full border font-mono text-xs',
                        isReached
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-primary/45 bg-background text-muted-foreground',
                        isActive && 'ring-2 ring-primary/25 ring-offset-2 ring-offset-background',
                      )}
                    >
                      {step.number}
                    </span>
                    <span
                      className={cn(
                        'text-clamp-14-16 leading-tight text-muted-foreground',
                        isActive && 'font-semibold text-foreground',
                        isReached && !isActive && 'text-foreground/75',
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        <div aria-hidden="true" className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_20%,black_78%,transparent_100%)] opacity-25">
            <div className="size-full bg-[radial-gradient(circle,var(--primary)_1px,transparent_1.25px)] bg-size-[14px_14px]" />
          </div>
        </div>
      </div>
    </aside>
  )
}

function ProcessStepCopy({
  step,
  isLast,
  isActive,
  shouldReduceMotion,
  triggerRef,
}: {
  step: ProcessStep
  isLast: boolean
  isActive: boolean
  shouldReduceMotion: boolean
  triggerRef: (node: HTMLHeadingElement | null) => void
}) {
  return (
    <article
      data-process-step={step.id}
      className={cn(
        'flex flex-col gap-6 text-foreground md:gap-5 xl:min-h-[calc(100svh_-_var(--nav-height)_-_0.5rem)] xl:gap-7 xl:pt-[calc(var(--nav-height)_+_0.5rem)]',
        !isLast && 'pb-24 xl:pb-0',
      )}
    >
      <h3
        id={`process-step-${step.id}`}
        ref={triggerRef}
        className="text-clamp-32-52 leading-[1.05] font-medium text-balance"
      >
        {step.title}
      </h3>

      <p className="text-clamp-16-19 max-w-prose leading-[1.35] text-pretty">{step.description}</p>

      <ProcessBulletList step={step} />

      {step.cta ? (
        <Link href={step.cta.href} className={cn(buttonVariants({ size: 'lg' }), 'mt-1 self-start')}>
          {step.cta.label}
        </Link>
      ) : null}

      <ProcessEmbeddedMedia
        step={step}
        sizes={TABLET_MEDIA_SIZES}
        isActive={isActive}
        shouldReduceMotion={shouldReduceMotion}
        className="xl:hidden"
      />
    </article>
  )
}

function ProcessBulletList({ step }: { step: ProcessStep }) {
  return (
    <ul className="text-clamp-14-16 flex flex-col gap-0  ">
      {step.bullets.map((bullet) => (
        <li key={bullet} className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-[0.48em] size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  )
}

function ProcessEmbeddedMedia({
  step,
  sizes,
  isActive,
  shouldReduceMotion,
  className,
}: {
  step: ProcessStep
  sizes: string
  isActive: boolean
  shouldReduceMotion: boolean
  className?: string
}) {
  return (
    // <figure className={cn('relative mt-2 aspect-4/3 overflow-hidden rounded-xl border border-border', className)}>
    <figure className={cn('relative aspect-4/3 overflow-hidden', className)}>
      <ProcessMedia step={step} sizes={sizes} isActive={isActive} shouldReduceMotion={shouldReduceMotion} />
    </figure>
  )
}

function ProcessMedia({
  step,
  sizes,
  isDecorative = false,
  isActive,
  shouldReduceMotion,
  className,
}: {
  step: ProcessStep
  sizes: string
  isDecorative?: boolean
  isActive: boolean
  shouldReduceMotion: boolean
  className?: string
}) {
  const mediaClassName = cn('absolute inset-0 size-full object-cover', className)
  const isVideo = step.media.kind === 'video'

  if (isVideo) {
    return (
      <ProcessVideo
        src={step.media.src}
        alt={isDecorative ? undefined : step.media.alt}
        webmSrc={step.media.webmSrc}
        isDecorative={isDecorative}
        isActive={isActive}
        shouldReduceMotion={shouldReduceMotion}
        className={mediaClassName}
      />
    )
  }

  return (
    <Image
      src={step.media.src}
      alt={isDecorative ? '' : step.media.alt}
      fill
      sizes={sizes}
      loading="lazy"
      unoptimized={step.media.isPlaceholder}
      draggable={false}
      className={mediaClassName}
    />
  )
}

function ProcessVideo({
  src,
  webmSrc,
  alt,
  isDecorative = false,
  isActive,
  shouldReduceMotion,
  className,
}: {
  src: string
  webmSrc?: string
  alt?: string
  isDecorative?: boolean
  isActive: boolean
  shouldReduceMotion: boolean
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const shouldPlay = isActive && !shouldReduceMotion

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return undefined
    }

    video.muted = true
    video.playsInline = true

    if (!shouldPlay) {
      video.pause()
      return undefined
    }

    const playVideo = () => {
      void video.play().catch(() => undefined)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        playVideo()
      }
    }

    playVideo()
    video.addEventListener('canplay', playVideo)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      video.removeEventListener('canplay', playVideo)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [shouldPlay, src, webmSrc])

  return (
    <video
      ref={videoRef}
      aria-label={isDecorative ? undefined : alt}
      aria-hidden={isDecorative ? true : undefined}
      autoPlay={shouldPlay}
      muted
      loop
      playsInline
      preload={shouldPlay ? 'auto' : 'metadata'}
      draggable={false}
      className={cn('size-full', className)}
    >
      {webmSrc === undefined ? null : <source src={webmSrc} type="video/webm" />}
      <source src={src} type="video/mp4" />
    </video>
  )
}

function ProcessDesktopMedia({
  steps,
  activeStepIndex,
  shouldReduceMotion,
}: {
  steps: ReadonlyArray<ProcessStep>
  activeStepIndex: number
  shouldReduceMotion: boolean
}) {
  return (
    <div className="sticky top-[calc(var(--nav-height)_+_0.5rem)] hidden h-[calc(100svh_-_var(--nav-height)_-_0.5rem)] items-center xl:col-span-7 xl:col-start-10 xl:flex">
      <div
        aria-hidden="true"
        className="relative aspect-4/3 max-h-full w-full max-w-full overflow-hidden rounded-xl border border-border bg-background-accent"
      >
        {steps.map((step, index) => (
          <ProcessMedia
            key={step.id}
            step={step}
            isDecorative
            sizes={DESKTOP_MEDIA_SIZES}
            isActive={index === activeStepIndex}
            shouldReduceMotion={shouldReduceMotion}
            className={cn(
              'absolute inset-0 object-cover motion-reduce:transition-none',
              shouldReduceMotion ? 'transition-none' : 'transition-opacity duration-400 ease-out',
              index === activeStepIndex ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
      </div>
    </div>
  )
}

function ProcessMobileCard({
  step,
  isActive,
  shouldReduceMotion,
}: {
  step: ProcessStep
  isActive: boolean
  shouldReduceMotion: boolean
}) {
  const isPrimaryStep = step.number === '01' || step.number === '04'

  return (
    <Card className="h-full w-full gap-0 p-0">
      <div className="relative w-full">
        <ProcessEmbeddedMedia
          step={step}
          sizes={MOBILE_MEDIA_SIZES}
          isActive={isActive}
          shouldReduceMotion={shouldReduceMotion}
          className=""
        />
        <span
          className={cn(
            'absolute inset-s-5 top-5 z-10 grid size-14 place-items-center rounded-full border  font-mono text-xl backdrop-blur-sm',
            isPrimaryStep
              ? 'border-border/50 bg-primary text-primary-foreground'
              : 'border-primary/75 bg-background/90 text-primary',
          )}
        >
          {step.number}
        </span>
        {step.cta && (
          <Link
            href={step.cta.href}
            className={cn(buttonVariants({ size: 'lg' }), 'absolute right-2 bottom-8 h-12 px-5')}
          >
            {step.cta.label}
          </Link>
        )}
      </div>

      <CardHeader className="z-10 -mt-6 gap-2 bg-card pt-6">
        <h3 id={`process-mobile-step-${step.id}`} className="text-clamp-24-36 font-medium text-balance">
          {step.label}
        </h3>

        <p className="text-clamp-14-16 text-pretty">{step.description}</p>
      </CardHeader>

      <CardContent className="flex flex-col pt-2 pb-6">
        <ProcessBulletList step={step} />
      </CardContent>
    </Card>
  )
}

export { HowItWorksExperience }
