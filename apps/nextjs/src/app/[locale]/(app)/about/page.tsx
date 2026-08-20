import type { Metadata } from 'next'

import { resolveLocale } from '~/i18n/server'
import { metadata_about_description, metadata_about_title } from '~/paraglide/messages.js'
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

export default function AboutPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">About</h1>

        <div className="prose max-w-none">
          <p className="mb-4 text-gray-600">This is a starter shell for the Luma Cabins landing page.</p>

          <h2 className="mb-3 text-xl font-semibold text-gray-900">Tech Stack</h2>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Frontend</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• React 19 with TypeScript</li>
                <li>• Next.js App Router</li>
                <li>• Shared UI components</li>
                <li>• Tailwind CSS for styling</li>
              </ul>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Backend</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Static content-first pages</li>
                <li>• No auth or database layer</li>
                <li>• Production build on Vercel</li>
                <li>• Turborepo for monorepo management</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-600">
            This setup provides a robust foundation for building modern web applications with type safety, excellent
            developer experience, and production-ready architecture.
          </p>
        </div>
      </div>
    </div>
  )
}
