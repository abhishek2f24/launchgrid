import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

type PublicIdea = {
  id: string
  name: string
  category: string | null
  subcategory: string | null
  public_slug: string
  public_intent_keywords: string[]
  target_retail_price: number | null
  max_preferred_moq: number | null
  research_suppliers: { id: string }[]
  research_opportunity_scores: { score: number; recommendation: string; created_at: string }[]
}

const ignoredTerms = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'product', 'research', 'the', 'to', 'with'])

function terms(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((term) => term.length > 1 && !ignoredTerms.has(term))
}

function rankIdea(idea: PublicIdea, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  const queryTerms = new Set(terms(query))
  const fields = [
    { value: idea.name, label: 'product name', weight: 12 },
    { value: idea.category ?? '', label: 'category', weight: 8 },
    { value: idea.subcategory ?? '', label: 'subcategory', weight: 8 },
  ]
  const reasons = new Set<string>()
  let score = 0

  for (const field of fields) {
    const value = field.value.toLowerCase()
    if (normalizedQuery && value.includes(normalizedQuery)) {
      score += 50
      reasons.add(field.label)
    }
    for (const term of queryTerms) {
      if (value.includes(term)) {
        score += field.weight
        reasons.add(field.label)
      }
    }
  }

  for (const keyword of idea.public_intent_keywords ?? []) {
    const normalizedKeyword = keyword.toLowerCase()
    if (normalizedQuery === normalizedKeyword) {
      score += 70
      reasons.add('intent keyword')
      continue
    }
    const keywordTerms = terms(keyword)
    const overlap = keywordTerms.filter((term) => queryTerms.has(term)).length
    if (overlap > 0) {
      score += overlap * 16
      reasons.add('intent keyword')
    }
  }

  return { score, reasons: [...reasons] }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const category = url.searchParams.get('category')?.trim() ?? ''
  if (query.length < 2 && !category) return NextResponse.json({ results: [] })

  const supabase = createServiceClient()
  // Both is_demo AND is_public are required — never just is_public. This is
  // the second of two independent gates (the other is the DB index in
  // migration 0028) protecting against a real user's research ever being
  // exposed here by an accidental or malicious is_public flip alone.
  let queryBuilder = supabase
    .from('product_ideas')
    .select('id, name, category, subcategory, public_slug, public_intent_keywords, target_retail_price, max_preferred_moq, research_suppliers(id), research_opportunity_scores(score, recommendation, created_at)')
    .eq('is_demo', true)
    .eq('is_public', true)
    .not('public_slug', 'is', null)

  if (category) queryBuilder = queryBuilder.eq('category', category)

  const { data, error } = await queryBuilder

  if (error) {
    console.error('[PUBLIC_RESEARCH_SEARCH]', error)
    return NextResponse.json({ error: 'Unable to search reports right now.' }, { status: 500 })
  }

  const ideas = (data ?? []) as PublicIdea[]

  // Category browse: no text query to rank against, just list everything in
  // that category (real query, scales to however many reports exist there —
  // never a fixed/hardcoded list).
  if (category) {
    const results = ideas
      .map((idea) => {
        const score = [...idea.research_opportunity_scores].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
        return {
          slug: idea.public_slug,
          name: idea.name,
          category: idea.category,
          targetRetailPrice: idea.target_retail_price,
          supplierCount: idea.research_suppliers.length,
          score: score ? Number(score.score) : null,
          recommendation: score?.recommendation ?? null,
          matchReasons: ['category'],
        }
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 24)
    return NextResponse.json({ results })
  }

  const results = ideas
    .map((idea) => {
      const match = rankIdea(idea, query)
      const score = [...idea.research_opportunity_scores].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
      return {
        slug: idea.public_slug,
        name: idea.name,
        category: idea.category,
        targetRetailPrice: idea.target_retail_price,
        supplierCount: idea.research_suppliers.length,
        score: score ? Number(score.score) : null,
        recommendation: score?.recommendation ?? null,
        matchReasons: match.reasons,
        matchScore: match.score,
      }
    })
    .filter((result) => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)

  // ── Confident match vs "related" ─────────────────────────────────────────
  // Lexical scoring cannot tell "ultrasound machine for clinic" → "White Noise
  // Sleep Machine" (both score 44 on a single shared generic word) apart from a
  // genuinely good near-match. Rather than present a coincidence as an answer —
  // the same failure as showing agate sellers for a macrame search — anything
  // under this bar is shown as "related", never as a match.
  //
  // Calibrated against real queries: exact/near-exact hits land 72–138
  // (power bank 138, yoga mat 122, dog food bowl 72); single-generic-word
  // coincidences land 12–44 (fountain pen 28, sleep machine 44).
  const CONFIDENT_MATCH_SCORE = 60

  const confident = results.filter((r) => r.matchScore >= CONFIDENT_MATCH_SCORE).slice(0, 3)
  const related = results.filter((r) => r.matchScore < CONFIDENT_MATCH_SCORE).slice(0, 6)

  if (confident.length > 0) {
    return NextResponse.json({ results: confident, related, suggestions: null })
  }

  // No confident match. If there are weak ones, show them as related rather
  // than falling through to a category guess — they are at least word-relevant.
  if (related.length > 0) {
    return NextResponse.json({ results: [], related, suggestions: null })
  }

  // ── Never return an empty screen ─────────────────────────────────────────
  // A miss is the MOST common first-run outcome — the catalogue cannot cover
  // everything a merchant might type. Showing "no results" and nothing else is
  // where people leave. So a miss answers a different question instead: "what
  // near this is worth looking at?"
  //
  // The nearest category is inferred by scoring each category on how well the
  // query overlaps its name and its products' names. Deterministic string
  // matching — no model call, so a miss costs nothing and returns instantly.
  const byCategory = new Map<string, PublicIdea[]>()
  for (const idea of ideas) {
    if (!idea.category) continue
    const bucket = byCategory.get(idea.category) ?? []
    bucket.push(idea)
    byCategory.set(idea.category, bucket)
  }

  const queryTerms = new Set(terms(query))
  let bestCategory: string | null = null
  let bestCategoryScore = 0

  for (const [name, members] of byCategory) {
    let categoryScore = 0
    // The category's own name is the strongest signal ("fashion" → Fashion).
    for (const term of terms(name)) {
      if (queryTerms.has(term)) categoryScore += 30
    }
    // Then how many of its products share vocabulary with the query. Capped per
    // product so one very long product name cannot dominate.
    for (const member of members) {
      const overlap = terms(member.name).filter((t) => queryTerms.has(t)).length
      categoryScore += Math.min(overlap, 3) * 4
    }
    if (categoryScore > bestCategoryScore) {
      bestCategoryScore = categoryScore
      bestCategory = name
    }
  }

  const toResult = (idea: PublicIdea, reason: string) => {
    const s = [...idea.research_opportunity_scores].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    return {
      slug: idea.public_slug,
      name: idea.name,
      category: idea.category,
      targetRetailPrice: idea.target_retail_price,
      supplierCount: idea.research_suppliers.length,
      score: s ? Number(s.score) : null,
      recommendation: s?.recommendation ?? null,
      matchReasons: [reason],
    }
  }

  // If nothing in the query resembles any category, fall back to the
  // highest-scoring reports overall. Still useful, still never empty.
  const pool = bestCategory ? (byCategory.get(bestCategory) ?? []) : ideas
  const suggestionResults = pool
    .map((idea) => toResult(idea, bestCategory ? 'same category' : 'top rated'))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 6)

  return NextResponse.json({
    results: [],
    suggestions: {
      // null means "we could not tell which category you meant" — the UI should
      // say so rather than mislabelling the fallback as a category match.
      category: bestCategory,
      reason: bestCategory
        ? `Closest category to “${query}”`
        : 'Most researched products right now',
      results: suggestionResults,
      // Lets the UI offer browse chips without a second request.
      otherCategories: [...byCategory.keys()]
        .filter((c) => c !== bestCategory)
        .sort()
        .slice(0, 8),
    },
  })
}
