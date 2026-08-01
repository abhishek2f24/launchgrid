# LaunchGrid Research Engine — Technical Due Diligence

**Audit basis:** the source code and live database, not screenshots or marketing.
**Date:** 2026-08-01 · **Auditor stance:** pre-acquisition, adversarial.
**Intended reader:** an AI or engineer who will take over and rebuild this engine.

> **Headline finding.** The engine is architecturally serious — provenance tracking,
> hard overrides, quantified uncertainty, a refund-on-failure quality gate. It is
> better engineered than most tools in this category.
>
> But **~49% of the flagship Opportunity Score's weight is user opinion or a neutral
> default, not measurement**, and the single largest missing input — demand — has no
> data source anywhere in the system. The score looks like a measurement and is
> substantially a mirror.
>
> Everything else in this document is detail beneath that sentence.

---

# PART 1 — HIGH LEVEL

## 1.1 What the software is trying to accomplish

LaunchGrid answers one question for a small Indian e-commerce merchant:

> **"Should I put my money into this product, and if so, how much and from whom?"**

It is not a keyword tool and not a dashboard product. The intended output is a
*decision* — buy, don't buy, or go and find out more — backed by supplier evidence and
a landed-cost model calibrated for Indian imports (customs duty, social welfare
surcharge, import IGST, port handling, inland freight).

The competitive position is the gap between:
- **Helium10 / JungleScout** — demand and keyword intelligence, US/Amazon-centric, tell
  you *what sells* but nothing about who manufactures it or what it lands at in India
- **IndiaMART / Alibaba** — supplier discovery with no economics
- **A CA or import consultant** — the landed-cost math, done manually, expensively

LaunchGrid attempts to be the join of all three for a merchant with ₹50k–₹5L to commit.

## 1.2 Intended workflow

```
  Idea ──▶ Supplier evidence ──▶ Landed cost ──▶ Profitability ──▶ Opportunity
   │            (scraped)         (modelled)      (modelled)         score
   │                                                                   │
   │                                                                   ▼
   └────────────────────────────────────────────────▶ Decision cockpit
                                                       (verdict, blockers,
                                                        readiness, first order)
                                                                       │
                                                                       ▼
                                                            "Build my store"
                                                       (idea → storefront product)
```

The Build-my-store bridge at the end is the actual business model: research is the
acquisition wedge, the storefront subscription is the revenue.

## 1.3 Philosophy behind the scoring

Three principles are genuinely encoded in the code, and they are the best thing here:

**(a) Unknown is not zero, and not false.** The 13 supplier evidence columns default
`FALSE` at the DB level, so the ingest endpoint writes *explicit NULLs* to avoid
asserting "we checked and it's absent". This distinction is enforced in three places
(migration 0023 comments, `UNKNOWN_EVIDENCE_COLUMNS` in the ingest route, the parsers).
It exists because 505 rows once falsely asserted "no factory audit available".

**(b) A high score must never override a hard disqualifier.** Two conditions force
`Reject` and cap the score at 20 regardless of every other input:
- `criticalComplianceOrSafetyFlag`
- `negativeContributionMargin`

This was added after the system showed **"LAUNCH READY" on a product with −2381%
margin**. It is the single most important line of defence in the codebase.

**(c) A score without an uncertainty band is a lie.** `decisionConfidence.ts` re-runs
the whole opportunity calculation under conservative and optimistic scenarios and
reports whether the *recommendation* is stable, not just the number.

## 1.4 What decisions it automates

| Decision | Automated? | Reality |
|---|---|---|
| Is this product worth selling? | Partially | Score exists; ~half its weight is unmeasured |
| Who should I buy from? | Yes | 3 suppliers with price, location, (newly) contact + MOQ |
| What will it cost me landed? | Yes — if you supply the inputs | Full India import model, **every input user-entered** |
| Will I make money at my price? | Yes | Marketplace fee model, hardcoded defaults |
| How much should I order first? | Yes | Derived from MOQ + budget |
| Is this supplier a manufacturer or a trader? | **No, in practice** | Engine is well designed; **its inputs are 100% NULL** |
| Is there demand? | **No** | 15% of the score, zero data sources |
| Is it legally clear to sell? | **No** | Compliance is a user-set slider |

---

# PART 2 — RESEARCH PIPELINE

## 2.1 Actual data flow

```
IndiaMART search page ──(residential proxy, render=true)──▶ parseSearchHtml
        │                                                        │
        │  ⚠ blocked: server GETs return a DECOY (see §4.6)      ▼
        │                                              supplier + price + storeUrl
        ▼                                                        │
supplier profile page ──────────────────────────────▶ parseSupplierDetailHtml
                                                        (phone, email, MOQ, certs)
                                                                 │
                                                                 ▼
                                       POST /api/research/ingest-supplier
                                       (only sanctioned write path)
                                       · evidence booleans → NULL
                                       · currency never guessed
                                       · confidence < 0.3 rejected
                                       · provenance stamped
                                                                 │
                                                                 ▼
                              research_suppliers / research_price_tiers
                                                                 │
                     ┌───────────────────────────────────────────┤
                     ▼                                           ▼
            USER-ENTERED INPUTS                          7 scoring engines
       (freight, duty, FX, retail price,          landedCost · profitability
        budget, 6 of 11 score components)          quality · manufacturerConfidence
                     │                             sourcingScenarios · opportunityScore
                     └──────────────────────────▶  decisionConfidence
                                                                 │
                                                                 ▼
                                                        decisionCockpit
                                                (verdict · blockers · readiness)
```

## 2.2 Metric-by-metric audit

Legend for **Source**: `SCRAPED` · `CALCULATED` · `USER` · `ESTIMATED` (hardcoded
assumption) · `AI` · `NONE` (no data path exists)

---

### Opportunity Score *(the flagship number)*

- **INPUTS:** 11 weighted components + 10 point-penalties + 2 hard overrides
- **PROCESS:** `Σ(weight × clamp(component, 0, 100)) − penalties`, then banded
- **OUTPUT:** 0–100 + one of five recommendation bands
- **SOURCE:** `CALCULATED` over inputs that are ~half `USER`/`ESTIMATED`

Actual weights (`OPPORTUNITY_WEIGHTS`):

| Component | Weight | Real source today |
|---|---:|---|
| marginScore | **20%** | CALCULATED from profitability (which rests on USER inputs) |
| demandScore | **15%** | 🔴 **NONE — user slider. No data source exists.** |
| competitionGapScore | **12%** | 🔴 NONE — user slider |
| improvementOpportunityScore | **12%** | 🔴 NONE — review mining not implemented |
| qualityScore | 10% | Engine exists; inputs are USER/absent → defaults to 50 |
| manufacturerConfidenceScore | 8% | Engine exists; **inputs are 100% NULL** → 50 |
| moqSuitabilityScore | 8% | CALCULATED (MOQ × price vs budget) — now real post-enrichment |
| capitalScore | 5% | CALCULATED (currently just aliased to moqSuitability) |
| returnRiskScore | 4% | 🔴 NONE — user slider |
| complianceScore | 3% | 🔴 NONE — user slider |
| shippingSuitabilityScore | 3% | 🔴 NONE — user slider |

**🔴 49% of the weight has no data source.** A further 18% (quality +
manufacturerConfidence) silently resolves to the neutral 50 default because its inputs
are NULL. **In the worst case, ~67% of the flagship score is a constant or an opinion.**

- **LIMITATIONS:** weights are unvalidated — no outcome data exists to fit them against.
  `SCORE_VERSION = '1.0.0'` is honest labelling of a first guess.
- **CONFIDENCE:** **Low.** Structurally sound, empirically ungrounded.

---

### Contribution Margin / Profitability

- **INPUTS:** landed cost, retail price (USER), marketplace fee profile (ESTIMATED)
- **PROCESS:** revenue − fees − landed cost − allowances
- **SOURCE:** `CALCULATED` over `ESTIMATED` fee constants

`DEFAULT_FEE_PROFILES.amazon_in` hardcodes: commission 15%, fixed fee ₹15, collection
2%, fulfilment ₹55/unit, advertising 8%, returns 3%, damage 1%.

- **LIMITATIONS:** Amazon commission is **category-dependent (2%–17%)**; a flat 15%
  can be wrong by 750 basis points, which on a 20% margin product is a third of the
  margin. Fee tables are not versioned or dated, so they will silently rot.
- **CONFIDENCE:** **Medium-low.** Correct arithmetic over stale, category-blind rates.
- **FIX:** category-keyed fee tables with `effective_from` dates and a "fees last
  verified on X" line in the UI.

---

### Landed Cost

- **INPUTS:** ~20 fields — quantity, unit price, currency, FX rate, FX buffer,
  packaging, branding, tooling, inland transport, international freight, insurance %,
  customs duty %, social welfare surcharge %, import IGST %, broker, port handling,
  warehousing
- **PROCESS:** standard CIF → assessable → duty → surcharge → IGST cascade, amortised
- **SOURCE:** `CALCULATED` — **every single input is `USER`**
- **OUTPUT:** ready-to-sell cost per unit

**This is the best-engineered module and the most dangerous.** The India import cascade
is modelled correctly. But a merchant who does not know their HS code, duty rate, or
freight quote is guessing, and the output is presented to the paise. Precision is being
mistaken for accuracy.

- **LIMITATIONS:** no HS-code lookup, no duty database, no freight rate source, no FX
  feed. Nothing validates that entered duty is plausible for the product.
- **CONFIDENCE:** **High on math, unknowable on inputs.** Garbage-in is invisible here.
- **FIX:** HS-code classifier → duty lookup → prefilled rates with a "you can override"
  affordance, plus a live FX feed. This converts the single biggest guess into data.

---

### Supplier / Manufacturer Confidence Score

- **INPUTS:** 18 boolean signals (10 positive, 8 negative)
- **PROCESS:** baseline 50, ± weights per triggered signal, clamp 0–100
- **SOURCE:** `SCRAPED` in principle. **In fact, all 18 are NULL for 100% of rows.**

The engine handles this correctly — `evidenceCount === 0` yields the label
**"Insufficient evidence"**. That is exactly right.

**🔴 But the honesty is laundered downstream.** `deriveAutoComponents` reads
`manufacturer_confidence_score` (= 50) and feeds it into the Opportunity Score as an 8%
weighted component. **The "Insufficient evidence" label is dropped.** A total absence of
evidence enters the flagship score as a neutral measurement.

- **LIMITATIONS:** the signals are precisely the things a directory listing never
  publishes — factory audits, production-line evidence, live video willingness. These
  are *outreach* outputs, not scraping outputs.
- **CONFIDENCE:** **Zero today.** Well-designed engine, no fuel.
- **FIX:** propagate `Insufficient evidence` as a *null component* that reduces the
  score's confidence band rather than contributing 50 × 0.08.

---

### Quality Score

- **INPUTS:** 7 components — spec completeness, material, construction,
  certification/test, review quality, defect rate, sample inspection
- **PROCESS:** weighted sum with proportional weight redistribution when no sample exists
- **SOURCE:** `USER` where present, defaults otherwise

The redistribution logic is genuinely good design — it avoids penalising a product
merely for not having been sampled yet.

- **LIMITATIONS:** review quality and defect rate require review mining, which does not
  exist. Certification requires document verification, which does not exist.
- **CONFIDENCE:** **Low.** Mostly the merchant scoring their own intuition.

---

### MOQ

- **SOURCE:** `SCRAPED` — **as of this session.** Previously 0% populated.
- **PROCESS:** read from supplier profile page; values of 1–2 rejected as parser noise
- **LIMITATIONS:** the profile-page selectors are **uncalibrated** — written from
  documented layout, never verified against a live page, because IndiaMART blocks
  automation. Every field independently returns null on no match, so failure degrades
  rather than corrupts.
- **CONFIDENCE:** **Unverified.** Must be spot-checked against three live pages on the
  first real proxy run.

---

### Recommended Order Quantity / Investment

- **INPUTS:** supplier MOQ, landed cost per unit, `max_initial_investment` (USER)
- **PROCESS:** `moqInvestment = MOQ × readyToSellCost`; banded against budget
  (≤ budget → 90, ≤ 2× → 55, else 20)
- **SOURCE:** `CALCULATED`
- **LIMITATIONS:** the 90/55/20 bands are arbitrary round numbers. No sensitivity to
  cash-conversion cycle, shelf life, or reorder lead time.
- **CONFIDENCE:** **Medium** now that MOQ is real; was fabricated before.

---

### Route Recommendation (Sourcing Scenarios)

- **INPUTS:** supplier set, landed-cost scenarios per route
- **PROCESS:** compare domestic vs import routes, pick verdict
- **SOURCE:** `CALCULATED` over `USER` cost assumptions
- **LIMITATIONS:** only meaningful with ≥2 routes priced. Today the catalogue is
  IndiaMART-only, so it compares Indian suppliers to Indian suppliers.
- **CONFIDENCE:** **Low until a second source exists.**

---

### Decision Confidence

- **INPUTS:** component ranges, penalty toggles
- **PROCESS:** re-runs full scoring under conservative/optimistic scenarios; reports
  whether the *recommendation band* is stable
- **SOURCE:** `CALCULATED`
- **STRENGTH:** this is the most sophisticated idea in the product and is rare in the
  category. Helium10 does not do this.
- **LIMITATIONS:** it measures sensitivity to *stated* ranges. It cannot know that
  `demandScore` was invented, so it reports confident stability around a fiction. **It
  quantifies precision, not accuracy.**
- **CONFIDENCE:** **High as implemented, misleading as presented.**

---

### Demand · Competition · Differentiation · Compliance · Return Risk · Shipping

- **SOURCE:** 🔴 `NONE`. All six are user sliders or defaults.
- Together: **49% of the Opportunity Score.**
- No Google Trends, no marketplace listing counts, no review mining, no HS/regulatory
  lookup, no dimensional/weight data.
- **CONFIDENCE:** **Zero.** These are the merchant's priors, returned to them with a
  decimal point attached.

---

# PART 3 — SCORING LOGIC

## 3.1 How I would rebuild the Opportunity Score

The current design has one fatal structural flaw: **missing data and neutral data are
indistinguishable.** A 50 means "average" and also "we have no idea", and they are
summed identically.

**Fix 1 — components become nullable, and null propagates.**

```ts
type Component = { value: number; confidence: number; source: Provenance } | null;
```

Re-normalise weights across *present* components, and expose coverage explicitly:

```
Opportunity 72 / 100   ·   Evidence coverage 51%   ·   Band 58–86
```

A score computed from 51% of its intended inputs must never render identically to one
computed from 95%.

**Fix 2 — separate the three questions.** One number conflates:
- **Market:** will it sell? (demand, competition, differentiation)
- **Economics:** will it profit? (margin, landed cost, capital)
- **Execution:** can I actually get it? (supplier, quality, compliance, MOQ)

A merchant needs to know *which* is failing. A 62 is unactionable; "Economics 84,
Market 41, Execution 70" tells them to go validate demand.

**Fix 3 — weights must be earned.** Current weights are asserted. Instrument outcomes
(did the merchant order? did it sell through?) and fit weights by logistic regression
once ~200 outcomes exist. Until then, label them as priors — which `SCORE_VERSION` at
least gestures at.

**Fix 4 — the hard overrides are correct. Extend them.** Add: no verified supplier
contact; MOQ investment > 3× stated budget; landed cost > retail price.

## 3.2 Factors that should influence it and don't

Demand velocity · price elasticity · seasonality · review sentiment and complaint
clusters · listing saturation · brand concentration (is one seller 60% of the category?)
· patent/trademark exposure · return rate by category · dimensional weight · shelf life ·
cash-conversion cycle · reorder lead time · competitor ad spend · regulatory regime
(BIS/FSSAI/CDSCO/EPR) · counterfeit risk.

## 3.3 How McKinsey would build it

They would refuse to publish a single score. Instead:

- **An explicit decision tree with kill gates**, not a weighted average — weighted
  averages let a strong margin mask fatal compliance risk. (LaunchGrid's hard overrides
  are the right instinct, half-applied.)
- **Scenario planning** — base / upside / downside with named assumptions. `decisionConfidence`
  is already 70% of this.
- **Sensitivity analysis** — a tornado chart of which assumption moves the answer most.
  This is the highest-value missing feature and is *cheap*: the machinery already exists.
- **An assumption register** — every number tagged with owner, source, date, confidence.
- **"What would have to be true?"** — invert it. Instead of "score 72", say *"this works
  if you sell 40 units/month at ₹899 with returns under 5%. Two of those three are
  unverified."*

## 3.4 How Amazon would score it

Amazon's internal logic is **working-backwards + single-threaded metrics**:

- **Start from the customer**, not the supplier. LaunchGrid starts from supply, which is
  structurally why demand is missing — it wasn't in the original frame.
- **Input metrics over output metrics.** "Opportunity score" is an output metric. Amazon
  would track controllable inputs: unit economics at reorder point, in-stock rate,
  defect rate, contribution profit per unit.
- **Contribution profit per unit after all allocated cost** — LaunchGrid computes this
  and it is the strongest part of the product.
- **A one-way vs two-way door test.** Ordering 100 units is reversible; ordering 5,000
  with custom tooling is not. Risk tolerance should scale to reversibility — completely
  absent today, and a genuinely novel feature if added.

---

# PART 4 — RESEARCH QUALITY: WHERE IT GUESSES

## 4.1 Provenance ledger

The system has a real provenance enum (`scraped | manual | seeded | unknown`,
migration 0032) — better than most competitors. Measured today:

```
Total catalogue products         309
  data_source = 'seeded'         305   (synthetic demo data)
  data_source = 'manual'           4
  data_source = 'scraped'          0
Products with real supplier evidence  49
Real scraped suppliers              145
```

**🔴 84% of the catalogue is synthetic**, badged as demo but visually indistinguishable
in the report body. A prospect browsing sees rich reports; a paying customer receives
three IndiaMART sellers. The demo writes a cheque the product does not cash.

## 4.2 REAL DATA (scraped, verifiable)

| Field | Coverage | Confidence |
|---|---|---|
| supplier_name | 100% of scraped | High |
| unit_price | 100% | High — but **1.0 tiers/supplier, no ladder** |
| city | 91% | High |
| year_established | 91% | Medium (derived from "N yrs" text) |
| store_url | **new** | Unverified in production |
| contact_phone / email / address | **new** | Uncalibrated selectors |
| moq | **new** | Uncalibrated selectors |

## 4.3 ESTIMATED DATA (hardcoded assumptions presented as fact)

- Marketplace fee profiles (commission, fulfilment, ad allowance) — undated, category-blind
- Return/damage allowances (3% / 1%) — universal constants applied to every product
- The 90/55/20 MOQ suitability bands
- FX buffer default
- Every opportunity weight

## 4.4 USER DATA (the merchant's own belief, scored back at them)

- All landed-cost inputs (freight, duty, IGST, insurance, packaging, tooling)
- Retail price, max initial investment
- 6 of 11 opportunity components
- Most quality components
- All 10 penalty toggles

## 4.5 AI GENERATED

**Almost none — and this is a genuine strength.** Extraction is deterministic regex/DOM
parsing. No LLM invents a supplier, a price, or a score. Scraping 1 product costs the
same as 1,000. Only marketing copy generation uses a model.

## 4.6 UNKNOWN / ACTIVELY MISLEADING

**🔴 The IndiaMART decoy.** Measured 2026-08-01: a server-side GET returns HTTP **200**,
24KB, 11 script tags, **no CAPTCHA**, real-looking markup — containing **t-shirt
suppliers in response to a "yoga mat" query**. It is deliberate bot poisoning, and every
generic block signal passes it.

This is the single most dangerous external condition. Two defences now exist:
1. `detectBlock` shape check — an IndiaMART search page with no `im-lc-card` is treated
   as a retryable block, not as "no suppliers exist"
2. The quality gate's relevance rule — <34% title match hard-fails and refunds

Without both, the system would have silently ingested t-shirt suppliers as yoga-mat
sourcing evidence.

**Also unknown:** whether the profile-page selectors work at all in production; whether
the six ported adapters work (all stamped `0.2.0-uncalibrated`); real duty rates; real
freight; real demand.

## 4.7 Where confidence must decrease and currently doesn't

| Condition | Today | Should be |
|---|---|---|
| Evidence booleans all NULL | Component contributes 50 × 0.08 | Component excluded; coverage drops |
| No profitability run | marginScore = 50 | Score not computable |
| Single price point, no ladder | Full confidence | Volume pricing unknown → flag |
| 1 supplier vs 12 | Same confidence | Sample-size penalty |
| Data 6 months old | No decay | Time-decay on price/availability |
| 84% seeded catalogue | Same visual weight | Prominent provenance badge in-body |

---

# PART 5 — EVIDENCE SYSTEM

## 5.1 What exists

Genuinely good foundations, uncommon in this category:
- `data_source`, `extraction_confidence`, `parser_version`, `source_url`, `scraped_at`
  on every supplier row
- `detail_scraped_at` distinguishing "never looked" from "looked, found nothing"
- Explicit NULLs on all 13 evidence booleans
- `quality_report` JSONB persisted on every request, so a refund can be explained months later

## 5.2 What's missing — the design

Every claim should carry a citation record:

```ts
interface Evidence {
  claim: string;                 // "MOQ is 250 units"
  value: unknown;
  source: {
    type: 'scraped'|'user'|'calculated'|'estimated'|'third_party_api'|'document';
    url?: string;
    parserVersion?: string;
    capturedAt: string;
    snapshotHash?: string;       // content hash of the page as captured
  };
  confidence: number;            // 0-1
  freshness: { capturedAt: string; ttlDays: number; staleAt: string };
  verification: {
    method: 'none'|'cross_source'|'human'|'document'|'supplier_confirmed';
    verifiedAt?: string;
    verifiedBy?: string;
  };
  supersedes?: string;           // prior evidence id — append-only, never overwrite
}
```

**Per-metric requirements:**

| Metric | Evidence required | Source | Freshness TTL | Verification |
|---|---|---|---|---|
| Unit price | Price ladder ≥3 tiers | Supplier page | 30d | Cross-source or RFQ confirm |
| MOQ | Profile or quotation | Supplier page | 60d | Supplier confirmed |
| Duty % | HS code + tariff entry | CBIC tariff | 180d | Document |
| Freight | Rate quote, lane + weight | Freight API | 14d | Quote document |
| Demand | Search volume / sales rank | Trends / marketplace | 7d | Cross-source |
| Compliance | Applicable regime + cert | Regulatory DB | 365d | Document |
| Manufacturer status | Licence, audit, video | Supplier docs | 365d | Human |
| Marketplace fees | Fee schedule + date | Marketplace docs | 90d | Document |

**Storage:** append-only `research_evidence` table, never mutated. Snapshot HTML to
object storage keyed by hash — non-negotiable for disputes and for re-parsing when a
selector is later found wrong.

**Verification ladder:** `unverified` → `cross-source agreement` → `document` →
`supplier confirmed` → `physically inspected`. Confidence should be a function of
position on this ladder, not of parser luck.

**Presentation rule:** every number in the UI gets a hoverable citation. If a number has
no citation, it must be visually marked as an assumption. This one rule would force the
rest of the system honest.

---

# PART 6 — DECISION ENGINE

## 6.1 The problem with the current cockpit

It presents a score and lets the merchant infer the decision. A merchant with ₹2L to
commit and no import experience cannot infer well. And a five-band scale ("Strong launch
candidate" / "Order samples and validate" / "Negotiate or monitor" / "Weak" / "Reject")
is really three decisions wearing five hats.

## 6.2 Proposed engine

**Output exactly one of three verdicts. Never a number as the headline.**

```
BUY    — commit capital now, at this quantity, from this supplier
WAIT   — the opportunity may be real but a named unknown must be resolved first
REJECT — do not pursue; a structural condition fails
```

**Evaluation order — gates before scores:**

```
1. DISQUALIFIERS (any true → REJECT, no score computed)
   · negative contribution margin at realistic price
   · critical compliance/safety flag
   · landed cost > achievable retail
   · no supplier with verified contact
   · patent/trademark block

2. EVIDENCE FLOOR (below → WAIT, never BUY)
   · evidence coverage < 60% of weighted components
   · zero demand evidence
   · MOQ unknown
   · single supplier only
   · price from a single point, no ladder

3. CAPITAL FIT (fails → WAIT)
   · MOQ investment > stated budget
   · payback period > merchant's stated tolerance

4. SCORE + CONFIDENCE BAND
   · BUY  → score ≥ 65 AND lower confidence bound ≥ 55
   · WAIT → band straddles the threshold
   · REJECT → upper bound < 50
```

**Critically: `WAIT` must be the default, not the exception.** With today's data almost
everything is a WAIT, and saying so is the honest product.

## 6.3 Required output shape

```json
{
  "verdict": "WAIT",
  "confidence": 0.42,
  "because": [
    "Contribution margin 31% at ₹899 — healthy",
    "Zero demand evidence — 15% of the assessment is unmeasured",
    "MOQ 250 units ≈ ₹1,22,500 vs your ₹1,00,000 budget"
  ],
  "assumptions": [
    { "what": "Customs duty 18%", "source": "user", "impactIfWrong": "±₹47/unit" },
    { "what": "Amazon commission 15%", "source": "estimated", "impactIfWrong": "±₹63/unit" }
  ],
  "unknowns": [
    { "what": "Monthly demand", "howToResolve": "Check marketplace rank", "blocksVerdict": true }
  ],
  "nextActions": [
    { "action": "Send RFQ to 3 suppliers", "cost": "free", "resolves": ["MOQ", "price ladder"] },
    { "action": "Verify HS code and duty", "cost": "free", "resolves": ["landed cost"] }
  ],
  "wouldBecomeBuyIf": "demand ≥ 40 units/month AND MOQ negotiable to 150"
}
```

`wouldBecomeBuyIf` is the highest-value field in the entire product and does not exist
today. It converts a verdict into a task list.

---

# PART 7 — MISSING CAPABILITIES

Ordered by impact-per-unit-effort.

## Tier 1 — required for the product to be worth its price

1. **Demand signal** — 15% of the score with no source. Marketplace rank, search volume,
   Google Trends. Without this the product cannot answer "will it sell?"
2. **RFQ generator + outreach tracking** — turns a report into an action. Was built in a
   predecessor codebase and never ported. **Highest ROI item on this list.**
3. **Price ladder capture** — 1.0 tiers/supplier today. Volume pricing is the entire
   basis of a first-order decision.
4. **HS code → duty lookup** — removes the largest user-entered guess in landed cost.
5. **Freight rate estimation** — second largest guess.
6. **Real catalogue coverage** — 49/309. The product does not have enough real data.
7. **Review mining** — feeds `improvementOpportunityScore` (12%) and quality.

## Tier 2 — competitive parity

8. Competition / listing saturation · 9. Seasonality · 10. Price history (Keepa-style) ·
11. Seller history and concentration · 12. Keyword opportunity · 13. Demand forecasting ·
14. Multi-source supplier comparison · 15. Sensitivity analysis (tornado) ·
16. Category-specific fee tables · 17. Compliance regime detection (BIS/FSSAI/CDSCO/EPR) ·
18. Returns prediction by category

## Tier 3 — differentiation

19. Patent/trademark search · 20. Import/export trade records (a genuine moat — customs
data reveals who actually imports what, at what volume) · 21. Factory ownership
verification · 22. MOQ negotiation guidance with benchmarks · 23. Sample tracking ·
24. Packaging/dimensional estimation from images · 25. Listing quality scoring ·
26. Image quality scoring · 27. Brand/white-label opportunity · 28. Market gap analysis ·
29. Social demand signals (Meta/TikTok/Pinterest) · 30. Counterfeit risk ·
31. Cash-conversion-cycle modelling · 32. Reorder point and stockout risk ·
33. Multi-currency hedging · 34. Supplier reliability scoring over time ·
35. Landed-cost comparison across ports · 36. GST input-credit modelling ·
37. One-way vs two-way door risk classification

---

# PART 8 — WHAT THE NEXT AI NEEDS TO KNOW

## 8.1 Architecture

**Stack:** Next.js 16 App Router · Supabase (Postgres + RLS + Auth) · Vercel ·
Razorpay · native Kotlin/Compose Android companion app.

**Key modules:**
```
src/lib/research/engines/     11 scoring engines, pure functions, testable
src/lib/research/fetch/       htmlFetcher (proxy abstraction) + indiamartParser
src/lib/research/qualityGate.ts   deliver-vs-refund decision
src/lib/research/fulfilRequest.ts on-demand fulfilment orchestration
src/actions/research.ts       getResearchReport — runs all engines at read time
src/app/api/research/ingest-supplier/  THE ONLY SANCTIONED WRITE PATH
```

**Non-negotiable invariants — violating any of these has already caused an incident:**

1. **All supplier writes go through `/api/research/ingest-supplier`.** Direct SQL is
   what produced 505 rows falsely asserting "no factory audit". The endpoint writes
   explicit NULLs, refuses to guess currency, stamps provenance, rejects confidence < 0.3.
2. **Never emit evidence booleans from a scraper.** A "TrustSEAL" badge is marketing.
   `NULL` ≠ `false`.
3. **Never guess a currency.** Defaulting USD → INR once understated landed cost ~83× and
   turned a loss-maker into "LAUNCH READY".
4. **Reports are computed, not stored.** Seven engines run inside `getResearchReport`.
   Any client that re-implements them will drift — this is why the mobile app consumes
   `/api/research/report/[ideaId]` rather than raw tables.
5. **Credits are an append-only ledger, account-scoped.** Hold on request, refund on
   failure. Never a mutable counter.
6. **A price ladder never starts at quantity 1–2.** That means the parser grabbed a
   stray number.

**Money invariants, verified by `scripts/verify-credit-invariants.mjs`:** concurrent
requests cannot overspend (5 concurrent on 2 credits → exactly 2 granted); double-refund
is a no-op; clients cannot insert ledger or request rows.

## 8.2 Research philosophy

- Unknown is not zero and not false
- A hard disqualifier outranks any score
- A score without an uncertainty band is a lie
- Deterministic extraction — no model invents facts, so cost doesn't scale with catalogue
- Refund rather than deliver something wrong

## 8.3 Weaknesses and blind spots

**🔴 Blind spot 1 — the product is supply-first.** It started from "who makes this" and
demand was bolted on as a slider. That is why 49% of the score is unmeasured; it is a
framing problem, not a missing integration.

**🔴 Blind spot 2 — precision masquerading as accuracy.** Landed cost to the paise from
user-guessed duty. The interface communicates certainty the data cannot support.

**🔴 Blind spot 3 — the demo is richer than the product.** 305 seeded vs 49 real.

**🔴 Blind spot 4 — no outcome loop.** Nothing records whether a merchant ordered, or
whether it sold. Without that the weights can never be validated and the product cannot
improve from use.

**🔴 Blind spot 5 — single source.** IndiaMART only, and IndiaMART actively poisons
automation. One counterparty's bot policy can take the product offline.

**Blind spot 6 — "Insufficient evidence" is computed then discarded** on the way into the
Opportunity Score.

## 8.4 Known mistakes already made (do not repeat)

| Mistake | Consequence | Fix |
|---|---|---|
| Direct SQL writes bypassing ingest | 505 fabricated compliance claims | Single write path |
| Currency defaulted to INR | Landed cost off 83×, "LAUNCH READY" on a loss-maker | `PLATFORM_CURRENCY` map, reject if unknown |
| Unclamped score inputs | −2381% margin scored as launch-ready | `clamp01to100` + hard override |
| Adapters stamped "calibrated" without calibration | False trust signal in `parser_version` | Downgraded to `0.2.0-uncalibrated` |
| `NEXT_PUBLIC_APP_URL` used for internal loopback | Worker POSTed results to production | Use request origin |
| Blur-based paywall over fetched data | Trivially bypassable | Strip server-side |
| Relevance treated as a warning | Agate sellers delivered for macrame | Hard fail + refund below 34% |

## 8.5 Roadmap

**Now (product cannot be sold without these):**
1. Residential proxy with `render=true` — nothing works without it
2. Real coverage to 300+ products
3. RFQ generator
4. Price ladder capture
5. Calibrate profile-page selectors against live pages

**Next quarter:** demand signal · HS/duty lookup · freight estimation · evidence
citations in UI · BUY/WAIT/REJECT engine · sensitivity analysis · second supplier source

**Then:** review mining · outcome tracking and weight fitting · trade records · patent
search · supplier reliability over time

## 8.6 If you change one thing

**Make missing data visible in the score.** Today a report built on 51% coverage renders
identically to one built on 95%. Every other weakness in this document is downstream of
that single design decision.

The engine's bones are good. It is being fed guesses and presenting them as findings.

---

## Appendix — verification assets

```
node --test src/lib/research/**/*.test.ts     50 unit tests
node scripts/verify-credit-invariants.mjs     money invariants, real DB
node scripts/verify-fulfilment.mjs            21 e2e checks via local fixture
```

`verify-fulfilment.mjs` points `RESEARCH_PROXY_ENDPOINT` at its own fixture and restores
it on exit — the real ProxyFetcher → detectBlock → parser → gate → ingest → refund path
executes against controlled HTML. Nothing inside the app is mocked; only the origin is
substituted. This is the pattern to extend, not replace.
