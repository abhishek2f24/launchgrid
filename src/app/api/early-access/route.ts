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
    // Lower-cased here, not in the database: the unique constraint is a plain
    // one over (email, source), so normalisation is this layer's job.
    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase().slice(0, 254)
        : ''
    const source = typeof body.source === 'string' ? body.source.trim().slice(0, 64) : ''

    if (!EMAIL.test(email) || !source) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })
    }

    // Counts only — deliberately not the findings themselves.
    const rowsAnalysed = Number.isFinite(body.rowsAnalysed)
      ? Math.trunc(body.rowsAnalysed)
      : null
    const findingsCount = Number.isFinite(body.findingsCount)
      ? Math.trunc(body.findingsCount)
      : null

    // `context` is omitted entirely when this submission carries no counts.
    // An upsert only updates the columns it is given, so leaving it out
    // preserves what an earlier signup recorded — someone who signs up again
    // from the footer should not erase the "19 rows, 6 findings" captured the
    // first time, which is the whole reason the column exists.
    const row: Record<string, unknown> = { email, source }
    if (rowsAnalysed !== null || findingsCount !== null) {
      row.context = { rowsAnalysed, findingsCount }
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('early_access_signups')
      .upsert(row, { onConflict: 'email,source' })

    if (error) {
      console.error('[EARLY_ACCESS_ERROR]', error.message)
      return NextResponse.json({ ok: false, error: 'Could not save that. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save that. Try again.' }, { status: 400 })
  }
}
