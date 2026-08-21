import type { Metadata } from 'next'

import { resolveLocale } from '~/i18n/server'
import {
  about_page_backend,
  about_page_backend_no_auth,
  about_page_backend_static,
  about_page_backend_turbo,
  about_page_backend_vercel,
  about_page_frontend,
  about_page_frontend_next,
  about_page_frontend_react,
  about_page_frontend_tailwind,
  about_page_frontend_ui,
  about_page_intro,
  about_page_outro,
  about_page_tech_stack,
  about_page_title,
  metadata_about_description,
  metadata_about_title,
} from '~/paraglide/messages.js'
import { createSeoMetadata } from '~/utils/seo'

interface AboutPageProps {
  readonly params: Promise<{ locale: string }>
}

export const generateMetadata = async ({ params }: AboutPageProps): Promise<Metadata> => {
  const locale = resolveLocale((await params).locale)

  return createSeoMetadata({
    routeKey: 'about',
    locale,
    title: metadata_about_title({}, { locale }),
    description: metadata_about_description({}, { locale }),
  })
}

export default async function AboutPage({ params }: AboutPageProps) {
  const locale = resolveLocale((await params).locale)
  const messageOptions = { locale }
  const frontendItems = [
    about_page_frontend_react({}, messageOptions),
    about_page_frontend_next({}, messageOptions),
    about_page_frontend_ui({}, messageOptions),
    about_page_frontend_tailwind({}, messageOptions),
  ]
  const backendItems = [
    about_page_backend_static({}, messageOptions),
    about_page_backend_no_auth({}, messageOptions),
    about_page_backend_vercel({}, messageOptions),
    about_page_backend_turbo({}, messageOptions),
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">{about_page_title({}, messageOptions)}</h1>

        <div className="prose max-w-none">
          <p className="mb-4 text-gray-600">{about_page_intro({}, messageOptions)}</p>

          <h2 className="mb-3 text-xl font-semibold text-gray-900">{about_page_tech_stack({}, messageOptions)}</h2>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">{about_page_frontend({}, messageOptions)}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {frontendItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">{about_page_backend({}, messageOptions)}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {backendItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-gray-600">{about_page_outro({}, messageOptions)}</p>
        </div>
      </div>
    </div>
  )
}
