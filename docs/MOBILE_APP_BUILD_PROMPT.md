# Build the LaunchGrid Mobile App

> Paste everything below into a fresh AI coding session. It is self-contained: what to
> build, the exact contracts, the rules that must not be broken, and a validation
> checkpoint after every phase so you can prove it works instead of hoping.

---

## 0. Read this first — how to work

You are building the **LaunchGrid mobile app** (iOS + Android). LaunchGrid is an Indian
e-commerce platform whose **primary feature is product research**: telling a merchant
whether a product is worth selling, backed by real supplier evidence.

**Rules for how you work:**

1. **Do not invent product or architecture decisions.** The stack is already decided
   (§2) and the API already exists (§4). If something genuinely is not specified, pick
   the simplest option and leave a one-line comment saying you chose it and why.
2. **Stop at every CHECKPOINT.** Run the stated checks and report actual output. Do not
   start the next phase until the current one passes. "Should work" is not a result.
3. **The app displays numbers, it never computes them.** §5 explains why this is the
   most important rule in the codebase.
4. **Read `MOBILE_ARCHITECTURE.md` in the repo root.** It is the authority on stack,
   realtime, offline, and monetization. This document tells you *what to build*; that
   one tells you *how the system fits together*. If they ever disagree, that file wins.
5. If you cannot verify something, say so explicitly rather than claiming it works.

---

## 1. What the app is for

The merchant should be able to run almost their entire business from their phone.

| Priority | Job | Notes |
|---|---|---|
| 1 | **Browse and read research reports** | The core value. Must feel fast and native. |
| 2 | **Request research for any product** | Costs 1 credit. Server-fulfilled, so this works perfectly on mobile. |
| 3 | **Import a product via the share sheet** | Share an Amazon/Flipkart link from any app → it lands in their catalogue. |
| 4 | **Manage store: products, orders** | CRUD + order status. |
| 5 | **View plan, credits, storefront settings** | Read-mostly — see §3. |

### What the app deliberately does NOT do

- **It does not capture supplier listings.** That requires executing JavaScript inside a
  logged-in desktop browser session on the supplier's own origin. It is not possible on
  mobile and you must not attempt a WebView workaround — supplier sites bot-block, and
  a WebView scraper will get the user's IP rate-limited. Capture stays on desktop.
- **It does not sell anything.** See §3. This is a hard store-compliance constraint, not
  a preference.

---

## 2. Stack — already decided, do not re-litigate

From `MOBILE_ARCHITECTURE.md` §1:

- **Kotlin 2.1 & Jetpack Compose (Material 3)** — single-activity architecture, Navigation Compose
- **OkHttp & kotlinx.serialization** — standard REST client and serialization
- **OkHttp WebSockets** — lightweight, performant Supabase Realtime synchronization client
- **EncryptedSharedPreferences (Keystore-backed)** — hardware-encrypted auth token storage
- **Firebase Cloud Messaging (FCM)** — native high-priority order alert integration

Layout:
```
launchgrid/
├── launchgrid-android/  ← Android native companion app
├── src/                 ← existing Next.js app backend/frontend
└── docs/                ← project specs
```

**All writes go through the Next.js API routes.** The mobile app never writes to Postgres
directly, even though `supabase-js` would let it. The API routes are the single
business-logic layer; bypassing them is how web and mobile drift apart and how the data
integrity rules in §5 get violated.

---

## 3. ⚠️ The monetization constraint — read before building any purchase UI

LaunchGrid bills via **Razorpay in INR**. Apple and Google require **In-App Purchase**
for digital goods unlocked inside an app, at 15–30% commission, and IAP cannot use
Razorpay.

**Research credits are exactly this kind of digital good.** A credit is consumed in-app
to unlock a report. If you put a "Buy credits" button that opens Razorpay inside the app,
**the app will be rejected**, and repeated attempts risk the developer account.

**v1 is the companion-app model** (what Netflix, Spotify, and Shopify do):

- The app **displays** the credit balance and plan, read-only.
- When the merchant has no credits, show: *"You're out of research credits. Add more from
  your account on launchgrid.in."*
- **Do not** deep-link to a Razorpay checkout. **Do not** open an in-app browser to the
  purchase page. On iOS especially, do not include any button, link, or call to action
  that steers the user to an external purchase — that is what the guideline prohibits.
- A plain "Manage your account at launchgrid.in" text line is the safe pattern.

Credits bought on web appear in the app within ~1s via the Realtime subscription in §6.
That is the whole experience: purchase on web, use everywhere.

IAP via RevenueCat is a possible v2. Do not architect for it now.

---

## 4. API contracts

These endpoints exist. **Do not change them and do not invent new ones.** Where a `/v1`
endpoint does not exist yet, use the current path and note it.

### Auth
Supabase Auth via `supabase-js`. Store the session in `expo-secure-store`, never in
plain `AsyncStorage`. Send:
```
Authorization: Bearer <access_token>
```
Handle refresh with the Supabase client's built-in refresh. On a hard `401`, route to
sign-in — never retry in a loop.

### Research

`GET /api/research/my-ideas` → the merchant's product ideas
```json
{ "ideas": [ { "id": "uuid", "name": "10000mAh Slim Power Bank" } ] }
```

**Credit balance** — RPC, account-scoped (credits belong to the tenant, not the user):
```ts
supabase.rpc('research_credit_balance', { p_tenant_id: tenantId })  // → integer
```

**Request a report** — RPC. This does the balance check and the credit hold in one
transaction:
```ts
supabase.rpc('request_research_report', { p_query: 'Bamboo cutlery travel set' })
// → request uuid, or throws:
//   'No research credits remaining' | 'Query too short' | 'No account found for this user'
```
**Never** check the balance yourself and then call this. That pattern lets two screens
both spend the last credit. Let the RPC be the only gate and handle its error.

**Request history** — read directly via RLS (SELECT is permitted; INSERT is not):
```ts
supabase.from('research_report_requests')
  .select('id, requested_query, status, product_idea_id, served_from_cache, last_error, promised_by, created_at, delivered_at, quality_report')
  .order('created_at', { ascending: false })
```

`status` is one of: `queued` · `running` · `delivered` · `failed` · `refunded`.

### Products
- `POST /api/products/add` — `{ url }` imports from a marketplace product page
- `GET /api/products` — list

### Orders
- `GET /api/orders`, order status updates via the existing routes

---

## 5. THE DATA INTEGRITY RULES — non-negotiable

This project previously shipped 505 supplier records that falsely asserted "no factory
audit available", and separately showed a "LAUNCH READY" verdict on a product with a
−2381% margin. Both came from code that computed or defaulted values it had no right to.
Cleaning up took days and destroyed trust in every number on screen.

### 5.1 The app displays numbers; it never computes them
Opportunity score, landed cost, margin, verdict, confidence — all of it arrives from the
API already calculated. **Do not** recompute, re-round, re-derive, or "fix up" any of it
on the client.

If the API returns `landed_cost: 1247.50`, show ₹1,247.50. Do not round to ₹1,248 because
it looks tidier. A merchant comparing the app against the web dashboard must see
identical figures, and a number that differs by ₹0.50 between surfaces reads as a bug in
the whole product.

### 5.2 Never fill in a missing value
`null` means **unknown**, and unknown must render as unknown — "Not available", an em
dash, a greyed row. Never show `0`, `—0%`, "None", or a plausible-looking default for a
null.

This matters most for the 13 supplier evidence booleans (`audit_report_available`,
`business_licence_available`, `export_history`, …). `null` = "we don't know".
`false` = "we checked and it is absent". **These are different claims and the UI must
distinguish them.** Render `null` as "Unknown" or "Not verified", never as "No".

### 5.3 Never display a currency you inferred
Every price arrives with an explicit `currency`. Render what you are given. Do not assume
INR because the app is Indian — supplier prices can be USD or CNY, and a USD figure shown
with a ₹ sign understates cost by ~83×.

### 5.4 Show quality warnings, do not hide them
`quality_report.warnings` on a delivered request contains things like *"Only 40% of
listings clearly match your query"*. Surface these on the report. They exist because
supplier directories genuinely return loosely-related sellers, and the merchant deserves
to know before placing an order.

### 5.5 Never write research data from the app
The app has no path that writes suppliers, price tiers, or credits. RLS enforces this
(there is deliberately no INSERT policy on `research_credit_ledger` or
`research_report_requests`). If you find yourself needing one, you have misread the
design — the RPC in §4 is the only write path.

---

## 6. Realtime — notify, then refetch

From `MOBILE_ARCHITECTURE.md` §3. One channel per tenant:

```ts
supabase.channel(`tenant:${tenantId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'research_report_requests',
       filter: `tenant_id=eq.${tenantId}` },
      () => queryClient.invalidateQueries({ queryKey: ['research-requests'] }))
  .on('postgres_changes', { event: '*', schema: 'public', table: 'research_credit_ledger',
       filter: `tenant_id=eq.${tenantId}` },
      () => queryClient.invalidateQueries({ queryKey: ['credits'] }))
  .on('postgres_changes', { ...orders... },
      () => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  .subscribe()
```

**Invalidate only — never render the realtime payload directly.** The refetch goes
through the API so everything the UI shows has passed the single business-logic layer.
This one decision eliminates an entire class of web/mobile drift bugs.

---

## 7. Build phases

### Phase 1 — Shell, auth, navigation

Kotlin Activity and Composables structure:
```
MainActivity.kt         ← Main host scaffold and Navigation graph
ui/screens/
  LoginScreen.kt        ← Auth sign-in screen
  ResearchScreen.kt     ← Research List tab (home tab)
  ProductsScreen.kt
  OrdersScreen.kt
  SettingsScreen.kt     ← Account settings tab
  ReportDetailScreen.kt    ← Report details
  RequestResearchScreen.kt ← Request research screen
```

**Research is the first tab and the default route.** It is the primary feature; do not
put a generic dashboard in front of it.

> **CHECKPOINT 1**
> 1. App builds and runs on an Android emulator or device.
> 2. Sign in with a real account. Kill the app, reopen → **still signed in** (session
>    persisted to `SessionStore` using Keystore-backed `EncryptedSharedPreferences`).
> 3. Airplane mode → app opens to a cached/offline state, not a white screen or crash.
> 4. Confirm the token is in `SessionStore` (encapsulated hardware storage).
> 5. Deliberately corrupt the stored session → app routes to sign-in cleanly, no loop.

---

### Phase 2 — Research: list and report detail

The list shows the merchant's ideas with verdict and score. The detail screen shows the
full decision report: verdict, opportunity score, readiness matrix, blockers, suppliers,
price tiers, landed cost, profitability.

> **CHECKPOINT 2 — the parity gate**
> Open the **same product** on mobile and at `/dashboard/research/<id>` on web, side by
> side. Then:
> 1. Opportunity score: **identical number**, not ±1.
> 2. Landed cost and margin: **identical to the paise**.
> 3. Supplier count matches; supplier names and cities match.
> 4. Find a supplier with a `null` evidence boolean. Mobile must show **"Unknown"** or
>    equivalent — **not "No"**. If it shows "No", you have violated §5.2; fix it now.
> 5. Find a product with a non-INR price tier (or temporarily set one). Confirm the
>    correct symbol renders, not ₹.
> 6. Any `quality_report.warnings` present are visible on screen (§5.4).
>
> If any number differs, do not proceed. A parity bug here undermines every screen.

---

### Phase 3 — On-demand research requests

Screen: credit balance, a text input, submit, and the request history list.

Status labels — use plain, honest language:

| status | label |
|---|---|
| `queued` | Queued · *"Ready by {promised_by}"* |
| `running` | Researching |
| `delivered` | Ready → tap to open report |
| `refunded` | Credit returned + the reason from `last_error` |
| `failed` | Failed |

**Do not promise instant results.** Fulfilment scrapes real supplier sites and takes
time; `promised_by` is a real timestamp on the row (default +6 hours). Show it.

**A refund is a feature, not an error.** If we could not build a usable report the credit
goes back automatically. Say so plainly — a silent refund reads as a bug.

When balance is 0: show the §3 message. **No purchase button.**

> **CHECKPOINT 3**
> 1. With credits available, submit a request. Balance decrements by exactly 1 and the
>    row appears as "Queued" with a real "Ready by" time.
> 2. **Concurrency:** get the account to exactly 1 credit. Submit from two devices (or
>    two rapid taps) at once. **Exactly one** must succeed; the other shows "no credits
>    remaining". If both succeed you have added a client-side balance check — remove it
>    and rely on the RPC (§4).
> 3. Run the fulfilment worker so a request is delivered. **Without touching the app**,
>    confirm the row flips to "Ready" within ~2s via Realtime (§6).
> 4. Force a refund case (request something that yields too few suppliers). Confirm the
>    row shows "Credit returned" **with the reason**, and the balance goes back up.
> 5. Set balance to 0. Confirm the out-of-credits message appears and there is **no**
>    purchase button, no Razorpay link, and no in-app browser to a purchase page (§3).
> 6. Submit a 2-character query → rejected with a clear message, no credit consumed.

---

### Phase 4 — Share-sheet product import

Register the app as a share target for URLs (`expo-share-intent` or a config plugin).
Sharing an Amazon/Flipkart/Meesho link from any app opens LaunchGrid with the URL
prefilled, then POSTs to `/api/products/add`.

**This is the mobile replacement for the desktop extension's import feature** — the main
reason a merchant can now work entirely from a phone.

> **CHECKPOINT 4**
> 1. From the Amazon app, share a product → LaunchGrid receives it → product appears in
>    the catalogue. Repeat for Flipkart and Meesho. Report all three.
> 2. Verify **title, price, and image** are correct against the source page. **Test a
>    discounted product** — price extraction breaks there most often.
> 3. Share a non-product URL (a news article). Expect a clear error, not a crash and not
>    a garbage product.
> 4. Share while signed out → app prompts sign-in, then completes the import.

---

### Phase 5 — Products, orders, account

Standard CRUD. Orders list with status updates. Account tab shows plan and credits
read-only per §3.

> **CHECKPOINT 5**
> 1. Create, edit, delete a product on mobile → verify each on web.
> 2. Change an order's status on web → mobile updates within ~2s without a manual pull
>    (Realtime).
> 3. Go offline, edit a product, come back online → the change syncs or fails visibly.
>    **It must not silently vanish.**
> 4. Account tab shows the same plan tier as web, and the same credit balance.

---

## 8. Final acceptance

- [ ] Builds and runs on Android emulator or device
- [ ] Session survives app restart; stored in Keystore-backed `SessionStore`
- [ ] **Every research number matches web exactly** — score, landed cost, margin, supplier count
- [ ] **`null` evidence booleans render as "Unknown", never "No"** (§5.2)
- [ ] Currency symbol always matches the `currency` field; never assumed (§5.3)
- [ ] Quality warnings visible on delivered reports (§5.4)
- [ ] Concurrent requests on 1 credit → exactly one succeeds
- [ ] Refunds show the reason and restore the balance
- [ ] **No purchase UI, no Razorpay, no external purchase link anywhere in the app** (§3)
- [ ] Realtime: web changes appear on mobile in ~2s without manual refresh
- [ ] Share-sheet import verified on Amazon, Flipkart, Meesho, including a discounted item
- [ ] No direct Postgres writes — all mutations go through API routes or the sanctioned RPC
- [ ] No WebView scraping of supplier sites (§1)
- [ ] Offline: opens to cached state; queued edits sync or fail visibly

---

## 9. If you get stuck

- **`my-ideas` returns `[]` but ideas exist** → the token is validated but not attached.
  `supabase.auth.getUser(token)` validates without attaching it; subsequent queries then
  run as `anon` and RLS returns **zero rows with no error**. Attach the token to the
  client, do not just validate it.
- **`request_research_report` throws "No account found for this user"** → the user has no
  `tenants` row. Credits are account-scoped; onboarding must create the tenant first.
- **Balance looks stale after buying on web** → the Realtime subscription is not filtered
  on the right `tenant_id`, or you are rendering the payload instead of invalidating (§6).
- **Numbers differ from web by a small amount** → you are formatting with a different
  rounding mode, or recomputing client-side. See §5.1. Find it and remove it.
- **App rejected by Apple** → almost certainly §3. Remove every purchase affordance,
  including links and buttons that steer to the web purchase page.
