# LaunchGrid V3 — Product Intelligence Platform Architecture

**Status:** design document, for build.
**Supersedes:** the scoring-centric model audited in `RESEARCH_ENGINE_AUDIT.md`.
**Core thesis:** stop computing a score over guesses. Accumulate evidence, derive claims
from evidence, and let the decision fall out of coverage and confidence.

---

## 0. The one principle everything else follows from

> **The architecture is copyable in a weekend. The evidence store is not.**

Any competent team can rebuild five engines and a decision layer. Nobody can replicate
three years of daily price snapshots, review deltas, supplier quotations and import
records for the Indian market.

Therefore the design goal is **maximum evidence accrued per rupee spent, retained
forever, never overwritten.**

Three consequences, and they drive the whole schema:

1. **Every paid fetch is stored raw and immutable.** Store the HTML/JSON snapshot, not
   just what you parsed from it. When a selector turns out to be wrong — and it will —
   you re-parse history instead of re-buying it.
2. **Claims are versioned, never updated in place.** A price of ₹599 on 12 Jan and ₹649
   on 3 Feb are two facts, not one field that changed. Price *history* is the asset.
3. **Nothing is deleted.** A supplier that disappears is evidence. A listing that dies
   is demand evidence.

---

## 1. Layer model

```
┌─ L1  ACQUISITION ────────────────────────────────────────────────┐
│  Paid APIs · proxied scrape · user upload · extension capture    │
│  ↓ every response persisted raw + content-hashed                 │
├─ L2  EVIDENCE STORE (immutable, append-only) ────────────────────┤
│  raw_captures · evidence · entity_resolution                     │
│  ↓ nothing above this line may write here except the ingest gate │
├─ L3  DERIVATION (pure functions, replayable) ────────────────────┤
│  claims: demand · price band · competition · landed cost ·       │
│  margin · supplier reliability — each with coverage + confidence │
├─ L4  KNOWLEDGE GRAPH (derived, rebuildable, NOT source of truth) │
│  product ↔ factory ↔ brand ↔ importer ↔ complaint ↔ material     │
├─ L5  DECISION (investment memo) ─────────────────────────────────┤
│  BUY / WAIT / REJECT · confidence · unknowns · would-become-BUY  │
├─ L6  OUTCOME LEARNING ───────────────────────────────────────────┤
│  ordered? sold through? returned? → recalibrate L3 and L5        │
└──────────────────────────────────────────────────────────────────┘
```

**The critical rule:** L4 is *derived and rebuildable* from L2+L3. It is never a source
of truth. If the graph burns down you replay it in an afternoon. This is what keeps the
graph from becoming the thing you're afraid to change.

---

## 2. L2 — the evidence store

This is the product. Everything else is replaceable.

### 2.1 Raw captures — the archive

```sql
CREATE TABLE raw_captures (
  id            UUID PRIMARY KEY,
  source        TEXT NOT NULL,        -- 'keepa' | 'indiamart' | 'volza' | 'amazon_serp'
  url           TEXT,
  request       JSONB,                -- exact params, so it is reproducible
  body_hash     TEXT NOT NULL,        -- sha256; dedupes identical captures
  storage_key   TEXT NOT NULL,        -- object storage; NEVER in Postgres
  status        INT,
  captured_at   TIMESTAMPTZ NOT NULL,
  cost_paise    INT,                  -- what this fetch cost. drives unit economics
  UNIQUE (source, body_hash)
);
```

`cost_paise` is not bookkeeping — it is how you learn which sources earn their price.

### 2.2 Evidence — atomic observations

```sql
CREATE TABLE evidence (
  id             UUID PRIMARY KEY,
  subject_type   TEXT NOT NULL,       -- 'product' | 'supplier' | 'listing' | 'market'
  subject_id     UUID NOT NULL,
  predicate      TEXT NOT NULL,       -- 'unit_price' | 'monthly_sales' | 'moq' | 'review_count'
  value          JSONB NOT NULL,
  unit           TEXT,                -- 'INR' | 'units_per_month' | 'days'

  capture_id     UUID REFERENCES raw_captures(id),
  method         TEXT NOT NULL,       -- 'parsed' | 'api' | 'user' | 'document' | 'inferred'
  parser_version TEXT,
  confidence     NUMERIC NOT NULL,    -- 0..1, earned not asserted
  observed_at    TIMESTAMPTZ NOT NULL,
  ttl_days       INT NOT NULL,        -- when this becomes stale, by predicate
  superseded_by  UUID REFERENCES evidence(id)   -- append-only correction chain
);
CREATE INDEX ON evidence (subject_type, subject_id, predicate, observed_at DESC);
```

**Why `predicate` rather than columns:** you cannot know today which facts matter in two
years. A wide table forces a migration per new fact; this does not. The cost is weaker
type safety — pay it, and enforce shape in the derivation layer.

**`ttl_days` per predicate**, because staleness is not uniform:

| Predicate | TTL | Why |
|---|---:|---|
| unit_price | 30d | Supplier quotes drift |
| monthly_sales | 7d | Demand moves fast |
| review_count | 14d | Velocity is the signal, not the level |
| moq | 90d | Rarely changes |
| duty_rate | 180d | Budget cycle |
| factory_address | 365d | Structural |
| marketplace_fee | 90d | Published schedules change |

### 2.3 Entity resolution — the hardest unglamorous problem

"Magnetic Cable Organizer" on Amazon, "磁性理线器" on 1688 and "Cable Management Clip" on
IndiaMART may be one product. Getting this wrong silently corrupts every downstream claim.

```sql
CREATE TABLE entity_aliases (
  canonical_id  UUID NOT NULL,
  source        TEXT NOT NULL,
  external_id   TEXT NOT NULL,        -- ASIN, IndiaMART id, 1688 id
  match_method  TEXT NOT NULL,        -- 'exact_gtin'|'image_hash'|'text_sim'|'human'
  match_score   NUMERIC,
  confirmed_by  TEXT,                 -- human reviewer, when applicable
  UNIQUE (source, external_id)
);
```

Resolution ladder, strongest first: **GTIN/EAN/UPC → perceptual image hash → model
number → text similarity → human**. Never auto-merge below ~0.9; queue for review
instead. `textSimilarity.ts` already exists and is the weakest rung — do not rely on it
alone.

**A wrong merge is worse than no merge.** It fabricates evidence by attributing one
product's demand to another.

---

## 3. L3 — claims, and the coverage contract

A **claim** is a derived answer with an explicit accounting of what it was derived from.

```ts
interface Claim<T> {
  predicate: string;
  value: T | null;                 // null = we genuinely do not know
  confidence: number;              // 0..1
  coverage: number;                // 0..1 — fraction of required evidence present
  evidenceIds: string[];           // every observation used
  derivedBy: string;               // 'demand@2.1.0' — versioned, replayable
  assumptions: Assumption[];       // anything not observed
  staleAt: string | null;
}
```

**The coverage contract — the rule that fixes the audited system:**

> A claim with `value !== null` MUST have `coverage > 0` and a non-empty `evidenceIds`.
> A claim with no evidence returns `null`, never a neutral default.

This one invariant eliminates the audit's headline defect, where absent evidence entered
the score as a 50. It should be enforced by a runtime assertion, not a convention.

### 3.1 Demand as a derived claim

Your point, made concrete. Demand stops being a slider:

```
INPUTS (evidence)                       →  CLAIM
sales_rank history (Keepa, 90d)            monthly_sales_estimate
review_count deltas (t0 vs t-30)           review_velocity
listing_count for keyword                  competition_density
search_interest (Trends, 12mo)             trend_direction, seasonality
price history (Keepa)                      price_band, price_stability
sponsored_ratio in SERP                    ad_saturation

coverage = weighted presence of the six inputs
confidence = f(coverage, source reliability, agreement between sources, staleness)
```

Rank→sales conversion is category-specific and itself an estimate — it must be stored as
an **assumption on the claim**, with its own confidence, not silently applied.

### 3.2 Confidence formula

```
confidence = base(method)
           × freshness(observed_at, ttl)
           × agreement(independent sources)
           × sample_adequacy(n)
```

- `base`: api 0.95 · document 0.9 · parsed-calibrated 0.8 · parsed-uncalibrated 0.5 ·
  user 0.4 · inferred 0.3
- `freshness`: linear decay to 0.5 at TTL, floor 0.2 after
- `agreement`: two independent sources agreeing → ×1.2 (cap 1.0); disagreeing → ×0.6 **and
  raise a contradiction**
- `sample_adequacy`: 1 supplier 0.5 · 3 → 0.8 · 10+ → 1.0

**Contradictions are first-class.** If Keepa says ₹599 and the SERP says ₹899, that is a
finding to surface, not an average to take. Averaging contradictory evidence is how
intelligence systems quietly become wrong.

---

## 4. The five engines — with sourcing reality

Naming what each engine can *actually* be fed matters more than the boxes. This is where
plans of this kind usually die.

### Engine 1 — Market Intelligence 🔴 hardest, most valuable

| Need | Source | Reality |
|---|---|---|
| Price + rank history (amazon.in) | **Keepa API** | ~€50/mo. Years of history. **Start here.** |
| Live SERP, sponsored %, listing count | Rainforest / Oxylabs | Paid scraping-as-a-service; they absorb the arms race |
| Official catalogue | Amazon PA-API | Free but needs affiliate account with qualifying sales — chicken-and-egg |
| Search interest | Google Trends | Free, unofficial, coarse but real |
| Flipkart / Meesho | — | **No public API. Hardest. Defer.** |

**Do not build an Amazon scraper.** IndiaMART already defeats us with decoys; Amazon is
far harder and carries real legal exposure. Buy this data.

### Engine 2 — Supplier Intelligence *(partly built)*

IndiaMART (proxy + `render=true`) · Alibaba · 1688 · Made-in-China · **Indian import
records via Volza / Export Genius / Zauba** (~$100+/mo).

Import records are the genuine moat: they reveal who *actually* imports what, in what
volume, from which factory — the one dataset that cannot be inferred from listings.

Reusable today: `ingest-supplier` endpoint, provenance columns, `htmlFetcher`,
`indiamartParser`, quality gate. The six ported adapters are `0.2.0-uncalibrated` — treat
as unwritten.

### Engine 3 — Customer Intelligence

Review text (via Engine 1 sources) → complaint clustering → feature requests → return
reasons. `reviewAnalysis.ts` exists as a skeleton.

**This is the differentiation engine.** "Customers complain the adhesive is weak" is a
product spec, and it is the one output a merchant cannot get anywhere else. It feeds
`improvementOpportunityScore` (12% weight, currently zero evidence) and, more
importantly, the RFQ.

### Engine 4 — Financial Intelligence *(best-built today, worst-fed)*

`landedCost.ts` models the India import cascade correctly. Every input is user-guessed.
Fix by source, in order of size of guess removed:

1. **HS classifier → CBIC duty lookup** — removes the largest guess
2. **Freight rate API** — second largest
3. **Category-keyed marketplace fees, dated** — replaces the flat 15% (real range 2–17%)
4. **Live FX** — trivial, do it immediately
5. GST input credit, working capital, reorder economics

### Engine 5 — Decision Intelligence

Consumes claims only. Never touches raw evidence. See §6.

---

## 5. L4 — the knowledge graph (build in year two)

Your example is right about the *questions*, and those questions need density to answer.
With 49 products and one supplier source, the graph connects nothing.

**So: design for it, defer building it.** The evidence store above makes the graph a
projection — `(subject, predicate, object)` is already graph-shaped. Materialise into a
graph store only when you can answer:

> "Products where the factory is verified, competition is moderate, margin > 35%, review
> complaints indicate an easy fix, and MOQ fits ₹20,000."

That query needs ~1,000 products × verified factories × review clusters. Until then it
is a SQL query over claims, which is fine and much cheaper.

**Trigger to build:** >2,000 resolved products AND >2 supplier sources AND review mining
live. Not before.

---

## 6. L5 — the investment memo

Your format, formalised. **No headline score.**

```json
{
  "product": "Magnetic Cable Organizer",
  "verdict": "BUY",
  "confidence": 0.91,
  "evidenceCoverage": 0.94,

  "gates": {
    "disqualifiers": [],
    "evidenceFloor": "passed",
    "capitalFit": "passed"
  },

  "because": [
    { "claim": "Median monthly sales 620", "coverage": 0.9, "evidence": ["ev_1","ev_2"] },
    { "claim": "Contribution margin 41% at ₹599", "coverage": 0.95, "evidence": ["ev_7"] },
    { "claim": "3 suppliers with verified contact, MOQ 100", "coverage": 1.0 }
  ],

  "unknownsBlockingDecision": [
    { "what": "Duty rate", "status": "estimated", "impactIfWrong": "±₹47/unit",
      "howToResolve": "Confirm HS code with CHA", "cost": "free" }
  ],

  "assumptions": [
    { "what": "Amazon commission 15%", "source": "estimated",
      "actualRange": "2–17% by category", "impactIfWrong": "±₹63/unit" }
  ],

  "differentiation": {
    "complaints": ["adhesive weak", "packaging poor"],
    "opportunity": ["premium 3M adhesive", "include alcohol wipe"],
    "evidence": "412 reviews mined, 31% mention adhesion"
  },

  "recommendedOrder": { "units": 120, "capital": 21960, "paybackMonths": 2.4 },

  "wouldBecomeRejectIf": "duty > 28% or median price falls below ₹450",
  "wouldBecomeBuyIf": null
}
```

**Decision order — gates before scores, always:**

```
1. DISQUALIFIERS      → REJECT   (negative margin · compliance flag ·
                                  landed > retail · no verified supplier · IP block)
2. EVIDENCE FLOOR     → WAIT     (coverage < 0.6 · zero demand evidence ·
                                  MOQ unknown · single supplier · single price point)
3. CAPITAL FIT        → WAIT     (MOQ investment > budget · payback > tolerance)
4. CLAIM SYNTHESIS    → BUY / WAIT / REJECT on value AND confidence band
```

**Two hard truths about this design:**

**(a) On day one, almost everything is WAIT.** With a strict evidence floor and today's
coverage, near 100% of products return WAIT. That is correct and honest — but it is a
product experience you must design for deliberately, not discover. Make WAIT *useful*:
lead with `unknownsBlockingDecision` and the cheapest action that resolves it.

**(b) `wouldBecomeBuyIf` is the highest-value field.** It converts a refusal into a task
list, and it is what makes a WAIT worth paying for.

---

## 7. L6 — outcome learning

Nothing in the current system records whether the advice was right. Without this the
weights can never be validated and the product cannot improve from use.

```sql
CREATE TABLE decision_outcomes (
  memo_id           UUID,
  verdict           TEXT,
  confidence        NUMERIC,
  evidence_coverage NUMERIC,
  merchant_action   TEXT,        -- 'ordered'|'skipped'|'deferred'
  units_ordered     INT,
  actual_landed     NUMERIC,     -- vs predicted
  units_sold_90d    INT,         -- vs predicted
  return_rate       NUMERIC,
  gross_profit      NUMERIC,
  recorded_at       TIMESTAMPTZ
);
```

**Two learning loops:**

1. **Calibration** — when we say 0.9 confidence, are we right ~90% of the time? Track
   Brier score per claim type. Miscalibration is more damaging than low accuracy, because
   it corrupts the gates.
2. **Weight fitting** — once ~200 outcomes exist, fit weights by regression instead of
   asserting them. Until then, label them priors.

**The bootstrap problem, and its answer:** outcomes need transactions, which need
merchants. **Be customer zero.** Launch your own products through the engine. Your P&L is
the only training set available before you have paying merchants — and it forces you to
eat every weakness in the system before a customer does.

---

## 8. Build order

Each phase must produce something usable alone. No 6-month unlanded platform.

**Phase 0 — foundation (2 weeks).** `raw_captures` + `evidence` + `Claim` type + coverage
contract. Retrofit the existing supplier pipeline to write evidence. **Nothing user-facing.
Do not skip.** Every later phase is cheap or expensive depending on this.

**Phase 1 — demand, bought not scraped (3 weeks).** Keepa integration → price and rank
history → `monthly_sales_estimate`, `price_band`, `trend`. Google Trends for seasonality.
**This alone fixes the 15% hole and is the single highest-value phase.**

**Phase 2 — memo v1 (2 weeks).** BUY/WAIT/REJECT with gates, `unknownsBlockingDecision`,
`wouldBecomeBuyIf`. Retire the 100-point score from the UI. Expect ~all WAIT — ship it
anyway; it is the honest state.

**Phase 3 — financial truth (3 weeks).** HS→duty, freight API, dated category fee tables,
live FX. Converts landed cost from guess to claim.

**Phase 4 — customer intelligence (4 weeks).** Review ingestion → complaint clustering →
differentiation opportunities → **RFQ generator**. This is where reports become actions.

**Phase 5 — supplier depth (3 weeks).** Import records, second and third supplier source,
price ladders, entity resolution across sources.

**Phase 6 — outcome loop (2 weeks).** Outcome capture + calibration dashboard. Start with
your own launches.

**Phase 7 — graph (year two).** Only when §5's trigger is met.

---

## 9. Cost model — the real gate

This plan is gated by data spend, not engineering.

| Source | Monthly | Buys |
|---|---:|---|
| Keepa API | ~₹5,000 | Price + rank history, amazon.in |
| Residential proxy (`render=true`) | ~₹3,000–8,000 | Supplier pages |
| Import records (Volza/Export Genius) | ~₹8,000+ | Trade relationships |
| SERP API | ~₹4,000 | Competition, sponsored % |
| **Floor for a credible v1** | **~₹20,000–25,000/mo** | |

At ₹80/report that is ~300 reports/month to break even on data alone, before compute or
salary. **Two implications:**

1. **Cache is the business model.** Evidence is shared across all customers. The 300th
   merchant asking about a power bank costs ₹0. Unit economics improve superlinearly with
   users — this is the real reason to accumulate rather than fetch on demand.
2. **Pre-fetch the head, on-demand the tail.** Batch-build the top ~2,000 Indian D2C
   products so most searches are instant cache hits, and reserve paid on-demand fetches
   for the long tail.

---

## 10. What kills this

Honest failure modes, in order of likelihood:

1. **Building the graph first.** Most seductive, least urgent. Defer.
2. **Trying to scrape Amazon.** Arms race you lose, with legal exposure. Buy it.
3. **Skipping Phase 0.** Retrofitting an evidence store after five engines exist is a
   rewrite. This is the single highest-regret shortcut available.
4. **Letting a default back in.** One `?? 50` reintroduces the exact defect the audit
   found. Enforce the coverage contract with a runtime assertion, not a code review.
5. **Averaging contradictions.** Two disagreeing sources must surface a contradiction,
   never a mean.
6. **Data spend before revenue.** ₹25k/mo with no customers has a clock on it. Phase 1
   (Keepa only, ~₹5k) is deliberately the cheapest high-value step for this reason.
7. **Never being customer zero.** If you won't spend your own money on the engine's
   advice, the advice isn't ready to sell.

---

## 11. What carries forward from V2

Not a rewrite. These survive intact:

- `ingest-supplier` as the single sanctioned write path, and its NULL-vs-false discipline
- Provenance columns (`data_source`, `parser_version`, `extraction_confidence`, `source_url`)
- The quality gate and refund-on-failure contract
- Hard overrides (negative margin, compliance flag) — these become **disqualifier gates**
- `decisionConfidence.ts` scenario machinery — becomes confidence-band computation
- `landedCost.ts` — correct math, just needs sourced inputs
- The credit ledger and fair-use cap
- `htmlFetcher` + `detectBlock` decoy detection

**What retires:** the 100-point Opportunity Score as a user-facing number, the six
opinion-slider components, and neutral-50 defaults everywhere.
