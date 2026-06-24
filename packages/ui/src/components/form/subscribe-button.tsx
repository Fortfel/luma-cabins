import type * as React from 'react'

import { ButtonGradient } from '@workspace/ui/components/button-gradient'
import { CircleSpinner } from '@workspace/ui/components/spinner-variants'

import { useFormContext } from './contexts/form-context'

interface SubscribeButtonProps extends Omit<React.ComponentProps<typeof ButtonGradient>, 'type'> {
  label: React.ReactNode
  // If true sets button as disabled. False by default
  isPending?: boolean
}

const SubscribeButton = ({ label, isPending = false, gradient = 'default', ...props }: SubscribeButtonProps) => {
  const form = useFormContext()

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <ButtonGradient
          type="submit"
          size="lg"
          gradient={gradient}
          disabled={canSubmit !== true || isPending}
          {...props}
        >
          {isSubmitting === true && <CircleSpinner size="sm" />} {label}
        </ButtonGradient>
      )}
    </form.Subscribe>
  )
}

export { SubscribeButton }
