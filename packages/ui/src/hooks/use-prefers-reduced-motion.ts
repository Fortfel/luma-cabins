'use client'

import { useEffect, useState } from 'react'

const prefersReducedMotionQuery = '(prefers-reduced-motion: reduce)'

/**
 * Tracks whether the user has requested reduced motion in their system preferences.
 *
 * @returns Whether `prefers-reduced-motion: reduce` currently matches.
 */
const usePrefersReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(true)

  useEffect(() => {
    const mediaQuery = window.matchMedia(prefersReducedMotionQuery)

    const handleMotionPreferenceChange = () => {
      setShouldReduceMotion(mediaQuery.matches)
    }

    handleMotionPreferenceChange()
    mediaQuery.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange)
    }
  }, [])

  return shouldReduceMotion
}

export { usePrefersReducedMotion }
