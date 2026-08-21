'use client'

import type * as React from 'react'
import type { CarouselApi } from '@workspace/ui/components/carousel'
import type { Testimonial } from '~/app/[locale]/(app)/_data/testimonials'
import type { Locale } from '~/i18n/routing'

import { useEffect, useEffectEvent, useLayoutEffect, useState } from 'react'

import { Plus, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { createPortal } from 'react-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import { Carousel, CarouselContent, CarouselItem } from '@workspace/ui/components/carousel'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { useIsMobile } from '@workspace/ui/hooks/use-mobile'
import { usePrefersReducedMotion } from '@workspace/ui/hooks/use-prefers-reduced-motion'
import { AutoScroll } from '@workspace/ui/lib/embla-plugins'
import { cn } from '@workspace/ui/lib/utils'

import { createTestimonials } from '~/app/[locale]/(app)/_data/testimonials'
import {
  carousel_role,
  carousel_slide_role,
  testimonials_carousel_label,
  testimonials_close,
  testimonials_position,
  testimonials_rating,
  testimonials_read_full,
  testimonials_title,
} from '~/paraglide/messages.js'

const AUTO_SCROLL_SPEED = 0.75
const AUTO_SCROLL_START_DELAY_MS = 100
const AUTO_SCROLL_VISIBILITY_THRESHOLD = 0.01
const CENTERING_FALLBACK_MS = 600
const GEOMETRY_DURATION_S = 0.48
const REPOSITION_DURATION_S = GEOMETRY_DURATION_S * (7 / 12)
const CLOSING_GEOMETRY_DURATION_S = GEOMETRY_DURATION_S * 0.875
const REVIEW_DURATION_S = 0.18
const REVIEW_DELAY_S = 0.14
const MOBILE_NEAREST_EDGE_INSET_PX = 12
const DESKTOP_NEAREST_EDGE_INSET_PX = 92
const NEAREST_EDGE_SCROLL_DURATION = 14
const POPOVER_VIEWPORT_INSET_PX = 30
const SCROLL_DISTANCE_TOLERANCE_PX = 1
const RATING_STARS = [1, 2, 3, 4, 5] as const
const MOVE_EASE = [0.22, 1, 0.36, 1] as const

type PopoverOpenChangeHandler = NonNullable<React.ComponentProps<typeof Popover>['onOpenChange']>
interface TriggerMetrics {
  width: number
  height: number
}

interface TestimonialsSectionProps extends React.ComponentProps<'section'> {
  readonly locale: Locale
}

function TestimonialsSection({ locale, className, ...props }: TestimonialsSectionProps) {
  const testimonials = createTestimonials(locale)
  const messageOptions = { locale }
  const [autoScroll] = useState(() =>
    AutoScroll({
      speed: AUTO_SCROLL_SPEED,
      startDelay: AUTO_SCROLL_START_DELAY_MS,
      playOnInit: false,
      stopOnInteraction: true,
      stopOnFocusIn: false,
      stopOnMouseEnter: false,
    }),
  )
  const [carouselPlugins] = useState(() => [autoScroll])
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [activeTriggerId, setActiveTriggerId] = useState<string | null>(null)
  const [activeTriggerMetrics, setActiveTriggerMetrics] = useState<TriggerMetrics | null>(null)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isPopoverClosing, setIsPopoverClosing] = useState(false)
  const [isPopoverReady, setIsPopoverReady] = useState(false)
  const [isCarouselInView, setIsCarouselInView] = useState(false)
  const [isMouseOver, setIsMouseOver] = useState(false)
  const [isKeyboardFocusWithin, setIsKeyboardFocusWithin] = useState(false)
  const [isPointerInteracting, setIsPointerInteracting] = useState(false)
  const isDesktop = !useIsMobile()
  const shouldReduceMotion = usePrefersReducedMotion()

  const activeTestimonial = activeIndex === null ? null : testimonials[activeIndex]
  const canAutoScroll =
    Boolean(api) &&
    !shouldReduceMotion &&
    isCarouselInView &&
    !isMouseOver &&
    !isKeyboardFocusWithin &&
    !isPointerInteracting &&
    pendingIndex === null &&
    !isPopoverOpen

  useEffect(() => {
    const section = api?.rootNode()

    if (!section) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCarouselInView(
          entry ? entry.isIntersecting && entry.intersectionRatio >= AUTO_SCROLL_VISIBILITY_THRESHOLD : false,
        )
      },
      { threshold: AUTO_SCROLL_VISIBILITY_THRESHOLD },
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
    }
  }, [api])

  useEffect(() => {
    if (!api) {
      return undefined
    }

    const handlePointerDown = () => {
      setIsPointerInteracting(true)
    }
    const handlePointerUp = () => {
      setIsPointerInteracting(false)
    }

    api.on('pointerDown', handlePointerDown)
    api.on('pointerUp', handlePointerUp)

    return () => {
      api.off('pointerDown', handlePointerDown)
      api.off('pointerUp', handlePointerUp)
    }
  }, [api])

  useEffect(() => {
    if (!api) {
      return undefined
    }

    const syncAutoScroll = () => {
      if (canAutoScroll) {
        autoScroll.play()
      } else {
        autoScroll.stop()
      }
    }

    syncAutoScroll()
    api.on('reInit', syncAutoScroll)

    return () => {
      api.off('reInit', syncAutoScroll)
      autoScroll.stop()
    }
  }, [api, autoScroll, canAutoScroll])

  useEffect(() => {
    if (!api || isPopoverOpen) {
      return undefined
    }

    const hoverFrame = window.requestAnimationFrame(() => {
      setIsMouseOver(api.rootNode().matches(':hover'))
    })

    return () => {
      window.cancelAnimationFrame(hoverFrame)
    }
  }, [api, isPopoverOpen])

  useEffect(() => {
    if (!api || pendingIndex === null) {
      return undefined
    }

    let hasCompleted = false
    let centeringFrame = 0

    const completeCentering = () => {
      if (hasCompleted) {
        return
      }

      hasCompleted = true
      setPendingIndex(null)
      setIsPopoverClosing(false)
      setIsPopoverOpen(true)
    }

    api.on('settle', completeCentering)
    const didScroll = scrollSlideToNearestEdge(api, pendingIndex, isDesktop)

    const checkCentering = () => {
      if (getNearestEdgeScrollDistance(api, pendingIndex, isDesktop) === 0) {
        completeCentering()
        return
      }

      centeringFrame = window.requestAnimationFrame(checkCentering)
    }

    if (didScroll) {
      centeringFrame = window.requestAnimationFrame(checkCentering)
    }

    const fallbackTimeout = window.setTimeout(completeCentering, didScroll ? CENTERING_FALLBACK_MS : 0)

    return () => {
      hasCompleted = true
      window.cancelAnimationFrame(centeringFrame)
      window.clearTimeout(fallbackTimeout)
      api.off('settle', completeCentering)
    }
  }, [api, isDesktop, pendingIndex])

  const handlePopoverOpenChange: PopoverOpenChangeHandler = (isOpen, eventDetails) => {
    if (!isOpen) {
      setPendingIndex(null)

      if (isPopoverOpen) {
        setIsPopoverClosing(true)
      }

      return
    }

    const trigger = eventDetails.trigger

    if (!trigger || trigger.id === '') {
      return
    }

    const triggerId = trigger.id

    const index = testimonials.findIndex((testimonial) => getTestimonialTriggerId(testimonial) === triggerId)

    if (index < 0) {
      return
    }

    autoScroll.stop()
    const triggerBounds = trigger.getBoundingClientRect()

    setActiveIndex(index)
    setActiveTriggerId(triggerId)
    setActiveTriggerMetrics({ width: triggerBounds.width, height: triggerBounds.height })
    setIsPopoverReady(false)

    if (!api || getNearestEdgeScrollDistance(api, index, isDesktop) === 0) {
      setPendingIndex(null)
      setIsPopoverClosing(false)
      setIsPopoverOpen(true)
      return
    }

    setIsPopoverOpen(false)
    setPendingIndex(index)
  }

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
      setIsKeyboardFocusWithin(true)
      const testimonialTrigger = event.target.closest('[data-testimonial-index]')

      if (api && testimonialTrigger instanceof HTMLElement) {
        const index = Number(testimonialTrigger.dataset.testimonialIndex)

        if (Number.isInteger(index)) {
          autoScroll.stop()
          scrollSlideToNearestEdge(api, index, isDesktop)
        }
      }
    }
  }

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
      setIsKeyboardFocusWithin(false)
    }
  }

  return (
    <section className={className} {...props}>
      <div
        className={cn(
          'container-page-2xl flex flex-col items-center gap-4',
          'mr-[max(0px,calc((100%-2560px)/2))]',
          'sm:gap-5 md:gap-7',
          'max-lg:container-bleed lg:flex-row lg:gap-[clamp(2rem,calc(-6.5rem+13.28125vw),6.25rem)]',
        )}
      >
        <h2 className="text-heading-md max-lg:section-px w-full text-center text-balance text-foreground lg:w-62 lg:shrink-0 lg:px-0 lg:text-left">
          {testimonials_title({}, messageOptions)}
        </h2>

        {isPopoverOpen ? (
          <TestimonialBackdrop
            label={testimonials_close({}, messageOptions)}
            onClick={() => {
              setIsPopoverClosing(true)
            }}
          />
        ) : null}

        <Popover open={isPopoverOpen} triggerId={activeTriggerId} onOpenChange={handlePopoverOpenChange}>
          <Carousel
            aria-label={testimonials_carousel_label({}, messageOptions)}
            aria-roledescription={carousel_role({}, messageOptions)}
            setApi={setApi}
            opts={{ align: 'start', dragFree: true, loop: true, watchDrag: !isDesktop, watchFocus: false }}
            plugins={carouselPlugins}
            onMouseEnter={() => {
              setIsMouseOver(true)
            }}
            onMouseLeave={() => {
              setIsMouseOver(false)
            }}
            onFocusCapture={handleFocusCapture}
            onBlurCapture={handleBlurCapture}
            className={cn(
              'w-full min-w-0 flex-1 overflow-hidden',
              '**:data-[slot=carousel-content]:h-full',
              !isDesktop &&
                '**:data-[slot=carousel-content]:cursor-grab **:data-[slot=carousel-content]:select-none **:data-[slot=carousel-content]:active:cursor-grabbing',
            )}
          >
            <div className="w-full min-w-0 mask-[linear-gradient(to_right,transparent_0,rgb(0_0_0/20%)_12px,black_24px,black_calc(100%-24px),rgb(0_0_0/20%)_calc(100%-12px),transparent_100%)] mask-alpha md:mask-[linear-gradient(to_right,transparent_0,rgb(0_0_0/20%)_40px,black_80px,black_calc(100%-80px),rgb(0_0_0/20%)_calc(100%-40px),transparent_100%)]">
              <CarouselContent className="ms-0 h-full items-center">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem
                    key={testimonial.id}
                    aria-roledescription={carousel_slide_role({}, messageOptions)}
                    className="w-auto basis-auto py-1 ps-6"
                  >
                    <TestimonialCard
                      testimonial={testimonial}
                      index={index}
                      locale={locale}
                      total={testimonials.length}
                      isDesktop={isDesktop}
                      isHidden={isPopoverOpen && isPopoverReady && index === activeIndex}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </div>
          </Carousel>

          {activeTestimonial && activeTriggerMetrics && isPopoverOpen ? (
            <TestimonialPopover
              key={activeTestimonial.id}
              testimonial={activeTestimonial}
              locale={locale}
              triggerMetrics={activeTriggerMetrics}
              isClosing={isPopoverClosing}
              shouldReduceMotion={shouldReduceMotion}
              onReady={() => {
                setIsPopoverReady(true)
              }}
              onPageScroll={() => {
                setIsPopoverClosing(true)
              }}
              onCollapseComplete={() => {
                setIsPopoverOpen(false)
                setIsPopoverClosing(false)
                setIsPopoverReady(false)
              }}
            />
          ) : null}
        </Popover>
      </div>
    </section>
  )
}

function TestimonialCard({
  testimonial,
  index,
  locale,
  total,
  isDesktop,
  isHidden,
}: {
  testimonial: Testimonial
  index: number
  locale: Locale
  total: number
  isDesktop: boolean
  isHidden: boolean
}) {
  return (
    <PopoverTrigger
      id={getTestimonialTriggerId(testimonial)}
      data-testimonial-index={index}
      aria-label={testimonials_read_full({ client: testimonial.clientName, quote: testimonial.quote }, { locale })}
      className={cn(
        'flex w-75 flex-col gap-4 rounded-lg border border-border bg-card p-4 text-left text-card-foreground shadow-xs transition-[border-color,box-shadow]',
        'hover:border-foreground/20 hover:shadow-sm',
        'focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:outline-none',
        'lg:w-[clamp(18.75rem,calc(11.25rem+11.71875vw),22.5rem)]',
        'xl:p-5',
        isHidden && 'invisible',
        isDesktop ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
      )}
    >
      <span className="text-body-md line-clamp-2 h-[2lh] font-heading leading-[1.3] font-medium">
        “{testimonial.quote}”
      </span>
      <TestimonialFooter testimonial={testimonial} locale={locale} isExpanded={false} />
      <span className="sr-only">{testimonials_position({ current: index + 1, total }, { locale })}</span>
    </PopoverTrigger>
  )
}

function TestimonialBackdrop({ label, onClick }: { label: string; onClick: () => void }) {
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      onClick={onClick}
      className="fixed inset-0 z-50 cursor-default bg-transparent"
    />,
    document.body,
  )
}

function TestimonialPopover({
  testimonial,
  locale,
  triggerMetrics,
  isClosing,
  shouldReduceMotion,
  onReady,
  onPageScroll,
  onCollapseComplete,
}: {
  testimonial: Testimonial
  locale: Locale
  triggerMetrics: TriggerMetrics
  isClosing: boolean
  shouldReduceMotion: boolean
  onReady: () => void
  onPageScroll: () => void
  onCollapseComplete: () => void
}) {
  const [popup, setPopup] = useState<HTMLDivElement | null>(null)
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null)
  const [verticalPositionAdjustment, setVerticalPositionAdjustment] = useState(0)
  const [isPrepared, setIsPrepared] = useState(false)
  const [isReadyToExpand, setIsReadyToExpand] = useState(false)
  const [isExpansionComplete, setIsExpansionComplete] = useState(false)
  const notifyReady = useEffectEvent(onReady)
  const requestCloseFromPageScroll = useEffectEvent(onPageScroll)
  const triggerId = getTestimonialTriggerId(testimonial)

  useLayoutEffect(() => {
    if (!popup) {
      return undefined
    }

    let positioningFrame = 0
    let preparationFrame = 0
    let expansionFrame = 0

    const measurementFrame = window.requestAnimationFrame(() => {
      const measuredExpandedHeight = popup.getBoundingClientRect().height

      setExpandedHeight(measuredExpandedHeight)
      positioningFrame = window.requestAnimationFrame(() => {
        const trigger = document.getElementById(triggerId)

        setVerticalPositionAdjustment(
          trigger ? getVerticalViewportPositionAdjustment(trigger, measuredExpandedHeight) : 0,
        )
        preparationFrame = window.requestAnimationFrame(() => {
          setIsPrepared(true)
          notifyReady()
          expansionFrame = window.requestAnimationFrame(() => {
            setIsReadyToExpand(true)
          })
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(measurementFrame)
      window.cancelAnimationFrame(positioningFrame)
      window.cancelAnimationFrame(preparationFrame)
      window.cancelAnimationFrame(expansionFrame)
    }
  }, [popup, triggerId])

  useEffect(() => {
    if (isClosing) {
      resetTestimonialScrollArea(popup)
    }
  }, [isClosing, popup])

  useEffect(() => {
    if (!isExpansionComplete || isClosing || !popup) {
      return undefined
    }

    const handleScroll = (event: Event) => {
      const target = event.target

      if (target instanceof Node && popup.contains(target)) {
        return
      }

      requestCloseFromPageScroll()
    }

    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isClosing, isExpansionComplete, popup])

  const resolvedExpandedHeight = expandedHeight ?? triggerMetrics.height
  const addedHeight = Math.max(resolvedExpandedHeight - triggerMetrics.height, 0)
  const shouldShowExpandedState = isReadyToExpand && !isClosing
  const geometryTransition =
    shouldReduceMotion || !isReadyToExpand
      ? { duration: 0 }
      : {
          duration: isClosing ? CLOSING_GEOMETRY_DURATION_S : GEOMETRY_DURATION_S,
          ease: MOVE_EASE,
        }
  const repositionTransition =
    shouldReduceMotion || !isReadyToExpand
      ? { duration: 0 }
      : {
          duration: isClosing ? CLOSING_GEOMETRY_DURATION_S : REPOSITION_DURATION_S,
          ease: MOVE_EASE,
        }
  const contentTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        duration: isClosing ? 0.1 : REVIEW_DURATION_S,
        delay: shouldShowExpandedState ? REVIEW_DELAY_S : 0,
        ease: 'easeOut' as const,
      }

  return (
    <PopoverContent
      ref={setPopup}
      side="bottom"
      sideOffset={-(triggerMetrics.height + resolvedExpandedHeight) / 2 + verticalPositionAdjustment}
      align="center"
      collisionAvoidance={{ side: 'none', align: 'none', fallbackAxisSide: 'none' }}
      style={{
        width: triggerMetrics.width,
        visibility: isPrepared ? 'visible' : 'hidden',
      }}
      className="relative max-w-[calc(100vw-3rem)] gap-0 overflow-visible rounded-none bg-transparent p-0 shadow-none ring-0 data-open:animate-none! data-closed:animate-none!"
    >
      <motion.div
        initial={false}
        animate={{ y: shouldShowExpandedState ? 0 : -verticalPositionAdjustment }}
        transition={repositionTransition}
        className="relative flex flex-col"
      >
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ height: shouldShowExpandedState ? resolvedExpandedHeight : triggerMetrics.height }}
          transition={geometryTransition}
          onAnimationComplete={() => {
            if (isClosing) {
              window.requestAnimationFrame(onCollapseComplete)
            } else if (shouldShowExpandedState) {
              setIsExpansionComplete(true)
            }
          }}
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-lg border border-border bg-card shadow-xs"
        />

        <figure className="relative flex min-h-0 flex-col gap-3 border border-transparent px-1 py-4 xl:px-1 xl:py-5">
          <blockquote className="min-h-0">
            <ScrollArea
              className={cn(
                'min-h-0',
                '**:data-[slot=scroll-area-viewport]:h-auto!',
                '**:data-[slot=scroll-area-viewport]:max-h-69',
                '**:data-[slot=scroll-area-viewport]:scroll-fade-y',
                '**:data-[slot=scroll-area-viewport]:scroll-fade-5',
                isExpansionComplete && !isClosing
                  ? '**:data-[slot=scroll-area-scrollbar]:opacity-100 **:data-[slot=scroll-area-scrollbar]:transition-opacity! **:data-[slot=scroll-area-scrollbar]:duration-150'
                  : '**:data-[slot=scroll-area-scrollbar]:opacity-0! **:data-[slot=scroll-area-scrollbar]:transition-none!',
                (!isExpansionComplete || isClosing) && 'pointer-events-none',
              )}
            >
              {/* `pb-2` reserves space for the review's initial `y: 8` animation, */}
              {/* preventing temporary overflow from triggering the scrollbar. */}
              <div className="px-3 pb-2 xl:px-4">
                <PopoverHeader className="gap-3">
                  <motion.div
                    initial={false}
                    animate={{ y: shouldShowExpandedState ? 0 : addedHeight / 2 }}
                    transition={geometryTransition}
                  >
                    <PopoverTitle className="text-body-md font-heading leading-[1.3] font-medium text-card-foreground">
                      “{testimonial.quote}”
                    </PopoverTitle>
                  </motion.div>
                  <motion.div
                    initial={false}
                    animate={{ opacity: shouldShowExpandedState ? 1 : 0, y: shouldShowExpandedState ? 0 : 8 }}
                    transition={contentTransition}
                  >
                    <PopoverDescription className="text-body-sm text-justify leading-[1.3] text-pretty text-card-foreground">
                      {testimonial.review}
                    </PopoverDescription>
                  </motion.div>
                </PopoverHeader>
              </div>
            </ScrollArea>
          </blockquote>

          <motion.figcaption
            initial={false}
            animate={{ y: shouldShowExpandedState ? 0 : -addedHeight / 2 }}
            transition={geometryTransition}
            className="flex shrink-0 items-center justify-between px-3 xl:px-4"
          >
            <TestimonialFooter testimonial={testimonial} locale={locale} isExpanded={shouldShowExpandedState} />
          </motion.figcaption>
        </figure>
      </motion.div>
    </PopoverContent>
  )
}

function TestimonialFooter({
  testimonial,
  locale,
  isExpanded,
}: {
  testimonial: Testimonial
  locale: Locale
  isExpanded: boolean
}) {
  const shouldReduceMotion = usePrefersReducedMotion()
  const layoutDuration = isExpanded ? GEOMETRY_DURATION_S : CLOSING_GEOMETRY_DURATION_S
  const layoutTransition = shouldReduceMotion ? { duration: 0 } : { duration: layoutDuration, ease: MOVE_EASE }
  const fadeTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' as const }

  return (
    <span className="relative flex h-6 w-full min-w-0 items-center">
      <Avatar size="sm" aria-hidden="true">
        <AvatarImage src={testimonial.avatarSrc} alt="" />
        <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
          {testimonial.clientInitials}
        </AvatarFallback>
      </Avatar>

      <motion.span
        initial={false}
        animate={{ maxWidth: isExpanded ? 112 : 0, marginLeft: isExpanded ? 8 : 0, opacity: isExpanded ? 1 : 0 }}
        transition={layoutTransition}
        className="text-body-xs truncate text-muted-foreground"
      >
        {testimonial.clientName}
      </motion.span>

      <motion.span
        layout="position"
        initial={false}
        transition={{ layout: layoutTransition }}
        className={cn('shrink-0', isExpanded ? 'ml-auto' : 'ml-2')}
      >
        <TestimonialRating rating={testimonial.rating} locale={locale} />
      </motion.span>

      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: isExpanded ? 0 : 1, scale: isExpanded ? 0.8 : 1 }}
        transition={fadeTransition}
        className="absolute right-0 flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground"
      >
        <Plus className="size-3.5" />
      </motion.span>
    </span>
  )
}

function TestimonialRating({ rating, locale }: { rating: number; locale: Locale }) {
  return (
    <span
      role="img"
      aria-label={testimonials_rating({ rating }, { locale })}
      className={cn('flex shrink-0 items-center gap-1 text-[#B08D45]')}
    >
      {RATING_STARS.map((star) => (
        <Star key={star} aria-hidden="true" className="size-3.5 fill-current" />
      ))}
    </span>
  )
}

function getTestimonialTriggerId(testimonial: Testimonial) {
  return `testimonial-${testimonial.id}`
}

function resetTestimonialScrollArea(popup: HTMLDivElement | null) {
  const viewport = popup?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')

  if (viewport) {
    viewport.scrollTop = 0
  }
}

function getNearestEdgeScrollDistance(api: NonNullable<CarouselApi>, index: number, isDesktop: boolean) {
  const viewportBounds = api.rootNode().getBoundingClientRect()
  const slide = api.slideNodes()[index]
  const testimonialTrigger = slide?.querySelector<HTMLElement>('[data-testimonial-index]')
  const slideBounds = testimonialTrigger?.getBoundingClientRect()

  if (!slideBounds) {
    return 0
  }

  const nearestEdgeInset = isDesktop ? DESKTOP_NEAREST_EDGE_INSET_PX : MOBILE_NEAREST_EDGE_INSET_PX
  const visibleLeft = viewportBounds.left + nearestEdgeInset
  const visibleRight = viewportBounds.right - nearestEdgeInset
  const visibleWidth = visibleRight - visibleLeft

  if (slideBounds.width > visibleWidth) {
    const viewportCenter = (visibleLeft + visibleRight) / 2
    const slideCenter = (slideBounds.left + slideBounds.right) / 2

    return viewportCenter - slideCenter
  }

  const leftOverflow = visibleLeft - slideBounds.left

  if (leftOverflow > SCROLL_DISTANCE_TOLERANCE_PX) {
    return leftOverflow
  }

  const rightOverflow = slideBounds.right - visibleRight

  if (rightOverflow > SCROLL_DISTANCE_TOLERANCE_PX) {
    return -rightOverflow
  }

  return 0
}

function getVerticalViewportPositionAdjustment(trigger: HTMLElement, popupHeight: number) {
  const triggerBounds = trigger.getBoundingClientRect()
  const visualViewport = window.visualViewport
  const navbar = document.querySelector<HTMLElement>('[data-slot="navbar-wrapper"]')
  const navbarBottom = navbar?.getBoundingClientRect().bottom ?? 0
  const viewportTop = Math.max(
    (visualViewport?.offsetTop ?? 0) + POPOVER_VIEWPORT_INSET_PX,
    navbarBottom + POPOVER_VIEWPORT_INSET_PX,
  )
  const viewportBottom =
    (visualViewport?.offsetTop ?? 0) + (visualViewport?.height ?? window.innerHeight) - POPOVER_VIEWPORT_INSET_PX
  const availableHeight = viewportBottom - viewportTop
  const popupTop = triggerBounds.top + triggerBounds.height / 2 - popupHeight / 2
  const popupBottom = popupTop + popupHeight

  if (popupHeight > availableHeight) {
    const popupCenter = popupTop + popupHeight / 2
    const viewportCenter = (viewportTop + viewportBottom) / 2

    return viewportCenter - popupCenter
  }

  if (popupTop < viewportTop) {
    return viewportTop - popupTop
  }

  if (popupBottom > viewportBottom) {
    return viewportBottom - popupBottom
  }

  return 0
}

function scrollSlideToNearestEdge(api: NonNullable<CarouselApi>, index: number, isDesktop: boolean) {
  const distance = getNearestEdgeScrollDistance(api, index, isDesktop)

  if (Math.abs(distance) <= SCROLL_DISTANCE_TOLERANCE_PX) {
    return false
  }

  // Embla has no public distance-scrolling method; keep this version-pinned internal access isolated here.
  const { animation, scrollBody, scrollTo } = api.internalEngine()

  animation.stop()
  scrollBody.useBaseFriction().useDuration(NEAREST_EDGE_SCROLL_DURATION)
  scrollTo.distance(distance, false)

  return true
}

export { TestimonialsSection }
