'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  unstable_retry,
}: Readonly<{ error: Error & { digest?: string }; unstable_retry: () => void }>) {
  console.error(error)

  return (
    <html lang="en" dir="ltr">
      <head>
        <title>Application error | Luma Cabins</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          background: '#f7f5f0',
          color: '#191816',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            minHeight: '100dvh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: '#68645d', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Application Error
          </p>
          <h1 style={{ margin: 0, maxWidth: '40rem', fontSize: 'clamp(2.25rem, 7vw, 3rem)', lineHeight: 1.1 }}>
            Something went wrong
          </h1>
          <p style={{ margin: 0, maxWidth: '28rem', color: '#68645d', lineHeight: 1.5 }}>
            An unexpected error occurred while rendering this page.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={unstable_retry}
              style={{
                minHeight: '2.75rem',
                cursor: 'pointer',
                border: 0,
                borderRadius: '0.5rem',
                background: '#35472b',
                color: '#fff',
                padding: '0.625rem 1rem',
                font: 'inherit',
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
            <Link
              href="/"
              style={{
                boxSizing: 'border-box',
                display: 'inline-flex',
                minHeight: '2.75rem',
                alignItems: 'center',
                border: '1px solid #cbc6bb',
                borderRadius: '0.5rem',
                color: '#191816',
                padding: '0.625rem 1rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
