'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@workspace/ui/components/button'

import notFoundImage from '~/assets/images/not-found.jpg'

export default function NotFound() {
  return (
    <div className="relative min-h-screen">
      <Image src={notFoundImage} alt="" fill priority placeholder="blur" sizes="100vw" className="object-cover" />
      <main className="relative z-10 grid min-h-screen place-items-center px-6 pt-6 sm:pt-16 lg:px-8">
        <div className="relative z-10 flex flex-col items-center text-white">
          <p className="text-base font-semibold">404</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Page not found</h1>
          <p className="mt-6 text-center text-lg font-medium text-white/70 sm:text-xl/8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>

          <div className="mt-16 flex flex-row gap-12">
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="cursor-pointer bg-transparent uppercase hover:bg-white! hover:text-black!"
            >
              Go back
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="cursor-pointer bg-transparent uppercase hover:bg-white! hover:text-black!"
              >
                Start Over
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
