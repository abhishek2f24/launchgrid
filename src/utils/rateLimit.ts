/**
 * In-memory sliding-window rate limiter.
 *
 * Works on a single Vercel instance / serverless function warm container.
 * For multi-region / multi-instance deployments replace the store with
 * Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *
 * Usage:
 *   const result = rateLimit(ip, { limit: 10, windowMs: 60_000 })
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// Map<key, timestamps[]>
const store = new Map<string, number[]>()

// Purge stale keys every 5 minutes to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store.entries()) {
    // We don't know the windowMs here, so prune anything older than 10 minutes
    const fresh = timestamps.filter(t => now - t < 10 * 60_000)
    if (fresh.length === 0) {
      store.delete(key)
    } else {
      store.set(key, fresh)
    }
  }
}, 5 * 60_000)

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  const timestamps = (store.get(key) ?? []).filter(t => t > windowStart)
  timestamps.push(now)
  store.set(key, timestamps)

  const count = timestamps.length
  const oldest = timestamps[0] ?? now
  const resetAt = oldest + windowMs

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  }
}

/**
 * Extract the real client IP from Next.js request headers.
 * Handles Vercel / Cloudflare / nginx forwarding.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
