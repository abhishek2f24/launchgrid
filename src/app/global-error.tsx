'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', background: '#050505', color: '#f8f8f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666', marginBottom: '16px' }}>
            Something went wrong
          </p>
          <h1 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Unexpected error
          </h1>
          <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
            We&apos;ve been notified and are looking into it. Try again or contact support if it persists.
          </p>
          <button
            onClick={() => reset()}
            style={{ background: '#f8f8f2', color: '#050505', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
