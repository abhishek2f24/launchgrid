import { NextResponse } from 'next/server'

/**
 * In-memory OTP store shared with send-otp.
 * NOTE: This works on a single Vercel instance. For multi-region, use Redis.
 *
 * We use a module-level Map. Both routes share the same Node process in local dev.
 * In Vercel production, Vercel may route to a different lambda, so we keep the OTP
 * also in the signed order payload as a fallback (see create-order route).
 */
const otpStore = new Map<string, { otp: string; expiresAt: number }>()

export async function POST(req: Request) {
  try {
    const { tenantId, phone, otp } = await req.json()

    if (!tenantId || !phone || !otp) {
      return NextResponse.json({ error: 'tenantId, phone, and otp are required' }, { status: 400 })
    }

    const key = `${tenantId}:${phone}`
    const stored = otpStore.get(key)

    if (!stored) {
      return NextResponse.json({ valid: false, error: 'OTP not found or already used. Please request a new one.' }, { status: 400 })
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key)
      return NextResponse.json({ valid: false, error: 'OTP has expired. Please request a new one.' }, { status: 400 })
    }

    if (stored.otp !== otp.trim()) {
      return NextResponse.json({ valid: false, error: 'Invalid OTP. Please try again.' }, { status: 400 })
    }

    // OTP is valid — consume it (one-time use)
    otpStore.delete(key)

    return NextResponse.json({ valid: true })
  } catch (err: any) {
    console.error('[VERIFY_OTP_ERROR]', err)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}

export { otpStore }
