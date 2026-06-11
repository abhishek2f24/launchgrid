import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ── Helpers (used for direct-fetch fallback) ──────────────────────────────────

function getMeta(html: string, attr: string, value: string): string {
  const re  = new RegExp(`<meta[^>]+(?:${attr})=["']${value}["'][^>]*content=["']([^"']+)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:${attr})=["']${value}["']`, 'i')
  return (html.match(re)?.[1] || html.match(re2)?.[1] || '').trim()
}

function getJsonLd(html: string): Record<string, any> | null {
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of blocks) {
    try {
      const inner = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
      const json  = JSON.parse(inner)
      const items: any[] = Array.isArray(json) ? json : [json]
      for (const item of items) {
        if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) return item
        if (item['@graph']) {
          const found = item['@graph'].find((g: any) => g['@type'] === 'Product')
          if (found) return found
        }
      }
    } catch {}
  }
  return null
}

function priceFromJsonLd(ld: Record<string, any>): number | null {
  const offers = ld.offers
  if (!offers) return null
  const o = Array.isArray(offers) ? offers[0] : offers
  const p = o?.price ?? o?.lowPrice ?? o?.highPrice
  const num = parseFloat(String(p).replace(/[^0-9.]/g, ''))
  return isNaN(num) ? null : num
}

function imagesFromJsonLd(ld: Record<string, any>): string[] {
  const img = ld.image
  if (!img) return []
  if (typeof img === 'string') return [img]
  if (Array.isArray(img)) return img.map((i: any) => (typeof i === 'string' ? i : i.url)).filter(Boolean)
  if (img.url) return [img.url]
  return []
}

function parsePrice(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) || num === 0 ? null : num
}

/** Extract a price from a large block of text — handles ₹, Rs., MRP, INR, USD */
function extractPriceFromText(text: string): number | null {
  const patterns = [
    /[₹]\s*(\d[\d,]*(?:\.\d{1,2})?)/,
    /Rs\.?\s*(\d[\d,]*(?:\.\d{1,2})?)/i,
    /INR\s*(\d[\d,]*(?:\.\d{1,2})?)/i,
    /MRP[:\s]+[₹Rs\.]*\s*(\d[\d,]*(?:\.\d{1,2})?)/i,
    /Selling\s+Price[:\s]+[₹Rs\.]*\s*(\d[\d,]*(?:\.\d{1,2})?)/i,
    /(?:Price|PRICE)[:\s]+[₹Rs\.]*\s*(\d[\d,]*(?:\.\d{1,2})?)/,
    /\$\s*(\d[\d,]*(?:\.\d{1,2})?)/,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''))
      if (!isNaN(num) && num > 0 && num < 10_000_000) return num
    }
  }
  return null
}

/** Strip trailing site name suffixes like " | Amazon.in" or " — Flipkart" */
const SITE_SUFFIX_RE = /\s*[|—–\-]\s*(Amazon|Flipkart|Meesho|Myntra|Nykaa|Ajio|Snapdeal|Tata\s*Cliq|Shopify|Lazada|Alibaba|eBay|Etsy|Swiggy|Zomato|Blinkit|Zepto|JioMart|GlowRoad|Roposo)[^|—–\-]*$/i

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  // Resolve short link redirects to find the canonical URL
  let targetUrl = url
  try {
    const resolveRes = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      }
    })
    if (resolveRes.url) {
      targetUrl = resolveRes.url
    }
  } catch (err) {
    console.error('Failed to resolve redirect:', err)
  }

  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  let title:       string | null = null
  let description: string | null = null
  let price:       number | null = null
  let images:      string[]      = []
  const sourceSite = parsed.hostname.replace(/^www\./, '')

  // ─── Strategy 1: Jina AI Reader ─────────────────────────────────────────────
  // Jina renders pages through a real browser — bypasses bot detection on Amazon,
  // Flipkart, Meesho, Myntra, and most major sites. Free at r.jina.ai with no
  // API key (set JINA_API_KEY env var for higher rate limits).
  try {
    const jinaController = new AbortController()
    const jinaTimeout = setTimeout(() => jinaController.abort(), 20_000)

    const jinaRes = await fetch(`https://r.jina.ai/${parsed.toString()}`, {
      signal: jinaController.signal,
      headers: {
        'Accept':                'application/json',
        'X-Return-Format':       'markdown',
        'X-With-Images-Summary': 'true',
        ...(process.env.JINA_API_KEY ? { 'Authorization': `Bearer ${process.env.JINA_API_KEY}` } : {}),
      },
    })
    clearTimeout(jinaTimeout)

    if (jinaRes.ok) {
      const jinaJson = await jinaRes.json()
      // Jina wraps response under .data in some versions, root in others
      const data = jinaJson.data ?? jinaJson

      // Title
      const rawTitle = (data.title || '').trim()
      title = rawTitle.replace(SITE_SUFFIX_RE, '').trim() || null

      // Description
      description = (data.description || '').trim() || null

      // Price — scan the markdown content
      const content: string = data.content || ''
      price = extractPriceFromText(content)

      // Images — Jina returns structured image list when X-With-Images-Summary is set
      if (Array.isArray(data.images)) {
        images = data.images
          .map((img: any) => img.src || img.url || (typeof img === 'string' ? img : null))
          .filter((src: any): src is string =>
            typeof src === 'string' &&
            src.startsWith('http') &&
            !src.includes('icon') &&
            !src.includes('logo') &&
            !src.includes('favicon') &&
            !src.includes('sprite')
          )
          .slice(0, 6)
      }

      // Fallback: extract ![alt](url) image links from markdown content
      if (images.length === 0) {
        const mdImgs = [...content.matchAll(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g)]
        images = mdImgs
          .map(m => m[1])
          .filter(src =>
            !src.includes('icon') &&
            !src.includes('logo') &&
            !src.includes('favicon') &&
            !src.includes('1x1') &&
            !src.includes('pixel')
          )
          .slice(0, 6)
      }
    }
  } catch {
    // Jina unreachable or timed out — fall through to direct fetch
  }

  // ─── Strategy 2: Direct fetch (fallback for unprotected sites) ──────────────
  // Works for most Shopify stores, WooCommerce sites, and any site without
  // aggressive bot protection. Supplements Jina if images/price is missing.
  if (!title || price === null || images.length === 0) {
    try {
      const directController = new AbortController()
      const directTimeout = setTimeout(() => directController.abort(), 12_000)

      const res = await fetch(parsed.toString(), {
        signal: directController.signal,
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,en-IN;q=0.8',
          'Cache-Control':   'no-cache',
          'Sec-Ch-Ua':       '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest':  'document',
          'Sec-Fetch-Mode':  'navigate',
          'Sec-Fetch-Site':  'none',
          'Sec-Fetch-User':  '?1',
          'Upgrade-Insecure-Requests': '1',
        },
      })
      clearTimeout(directTimeout)

      if (res.ok && (res.headers.get('content-type') || '').includes('html')) {
        const buffer = await res.arrayBuffer()
        const html   = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 512_000))

        const ld            = getJsonLd(html)
        const ogTitle       = getMeta(html, 'property', 'og:title')
        const ogDesc        = getMeta(html, 'property', 'og:description')
        const ogImage       = getMeta(html, 'property', 'og:image')
        const ogPrice       = getMeta(html, 'property', 'og:price:amount') || getMeta(html, 'property', 'product:price:amount')
        const metaDesc      = getMeta(html, 'name', 'description')
        const titleTag      = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''

        if (!title) {
          const candidate = (ld?.name || ogTitle || titleTag).replace(SITE_SUFFIX_RE, '').trim()
          title = candidate || null
        }
        if (!description) {
          description = ld?.description || ogDesc || metaDesc || null
        }
        if (price === null) {
          price = parsePrice(ogPrice || '') ?? priceFromJsonLd(ld || {}) ?? null
        }
        if (images.length === 0) {
          const ldImgs = ld ? imagesFromJsonLd(ld) : []
          if (ogImage) ldImgs.push(ogImage)
          images = [...new Set(ldImgs)]
            .filter(u => { try { new URL(u); return true } catch { return false } })
            .slice(0, 6)
        }
      }
    } catch {
      // Direct fetch failed too — return whatever we have from Jina
    }
  }

  const partial = !title && price === null && images.length === 0

  return NextResponse.json({
    title:       title       || null,
    description: description || null,
    price,
    images,
    source_url:  parsed.toString(),
    source_site: sourceSite,
    partial,
  })
}
