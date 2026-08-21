import type { Metadata } from 'next'

import { resolveLocale } from '~/i18n/server'
import { contact_page_placeholder, metadata_contact_description, metadata_contact_title } from '~/paraglide/messages.js'
import { createSeoMetadata } from '~/utils/seo'

interface ContactPageProps {
  readonly params: Promise<{ locale: string }>
}

export const generateMetadata = async ({ params }: ContactPageProps): Promise<Metadata> => {
  const locale = resolveLocale((await params).locale)

  return createSeoMetadata({
    routeKey: 'contact',
    locale,
    title: metadata_contact_title({}, { locale }),
    description: metadata_contact_description({}, { locale }),
  })
}

export default async function ContactPage({ params }: ContactPageProps) {
  const locale = resolveLocale((await params).locale)

  return <div>{contact_page_placeholder({}, { locale })}</div>
}
