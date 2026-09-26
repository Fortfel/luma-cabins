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
  const [request, setRequest] = useState({ src })
  const requestedRef = useRef(request)
  const [pendingFeedbackSrc, setPendingFeedbackSrc] = useState<string | null>(null)
  const [retryRevision, setRetryRevision] = useState(0)
  // Reset before committing a new source, including A -> B -> C -> B. A source
  // string alone cannot distinguish the old B request from the new one.
  if (request.src !== src) {
    setRequest({ src })
    setFailedSrc(null)
    setPendingFeedbackSrc(null)
  }
  useLayoutEffect(() => {
    requestedRef.current = request
  }, [request])
  const isUpdating = displayedSrc !== src
  const hasError = failedSrc === src
  useEffect(() => {
    if (!isUpdating || hasError) return undefined
    const timer = window.setTimeout(() => {
      if (requestedRef.current === request) setPendingFeedbackSrc(src)
    }, PREVIEW_FEEDBACK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [hasError, isUpdating, request, src])

  return (
    <>
      <Image
        {...props}
        key={retryRevision}
        src={displayedSrc}
        aria-busy={isUpdating}
        className={className}
        onError={(event) => {
          if (requestedRef.current !== request || requestedRef.current.src !== displayedSrc) return
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
            if (requestedRef.current !== request) return
            setDisplayedSrc(src)
            setFailedSrc(null)
            setPendingFeedbackSrc(null)
            onLoad?.(event)
          }}
          onError={(event) => {
            if (requestedRef.current !== request) return
            setFailedSrc(src)
            setPendingFeedbackSrc(null)
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
                setRequest({ src })
                // Only remount a failed displayed image. An incoming-image retry
                // must keep the last decoded raster mounted underneath it.
                if (!isUpdating) setRetryRevision((revision) => revision + 1)
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
