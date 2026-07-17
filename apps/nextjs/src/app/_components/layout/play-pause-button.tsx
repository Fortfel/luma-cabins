import type { ComponentProps } from 'react'

import { Pause, Play } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

interface PlayPauseButtonProps extends Omit<ComponentProps<typeof Button>, 'aria-label'> {
  isPaused: boolean
  playLabel: string
  pauseLabel: string
}

function PlayPauseButton({ isPaused, playLabel, pauseLabel, className, ...props }: PlayPauseButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isPaused ? playLabel : pauseLabel}
      aria-pressed={!isPaused}
      className={cn(
        'pointer-events-auto size-10 rounded-full border-muted-foreground/25 bg-transparent backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {isPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
    </Button>
  )
}

export { PlayPauseButton }
