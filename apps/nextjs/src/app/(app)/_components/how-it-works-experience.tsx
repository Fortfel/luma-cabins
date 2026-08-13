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

const ACTIVATION_BAND_TOP_RATIO = 0.25
const ACTIVATION_BAND_BOTTOM_RATIO = 0.5
const GESTURE_INTENT_THRESHOLD_PX = 10
const DESKTOP_MEDIA_SIZES = '(min-width: 1728px) 756px, (min-width: 1280px) 42vw'
const TABLET_MEDIA_SIZES = '(min-width: 1024px) 60vw, (min-width: 768px) 66vw'
const MOBILE_MEDIA_SIZES = '(min-width: 640px) calc(87vw - 3.125rem), calc(87vw - 2.625rem)'

interface MobilePointerGesture {
  intent: 'horizontal' | 'pending' | 'vertical'
  pointerId: number
  startX: number
  startY: number
}

function HowItWorksExperience({ steps }: { steps: ReadonlyArray<ProcessStep> }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false)
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)', { initializeWithValue: false }) === true
  const shouldReduceMotion = usePrefersReducedMotion()

  const experienceRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<Array<HTMLHeadingElement | null>>([])
  const stepContentRefs = useRef<Array<HTMLDivElement | null>>([])
  const activeStepRef = useRef(0)
  const lastScrollYRef = useRef<number | null>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const mobilePointerGestureRef = useRef<MobilePointerGesture | null>(null)
  const lastMobileGestureIntentRef = useRef<'horizontal' | 'vertical' | null>(null)

  useEffect(() => {
    const experience = experienceRef.current

    if (!experience || typeof IntersectionObserver === 'undefined') {
      setHasEnteredViewport(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry === undefined) {
          return
        }

        if (!entry.isIntersecting) {
          return
        }

        setHasEnteredViewport(true)
        observer.disconnect()
      },
      { rootMargin: '400px 0px' },
    )

    observer.observe(experience)

    return () => {
      observer.disconnect()
    }
  }, [])

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

    if (!experience) {
      return undefined
    }

    const updateActiveStep = () => {
      scrollFrameRef.current = null

      const scrollY = window.scrollY
      const previousScrollY = lastScrollYRef.current
      lastScrollYRef.current = scrollY

      if (previousScrollY === null || scrollY === previousScrollY) {
        return
      }

      const direction = scrollY > previousScrollY ? 1 : -1
      const bandTop = window.innerHeight * ACTIVATION_BAND_TOP_RATIO
      const bandBottom = window.innerHeight * ACTIVATION_BAND_BOTTOM_RATIO
      const currentIndex = activeStepRef.current
      let nextIndex = currentIndex
      const intersectsActivationBand = (content: HTMLDivElement) => {
        const bounds = content.getBoundingClientRect()

        return bounds.top <= bandBottom && bounds.bottom >= bandTop
      }

      if (direction > 0) {
        for (let index = currentIndex + 1; index < steps.length; index += 1) {
          const content = stepContentRefs.current[index]

          if (content && intersectsActivationBand(content)) {
            nextIndex = index
          }
        }
      } else {
        for (let index = currentIndex - 1; index >= 0; index -= 1) {
          const content = stepContentRefs.current[index]

          if (content && intersectsActivationBand(content)) {
            nextIndex = index
          }
        }
      }

      if (nextIndex !== currentIndex) {
        activeStepRef.current = nextIndex
        setActiveStepIndex(nextIndex)
      }
    }

    const scheduleActiveStepUpdate = () => {
      if (scrollFrameRef.current !== null) {
        return
      }

      scrollFrameRef.current = window.requestAnimationFrame(updateActiveStep)
    }

    lastScrollYRef.current = window.scrollY
    window.addEventListener('scroll', scheduleActiveStepUpdate, { passive: true })
    window.addEventListener('resize', scheduleActiveStepUpdate)
    window.visualViewport?.addEventListener('resize', scheduleActiveStepUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleActiveStepUpdate)
      window.removeEventListener('resize', scheduleActiveStepUpdate)
      window.visualViewport?.removeEventListener('resize', scheduleActiveStepUpdate)

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
        scrollFrameRef.current = null
      }
    }
  }, [isTabletOrDesktop, steps.length])

  const handleTimelineClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus({ preventScroll: true })

    const trigger = triggerRefs.current[index]

    if (!trigger) {
      return
    }

    const step = trigger.closest<HTMLElement>('[data-process-step]') ?? trigger

    if (shouldReduceMotion) {
      activeStepRef.current = index
      setActiveStepIndex(index)
    }

    step.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
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
          shouldReduceMotion={shouldReduceMotion}
          onTimelineClick={handleTimelineClick}
          className="sticky top-[calc(var(--nav-height)+0.5rem)] col-span-4 h-[calc(100svh-var(--nav-height)-0.5rem)] pt-4"
        />

        <div className="col-span-8 col-start-5 xl:col-span-5">
          <div className="flex flex-col gap-32 xl:gap-0">
            {steps.map((step, index) => (
              <ProcessStepCopy
                key={step.id}
                step={step}
                isActive={index === activeStepIndex}
                shouldPreload={hasEnteredViewport && Math.abs(index - activeStepIndex) <= 1}
                shouldReduceMotion={shouldReduceMotion}
                contentRef={(node) => {
                  stepContentRefs.current[index] = node
                }}
                triggerRef={(node) => {
                  triggerRefs.current[index] = node
                }}
              />
            ))}
          </div>
        </div>

        <ProcessDesktopMedia
          steps={steps}
          activeStepIndex={activeStepIndex}
          hasEnteredViewport={hasEnteredViewport}
          shouldReduceMotion={shouldReduceMotion}
        />
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
          <CarouselContent className="ms-0 gap-3 py-px select-none">
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
                  shouldPreload={hasEnteredViewport && Math.abs(index - activeStepIndex) <= 1}
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
  shouldReduceMotion,
  onTimelineClick,
  className,
}: {
  steps: ReadonlyArray<ProcessStep>
  activeStepIndex: number
  shouldReduceMotion: boolean
  onTimelineClick: (index: number, event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}) {
  const progress = steps.length > 1 ? activeStepIndex / (steps.length - 1) : 0

  return (
    <aside className={cn(className)} aria-label="Process timeline">
      <div className="relative flex h-full flex-col pe-4">
        <div className="relative h-full max-h-96 shrink-0">
          <span aria-hidden="true" className="absolute inset-y-6 start-6 w-px bg-border">
            <span
              className={cn(
                'absolute inset-x-0 top-0 h-full origin-top bg-primary transition-transform duration-400 ease-out',
                shouldReduceMotion && 'transition-none',
              )}
              style={{ transform: `scaleY(${progress})` }}
            />
          </span>

          <ol className="relative flex h-full flex-col justify-between gap-4">
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
                      'relative z-10 h-auto min-h-12 w-full cursor-pointer justify-start gap-4 rounded-lg px-0 text-left',
                      'transition-none focus-visible:ring-3 focus-visible:ring-ring/60',
                      'hover:bg-transparent!',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-12 shrink-0 place-items-center rounded-full border font-mono text-base',
                        'group-hover/button:bg-[color-mix(in_oklab,var(--color-primary)_80%,white)] group-hover/button:text-primary-foreground',
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
                        'text-clamp-15-18 leading-tight text-muted-foreground',
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
          <div className="absolute inset-0 mask-[linear-gradient(to_bottom,transparent_0%,black_20%,black_78%,transparent_100%)] opacity-25">
            <div className="size-full bg-[radial-gradient(circle,var(--primary)_1px,transparent_1.25px)] bg-size-[12px_12px]" />
          </div>
        </div>
      </div>
    </aside>
  )
}

function ProcessStepCopy({
  step,
  isActive,
  shouldPreload,
  shouldReduceMotion,
  contentRef,
  triggerRef,
}: {
  step: ProcessStep
  isActive: boolean
  shouldPreload: boolean
  shouldReduceMotion: boolean
  contentRef: (node: HTMLDivElement | null) => void
  triggerRef: (node: HTMLHeadingElement | null) => void
}) {
  return (
    <article
      data-process-step={step.id}
      className="scroll-mt-[calc(var(--nav-height)+0.5rem)] text-foreground xl:min-h-[calc(100svh-var(--nav-height)-0.5rem)]"
    >
      <div ref={contentRef} data-process-step-content className="flex flex-col gap-6 pt-4 xl:gap-8">
        <h3
          id={`process-step-${step.id}`}
          ref={triggerRef}
          className="text-clamp-28-44 leading-[1.05] font-medium text-balance"
        >
          {step.title}
        </h3>

        <div className="flex flex-col gap-2">
          <p className="text-clamp-15-18 leading-[1.35] text-pretty">{step.description}</p>

          <ProcessBulletList step={step} />
        </div>

        {step.cta ? (
          <Link href={step.cta.href} className={cn(buttonVariants({ size: 'lg' }), 'mt-1 self-start')}>
            {step.cta.label}
          </Link>
        ) : null}

        <ProcessEmbeddedMedia
          step={step}
          sizes={TABLET_MEDIA_SIZES}
          isActive={isActive}
          shouldPreload={shouldPreload}
          shouldReduceMotion={shouldReduceMotion}
          className="xl:hidden"
        />
      </div>
    </article>
  )
}

function ProcessBulletList({ step, className }: { step: ProcessStep; className?: string }) {
  return (
    <ul className={cn('text-clamp-14-16 flex flex-col gap-0', className)}>
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
  shouldPreload,
  shouldReduceMotion,
  className,
}: {
  step: ProcessStep
  sizes: string
  isActive: boolean
  shouldPreload: boolean
  shouldReduceMotion: boolean
  className?: string
}) {
  return (
    <figure className={cn('relative aspect-4/3 overflow-hidden', className)}>
      <ProcessMedia
        step={step}
        sizes={sizes}
        isActive={isActive}
        shouldPreload={shouldPreload}
        shouldReduceMotion={shouldReduceMotion}
      />
    </figure>
  )
}

function ProcessMedia({
  step,
  sizes,
  isDecorative = false,
  isActive,
  shouldPreload,
  shouldReduceMotion,
  className,
}: {
  step: ProcessStep
  sizes: string
  isDecorative?: boolean
  isActive: boolean
  shouldPreload: boolean
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
        posterSrc={step.media.posterSrc}
        isDecorative={isDecorative}
        isActive={isActive}
        shouldPreload={shouldPreload}
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
      loading={shouldPreload ? 'eager' : 'lazy'}
      unoptimized={step.media.isPlaceholder}
      draggable={false}
      className={mediaClassName}
    />
  )
}

function ProcessVideo({
  src,
  webmSrc,
  posterSrc,
  alt,
  isDecorative = false,
  isActive,
  shouldPreload,
  shouldReduceMotion,
  className,
}: {
  src: string
  webmSrc?: string
  posterSrc?: string
  alt?: string
  isDecorative?: boolean
  isActive: boolean
  shouldPreload: boolean
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
      poster={posterSrc}
      preload={shouldPreload ? 'auto' : 'metadata'}
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
  hasEnteredViewport,
  shouldReduceMotion,
}: {
  steps: ReadonlyArray<ProcessStep>
  activeStepIndex: number
  hasEnteredViewport: boolean
  shouldReduceMotion: boolean
}) {
  return (
    <div className="sticky top-[calc(var(--nav-height)+0.5rem)] hidden h-[calc(100svh-var(--nav-height)-0.5rem)] items-center xl:col-span-7 xl:col-start-10 xl:flex">
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
            shouldPreload={hasEnteredViewport && Math.abs(index - activeStepIndex) <= 1}
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
  shouldPreload,
  shouldReduceMotion,
}: {
  step: ProcessStep
  isActive: boolean
  shouldPreload: boolean
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
          shouldPreload={shouldPreload}
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

        <p className="text-clamp-15-18 text-pretty">{step.description}</p>
      </CardHeader>

      <CardContent className="flex flex-col pt-2 pb-6">
        <ProcessBulletList step={step} className="text-clamp-14-16" />
      </CardContent>
    </Card>
  )
}

export { HowItWorksExperience }
