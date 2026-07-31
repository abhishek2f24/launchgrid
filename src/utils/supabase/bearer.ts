import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Builds a Supabase client whose requests carry the caller's JWT, so Postgres RLS sees the
 * real `auth.uid()`.
 *
 * WHY THIS EXISTS — subtle and easy to get wrong:
 * `createClient()` from './server' reads the session COOKIE. If a non-browser caller (the
 * Chrome extension, CLI tooling) authenticates with `Authorization: Bearer <token>`, the
 * usual pattern is:
 *
 *     const { data } = await supabase.auth.getUser(bearerToken)   // identifies the user ✅
 *     await supabase.from('product_ideas').select(...)            // still runs as ANON ❌
 *
 * `getUser(token)` only *validates and decodes* the token — it does not attach it to the
 * client. Every subsequent query therefore executes with no `auth.uid()`, and any
 * RLS-protected table silently returns ZERO ROWS instead of erroring. That failure mode is
 * particularly nasty because it looks like "the user has no data" rather than a bug.
 *
 * Passing the token as a global header makes RLS behave exactly as it does for a browser
 * session, so policies stay the single source of truth and we never fall back to the
 * service-role key (which would bypass RLS entirely and require re-implementing ownership
 * checks by hand).
 */
export function createBearerClient(accessToken: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
}

/**
 * Resolves the caller from either a session cookie or a Bearer token, returning a client
 * that is correctly scoped for RLS in both cases.
 */
export async function resolveRequestClient(
  req: Request,
  cookieClient: Awaited<ReturnType<typeof import('./server').createClient>>,
) {
  const cookieUser = (await cookieClient.auth.getUser()).data.user
  if (cookieUser) return { supabase: cookieClient, user: cookieUser }

  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const bearerClient = createBearerClient(token)
    const { data } = await bearerClient.auth.getUser(token)
    if (data.user) return { supabase: bearerClient, user: data.user }
  }

  return { supabase: cookieClient, user: null }
}
