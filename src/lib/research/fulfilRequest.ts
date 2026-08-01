// Fulfils one on-demand research request.
//
// THE CONTRACT
//   A credit is held the moment a request is queued. This module either produces a
//   report good enough to keep that credit, or gives it back. There is no third
//   outcome — every early return below either delivers or refunds.
//
// ORDER OF ATTEMPTS
//   1. Cache. If an existing idea already has scraped supplier evidence for the same
//      normalized query, serve it and REFUND — the customer pays for research, and
//      re-serving stored rows is not research. This is also what makes the economics
//      work: every fulfilment permanently enriches the catalogue, so repeat requests
//      cost nothing to serve.
//   2. Live fetch via the configured residential proxy, parse, quality gate.
//
// WHY THE INGEST ENDPOINT RATHER THAN DIRECT SQL
//   POST /api/research/ingest-supplier is the single sanctioned write path. It leaves
//   the 13 evidence booleans NULL instead of false, refuses to guess a currency, and
//   stamps provenance. Writing direct SQL is what previously produced 505 suppliers
//   falsely asserting "no factory audit".

import { getHtmlFetcher, detectBlock, type HtmlFetcher } from '@/lib/research/fetch/htmlFetcher';
import { parseSearchHtml, parseSupplierDetailHtml, searchUrl, PARSER_VERSION, type ParsedSupplier, type ParsedSupplierDetail } from '@/lib/research/fetch/indiamartParser';
import { evaluate, type GateVerdict } from '@/lib/research/qualityGate';

export interface RequestRow {
  id: string;
  user_id: string;
  tenant_id: string;
  requested_query: string;
  normalized_query: string;
  attempts: number;
}

export interface FulfilDeps {
  /** Service-role Supabase client. */
  admin: {
    from: (t: string) => any;
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }>;
  };
  fetcher?: HtmlFetcher;
  /** Base URL of this app, for the ingest endpoint. */
  baseUrl: string;
  /** Shared secret proving this is the fulfilment worker to the ingest endpoint. */
  workerSecret: string;
  log?: (msg: string) => void;
}

export type FulfilOutcome =
  | { status: 'delivered'; productIdeaId: string; supplierCount: number; verdict: GateVerdict; fromCache: boolean }
  | { status: 'refunded'; reason: string; verdict?: GateVerdict }
  | { status: 'retry'; reason: string };

/** Transient conditions deserve another attempt before the customer's credit is returned. */
const MAX_ATTEMPTS = 3;

export async function fulfilRequest(req: RequestRow, deps: FulfilDeps): Promise<FulfilOutcome> {
  const log = deps.log ?? (() => {});
  const admin = deps.admin;

  const finishRefund = async (reason: string, verdict?: GateVerdict): Promise<FulfilOutcome> => {
    await admin.rpc('refund_research_request', { p_request_id: req.id, p_reason: reason });
    await admin.from('research_report_requests').update({
      status: 'refunded',
      last_error: reason,
      quality_report: verdict ?? null,
    }).eq('id', req.id);
    return { status: 'refunded', reason, verdict };
  };

  // ---- 1. Cache -------------------------------------------------------------
  const { data: cached } = await admin
    .from('product_ideas')
    .select('id, name, research_suppliers(id, data_source)')
    .ilike('name', req.normalized_query)
    .limit(5);

  const hit = (cached ?? []).find((i: any) =>
    (i.research_suppliers ?? []).some((s: any) => s.data_source === 'scraped'),
  );

  if (hit) {
    log(`cache hit for "${req.requested_query}" → idea ${hit.id}`);
    await admin.rpc('refund_research_request', { p_request_id: req.id, p_reason: 'Served from existing research' });
    await admin.from('research_report_requests').update({
      status: 'delivered',
      product_idea_id: hit.id,
      served_from_cache: true,
      delivered_at: new Date().toISOString(),
    }).eq('id', req.id);
    return {
      status: 'delivered',
      productIdeaId: hit.id,
      supplierCount: (hit.research_suppliers ?? []).length,
      verdict: evaluate({ query: req.requested_query, suppliers: [] }),
      fromCache: true,
    };
  }

  // ---- 2. Live fetch --------------------------------------------------------
  const fetcher = deps.fetcher ?? getHtmlFetcher();
  const url = searchUrl(req.requested_query);

  let parsed: ParsedSupplier[];
  try {
    const res = await fetcher.fetchHtml(url);
    const blocked = detectBlock(res.html, res.status, res.finalUrl || url);
    if (blocked) {
      // A retryable block (429, 5xx, shell response) is not the customer's fault and
      // is not evidence that no suppliers exist — try again before refunding.
      if (blocked.retryable && req.attempts + 1 < MAX_ATTEMPTS) {
        await admin.from('research_report_requests').update({
          status: 'queued', attempts: req.attempts + 1, last_error: blocked.message,
        }).eq('id', req.id);
        return { status: 'retry', reason: blocked.message };
      }
      return finishRefund(`Source unavailable: ${blocked.message}`);
    }
    parsed = parseSearchHtml(res.html);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (req.attempts + 1 < MAX_ATTEMPTS) {
      await admin.from('research_report_requests').update({
        status: 'queued', attempts: req.attempts + 1, last_error: message,
      }).eq('id', req.id);
      return { status: 'retry', reason: message };
    }
    return finishRefund(`Fetch failed: ${message}`);
  }

  // ---- 3. Quality gate ------------------------------------------------------
  // Evaluated BEFORE anything is written, so a failed report never leaves partial
  // supplier rows behind that would later look like a cache hit.
  const verdict = evaluate({ query: req.requested_query, suppliers: parsed });
  if (!verdict.pass) {
    log(`quality gate failed for "${req.requested_query}": ${verdict.failures.join('; ')}`);
    return finishRefund(`Could not build a usable report: ${verdict.failures.join('; ')}`, verdict);
  }

  // ---- 4. Create the idea and ingest suppliers ------------------------------
  // product_ideas.research_project_id is NOT NULL, so on-demand results need a home.
  // They go into one dedicated per-user project rather than a new project each time,
  // which would litter the customer's workspace with single-item folders.
  const ON_DEMAND_PROJECT = 'On-demand requests';
  let projectId: string | undefined;

  const { data: existingProject } = await admin
    .from('research_projects')
    .select('id')
    .eq('user_id', req.user_id)
    .eq('name', ON_DEMAND_PROJECT)
    .maybeSingle();

  if (existingProject) {
    projectId = existingProject.id;
  } else {
    const { data: newProject, error: projectErr } = await admin
      .from('research_projects')
      .insert({ user_id: req.user_id, name: ON_DEMAND_PROJECT })
      .select('id')
      .single();
    if (projectErr || !newProject) {
      return finishRefund(`Could not create research project: ${projectErr?.message ?? 'unknown'}`, verdict);
    }
    projectId = newProject.id;
  }

  const { data: idea, error: ideaErr } = await admin
    .from('product_ideas')
    .insert({
      user_id: req.user_id,
      research_project_id: projectId,
      name: req.requested_query,
      data_source: 'scraped',
    })
    .select('id')
    .single();

  if (ideaErr || !idea) {
    return finishRefund(`Could not create product idea: ${ideaErr?.message ?? 'unknown'}`, verdict);
  }

  // ---- 4b. Enrich from each supplier's profile page --------------------------
  // The search card carries a name and a price and nothing a merchant can act on:
  // measured over the first 145 real suppliers, 0% had a phone, email, profile URL
  // or MOQ. Those live one page deeper. This costs one extra fetch per supplier
  // (~₹2 on the report) and is the difference between a report you can read and one
  // you can act on.
  //
  // Enrichment is strictly best-effort: a profile that 429s, times out, or parses to
  // nothing leaves the supplier exactly as the card described it. A failure here must
  // never fail the report — the merchant already has usable pricing evidence.
  const details = new Map<string, ParsedSupplierDetail>();
  for (const s of parsed) {
    if (!s.storeUrl) continue;
    try {
      const res = await fetcher.fetchHtml(s.storeUrl, { timeoutMs: 45000 });
      if (detectBlock(res.html, res.status, s.storeUrl)) continue;
      details.set(s.supplierName, parseSupplierDetailHtml(res.html));
    } catch {
      // Deliberately swallowed — see above.
    }
  }

  let ingested = 0;
  for (const s of parsed) {
    const detail = details.get(s.supplierName) ?? null;
    // The profile page is the better MOQ source; the card rarely states one.
    const moq = detail?.moq ?? s.moq;
    const payload = {
      productIdeaId: idea.id,
      sourceUrl: `${url}#${encodeURIComponent(s.supplierName)}`,
      parserVersion: PARSER_VERSION,
      extractionConfidence: s.extractionConfidence,
      supplier: {
        supplierName: s.supplierName,
        country: 'India',
        ...(s.city ? { city: s.city } : {}),
        ...(s.yearsInBusiness ? { yearEstablished: new Date().getFullYear() - s.yearsInBusiness } : {}),
        ...(s.storeUrl ? { storeUrl: s.storeUrl } : {}),
        // Only sent when the profile actually published them. Omitted stays NULL
        // ("unknown") rather than an empty string ("we checked, there is none").
        ...(detail?.contactPhone ? { contactPhone: detail.contactPhone } : {}),
        ...(detail?.contactEmail ? { contactEmail: detail.contactEmail } : {}),
        ...(detail?.address ? { address: detail.address } : {}),
        ...(detail?.certifications ? { certifications: detail.certifications } : {}),
        ...(detail ? { detailScrapedAt: new Date().toISOString() } : {}),
      },
      priceTiers: [{ quantity: moq ?? 100, unitPrice: s.unitPrice, currency: s.currency }],
      ...(moq ? { moq } : {}),
    };
    const res = await fetch(`${deps.baseUrl}/api/research/ingest-supplier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': deps.workerSecret,
        'x-on-behalf-of': req.user_id,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) ingested++;
  }

  // The gate passed on parsed rows, but the ingest endpoint applies its own
  // validation. If too few survived it, the report is not what was promised.
  if (ingested < 3) {
    await admin.from('product_ideas').delete().eq('id', idea.id);
    return finishRefund(`Only ${ingested} supplier record(s) survived validation`, verdict);
  }

  await admin.from('research_report_requests').update({
    status: 'delivered',
    product_idea_id: idea.id,
    quality_report: verdict,
    delivered_at: new Date().toISOString(),
  }).eq('id', req.id);

  log(`delivered "${req.requested_query}" → ${ingested} suppliers`);
  return { status: 'delivered', productIdeaId: idea.id, supplierCount: ingested, verdict, fromCache: false };
}
