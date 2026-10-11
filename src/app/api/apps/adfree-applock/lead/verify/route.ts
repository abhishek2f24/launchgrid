import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { rateLimit, getClientIp } from '@/utils/rateLimit'
import { accountRef, leadSecret, normaliseEmail, verifyToken } from '@/lib/apps/leadOtp'

/**
 * Step 2 of the AdFree AppLock email sign-up: check the code, then record the
 * now-verified address in early_access_signups (source 'adfree-applock').
 *
 * CONSENT IS RECORDED AS GIVEN
 *   `marketing` is the user's own tick on a box that starts unticked. Verifying
 *   for the discount alone stores marketing: false, and nothing may send that
 *   address marketing mail. The latest submission wins, so someone who later
 *   ticks the box (or leaves it unticked) changes their choice.
 *
 * Same write path as /api/early-access: service client, one upsert on
 * (email, source), RLS on with no policies so the anon key cannot read it.
 */

/** Bump when the wording of the consent shown in the app changes. */
const CONSENT_VERSION = '2026-10-11'

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = rateLimit(`applock-lead-verify:${ip}`, { limit: 10, windowMs: 10 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const secret = leadSecret()
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  const email = normaliseEmail(body.email)
  if (!email) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }
  // Per address too, so a code cannot be guessed by spreading tries over many IPs.
  const perEmail = rateLimit(`applock-lead-verify-email:${email}`, { limit: 10, windowMs: 10 * 60_000 })
  if (!perEmail.allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const result = verifyToken(secret, body.token, email, body.code)
  if (result !== 'ok') {
    const status = result === 'expired' ? 410 : 400
    return NextResponse.json({ ok: false, error: result === 'mismatch' ? 'wrong_code' : result }, { status })
  }

  const origin = body.origin === 'dashboard' ? 'dashboard' : 'paywall'
  const ref = accountRef(secret, email)
  const context = {
    name: str(body.name, 80),
    marketing: body.marketing === true,
    consentVersion: CONSENT_VERSION,
    verifiedAt: new Date().toISOString(),
    origin,
    appVersion: str(body.appVersion, 20),
    locale: str(body.locale, 16),
    accountRef: ref,
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('early_access_signups')
    .upsert({ email, source: 'adfree-applock', context }, { onConflict: 'email,source' })

  if (error) {
    console.error('[APPLOCK_LEAD_SAVE_ERROR]', error.message)
    return NextResponse.json({ ok: false, error: 'save_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, accountRef: ref })
}
