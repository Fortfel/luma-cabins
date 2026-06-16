'use client'

import Image from 'next/image'

import { HeroVideoToggle } from '~/app/(app)/_components/hero-video-toggle'

function HeroBackground() {
  return (
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
      {/* VIDEO HERE */}

      {/* OVERLAY */}
      <div className="absolute inset-0 size-full bg-[linear-gradient(180deg,rgba(20,16,10,0.42)_0%,rgba(20,16,10,0.15)_36%,rgba(20,16,10,0.78)_100%)]" />

      <HeroVideoToggle
        isPaused={false}
        onClick={() => true}
        className="absolute right-1 bottom-6 sm:right-5 sm:bottom-8"
      />
    </div>
  )
}

export { HeroBackground }
