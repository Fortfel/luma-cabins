'use client'

import { useEffect, useEffectEvent, useState } from 'react'

/**
 * Tracks whether the page has been scrolled past a given threshold.
 *
 * @param threshold - Scroll offset in pixels before `isScrolled` becomes `true`. Defaults to `0`.
 * @returns Whether `window.scrollY` exceeds the threshold.
 */
const useIsScrolled = (threshold = 0) => {
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.scrollY > threshold
  })

  const handleScroll = useEffectEvent(() => {
    setIsScrolled(window.scrollY > threshold)
  })

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return isScrolled
}

export { useIsScrolled }
