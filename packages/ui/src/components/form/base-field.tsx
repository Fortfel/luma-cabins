import type * as React from 'react'

import { Field, FieldDescription, FieldError, FieldLabel } from '@workspace/ui/components/field'
import { cn } from '@workspace/ui/lib/utils'

import { useFieldContext } from './contexts/form-context'

interface BaseFieldProps {
  label: React.ReactNode
  labelRight?: React.ReactNode
  description?: React.ReactNode
  horizontal?: boolean
  controlFirst?: boolean
  className?: string
  children: React.ReactNode
}

const BaseField = ({
  label,
  labelRight,
  description,
  horizontal,
  controlFirst,
  className,
  children,
}: BaseFieldProps) => {
  // The `Field` infers that it should have a `value` type of `string`
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  const labelElement = labelRight ? (
    <div className="flex justify-between">
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {labelRight}
    </div>
  ) : (
    <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
  )

  const descriptionElem = description && <FieldDescription>{description}</FieldDescription>
  const errorElem = isInvalid && <FieldError errors={field.state.meta.errors} />

  return (
    <Field data-invalid={isInvalid} className={cn(className)} orientation={horizontal ? 'horizontal' : undefined}>
      {controlFirst ? (
        <>
          {children}
          {/*<FieldContent>*/}
          {labelElement}
          {descriptionElem}
          {errorElem}
          {/*</FieldContent>*/}
        </>
      ) : (
        <>
          {labelElement}
          {children}
          {descriptionElem}
          {errorElem}
        </>
      )}
    </Field>
  )
}

export { BaseField }
