import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { rateLimit, getClientIp } from '@/utils/rateLimit'

/**
 * Early-access signups for LaunchGrid Reconcile.
 *
 * WHAT THIS MUST NEVER RECEIVE
 *   The landing page's promise is that a payout file is read in the browser
 *   and never uploaded. This route is the only network call that page makes,
 *   so it is the one place that promise could be broken. It accepts an email,
 *   a source, and two integers describing how many rows and findings a
 *   reconciliation produced — never a row, never an order ID, never an amount
 *   from the file. Adding a field here that carries file content would make
 *   the page's headline a lie.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = rateLimit(`early-access:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a minute.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''
    const source = typeof body.source === 'string' ? body.source.trim().slice(0, 64) : ''

    if (!EMAIL.test(email) || !source) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })
    }

    // Counts only — deliberately not the findings themselves.
    const context = {
      rowsAnalysed: Number.isFinite(body.rowsAnalysed) ? Math.trunc(body.rowsAnalysed) : null,
      findingsCount: Number.isFinite(body.findingsCount) ? Math.trunc(body.findingsCount) : null,
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('early_access_signups')
      .upsert({ email, source, context }, { onConflict: 'email,source' })

    if (error) {
      console.error('[EARLY_ACCESS_ERROR]', error.message)
      return NextResponse.json({ ok: false, error: 'Could not save that. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save that. Try again.' }, { status: 400 })
  }
}
