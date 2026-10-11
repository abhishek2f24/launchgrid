import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, getClientIp } from '@/utils/rateLimit'
import { generateCode, issueToken, leadSecret, normaliseEmail } from '@/lib/apps/leadOtp'

/**
 * Step 1 of the AdFree AppLock email sign-up: email a 6-digit code.
 *
 * Called by the app's "Get 30% off" and "Early access" forms. Stores nothing:
 * the response carries a token committing to the code (see lib/apps/leadOtp),
 * and only a verified address is ever written, by the verify route.
 *
 * WHAT THIS MUST NEVER RECEIVE
 *   This is an app whose promise is that locked apps, PINs and photos stay on
 *   the phone. The only inputs are an email address and where the form was
 *   opened — never anything about what the user locks.
 */

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = rateLimit(`applock-lead-start:${ip}`, { limit: 5, windowMs: 10 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const secret = leadSecret()
  if (!secret || !process.env.RESEND_API_KEY) {
    console.error('[APPLOCK_LEAD] not configured (secret or RESEND_API_KEY missing)')
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
  // A second, per-address limit so one inbox cannot be flooded from many IPs.
  const perEmail = rateLimit(`applock-lead-email:${email}`, { limit: 3, windowMs: 10 * 60_000 })
  if (!perEmail.allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const code = generateCode()
  const { token, expiresAt } = issueToken(secret, email, code)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.FROM_EMAIL || 'notifications@launchgrid.in'
    const { error } = await resend.emails.send({
      from: `AdFree AppLock <${from}>`,
      to: email,
      subject: `${code} is your AdFree AppLock code`,
      text: `Your AdFree AppLock verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email — nothing has been signed up.`,
      html: `
        <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #eee;border-radius:12px;color:#222">
          <h2 style="margin-top:0;font-size:20px">Your AdFree AppLock code</h2>
          <p style="font-size:14px;color:#555">Enter this code in the app to verify your email. It expires in 10 minutes.</p>
          <div style="text-align:center;margin:28px 0">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#111">${code}</span>
          </div>
          <p style="font-size:12px;color:#999">If you did not request this, ignore this email — nothing has been signed up.</p>
        </div>`,
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error('[APPLOCK_LEAD_EMAIL_ERROR]', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, token, expiresAt })
}
