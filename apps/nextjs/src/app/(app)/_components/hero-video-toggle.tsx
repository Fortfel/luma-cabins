import type * as React from 'react'
import { Pause, Play } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

interface HeroVideoToggleProps extends React.ComponentProps<typeof Button> {
  isPaused: boolean
  onClick: () => void
}

function HeroVideoToggle({ isPaused, onClick, className, ...props }: HeroVideoToggleProps) {
  const label = isPaused ? 'Play background video' : 'Pause background video'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      aria-pressed={!isPaused}
      onClick={onClick}
      className={cn(
        'border-muted-foreground/25 pointer-events-auto size-10 rounded-full bg-transparent backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {isPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
    </Button>
  )
}

export { HeroVideoToggle }
