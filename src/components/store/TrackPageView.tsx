'use client'
import { useEffect, useRef } from 'react'
import { pixelViewContent } from '@/lib/pixel'

/** Read UTM params from the URL once per session (first-touch attribution). */
function getUtmParams(): { utm_source: string | null, utm_medium: string | null, utm_campaign: string | null } {
  if (typeof window === 'undefined') return { utm_source: null, utm_medium: null, utm_campaign: null }
  try {
    const stored = sessionStorage.getItem('lg_utm')
    if (stored) return JSON.parse(stored)
    const params = new URLSearchParams(window.location.search)
    const utm = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    }
    if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
      sessionStorage.setItem('lg_utm', JSON.stringify(utm))
    }
    return utm
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null }
  }
}

export function TrackPageView({ storeId, productId, productName, productPrice, eventType }: {
  storeId: string,
  productId?: string,
  productName?: string,
  productPrice?: number,
  eventType?: 'page_view' | 'product_view' | 'cart_add' | 'checkout_start'
}) {
  const fired = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('lg_owner') === 'true') {
      return
    }
    if (fired.current) return
    fired.current = true

    const sessionId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('lg_sid') || Math.random().toString(36).slice(2))
      : ''
    if (typeof window !== 'undefined' && sessionId) {
      sessionStorage.setItem('lg_sid', sessionId)
    }

    const utm = getUtmParams()
    const resolvedType = eventType || (productId ? 'product_view' : 'page_view')

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: storeId,
        event_type: resolvedType,
        product_id: productId || null,
        session_id: sessionId,
        referrer: typeof document !== 'undefined' ? (document.referrer || null) : null,
        ...utm,
      }),
      keepalive: true,
    }).catch(() => {}) // never crash

    // Merchant ad pixels (Meta Pixel / GA4) — no-op if not configured
    if (resolvedType === 'product_view' && productId) {
      pixelViewContent({ id: productId, name: productName, price: productPrice })
    }
  }, [storeId, productId, productName, productPrice, eventType])

  return null
}
