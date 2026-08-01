// Writes observations into the Phase 0 evidence store.
//
// DUAL-WRITE, ON PURPOSE
//   The V2 tables (research_suppliers, research_price_tiers) keep working exactly as
//   they do today; this records the same observations a second time as atomic evidence.
//   Running both in parallel means the V3 memo can be built and compared against the V2
//   report on the same products, and V2 can be retired only once V3 demonstrably beats
//   it — rather than by a flag-day rewrite that breaks a paying customer's reports.
//
// WHY EVIDENCE IS NEVER FATAL
//   A failure to record evidence must never fail an ingest. The supplier row is what the
//   customer paid for; evidence is our asset. Losing an observation costs us one fetch.
//   Losing the supplier row costs the customer their credit.

import type { SupabaseClient } from '@supabase/supabase-js';

export type EvidenceMethod = 'api' | 'document' | 'parsed' | 'user' | 'inferred';

export interface EvidenceInput {
  subjectType: 'product' | 'supplier' | 'listing' | 'market';
  subjectId: string;
  predicate: string;
  value: unknown;
  unit?: string;
  method: EvidenceMethod;
  parserVersion?: string;
  confidence: number;
  ttlDays: number;
  captureId?: string;
  observedAt?: string;
}

/**
 * How long an observation stays trustworthy, by predicate.
 *
 * Staleness is not uniform: a supplier quote drifts within a month, a factory address is
 * structural. Stored per row at capture time so a later policy change cannot silently
 * rewrite the confidence of observations already made.
 */
export const TTL_BY_PREDICATE: Record<string, number> = {
  unit_price: 30,
  moq: 90,
  lead_time_days: 90,
  contact_phone: 180,
  contact_email: 180,
  address: 365,
  city: 365,
  year_established: 365,
  certifications: 365,
  store_url: 180,
  // Demand-side, once those engines exist.
  monthly_sales: 7,
  sales_rank: 7,
  review_count: 14,
  search_interest: 14,
  median_price: 14,
  duty_rate: 180,
  marketplace_fee: 90,
};

export function ttlFor(predicate: string): number {
  return TTL_BY_PREDICATE[predicate] ?? 30;
}

/**
 * Confidence of a single observation, before freshness decay and corroboration (which
 * are applied at claim time in claim.ts).
 *
 * A parser stamped `uncalibrated` scores barely above a user's guess — its selectors were
 * written from documentation and never verified against a live page. Trusting that
 * output is what previously put 505 fabricated rows in the database.
 */
export function observationConfidence(method: EvidenceMethod, parserVersion?: string): number {
  if (method === 'parsed') {
    return parserVersion && /uncalibrated/i.test(parserVersion) ? 0.5 : 0.8;
  }
  const base: Record<EvidenceMethod, number> = {
    api: 0.95, document: 0.9, parsed: 0.8, user: 0.4, inferred: 0.3,
  };
  return base[method];
}

/**
 * Records observations. Returns how many landed.
 *
 * Never throws: see the header note. Errors are logged and swallowed so an evidence
 * problem can never cost a customer their credit.
 */
export async function recordEvidence(
  admin: SupabaseClient,
  inputs: EvidenceInput[],
): Promise<number> {
  const rows = inputs
    // An observation with no value is not evidence of absence — it is simply nothing to
    // record. Writing a null here would later read as "we checked and there is none".
    .filter((i) => i.value !== null && i.value !== undefined && i.value !== '')
    .map((i) => ({
      subject_type: i.subjectType,
      subject_id: i.subjectId,
      predicate: i.predicate,
      value: i.value,
      unit: i.unit ?? null,
      capture_id: i.captureId ?? null,
      method: i.method,
      parser_version: i.parserVersion ?? null,
      confidence: i.confidence,
      ttl_days: i.ttlDays,
      observed_at: i.observedAt ?? new Date().toISOString(),
    }));

  if (!rows.length) return 0;

  const { error } = await admin.from('evidence').insert(rows);
  if (error) {
    console.error('[evidence] record failed (non-fatal)', error.message);
    return 0;
  }
  return rows.length;
}

/**
 * Turns one ingested supplier into atomic observations.
 *
 * Each field becomes its own row rather than one "supplier" blob, because claims are
 * built per predicate: "what is the MOQ" must be answerable from every observation of
 * MOQ across every source, independent of which supplier record carried it.
 */
export function supplierEvidence(args: {
  supplierId: string;
  parserVersion: string;
  extractionConfidence: number;
  observedAt: string;
  supplier: Record<string, unknown>;
  moq?: number | null;
  priceTiers?: { quantity?: unknown; unitPrice?: unknown; currency?: unknown }[];
}): EvidenceInput[] {
  const { supplierId, parserVersion, observedAt } = args;
  const out: EvidenceInput[] = [];

  // The scraper's own per-record confidence is folded in: a shaky extraction should not
  // produce evidence as trusted as a clean one from the same parser.
  const conf = (predicate: string) =>
    Math.max(
      0,
      Math.min(1, observationConfidence('parsed', parserVersion) * (args.extractionConfidence || 1)),
    ) || 0.5;

  const push = (predicate: string, value: unknown, unit?: string) => {
    out.push({
      subjectType: 'supplier',
      subjectId: supplierId,
      predicate,
      value,
      unit,
      method: 'parsed',
      parserVersion,
      confidence: Number(conf(predicate).toFixed(4)),
      ttlDays: ttlFor(predicate),
      observedAt,
    });
  };

  const s = args.supplier;
  push('city', s.city);
  push('year_established', s.yearEstablished);
  push('contact_phone', s.contactPhone);
  push('contact_email', s.contactEmail);
  push('address', s.address);
  push('store_url', s.storeUrl);
  if (Array.isArray(s.certifications) && s.certifications.length) {
    push('certifications', s.certifications);
  }
  if (typeof args.moq === 'number') push('moq', args.moq, 'units');

  for (const tier of args.priceTiers ?? []) {
    const price = Number(tier?.unitPrice);
    if (!Number.isFinite(price) || price <= 0) continue;
    out.push({
      subjectType: 'supplier',
      subjectId: supplierId,
      predicate: 'unit_price',
      // Quantity travels with the price: a unit price is meaningless without the break
      // it applies at, and storing them apart makes a ladder unreconstructable.
      value: { unitPrice: price, quantity: Number(tier?.quantity) || null },
      unit: typeof tier?.currency === 'string' ? tier.currency : undefined,
      method: 'parsed',
      parserVersion,
      confidence: Number(conf('unit_price').toFixed(4)),
      ttlDays: ttlFor('unit_price'),
      observedAt,
    });
  }

  return out;
}
