'use client'

// @see https://kurtextrem.de/posts/react-uses-hydration
// @see https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store
import { useDeferredValue, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {} // eslint-disable-line @typescript-eslint/no-empty-function
const returnFalse = () => false
const trueOnServerOrHydration = () => true

const useIsSSR = () => {
  const isSSRSync = useSyncExternalStore(emptySubscribe, returnFalse, trueOnServerOrHydration)
  return useDeferredValue(isSSRSync)
}

export { useIsSSR }
