'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { usePrefersReducedMotion } from '@workspace/ui/hooks/use-prefers-reduced-motion'

import { HeroVideoToggle } from '~/app/(app)/_components/hero-video-toggle'

function HeroBackground() {
  const [isPaused, setIsPaused] = useState(true)
  const shouldReduceMotion = usePrefersReducedMotion()

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (shouldReduceMotion) {
      video.pause()

      return
    }

    void video.play().catch(() => {
      video.pause()
    })
  }, [shouldReduceMotion])

  const handleToggleVideo = () => {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (video.paused) {
      void video.play().catch(() => {
        video.pause()
      })

      return
    }

    video.pause()
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-0 -z-10 size-full">
        <Image
          src="/images/luma-cabin-hero.webp"
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          sizes="100vw"
          className="absolute inset-0 size-full object-cover"
        />

        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="auto"
          onPause={() => {
            setIsPaused(true)
          }}
          onPlay={() => {
            setIsPaused(false)
          }}
          className="absolute inset-0 size-full object-cover"
        >
          <source src="/videos/hero_video.mp4" type="video/mp4" />
        </video>

        {/* OVERLAY */}
        <div className="absolute inset-0 size-full bg-[linear-gradient(180deg,rgba(19,18,17,0.45)_0%,rgba(19,18,17,0.35)_50%,rgba(19,18,17,0.80)_100%)]"></div>
      </div>
      <HeroVideoToggle
        isPaused={isPaused}
        onClick={handleToggleVideo}
        className="absolute right-4 bottom-5 z-20 sm:right-6 sm:bottom-8"
      />
    </>
  )
}

export { HeroBackground }
