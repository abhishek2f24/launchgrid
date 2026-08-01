'use server'

// Server actions for the Product Investigation Workspace.
//
// THE ONE RULE
//   Every value a human types becomes an evidence row — method 'user', confidence 0.4 —
//   never a column on the investigation. A typed number and an API reading must remain
//   distinguishable forever, because the whole point of the coverage contract is that
//   the report can tell you how much of it is actually known.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { known, unknown, type Claim, type EvidenceRef } from '@/lib/intelligence/claim'
import {
  evaluateInvestigation,
  generateTasks,
  REQUIRED_PREDICATES,
  SPEC_BY_PREDICATE,
  type InvestigationVerdict,
} from '@/lib/intelligence/investigation'
import { ttlFor } from '@/lib/intelligence/recordEvidence'

export interface InvestigationRow {
  id: string
  product_name: string
  subject_id: string
  budget_inr: number
  decision: 'BUY' | 'WAIT' | 'REJECT' | null
  decision_note: string | null
  created_at: string
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createInvestigation(
  _prev: { error?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const productName = String(formData.get('productName') ?? '').trim()
  const budget = Number(formData.get('budget') ?? 20000)

  if (productName.length < 3) return { error: 'Name the product you want to investigate.' }
  if (!Number.isFinite(budget) || budget <= 0) return { error: 'Enter the budget you actually have.' }

  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Please sign in.' }

  const { data: tenant } = await supabase
    .from('tenants').select('id').eq('owner_id', user.id).order('created_at').limit(1).maybeSingle()
  if (!tenant) return { error: 'Finish setting up your account first.' }

  const { data, error } = await supabase
    .from('investigations')
    .insert({ user_id: user.id, tenant_id: tenant.id, product_name: productName, budget_inr: budget })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/investigate')
  return { id: data.id }
}

export async function listInvestigations(): Promise<InvestigationRow[]> {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase
    .from('investigations')
    .select('id, product_name, subject_id, budget_inr, decision, decision_note, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as InvestigationRow[]
}

/**
 * Records one observation.
 *
 * Written through the service client because the evidence store is shared infrastructure
 * with no client-facing policies — the same observation about a product serves every
 * customer, which is what makes accumulated evidence the asset.
 */
export async function recordObservation(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const investigationId = String(formData.get('investigationId') ?? '')
  const predicate = String(formData.get('predicate') ?? '')
  const raw = String(formData.get('value') ?? '').trim()

  const spec = SPEC_BY_PREDICATE.get(predicate)
  if (!spec) return { error: 'Unknown field.' }
  if (!raw) return { error: 'Enter a value, or leave it unknown — a blank is not a zero.' }

  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Please sign in.' }

  const { data: inv } = await supabase
    .from('investigations').select('id, subject_id').eq('id', investigationId).maybeSingle()
  if (!inv) return { error: 'Investigation not found.' }

  // Numeric predicates are stored as numbers so contradiction detection and the financial
  // model can use them; free-text stays text.
  const numericUnits = new Set(['INR', 'units', 'units_per_month', 'count', 'days', 'fraction'])
  let value: unknown = raw
  if (spec.unit && numericUnits.has(spec.unit)) {
    const n = Number(raw.replace(/[₹,\s]/g, ''))
    if (!Number.isFinite(n)) return { error: 'Enter a number.' }
    value = n
  } else if (raw.includes(',') && (predicate === 'top_complaints' || predicate === 'differentiation_ideas')) {
    value = raw.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const admin = createServiceClient()
  const { error } = await admin.from('evidence').insert({
    subject_type: 'product',
    subject_id: inv.subject_id,
    predicate,
    value,
    unit: spec.unit ?? null,
    method: 'user',
    // A human reading a real Amazon page is genuine evidence — far better than a guessed
    // default, and materially weaker than an API reading. 0.4 says exactly that.
    confidence: 0.4,
    ttl_days: ttlFor(predicate),
  })
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/investigate/${investigationId}`)
  return { ok: true }
}

/** Builds current claims for an investigation from stored evidence. */
async function loadClaims(subjectId: string): Promise<Record<string, Claim<unknown>>> {
  const admin = createServiceClient()
  const { data: rows } = await admin
    .from('evidence')
    .select('id, predicate, value, unit, method, parser_version, confidence, observed_at, ttl_days')
    .eq('subject_id', subjectId)
    .is('superseded_by', null)
    .order('observed_at', { ascending: false })

  const byPredicate = new Map<string, NonNullable<typeof rows>>()
  for (const r of rows ?? []) {
    byPredicate.set(r.predicate, [...(byPredicate.get(r.predicate) ?? []), r])
  }

  const claims: Record<string, Claim<unknown>> = {}
  for (const spec of REQUIRED_PREDICATES) {
    const observations = byPredicate.get(spec.predicate) ?? []
    if (!observations.length) {
      claims[spec.predicate] = unknown(spec.predicate, 'investigation@1.0.0', 'Not yet investigated')
      continue
    }

    const refs: EvidenceRef[] = observations.map((o) => ({
      id: o.id,
      predicate: o.predicate,
      value: o.value,
      method: o.method,
      confidence: Number(o.confidence),
      observedAt: o.observed_at,
      ttlDays: o.ttl_days,
      parserVersion: o.parser_version,
    }))

    // Most recent observation wins as the claim's value; the rest still count toward
    // corroboration and contradiction detection.
    claims[spec.predicate] = known({
      predicate: spec.predicate,
      value: observations[0].value,
      unit: spec.unit,
      evidence: refs,
      expectedEvidenceCount: 1,
      derivedBy: 'investigation@1.0.0',
    })
  }
  return claims
}

export interface WorkspaceData {
  investigation: InvestigationRow
  verdict: InvestigationVerdict
  claims: Record<string, Claim<unknown>>
  tasks: { id: string; resolves: string; action: string; cost_inr: number; effort: string; done: boolean }[]
}

export async function getWorkspace(investigationId: string): Promise<WorkspaceData | null> {
  const { supabase, user } = await requireUser()
  if (!user) return null

  const { data: inv } = await supabase
    .from('investigations')
    .select('id, product_name, subject_id, budget_inr, decision, decision_note, created_at')
    .eq('id', investigationId)
    .maybeSingle()
  if (!inv) return null

  const claims = await loadClaims(inv.subject_id)
  const verdict = evaluateInvestigation(claims, Number(inv.budget_inr))

  // Tasks are regenerated from what is currently unknown, so the checklist can never
  // drift from reality. Upsert keeps any completion state already recorded.
  const admin = createServiceClient()
  const generated = generateTasks(verdict.unknowns)
  if (generated.length) {
    await admin.from('investigation_tasks').upsert(
      generated.map((t) => ({
        investigation_id: inv.id,
        resolves: t.resolves,
        action: t.action,
        cost_inr: t.costInr,
        effort: t.effort,
      })),
      { onConflict: 'investigation_id,resolves', ignoreDuplicates: true },
    )
  }
  // A resolved unknown no longer needs an action.
  const openPredicates = verdict.unknowns.map((u) => u.predicate)
  if (openPredicates.length) {
    await admin.from('investigation_tasks').delete()
      .eq('investigation_id', inv.id).not('resolves', 'in', `(${openPredicates.join(',')})`)
  } else {
    await admin.from('investigation_tasks').delete().eq('investigation_id', inv.id)
  }

  const { data: tasks } = await admin
    .from('investigation_tasks')
    .select('id, resolves, action, cost_inr, effort, done')
    .eq('investigation_id', inv.id)
    .order('done')
    .order('cost_inr')

  return {
    investigation: inv as InvestigationRow,
    verdict,
    claims,
    tasks: (tasks ?? []) as WorkspaceData['tasks'],
  }
}

export async function recordDecision(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const id = String(formData.get('investigationId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('note') ?? '').trim()

  if (!['BUY', 'WAIT', 'REJECT'].includes(decision)) return { error: 'Pick BUY, WAIT or REJECT.' }

  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Please sign in.' }

  // Stored separately from the computed verdict on purpose: comparing what the engine
  // said against what the human actually did is the first input to outcome learning.
  const { error } = await supabase
    .from('investigations')
    .update({ decision, decision_note: note || null, decided_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/investigate/${id}`)
  return { ok: true }
}
