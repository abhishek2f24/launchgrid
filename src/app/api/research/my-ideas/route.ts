import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { resolveRequestClient } from '@/utils/supabase/bearer'

/**
 * Lists the signed-in user's product ideas so the Chrome extension can ask "which research
 * idea should this supplier be attached to?" while the merchant is standing on a supplier
 * page (Alibaba / IndiaMART / TradeIndia / …).
 *
 * Read-only and RLS-scoped: it can only ever return ideas the caller already owns.
 *
 * NOTE: this MUST use resolveRequestClient, not `getUser(token)` on the cookie client.
 * `getUser(token)` validates the token but does not attach it, so follow-up queries run as
 * anon and RLS returns zero rows — which reads as "you have no research ideas" rather than
 * as an auth failure. See src/utils/supabase/bearer.ts.
 */
export async function GET(req: Request) {
  const cookieClient = await createClient()
  const { supabase, user } = await resolveRequestClient(req, cookieClient)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('product_ideas')
    .select('id, name, category, status, research_project_id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ideas: data ?? [] })
}
