'use client'

import type * as React from 'react'

import { createContext, useContext, useMemo, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'

interface ImageComparisonContextProps {
  isFocusVisible: boolean
  position: number
  setIsFocusVisible: (isFocusVisible: boolean) => void
  setPosition: (position: number) => void
}

interface ImageComparisonProps extends React.ComponentProps<'div'> {
  defaultValue?: number
}

interface ImageComparisonSliderProps extends Omit<
  React.ComponentProps<'input'>,
  'defaultValue' | 'max' | 'min' | 'step' | 'type' | 'value'
> {
  getValueText: (value: ImageComparisonValueTextContext) => string
}

interface ImageComparisonValueTextContext {
  announcedPosition: number
  position: number
}

interface TouchGesture {
  intent: 'horizontal' | 'pending' | 'vertical'
  pointerId: number
  startX: number
  startY: number
}

const ImageComparisonContext = createContext<ImageComparisonContextProps | null>(null)
const TOUCH_INTENT_THRESHOLD_PX = 8

const clampPosition = (position: number) => Math.min(100, Math.max(0, position))

function useImageComparison() {
  const context = useContext(ImageComparisonContext)

  if (!context) {
    throw new Error('Image comparison components must be used within <ImageComparison />')
  }

  return context
}

function ImageComparison({ defaultValue = 50, className, children, ...props }: ImageComparisonProps) {
  const [position, setPosition] = useState(() => clampPosition(defaultValue))
  const [isFocusVisible, setIsFocusVisible] = useState(false)
  const contextValue = useMemo(
    () => ({ isFocusVisible, position, setIsFocusVisible, setPosition }),
    [isFocusVisible, position],
  )

  return (
    <ImageComparisonContext.Provider value={contextValue}>
      <div
        data-slot="image-comparison"
        className={cn('relative isolate touch-pan-y overflow-hidden select-none', className)}
        {...props}
      >
        {children}
      </div>
    </ImageComparisonContext.Provider>
  )
}

function ImageComparisonLeft({ className, style, ...props }: React.ComponentProps<'div'>) {
  const { position } = useImageComparison()

  return (
    <div
      data-slot="image-comparison-left"
      className={cn('absolute inset-0 z-10 overflow-hidden transition-none', className)}
      style={{ ...style, clipPath: `inset(0 ${100 - position}% 0 0)` }}
      {...props}
    />
  )
}

function ImageComparisonRight({ className, ...props }: React.ComponentProps<'div'>) {
  useImageComparison()

  return <div data-slot="image-comparison-right" className={cn('absolute inset-0 z-0', className)} {...props} />
}

function ImageComparisonLabel({ className, ...props }: React.ComponentProps<'div'>) {
  useImageComparison()

  return (
    <div
      data-slot="image-comparison-label"
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute z-10 rounded-md bg-foreground/75 px-3 py-2 text-background backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

function ImageComparisonSlider({
  className,
  getValueText,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  ...props
}: ImageComparisonSliderProps) {
  const { position, setIsFocusVisible, setPosition } = useImageComparison()
  const inputRef = useRef<HTMLInputElement>(null)
  const isPointerFocusRef = useRef(false)
  const shouldSuppressClickFocusRef = useRef(false)
  const touchGestureRef = useRef<TouchGesture | null>(null)
  const announcedPosition = Math.round(position)
  const valueText = getValueText({ announcedPosition, position })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(clampPosition(event.currentTarget.valueAsNumber))
    onChange?.(event)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const positionChange =
      event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -1
        : event.key === 'ArrowRight' || event.key === 'ArrowUp'
          ? 1
          : null

    if (positionChange !== null) {
      event.preventDefault()
      setIsFocusVisible(true)
      setPosition(clampPosition(position + positionChange))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setIsFocusVisible(true)
      setPosition(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setIsFocusVisible(true)
      setPosition(100)
    }

    onKeyDown?.(event)
  }

  const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()

    if (bounds.width === 0) {
      return
    }

    setPosition(clampPosition(((event.clientX - bounds.left) / bounds.width) * 100))
  }

  const focusSliderFromPointer = () => {
    setIsFocusVisible(false)
    isPointerFocusRef.current = true
    inputRef.current?.focus({ preventScroll: true })
    isPointerFocusRef.current = false
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!isPointerFocusRef.current && event.currentTarget.matches(':focus-visible')) {
      setIsFocusVisible(true)
    }

    onFocus?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocusVisible(false)
    onBlur?.(event)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      if (touchGestureRef.current) {
        return
      }

      shouldSuppressClickFocusRef.current = false
      touchGestureRef.current = {
        intent: 'pending',
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      }

      return
    }

    focusSliderFromPointer()
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const touchGesture = touchGestureRef.current

    if (event.pointerType === 'touch') {
      if (touchGesture?.pointerId !== event.pointerId) {
        return
      }

      if (touchGesture.intent === 'vertical') {
        return
      }

      if (touchGesture.intent === 'pending') {
        const horizontalDistance = Math.abs(event.clientX - touchGesture.startX)
        const verticalDistance = Math.abs(event.clientY - touchGesture.startY)

        if (Math.max(horizontalDistance, verticalDistance) < TOUCH_INTENT_THRESHOLD_PX) {
          return
        }

        if (verticalDistance >= horizontalDistance) {
          touchGesture.intent = 'vertical'
          shouldSuppressClickFocusRef.current = true
          return
        }

        touchGesture.intent = 'horizontal'
        focusSliderFromPointer()

        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.setPointerCapture(event.pointerId)
        }
      }

      updateFromPointer(event)
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateFromPointer(event)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const touchGesture = touchGestureRef.current

    if (event.pointerType === 'touch') {
      if (touchGesture?.pointerId !== event.pointerId) {
        return
      }

      if (touchGesture.intent !== 'vertical') {
        updateFromPointer(event)
        focusSliderFromPointer()
      }

      touchGestureRef.current = null
    } else {
      focusSliderFromPointer()
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchGestureRef.current?.pointerId === event.pointerId) {
      shouldSuppressClickFocusRef.current = true
      touchGestureRef.current = null
    }
  }

  const handleClick = () => {
    if (shouldSuppressClickFocusRef.current) {
      shouldSuppressClickFocusRef.current = false
      return
    }

    focusSliderFromPointer()
  }

  return (
    <>
      <input
        ref={inputRef}
        data-slot="image-comparison-slider"
        type="range"
        min={0}
        max={100}
        step="any"
        value={position}
        aria-valuetext={valueText}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn('pointer-events-none absolute inset-0 z-30 h-full w-full opacity-0', className)}
        {...props}
      />
      <div
        data-slot="image-comparison-track"
        aria-hidden="true"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        className="absolute inset-0 z-30 cursor-ew-resize touch-pan-y"
      />
    </>
  )
}

function ImageComparisonDivider({ className, style, ...props }: React.ComponentProps<'div'>) {
  const { position } = useImageComparison()

  return (
    <div
      data-slot="image-comparison-divider"
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-20 w-1 -translate-x-1/2 bg-white transition-none',
        className,
      )}
      style={{ ...style, left: `${position}%` }}
      {...props}
    />
  )
}

function ImageComparisonHandle({ className, children, style, ...props }: React.ComponentProps<'div'>) {
  const { isFocusVisible, position } = useImageComparison()

  return (
    <div
      data-slot="image-comparison-handle"
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-1/2 z-40 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur-md transition-none',
        isFocusVisible && 'ring-3 ring-ring ring-offset-2 ring-offset-foreground',
        '[&_svg]:size-5',
        className,
      )}
      style={{ ...style, left: `clamp(1.5rem, ${position}%, calc(100% - 1.5rem))` }}
      {...props}
    >
      {children ?? (
        <>
          <ChevronLeft />
          <ChevronRight />
        </>
      )}
    </div>
  )
}

export {
  ImageComparison,
  ImageComparisonDivider,
  ImageComparisonHandle,
  ImageComparisonLabel,
  ImageComparisonLeft,
  ImageComparisonRight,
  ImageComparisonSlider,
}
export type { ImageComparisonValueTextContext }
