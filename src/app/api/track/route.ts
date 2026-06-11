import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { rateLimit, getClientIp } from '@/utils/rateLimit'

export async function POST(request: Request) {
  // Rate limit: 60 tracking events per IP per minute (generous for real users)
  const ip = getClientIp(request)
  const rl = rateLimit(`track:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { store_id, event_type, product_id, session_id, referrer } = body

    // Validate event type
    const validTypes = ['page_view', 'product_view', 'cart_add', 'checkout_start']
    if (!store_id || !event_type || !validTypes.includes(event_type)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = createServiceClient()
    await supabase.from('store_events').insert({
      store_id,
      event_type,
      product_id: product_id || null,
      session_id: session_id || null,
      referrer: referrer || null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Track API error (suppressed):', err)
    // Never let tracking errors crash — silently swallow
    return NextResponse.json({ ok: true })
  }
}
