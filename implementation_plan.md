# Research Module — LaunchGrid Android

Implement the Research features from `docs/MOBILE_APP_BUILD_PROMPT.md` in the native
Kotlin app at `launchgrid-android/`.

Research becomes the app's primary feature and default screen: view reports, request new
research with credits, track request status.

---

## Ground rules — read before writing code

1. **The app displays numbers; it never computes them.** Verdict, opportunity score,
   landed cost, margin and decision confidence are all derived server-side by seven
   engines (`src/lib/research/engines/*`). Porting any of that to Kotlin guarantees the
   two surfaces disagree. Render what the API returns, unrounded and unmodified.
2. **`null` means unknown, and must render as "Unknown".** Never "No", never `0`, never a
   plausible default. This matters most for the 13 supplier evidence booleans:
   `null` = "we don't know"; `false` = "we checked and it's absent". Different claims.
3. **Never infer a currency.** Render the `currency` field you are given. Supplier prices
   can be USD or CNY; showing a USD figure with ₹ understates cost ~83×.
4. **No purchase UI anywhere.** No Razorpay, no in-app browser to a purchase page, no
   button or link steering to one. Apple/Google require IAP for digital goods and credits
   qualify. Out-of-credits shows plain text only (§4.3 below).
5. **Report actual output at every checkpoint.** "Should work" is not a result. If you
   cannot verify something, say so.

---

## Phase 0 — Web backend (do this first; nothing else works without it)

### 0.1 [NEW] `src/app/api/v1/research/report/[ideaId]/route.ts`

Wraps the existing `getResearchReport` from `src/actions/research.ts:708` so the app
consumes an assembled report instead of raw tables.

Follow the existing `/api/v1` envelope (see `src/app/api/v1/entitlements/route.ts`):

```ts
// success
{ data: { idea, ideaDataSource, suppliers, opportunityScore, landedCosts,
          profitability, decisionCockpit, sourcingScenarios, locked }, error: null }
// failure
{ data: null, error: { code: 'UNAUTHORIZED' | 'NOT_FOUND', message: string } }
```

- `GET`, authenticated. Reuse the auth pattern from the sibling `/api/v1` routes.
- Idea not owned by the caller → **404**, never 403 (never confirm another user's idea
  exists).
- Return values exactly as `getResearchReport` produces them. **Do not round or reformat**
  — the client must be able to match web to the paise.

### 0.2 Server-side paywall

Free-tier users must never receive paid values. Blurring on the client is cosmetic and
bypassable with any HTTP client.

Read the plan tier the same way `/api/v1/entitlements` does (`subscriptions.plan_tier` →
`getPlan()`). For a free-tier caller, **omit from the payload entirely**:

- `decisionCockpit`
- `sourcingScenarios`
- `opportunityScore`
- `landedCosts` and `profitability`

Then include a `locked` object so the app can render a proper upgrade prompt instead of a
screen with unexplained gaps:

```ts
locked: { isLocked: true, fields: ['decisionCockpit', 'sourcingScenarios',
                                   'opportunityScore', 'landedCosts', 'profitability'],
          reason: 'Upgrade to see the full decision report' }
```

Paid callers get `locked: { isLocked: false, fields: [], reason: null }`.

Suppliers, price tiers and the idea itself stay visible on free tier — that is the
preview that motivates the upgrade.

> **CHECKPOINT 0** — before touching Android:
> 1. `curl` the endpoint with a **paid** account's token. Every field present.
> 2. `curl` with a **free** account's token. Confirm `decisionCockpit`,
>    `sourcingScenarios`, `opportunityScore`, `landedCosts`, `profitability` are
>    **absent from the JSON**, not `null`, not blurred. Grep the raw response body for
>    a known score value — it must not appear anywhere.
> 3. `curl` with account A's token for account B's ideaId → **404**.
> 4. Compare the paid response against `/dashboard/research/<projectId>/<ideaId>` in a
>    browser: opportunity score and landed cost identical.

---

## Phase 1 — Android data layer

### 1.1 [MODIFY] `data/Models.kt`

Add `@Serializable` models mirroring the Phase 0 response. Every numeric or boolean field
that can be absent must be **nullable** — a non-null Kotlin type with a default is how
`null` silently becomes `0` or `false`.

```
ResearchReport(idea, ideaDataSource, suppliers, opportunityScore, landedCosts,
               profitability, decisionCockpit, sourcingScenarios, locked)
LockedInfo(isLocked, fields, reason)
ProductIdea
ResearchReportRequest(id, requested_query, status, product_idea_id, served_from_cache,
                      last_error, promised_by, created_at, delivered_at, quality_report)
ResearchSupplier(..., city: String?, year_established: Int?,
                 extraction_confidence: Double?, data_source: String,
                 audit_report_available: Boolean?,   // nullable — rule 2
                 business_licence_available: Boolean?, export_history: Boolean?, …)
ResearchPriceTier(quantity: Int, unit_price: Double, currency: String)
OpportunityScore, LandedCostScenario, ProfitabilityScenario, DecisionCockpit,
SourcingScenario, QualityReport(warnings: List<String> = emptyList())
```

### 1.2 [MODIFY] `data/Backend.kt`

Add to `Repo`, reusing the existing `apiCall` / `pgList` helpers:

```kotlin
// Assembled server-side — the ONLY source for report values.
suspend fun researchReport(ideaId: String): Result<ResearchReport> =
    apiCall("GET", "/api/v1/research/report/$ideaId")

// Flat row reads under RLS are fine — these are rows, not computed reports.
suspend fun productIdeas(): Result<List<ProductIdea>> = pgList("product_ideas", …)
suspend fun researchRequests(tenantId: String): Result<List<ResearchReportRequest>> =
    pgList("research_report_requests",
           "tenant_id=eq.$tenantId&order=created_at.desc&limit=50")

// RPCs — POST /rest/v1/rpc/<name>
suspend fun researchCreditBalance(tenantId: String): Result<Int>      // p_tenant_id
suspend fun requestResearchReport(query: String): Result<String>      // p_query → request uuid
```

**`tenant_id` is already available** — `Repo.entitlements()` returns it
(`Entitlements.tenant_id`). Do not add a separate tenant lookup.

**Do not add a client-side balance check before calling `requestResearchReport`.** The
RPC does the balance check and the credit hold in one transaction; a pre-check lets two
screens both spend the last credit. Call it and handle its errors:

| RPC error contains | Show |
|---|---|
| `No research credits remaining` | out-of-credits state (§4.3) |
| `Query too short` | inline validation message |
| `No account found for this user` | "Finish setting up your account" |

> **CHECKPOINT 1**
> 1. `./gradlew assembleDebug` compiles.
> 2. Log the `researchReport` result for a known idea. Values match Checkpoint 0.
> 3. Log a supplier with a `null` evidence boolean — confirm it deserializes as
>    `null`, not `false`. If it is `false`, the model is non-nullable; fix it now.

---

## Phase 2 — Realtime

Requests are fulfilled by a background worker, so a queued request becomes ready with no
user action. Without realtime the merchant stares at "Queued" and assumes it's broken.

**Preferred: add `io.github.jan-tennert.supabase:realtime-kt`.** It implements the Phoenix
protocol, heartbeats, and reconnection already.

**If a hand-rolled OkHttp client is required instead**, it must implement all of:

- `phx_join` on `realtime:tenant:{tenantId}` with the JWT in the join payload
- **Heartbeat every 30s** on the `phoenix` topic — without it the server drops the socket
- **Reconnect with exponential backoff** (1s → 30s cap), rejoining channels on reconnect
- **Re-auth on token refresh.** `AuthClient.validToken()` refreshes tokens; the socket
  must send the new token or the server silently stops delivering. This is the most
  common failure: a socket that looks connected but went deaf.
- Close and rejoin on app foreground; disconnect on background

Subscribe to `research_report_requests` and `research_credit_ledger`, both filtered
`tenant_id=eq.{tenantId}`.

**Invalidate and refetch — never render the realtime payload.** The payload is a raw row;
report values must come back through the API so they pass the single business-logic layer.

> **CHECKPOINT 2**
> 1. Submit a request. Fulfil it server-side (run the worker). **Without touching the
>    app**, the row flips to "Ready" within ~2s.
> 2. **Token-refresh test:** leave the app open past token expiry (or force a refresh),
>    then fulfil another request. Confirm the update still arrives. If it does not, the
>    socket is not re-authing.
> 3. Kill Wi-Fi for 30s, restore. Confirm the socket reconnects and updates resume.

---

## Phase 3 — Navigation

### [MODIFY] `MainActivity.kt`

- Add `Tab("research", "Research", Icons.Filled.Search, Icons.Outlined.Search)` as the
  **first** tab and set `startDestination = "research"`.
- **Keep the existing Home tab.** `HomeScreen` shows today's stats, which merchants use
  daily; removing it is a regression. Five tabs is fine on Android. Order:
  Research · Home · Orders · Products · Settings.
- New routes: `research/request`, `research/{ideaId}`.

### [MODIFY] `AppViewModel.kt`

State + loaders for credit balance, product ideas, requests, and the active report,
following the existing patterns in that file.

---

## Phase 4 — Screens

### [NEW] `ui/screens/ResearchScreen.kt`
- Credit balance (from `researchCreditBalance`)
- "Request research" button → `research/request`
- Request list with status. **Use these labels:**

| status | label |
|---|---|
| `queued` | Queued · "Ready by {promised_by}" — show the real timestamp |
| `running` | Researching |
| `delivered` | Ready → tap opens report |
| `refunded` | "Credit returned" **+ the reason from `last_error`** |
| `failed` | Failed |

A refund is a feature, not an error — we return the credit when we cannot build a usable
report. A silent refund reads as a bug, so always show the reason.
- Product ideas list with verdict + score.

### [NEW] `ui/screens/RequestResearchScreen.kt`
- Text input, client-side length check (3–120 chars) **for UX only** — the RPC is the
  real gate.
- Calls `requestResearchReport`, maps errors per the table in 1.2.
- On success: "Queued. Ready within 6 hours — you keep the credit only if the report is
  usable."
- **Out-of-credits state (§4.3):** plain text — *"You're out of research credits. Add
  more from your account on launchgrid.in."* No button. No link. No in-app browser.

### [NEW] `ui/screens/ReportDetailScreen.kt`
- Verdict badge, opportunity score, readiness matrix, blockers, landed cost,
  profitability — **all rendered verbatim from the API**.
- **Suppliers** (not "verified suppliers" — we don't know that; the evidence booleans are
  `null`). Show name, city, MOQ, price tiers with their own currency symbol, and
  extraction confidence.
- Evidence booleans: `true` → "Yes", `false` → "No", **`null` → "Unknown"**.
- Surface `quality_report.warnings` visibly — e.g. *"Only 40% of listings clearly match
  your query"*. Supplier directories genuinely return loosely-related sellers and the
  merchant should know before ordering.
- If `locked.isLocked`, render an upgrade prompt using `locked.reason` in place of the
  missing sections. Do not fabricate placeholder numbers.

---

## Phase 5 — Documentation

Both docs currently state React Native + Expo, which is now wrong and will mislead the
next contributor.

- **[MODIFY] `MOBILE_ARCHITECTURE.md` §1** — record that native Kotlin + Jetpack Compose
  won, and why (an Android app already existed with auth, push, orders and products
  working). Note that the monorepo/`packages/shared` code-sharing rationale no longer
  applies, so shared constants must be kept in sync manually — which is exactly why the
  report endpoint exists.
- **[MODIFY] `docs/MOBILE_APP_BUILD_PROMPT.md`** — replace §2 (Expo stack) with the
  Kotlin stack; replace Expo-specific checkpoint items (`expo-secure-store` →
  `EncryptedSharedPreferences`, already used by `SessionStore.kt`).

---

## Verification

### Build
```
./gradlew assembleDebug
```

### Required tests — all six must pass and be reported with actual results

1. **Parity.** Open the same product on device and at
   `/dashboard/research/<projectId>/<ideaId>`. Opportunity score, landed cost and margin
   **identical to the paise**. A ±1 difference means something is being recomputed or
   re-rounded client-side — find it and remove it.
2. **Concurrency.** Get the account to exactly **1 credit**. Submit from two devices (or
   two rapid taps) simultaneously. **Exactly one succeeds**; the other shows "no credits
   remaining". If both succeed, a client-side balance check was added — delete it.
3. **Refund path.** Force a thin result (request something obscure). Row shows "Credit
   returned" **with the reason**, and the balance goes back up.
4. **Realtime.** Fulfil a request server-side; row flips to "Ready" within ~2s untouched.
   Repeat after a token refresh (Checkpoint 2.2).
5. **Currency.** With a non-INR price tier, confirm the correct symbol renders, never ₹.
6. **Validation + session.** A 2-character query is rejected with no credit consumed.
   Kill and reopen the app — still signed in. Corrupt the stored session — clean route to
   sign-in, no retry loop.

### Free-tier paywall
Sign in as a free-tier account, open a report, and **capture the raw HTTP response**.
Confirm the locked fields are absent from the body — not merely hidden in the UI.

### Data integrity spot-check
Pick three suppliers on screen and compare against the web dashboard: names, cities and
prices match, and any `null` evidence boolean shows "Unknown".

---

## Out of scope

Share-sheet product import, the products/orders redesign, and any purchase flow. Supplier
capture is **not possible on mobile** and must not be attempted via WebView — supplier
sites bot-block and it would get the user's own IP rate-limited.
