'use client'

/**
 * Storefront ad-pixel helper.
 * Fires standard ecommerce events to the merchant's Meta Pixel (fbq) and
 * Google tag (gtag) — both injected in store/[slug]/layout.tsx when the
 * merchant has configured meta_pixel_id / ga4_measurement_id.
 * Safe no-ops when the pixels aren't present.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

interface PixelItem {
  id: string
  name?: string
  price?: number
  quantity?: number
}

function fbq(...args: any[]) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try { window.fbq(...args) } catch { /* never crash the store */ }
  }
}

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try { window.gtag(...args) } catch { /* never crash the store */ }
  }
}

export function pixelViewContent(item: PixelItem) {
  fbq('track', 'ViewContent', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'INR',
  })
  gtag('event', 'view_item', {
    currency: 'INR',
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price }],
  })
}

export function pixelAddToCart(item: PixelItem) {
  fbq('track', 'AddToCart', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'INR',
  })
  gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity || 1 }],
  })
}

export function pixelInitiateCheckout(value: number, items: PixelItem[]) {
  fbq('track', 'InitiateCheckout', {
    content_ids: items.map(i => i.id),
    content_type: 'product',
    value,
    currency: 'INR',
    num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
  })
  gtag('event', 'begin_checkout', {
    currency: 'INR',
    value,
    items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity || 1 })),
  })
}

export function pixelPurchase(orderId: string, value: number, items: PixelItem[]) {
  fbq('track', 'Purchase', {
    content_ids: items.map(i => i.id),
    content_type: 'product',
    value,
    currency: 'INR',
  })
  gtag('event', 'purchase', {
    transaction_id: orderId,
    currency: 'INR',
    value,
    items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity || 1 })),
  })
}

/**
 * Platform-level conversion events for LaunchGrid's own marketing
 * (GTM dataLayer — configure Google Ads / Meta tags inside GTM).
 */
export function platformEvent(event: string, params: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
    try { window.dataLayer.push({ event, ...params }) } catch { /* noop */ }
  }
}
