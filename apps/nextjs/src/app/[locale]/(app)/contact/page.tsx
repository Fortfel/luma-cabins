import type { Metadata } from 'next'

import { resolveLocale } from '~/i18n/server'
import { metadata_contact_description, metadata_contact_title } from '~/paraglide/messages.js'
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

export default function ContactPage() {
  return <div>Contact page shell.</div>
}
