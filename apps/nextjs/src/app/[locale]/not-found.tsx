import { homeLinkOptions } from '~/app/[locale]/(app)/_validations/app-link-options'
import { NotFoundPage } from '~/app/_components/layout/not-found-page'
import {
  not_found_description,
  not_found_go_back,
  not_found_start_over,
  not_found_title,
} from '~/paraglide/messages.js'
import { getLocale } from '~/paraglide/runtime.js'

export default function NotFound() {
  const locale = getLocale()
  const messageOptions = { locale }

  return (
    <NotFoundPage
      homeHref={homeLinkOptions({ locale }).href}
      labels={{
        description: not_found_description({}, messageOptions),
        goBack: not_found_go_back({}, messageOptions),
        startOver: not_found_start_over({}, messageOptions),
        title: not_found_title({}, messageOptions),
      }}
    />
  )
}
