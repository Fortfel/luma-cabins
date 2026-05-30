import type * as React from 'react'

import { BaseField } from '@workspace/ui/components/form/base-field'
import { InputPassword } from '@workspace/ui/components/input-password'

import { useFieldContext } from './contexts/form-context'

const PasswordField = ({
  label,
  labelRight,
  description,
  horizontal,
  controlFirst,
  className,
  ...props
}: Omit<React.ComponentProps<typeof BaseField>, 'children'> & React.ComponentProps<typeof InputPassword>) => {
  // The `Field` infers that it should have a `value` type of `string`
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <BaseField
      label={label}
      labelRight={labelRight}
      description={description}
      horizontal={horizontal}
      controlFirst={controlFirst}
      className={className}
    >
      <InputPassword
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...props}
      />
    </BaseField>
  )
}

export { PasswordField }
