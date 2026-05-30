import { createFormHook } from '@tanstack/react-form'

import { fieldContext, formContext, PasswordField, SubscribeButton, TextField } from '@workspace/ui/components/form'

const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    PasswordField,
  },
  formComponents: {
    SubscribeButton,
  },
})

export { useAppForm, withForm }
export { revalidateLogic } from '@tanstack/react-form'
