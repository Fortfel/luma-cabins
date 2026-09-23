'use client'

import type { ComponentProps } from 'react'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import Image from 'next/image'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

interface PosterLabels {
  readonly updating: string
  readonly error: string
  readonly retry: string
}

const PREVIEW_FEEDBACK_DELAY_MS = 450

// The incoming responsive image is the preload: it uses exactly the same srcset as
// the displayed image, and replaces the previous raster only after Next has decoded it.
function InteractiveShowcasePoster({
  src,
  className,
  onLoad,
  onError,
  labels,
  ...props
}: Omit<ComponentProps<typeof Image>, 'src'> & { readonly src: string; readonly labels?: PosterLabels }) {
  const [displayedSrc, setDisplayedSrc] = useState(src)
  const [failedSrc, setFailedSrc] = useState<typeof src | null>(null)
  const requestedSrc = useRef(src)
  const [pendingFeedbackSrc, setPendingFeedbackSrc] = useState<string | null>(null)
  const [retryRevision, setRetryRevision] = useState(0)
  useLayoutEffect(() => {
    requestedSrc.current = src
  }, [src])
  const isUpdating = displayedSrc !== src
  const hasError = failedSrc === src
  useEffect(() => {
    if (!isUpdating || hasError) return undefined
    const timer = window.setTimeout(() => setPendingFeedbackSrc(src), PREVIEW_FEEDBACK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [hasError, isUpdating, src])

  return (
    <>
      <Image
        {...props}
        key={retryRevision}
        src={displayedSrc}
        aria-busy={isUpdating}
        className={className}
        onError={(event) => {
          if (requestedSrc.current !== displayedSrc) return
          setFailedSrc(displayedSrc)
          onError?.(event)
        }}
      />
      {isUpdating && failedSrc !== src ? (
        <Image
          {...props}
          key={src}
          src={src}
          alt=""
          aria-hidden
          loading="eager"
          className={cn(className, 'invisible')}
          onLoad={(event) => {
            if (requestedSrc.current !== src) return
            setDisplayedSrc(src)
            setFailedSrc(null)
            onLoad?.(event)
          }}
          onError={(event) => {
            if (requestedSrc.current !== src) return
            setFailedSrc(src)
            onError?.(event)
          }}
        />
      ) : null}
      {labels && (hasError || (isUpdating && pendingFeedbackSrc === src)) ? (
        <div
          role="status"
          className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 rounded-md bg-background/95 px-2 py-1 text-xs text-foreground"
        >
          <span>{hasError ? labels.error : labels.updating}</span>
          {hasError ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFailedSrc(null)
                setPendingFeedbackSrc(null)
                setRetryRevision((revision) => revision + 1)
              }}
            >
              {labels.retry}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

export { InteractiveShowcasePoster }
export type { PosterLabels }
