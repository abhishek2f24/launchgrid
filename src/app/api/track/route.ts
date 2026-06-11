import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { rateLimit, getClientIp } from '@/utils/rateLimit'

/** Truncate + strip control chars from free-text fields. */
function clean(val: unknown, maxLen = 255): string | null {
  if (typeof val !== 'string' || !val) return null
  return val.replace(/[\x00-\x1f\x7f]/g, '').slice(0, maxLen) || null
}

export async function POST(request: Request) {
  // Rate limit: 60 tracking events per IP per minute (generous for real users)
  const ip = getClientIp(request)
  const rl = rateLimit(`track:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { store_id, event_type, product_id, session_id, referrer, utm_source, utm_medium, utm_campaign } = body

    // Validate event type
    const validTypes = ['page_view', 'product_view', 'cart_add', 'checkout_start', 'purchase']
    if (!store_id || !event_type || !validTypes.includes(event_type)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = createServiceClient()
    await supabase.from('store_events').insert({
      store_id,
      event_type,
      product_id: product_id || null,
      session_id: clean(session_id, 64),
      referrer: clean(referrer, 512),
      utm_source: clean(utm_source, 128),
      utm_medium: clean(utm_medium, 128),
      utm_campaign: clean(utm_campaign, 128),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Track API error (suppressed):', err)
    // Never let tracking errors crash — silently swallow
    return NextResponse.json({ ok: true })
  }
}
