import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

const serviceSupabase = createServiceClient()

/**
 * Boolean evidence columns on research_suppliers.
 *
 * NONE of these are present in a scraped payload — a supplier page does not tell us
 * whether an audit report exists, whether the factory address was disclosed, or whether
 * the seller refuses a video call. The table declares `DEFAULT FALSE` for every one of
 * them (migration 0023), so simply *omitting* them from an INSERT would silently record
 * `false` — the claim "we checked and it is absent", which is not what we know. We
 * therefore write an explicit NULL ("unknown") for each on every insert, and never
 * touch them on update. Nothing in this route may infer them from verificationStatus,
 * review counts, response rate, or any other scraped signal.
 */
const UNKNOWN_EVIDENCE_COLUMNS = [
  'customisation_capability',
  'audit_report_available',
  'business_licence_available',
  'factory_address_disclosed',
  'factory_video_available',
  'export_history',
  'broad_unrelated_catalogue',
  'identical_photos_flag',
  'refuses_audit_or_video',
  'cannot_explain_specs',
  'trading_only_scope',
  'unrealistically_low_price',
  'conflicting_company_names',
] as const

function nullEvidenceColumns(): Record<string, null> {
  return Object.fromEntries(UNKNOWN_EVIDENCE_COLUMNS.map((c) => [c, null]))
}

// A scrape that the adapter itself is under 30% sure about is noise: partial selectors,
// a redesigned page, or a listing that was not a supplier page at all. Storing it would
// put a junk supplier row in front of a merchant with the same visual weight as a clean
// extraction, so we reject rather than persist and hope the UI de-emphasises it.
const MIN_EXTRACTION_CONFIDENCE = 0.3

// Supplier pages show a handful of break quantities. Anything much larger is a malformed
// or hostile payload, not a real price ladder.
const MAX_PRICE_TIERS = 20

interface PriceTierPayload {
  quantity?: unknown
  unitPrice?: unknown
  currency?: unknown
  incoterm?: unknown
}

interface IngestPayload {
  productIdeaId?: unknown
  sourceUrl?: unknown
  parserVersion?: unknown
  extractionConfidence?: unknown
  supplier?: Record<string, unknown>
  priceTiers?: unknown
  moq?: unknown
}

/** Best-effort platform label taken from the source URL host. Purely descriptive of the
 *  URL we were given — it is not an evidence signal. */
function platformFromUrl(rawUrl: string): string | null {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase()
    if (host.includes('alibaba')) return 'alibaba'
    if (host.includes('indiamart')) return 'indiamart'
    if (host.includes('tradeindia')) return 'tradeindia'
    if (host.includes('made-in-china')) return 'made-in-china'
    if (host.includes('globalsources')) return 'globalsources'
    if (host.includes('1688')) return '1688'
    if (host.includes('yiwugo')) return 'yiwugo'
    return host || null
  } catch {
    return null
  }
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function POST(req: Request) {
  try {
    // Auth — session cookie or `Authorization: Bearer <token>`, mirroring
    // src/app/api/products/add/route.ts so the extension can post with either.
    const supabase = await createClient()
    let user = (await supabase.auth.getUser()).data.user

    if (!user) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const { data } = await supabase.auth.getUser(token)
        user = data.user
      }
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      productIdeaId,
      sourceUrl,
      parserVersion,
      extractionConfidence,
      supplier,
      priceTiers,
      moq,
    } = body as IngestPayload

    const supplierPayload: Record<string, unknown> = supplier ?? {}

    if (typeof productIdeaId !== 'string' || !productIdeaId.trim()) {
      return NextResponse.json({ error: 'productIdeaId is required' }, { status: 400 })
    }
    if (typeof sourceUrl !== 'string' || !sourceUrl.trim()) {
      return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 })
    }
    if (typeof parserVersion !== 'string' || !parserVersion.trim()) {
      return NextResponse.json({ error: 'parserVersion is required' }, { status: 400 })
    }

    const supplierName = optionalText(supplierPayload.supplierName)
    if (!supplierName) {
      return NextResponse.json({ error: 'supplier.supplierName is required' }, { status: 400 })
    }

    const confidence = optionalNumber(extractionConfidence)
    if (confidence === null || confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { error: 'extractionConfidence must be a number between 0 and 1' },
        { status: 400 },
      )
    }
    if (confidence < MIN_EXTRACTION_CONFIDENCE) {
      return NextResponse.json(
        {
          error: `extractionConfidence ${confidence} is below the ${MIN_EXTRACTION_CONFIDENCE} threshold; the extraction is too unreliable to store as evidence.`,
          code: 'LOW_CONFIDENCE',
        },
        { status: 422 },
      )
    }

    // Ownership check BEFORE any write. Scoped by user_id (the same scoping the
    // research RLS policies apply), and answered with 404 rather than 403 so the
    // endpoint never confirms that another user's idea id exists.
    const { data: idea } = await serviceSupabase
      .from('product_ideas')
      .select('id')
      .eq('id', productIdeaId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!idea) return NextResponse.json({ error: 'Product idea not found' }, { status: 404 })

    // ── price tiers ──────────────────────────────────────────────────────────
    const rawTiers: PriceTierPayload[] = Array.isArray(priceTiers) ? priceTiers : []
    if (rawTiers.length > MAX_PRICE_TIERS) {
      return NextResponse.json(
        { error: `priceTiers is limited to ${MAX_PRICE_TIERS} entries` },
        { status: 400 },
      )
    }

    const cleanTiers: { quantity: number; unit_price: number; currency: string; incoterm: string | null }[] = []
    for (const tier of rawTiers) {
      const quantity = optionalNumber(tier?.quantity)
      const unitPrice = optionalNumber(tier?.unitPrice)
      if (quantity === null || quantity <= 0 || unitPrice === null || unitPrice <= 0) {
        return NextResponse.json(
          { error: 'Each price tier needs a positive quantity and unitPrice' },
          { status: 400 },
        )
      }
      cleanTiers.push({
        quantity: Math.round(quantity),
        unit_price: unitPrice,
        // India-first default, matching addPriceTier() in src/actions/research.ts.
        currency: optionalText(tier?.currency) ?? 'INR',
        incoterm: optionalText(tier?.incoterm),
      })
    }

    const supplierCurrency = cleanTiers[0]?.currency ?? 'INR'
    const cleanMoq = optionalNumber(moq)
    const reviewRating = optionalNumber(supplierPayload.reviewRating)
    const yearEstablished = optionalNumber(supplierPayload.yearEstablished)
    const scrapedAt = new Date().toISOString()

    const provenance = {
      data_source: 'scraped' as const,
      extraction_confidence: confidence,
      parser_version: parserVersion.trim(),
      source_url: sourceUrl.trim(),
      scraped_at: scrapedAt,
    }

    // Fields we genuinely observed on the page. Deliberately excludes every boolean
    // evidence column — see UNKNOWN_EVIDENCE_COLUMNS above.
    const observed = {
      supplier_name: supplierName,
      platform: platformFromUrl(sourceUrl),
      country: optionalText(supplierPayload.country),
      city: optionalText(supplierPayload.city),
      currency: supplierCurrency,
      moq: cleanMoq !== null && cleanMoq > 0 ? Math.round(cleanMoq) : null,
      store_url: optionalText(supplierPayload.storeUrl),
      year_established:
        yearEstablished !== null && yearEstablished > 1800 && yearEstablished <= new Date().getFullYear()
          ? Math.round(yearEstablished)
          : null,
      review_rating: reviewRating !== null && reviewRating >= 0 && reviewRating <= 5 ? reviewRating : null,
      updated_at: scrapedAt,
    }

    // Idempotency: the same sourceUrl re-posted for the same idea updates the existing
    // supplier instead of accumulating duplicates each time the merchant re-scrapes.
    const { data: existing } = await serviceSupabase
      .from('research_suppliers')
      .select('id')
      .eq('product_idea_id', productIdeaId)
      .eq('source_url', sourceUrl.trim())
      .maybeSingle()

    let supplierId: string

    if (existing) {
      // No evidence columns in this update: whatever a human recorded by hand about
      // audits or factory videos stays untouched by a scrape that cannot know it.
      const { data: updated, error: updateErr } = await serviceSupabase
        .from('research_suppliers')
        .update({ ...observed, ...provenance })
        .eq('id', existing.id)
        .select('id')
        .single()
      if (updateErr) throw updateErr
      supplierId = updated.id

      // Tiers are a full replacement — a re-scrape reflects the ladder as it stands now.
      const { error: deleteErr } = await serviceSupabase
        .from('research_price_tiers')
        .delete()
        .eq('supplier_id', supplierId)
      if (deleteErr) throw deleteErr
    } else {
      const { data: inserted, error: insertErr } = await serviceSupabase
        .from('research_suppliers')
        .insert({
          product_idea_id: productIdeaId,
          ...observed,
          // Explicit NULLs defeat the table's `DEFAULT FALSE` on every evidence column.
          ...nullEvidenceColumns(),
          ...provenance,
        })
        .select('id')
        .single()
      if (insertErr) throw insertErr
      supplierId = inserted.id
    }

    let tiersWritten = 0
    if (cleanTiers.length) {
      const { error: tierErr } = await serviceSupabase
        .from('research_price_tiers')
        .insert(cleanTiers.map((t) => ({ supplier_id: supplierId, ...t, ...provenance })))
      if (tierErr) throw tierErr
      tiersWritten = cleanTiers.length
    }

    return NextResponse.json({
      success: true,
      supplierId,
      updated: !!existing,
      priceTiers: tiersWritten,
      // Named so the caller cannot mistake absence for a negative finding.
      unknownEvidenceFields: UNKNOWN_EVIDENCE_COLUMNS,
    })
  } catch (err: unknown) {
    console.error('[RESEARCH_INGEST_SUPPLIER_ERROR]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ingest failed" }, { status: 500 })
  }
}
