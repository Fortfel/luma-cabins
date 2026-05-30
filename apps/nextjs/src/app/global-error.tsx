'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  unstable_retry,
}: Readonly<{ error: Error & { digest?: string }; unstable_retry: () => void }>) {
  console.error(error)

  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-dvh font-sans antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-muted-foreground text-sm font-semibold uppercase">Application Error</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">An unexpected error occurred while rendering this page.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={unstable_retry}
              className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="border-input bg-background inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              Go Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
