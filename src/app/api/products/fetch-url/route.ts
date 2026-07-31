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

/** Amazon/Flipkart CDNs embed a size modifier in the image URL (e.g. `._SL500_`, `._SX300_`)
 *  that serves a downscaled thumbnail — strip it so the browser fetches the original full-res image. */
/** Site chrome that marketplaces serve from their image CDNs — never a product photo. */
function isProductPhoto(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false

  // Must actually look like an image. Page URLs and anchors (e.g. the product page itself
  // ending in "#") were being collected as "images" and rendered as broken thumbnails.
  const looksLikeImage =
    /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(src) ||
    /(images?|img|media|photo|cdn)[./-]/i.test(new URL(src).hostname + new URL(src).pathname)
  if (!looksLikeImage) return false

  // SVGs on marketplaces are logos/sprites/badges, never product shots.
  if (/\.svg(\?|$)/i.test(src)) return false

  const junk = ['icon', 'logo', 'favicon', 'sprite', 'placeholder', 'pixel', '1x1', 'batman-returns', 'static-assets', '/promos/', 'banner']
  const lower = src.toLowerCase()
  return !junk.some((j) => lower.includes(j))
}

function upscaleImageUrl(url: string): string {
  if (url.includes('media-amazon.com') || url.includes('ssl-images-amazon.com')) {
    return url.replace(/\._[A-Z]{2}\d+(?:_[A-Z]{2}\d+)*_\./, '.')
  }
  if (url.includes('rukminim') && url.includes('flixcart.com')) {
    return url.replace(/\/image\/\d+\/\d+\//, '/image/1024/1024/')
  }
  return url
}

/** Strip trailing site name suffixes like " | Amazon.in" or " — Flipkart" */
const SITE_SUFFIX_RE = /\s*[|—–\-]\s*(Amazon|Flipkart|Meesho|Myntra|Nykaa|Ajio|Snapdeal|Tata\s*Cliq|Shopify|Lazada|Alibaba|eBay|Etsy|Swiggy|Zomato|Blinkit|Zepto|JioMart|GlowRoad|Roposo)[^|—–\-]*$/i

/**
 * Marketplace <title> tags are SEO strings, not product names — e.g.
 *   "Mivi DuoPods Oris AI ENC Bluetooth Price in India - Buy Mivi DuoPods Oris AI ENC
 *    Bluetooth Online - Mivi : Flipkart.com"
 * Pasting that straight into a storefront listing is unusable, so reduce it to the product
 * name. JSON-LD `name` is preferred over this wherever the page provides it.
 */
function cleanProductTitle(raw: string): string {
  let t = raw.trim()

  // "… : Flipkart.com" / "… | Amazon.in" style trailing site attribution.
  t = t.replace(/\s*[:|]\s*[A-Za-z0-9.\- ]*\.(com|in|co\.in|net|org)\s*$/i, '')
  t = t.replace(SITE_SUFFIX_RE, '')

  // Everything from the first SEO boilerplate marker onwards is not the product name.
  t = t.split(/\s+(?:Price\s+in\s+India|Buy\s+Online|at\s+Best\s+Price|Online\s+at\s+Best)\b/i)[0]
  t = t.replace(/\s*[-–—]\s*Buy\s+.*$/i, '')
  t = t.replace(/\s*[-–—|:]\s*$/,'')

  return t.trim()
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  let user = (await supabase.auth.getUser()).data.user

  // Accept a Bearer token as well as the session cookie, matching /api/products/add.
  // Without this, non-browser callers (the extension's sourcing flow, CLI import tooling)
  // got a 401 from this endpoint but succeeded against the add endpoint — an inconsistency
  // that made the two halves of the import pipeline unusable together.
  if (!user) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7))
      user = data.user
    }
  }

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
  /** True once the price came from structured data (JSON-LD / og:price) rather than a text scan. */
  let priceIsStructured = false
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

      // Title (SEO page title — refined below if the page exposes JSON-LD `name`)
      const rawTitle = (data.title || '').trim()
      title = cleanProductTitle(rawTitle) || null

      // Description
      description = (data.description || '').trim() || null

      // Price — scan the markdown content
      const content: string = data.content || ''
      price = extractPriceFromText(content)

      // Images — Jina returns structured image list when X-With-Images-Summary is set
      if (Array.isArray(data.images)) {
        images = data.images
          .map((img: any) => img.src || img.url || (typeof img === 'string' ? img : null))
          .filter((src: any): src is string => typeof src === 'string' && isProductPhoto(src))
          .map(upscaleImageUrl)
          .slice(0, 6)
      }

      // Fallback: extract ![alt](url) image links from markdown content
      if (images.length === 0) {
        const mdImgs = [...content.matchAll(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g)]
        images = mdImgs
          .map(m => m[1])
          .filter(isProductPhoto)
          .map(upscaleImageUrl)
          .slice(0, 6)
      }
    }
  } catch {
    // Jina unreachable or timed out — fall through to direct fetch
  }

  // ─── Strategy 2: Direct fetch (fallback for unprotected sites) ──────────────
  // Works for most Shopify stores, WooCommerce sites, and any site without
  // aggressive bot protection. Supplements Jina if images/price is missing.
  // Also run when the title still looks like an SEO string, or when the only price we have
  // came from scanning page text. Text scanning routinely latches onto an unrelated figure
  // (EMI instalment, exchange offer, bank cashback), so a "successful" Jina fetch must not
  // be allowed to lock in an unverified price when the page exposes structured data.
  const titleLooksLikeSeoString = !!title && /\b(buy|price in india|best price)\b|\.(com|in)\b/i.test(title)

  if (!title || price === null || images.length === 0 || titleLooksLikeSeoString || !priceIsStructured) {
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
        // Marketplace product pages are large (Flipkart ≈1.7 MB) and put their JSON-LD block
        // near the END of the document — a 512 KB window cut it off entirely, which is why
        // structured title/price extraction silently never fired. Still bounded, just big
        // enough to actually reach the metadata we came for.
        const MAX_HTML_BYTES = 4_000_000
        const html   = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, MAX_HTML_BYTES))

        const ld            = getJsonLd(html)
        const ogTitle       = getMeta(html, 'property', 'og:title')
        const ogDesc        = getMeta(html, 'property', 'og:description')
        const ogImage       = getMeta(html, 'property', 'og:image')
        const ogPrice       = getMeta(html, 'property', 'og:price:amount') || getMeta(html, 'property', 'product:price:amount')
        const metaDesc      = getMeta(html, 'name', 'description')
        const titleTag      = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''

        // JSON-LD `name` is the actual product name the merchant wants, so it OVERRIDES the
        // SEO <title>/Jina title rather than only filling a gap.
        if (ld?.name) {
          title = cleanProductTitle(String(ld.name)) || title
        } else if (!title) {
          title = cleanProductTitle(ogTitle || titleTag) || null
        }
        if (!description) {
          description = ld?.description || ogDesc || metaDesc || null
        }
        // Structured price beats the text scan, which can latch onto an unrelated figure on
        // the page (an EMI instalment, exchange offer, or bank cashback amount).
        const structuredPrice = priceFromJsonLd(ld || {}) ?? parsePrice(ogPrice || '')
        if (structuredPrice !== null && structuredPrice !== undefined) {
          price = structuredPrice
          priceIsStructured = true
        }
        if (images.length === 0) {
          const ldImgs = ld ? imagesFromJsonLd(ld) : []
          if (ogImage) ldImgs.push(ogImage)
          images = [...new Set(ldImgs)]
            .filter(u => { try { new URL(u); return true } catch { return false } })
            .filter(isProductPhoto)
            .map(upscaleImageUrl)
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
