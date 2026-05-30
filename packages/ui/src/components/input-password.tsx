'use client'

import * as React from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@workspace/ui/components/input-group'
import { cn } from '@workspace/ui/lib/utils'

interface InputPasswordProps extends React.ComponentProps<typeof InputGroupInput> {
  labelShow?: string
  labelHide?: string
  buttonSize?: React.ComponentProps<typeof InputGroupButton>['size']
}

const InputPassword = ({ buttonSize = 'icon-xs', className, ...props }: InputPasswordProps) => {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div data-slot="input-password" role="group">
      <InputGroup className={cn(className)}>
        <InputGroupInput type={isVisible ? 'text' : 'password'} placeholder="Password" {...props} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size={buttonSize}
            onClick={() => {
              setIsVisible((prevState) => !prevState)
            }}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            aria-controls={props.id}
          >
            {isVisible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

export { InputPassword }
