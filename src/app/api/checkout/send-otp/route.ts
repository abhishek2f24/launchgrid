import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, getClientIp } from '@/utils/rateLimit'

/**
 * In-memory OTP store.
 * Key: `${tenantId}:${phone}` → { otp, expiresAt }
 *
 * For multi-region or serverless scale, replace with Redis (Upstash).
 */
const otpStore = new Map<string, { otp: string; expiresAt: number }>()

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  // Rate limit: 5 OTP requests per IP per minute (anti-spam)
  const ip = getClientIp(req)
  const rl = rateLimit(`send-otp:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many OTP requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const { tenantId, phone, email } = await req.json()

    if (!tenantId || !phone) {
      return NextResponse.json({ error: 'tenantId and phone are required' }, { status: 400 })
    }

    const otp = generateOtp()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    const key = `${tenantId}:${phone}`
    otpStore.set(key, { otp, expiresAt })

    // Attempt email delivery via Resend (if email provided and API key configured)
    if (email && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.FROM_EMAIL || 'notifications@launchgrid.in'
        await resend.emails.send({
          from: `LaunchGrid <${fromEmail}>`,
          to: email,
          subject: `Your COD Verification Code: ${otp}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #eee; border-radius: 12px; color: #333;">
              <h2 style="margin-top:0; font-size:20px;">Cash on Delivery Verification</h2>
              <p style="font-size:14px; color:#555;">Use the code below to confirm your COD order. Valid for 5 minutes.</p>
              <div style="text-align:center; margin:28px 0;">
                <span style="font-size:36px; font-weight:900; letter-spacing:8px; color:#111;">${otp}</span>
              </div>
              <p style="font-size:12px; color:#999;">If you did not request this, ignore this email.</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('[COD_OTP_EMAIL_ERROR]', emailErr)
        // Email delivery failure is non-fatal — we can still show OTP in dev or log it
      }
    }

    // In development, log the OTP so it can be tested without email setup
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV COD OTP] phone=${phone} otp=${otp}`)
    }

    return NextResponse.json({ success: true, sentTo: email || 'phone' })
  } catch (err: any) {
    console.error('[SEND_OTP_ERROR]', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}

/**
 * Exported so that the verify-otp route can access the same store.
 * In a serverless environment, both routes must be in the same warm instance
 * for this to work reliably. For production at scale, replace with Redis.
 */
export { otpStore }
