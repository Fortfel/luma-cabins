'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  unstable_retry,
}: Readonly<{ error: Error & { digest?: string }; unstable_retry: () => void }>) {
  console.error(error)

  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase">Application Error</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Something went wrong</h1>
          <p className="max-w-md text-muted-foreground">An unexpected error occurred while rendering this page.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={unstable_retry}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium"
            >
              Go Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
