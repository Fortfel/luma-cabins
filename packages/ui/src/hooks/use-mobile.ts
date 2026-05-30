import { useMediaQuery } from '@workspace/ui/hooks/use-media-query'

export function useIsMobile() {
  return !useMediaQuery('(min-width: 768px)', {
    initializeWithValue: false,
  })
}
