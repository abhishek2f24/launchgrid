import { NextResponse } from 'next/server'
import { sendSupportEmail } from '@/lib/emails'
import { rateLimit, getClientIp } from '@/utils/rateLimit'

export async function POST(req: Request) {
  // Rate limit: 3 support tickets per IP per 10 minutes
  const ip = getClientIp(req)
  const rl = rateLimit(`support-contact:${ip}`, { limit: 3, windowMs: 10 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sendSupportEmail({
      fromName: name,
      fromEmail: email,
      message,
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[SUPPORT_CONTACT_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
