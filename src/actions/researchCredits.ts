'use server'

// Server actions for on-demand research: balance, queueing a request, history.
//
// Note what is NOT here: nothing that mints credits. Credits are created only by the
// Razorpay webhook (server-to-server, signature-verified) and spent only by the
// database functions. An action that could add credits would be reachable from the
// browser, which is exactly the hole the RLS policies exist to close.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export interface ResearchRequestSummary {
  id: string
  requested_query: string
  status: 'queued' | 'running' | 'delivered' | 'failed' | 'refunded'
  product_idea_id: string | null
  served_from_cache: boolean
  last_error: string | null
  promised_by: string
  created_at: string
  delivered_at: string | null
  quality_report: { warnings?: string[] } | null
}

async function resolveTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

export async function getResearchCreditBalance(): Promise<number> {
  const supabase = await createClient()
  const tenantId = await resolveTenantId(supabase)
  if (!tenantId) return 0
  const { data } = await supabase.rpc('research_credit_balance', { p_tenant_id: tenantId })
  return typeof data === 'number' ? data : 0
}

export async function listResearchRequests(): Promise<ResearchRequestSummary[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('research_report_requests')
    .select('id, requested_query, status, product_idea_id, served_from_cache, last_error, promised_by, created_at, delivered_at, quality_report')
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as ResearchRequestSummary[]
}

export async function requestResearchReport(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const query = String(formData.get('query') ?? '').trim()
  if (query.length < 3) return { error: 'Enter at least 3 characters.' }
  if (query.length > 120) return { error: 'That is too long — name the product, not a description.' }

  const supabase = await createClient()
  // The database function does the balance check and the hold in one transaction, so
  // there is deliberately no "check balance then insert" here — that pattern is what
  // lets two tabs both spend the last credit.
  const { error } = await supabase.rpc('request_research_report', { p_query: query })

  if (error) {
    if (/credits/i.test(error.message)) {
      return { error: 'You have no research credits left. Buy a pack to continue.' }
    }
    if (/Authentication/i.test(error.message)) return { error: 'Please sign in again.' }
    if (/No account/i.test(error.message)) return { error: 'Finish setting up your account first.' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/research/requests')
  return { ok: true }
}
