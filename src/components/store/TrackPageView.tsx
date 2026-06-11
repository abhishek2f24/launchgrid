'use client'
import { useEffect, useRef } from 'react'

export function TrackPageView({ storeId, productId, eventType }: { storeId: string, productId?: string, eventType?: 'page_view' | 'product_view' | 'cart_add' | 'checkout_start' }) {
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

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: storeId,
        event_type: eventType || (productId ? 'product_view' : 'page_view'),
        product_id: productId || null,
        session_id: sessionId,
        referrer: typeof document !== 'undefined' ? (document.referrer || null) : null,
      }),
      keepalive: true,
    }).catch(() => {}) // never crash
  }, [storeId, productId, eventType])

  return null
}
