'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'

import { usePrefersReducedMotion } from '@workspace/ui/hooks/use-prefers-reduced-motion'

import { PlayPauseButton } from '~/app/_components/layout/play-pause-button'

interface HeroBackgroundProps {
  readonly pauseLabel: string
  readonly playLabel: string
}

function HeroBackground({ pauseLabel, playLabel }: HeroBackgroundProps) {
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
        <picture className="absolute inset-0 size-full">
          <source media="(max-width: 767px)" srcSet="/images/luma-cabin-hero-mobile.webp" type="image/webp" />
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
        </picture>

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
          <source media="(max-width: 767px)" src="/videos/hero_mobile.webm" type="video/webm" />
          <source media="(max-width: 767px)" src="/videos/hero_mobile.mp4" type="video/mp4" />
          <source src="/videos/hero_desktop.webm" type="video/webm" />
          <source src="/videos/hero_desktop.mp4" type="video/mp4" />
        </video>

        {/* OVERLAY */}
        <div className="absolute inset-0 size-full bg-[linear-gradient(180deg,rgba(20,16,10,0.28)_0%,rgba(20,16,10,0.08)_36%,rgba(20,16,10,0.58)_100%)]" />
      </div>
      <PlayPauseButton
        isPaused={isPaused}
        playLabel={playLabel}
        pauseLabel={pauseLabel}
        onClick={handleToggleVideo}
        className="absolute right-4 bottom-5 z-20 sm:right-6 sm:bottom-8"
      />
    </>
  )
}

export { HeroBackground }
