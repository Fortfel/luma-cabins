import { homeLinkOptions } from '~/app/[locale]/(app)/_validations/app-link-options'
import { NotFoundPage } from '~/app/_components/layout/not-found-page'

export default function NotFound() {
  return <NotFoundPage homeHref={homeLinkOptions().href} />
}
