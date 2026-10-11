import { createHmac, randomInt, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Email verification for app sign-ups (first user: AdFree AppLock), without
 * storing anything between the two requests.
 *
 * WHY STATELESS
 *   The checkout OTP keeps codes in a module-level Map, which on Vercel only
 *   works when "send" and "verify" happen to land on the same warm instance.
 *   Here the server emails the code and returns a token that commits to it:
 *   an HMAC over (email, expiry, nonce, code) under a server secret. The app
 *   never sees the code; verifying needs the server, because the HMAC key never
 *   leaves it. No table, no KV, no migration to apply by hand.
 *
 * WHAT IT DOES NOT DO
 *   Count attempts. A 6-digit code, a 10-minute expiry and the per-IP limit in
 *   the route are the brute-force defence. Getting past them yields a discount
 *   and one unverified address in a list — not access to anything.
 *
 * Pure apart from the crypto primitives, so it is covered by node:test.
 */

export const CODE_TTL_MS = 10 * 60 * 1000

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Lower-cased and trimmed, or null when it is not a plausible address. */
export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase().slice(0, 254)
  return EMAIL.test(email) ? email : null
}

/** A sub-key per purpose, so one root secret cannot be replayed across them. */
function subKey(root: string, label: string): Buffer {
  return createHmac('sha256', root).update(`launchgrid-lead:${label}`).digest()
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url')
}

function mac(root: string, email: string, expiresAt: number, nonce: string, code: string): string {
  return createHmac('sha256', subKey(root, 'otp-v1'))
    .update(`${email}|${expiresAt}|${nonce}|${code}`)
    .digest('base64url')
}

/** A uniformly random 6-digit code, from the CSPRNG (not Math.random). */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export interface IssuedToken {
  token: string
  expiresAt: number
}

/** The token the app holds while the user reads their email. */
export function issueToken(root: string, email: string, code: string, now: number = Date.now()): IssuedToken {
  const expiresAt = now + CODE_TTL_MS
  const nonce = randomBytes(12).toString('base64url')
  const payload = b64url(JSON.stringify({ e: email, x: expiresAt, n: nonce }))
  return { token: `${payload}.${mac(root, email, expiresAt, nonce, code)}`, expiresAt }
}

export type VerifyResult = 'ok' | 'expired' | 'mismatch' | 'malformed'

/** Checks a code against a token issued for this exact email. */
export function verifyToken(
  root: string,
  token: unknown,
  email: string,
  code: unknown,
  now: number = Date.now()
): VerifyResult {
  if (typeof token !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return 'malformed'
  }
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return 'malformed'
  let parsed: { e?: unknown; x?: unknown; n?: unknown }
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return 'malformed'
  }
  if (parsed.e !== email || typeof parsed.x !== 'number' || typeof parsed.n !== 'string') {
    return 'malformed'
  }
  if (now > parsed.x) return 'expired'
  const expected = Buffer.from(mac(root, email, parsed.x, parsed.n, code))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given) ? 'ok' : 'mismatch'
}

/**
 * Opaque, stable reference for an email, for Play Billing's
 * obfuscatedAccountId (max 64 chars). Lets a purchase be matched to the
 * address it came from without putting the address itself into Play.
 */
export function accountRef(root: string, email: string): string {
  return createHmac('sha256', subKey(root, 'account-v1')).update(email).digest('hex')
}

/** Signature for the one-click unsubscribe link in marketing email. */
export function unsubscribeSig(root: string, email: string): string {
  return createHmac('sha256', subKey(root, 'unsubscribe-v1')).update(email).digest('base64url')
}

export function verifyUnsubscribeSig(root: string, email: string, sig: unknown): boolean {
  if (typeof sig !== 'string') return false
  const expected = Buffer.from(unsubscribeSig(root, email))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** The server secret: a dedicated one if set, else the deploy's encryption key. */
export function leadSecret(env: Record<string, string | undefined> = process.env): string | null {
  return env.APPLOCK_LEAD_SECRET || env.ENCRYPTION_KEY || null
}
