'use client'

import { useEffect, useEffectEvent, useState } from 'react'

/**
 * Tracks whether the page has been scrolled past a given threshold.
 *
 * @param threshold - Scroll offset in pixels before `isScrolled` becomes `true`. Defaults to `0`.
 * @returns Whether `window.scrollY` exceeds the threshold.
 */
const useIsScrolled = (threshold = 0) => {
  const [isScrolled, setIsScrolled] = useState(false)

  const updateIsScrolled = useEffectEvent(() => {
    setIsScrolled(window.scrollY > threshold)
  })

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(updateIsScrolled)

    window.addEventListener('scroll', updateIsScrolled, { passive: true })
    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', updateIsScrolled)
    }
  }, [])

  return isScrolled
}

export { useIsScrolled }
