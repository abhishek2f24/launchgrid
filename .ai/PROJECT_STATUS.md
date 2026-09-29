# Project Status

**Last Updated:** 2026-09-30
**Current Phase:** Live in production on Vercel, actively developed
**Overall Status:** Builds and tests pass. **One critical security item is open**
— see Current Blockers.

**Branch:** `main`, clean and level with `origin/main` before this session, at
`578b903`.

## Completed Features

Verified by reading the implementation.

### Multi-tenant storefronts
- **Where:** `src/app/store/[slug]/` — shop, product, checkout, invoice, track,
  policies, sitemap.xml
- **Verified:** All routes present and rendered in the production build as dynamic
  routes.

### Checkout with OTP and coupons
- **Where:** `src/app/api/checkout/` — create-order, send-otp, verify-otp,
  validate-coupon; `src/actions/checkout.ts`
- **Verified:** Four distinct route handlers exist with real implementations.

### Razorpay payments and webhook
- **Where:** `src/app/api/webhooks/razorpay/route.ts`
- **Verified:** Reads the raw body, requires an `x-razorpay-signature` header
  (400 if missing), recomputes an HMAC-SHA256 and rejects a mismatch, then
  processes only `payment.captured`. It branches on
  `notes.purpose === 'research_credits'` *before* the order lookup, with a comment
  explaining why — a credit pack has no `orders` row. Solid, with two caveats in
  Known Bugs below.
- Commit `a17e905` "feat(orders): record the UPI reference that proves a payment"
  and migration `0045_order_payment_reference.sql` are the most recent work here.

### Order management
- **Where:** `src/app/(portal)/dashboard/orders/`, `src/app/api/orders/`
- **Verified:** fulfill, mark-paid, update-status and per-order status routes.

### Plan entitlements
- **Where:** `src/lib/plans.ts`, `src/app/api/v1/entitlements/route.ts`
- **Verified:** A typed `PlanFeatures` interface with four tiers, explicitly
  documented as the single source of truth, and served to web and mobile through
  the `v1` API.

### On-demand supplier research
- **Where:** `src/lib/research/` (engines, adapters, fetch, qualityGate,
  creditPacks, fulfilRequest), `src/app/api/research/*`,
  `src/app/(portal)/dashboard/research/`
- **Verified:** The most heavily tested area of the codebase. `qualityGate.ts`
  has 9 tests asserting real product guarantees — "fails an empty harvest rather
  than charging for it", "REFUSES a report whose suppliers sell something else",
  "fails hard when a currency is missing, never guessing one". `adapters` (8),
  `indiamartParser` (25) and `htmlFetcher` (8) are all tested. **All pass.**
- Backed by ~12 migrations (0027, 0032–0041) covering usage, provenance, batching,
  marketplace listings, credits, fair-use caps and an evidence store.

### Intelligence / investigations
- **Where:** `src/lib/intelligence/` — claim, investigation, recordEvidence, sources
- **Verified:** `claim.ts` (20 tests), `investigation.ts` (19 tests),
  `sources/googleTrends.ts` (27 tests). **All pass.** Migrations `0041_evidence_store.sql`
  and `0042_investigations.sql` back it.

### Settlement reconciliation
- **Where:** `src/lib/reconcile/`, `tests/reconcile.test.ts`,
  `(marketing)/tools/settlement-reconciliation`, `shopify-payout-reconciliation`
- **Verified:** **47 tests**, the largest single suite, covering comma-decimal
  European files, negative-stored fees, rounding tolerance, duplicate order IDs,
  blank padding rows and Shopify payout/adjustment rows. This is genuinely
  well-built. **All pass.**

### Background jobs
- **Where:** `src/inngest/functions.ts`
- **Verified:** Four functions — `provision-tenant-store`, `sync-dropship-catalog`,
  `handle-abandoned-cart`, `webhook-dispatch`.

### Cron
- **Where:** `src/app/api/cron/` — abandoned-carts, archive-trials, trial-emails

### Marketing site and SEO tooling
- **Where:** `src/app/(marketing)/`
- **Verified:** The build output confirms blog, FAQ, pricing, discover, join,
  support, three competitor comparisons, and **45+ calculator/tool pages**
  (7 bespoke + 41 generated via `generateStaticParams` from `src/data/tools.ts`).

### Mobile app legal pages
- **Where:** `src/app/apps/<slug>/` for 9 apps — adfree-applock, gst-sahayak,
  kinly, nyayai, whatsapp, medicine, periods, snapdue, water
- **Verified:** privacy-policy and delete-account routes. This is the web home for
  the sibling mobile projects, including Snapdue, SendLater and AppLock.

### Mobile / extension API
- **Where:** `src/app/api/v1/` — account, devices, entitlements, meta;
  `src/utils/supabase/bearer.ts`

### Sibling subprojects
`launchgrid-android` (has its own CI), `launchgrid-extension` (Chrome extension),
`launchgrid-ads` (Remotion video generation). Not audited in depth this session.

## Partially Completed

### Plan-check migration
`src/lib/plans.ts` states: "Migrate scattered `plan === 'pro'` checks to
readFeature() over time." Both patterns therefore coexist. Not broken — an
in-progress refactor.

### Test wiring
163 test cases exist and **all 163 pass**, but `npm test` only runs 47 of them.
See Known Bugs.

## Not Started

- **CI for the web application.** `.github/workflows/android-ci.yml` is the only
  workflow and is path-filtered to `launchgrid-android/**`. No lint, typecheck,
  test or build check runs on the Next.js app.
- **Automated database migrations.** Applied by hand in the Supabase SQL editor.
- **Tests for API route handlers.** All 163 tests cover `src/lib` pure logic;
  none of the 58 routes is tested.

## Known Bugs

### `npm test` silently skips 116 of 163 test cases
- **Where:** `package.json` → `"test": "node --import ./tests/resolve-ts.mjs --test \"tests/**/*.test.ts\""`
- **Confirmed by running both:** the glob matches only `tests/reconcile.test.ts`
  (47 cases). Seven suites under `src/` — 116 cases across research, intelligence,
  quality gate, adapters, parsers and fetchers — never run.
- **Verified they are healthy:** running them explicitly gives **116 pass, 0 fail.**
  So this is a configuration gap, not broken tests. It means regressions in the
  research and intelligence code would not be caught by `npm test`.

### Razorpay webhook falls back to a hardcoded secret
- **Where:** `src/app/api/webhooks/razorpay/route.ts`
  — `const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_local_testing_secret'`
- **Problem:** If the environment variable is ever unset in production, the
  endpoint keeps working and validates against a **publicly known** default —
  which now really is public, since this file is in a public repository. Anyone
  could forge a `payment.captured` event and mark orders paid. `deploy.ps1` even
  contains a reminder to "replace 'whsec_local_testing_secret' in Vercel env vars".
- **Fix:** Throw at startup when the variable is missing rather than defaulting.

### Webhook signature compared with `!==`
- **Where:** same file
- **Problem:** `expectedSignature !== signature` is not constant-time. The
  practical risk over a network is low, but `crypto.timingSafeEqual` is the
  correct primitive and costs nothing.

## Technical Debt

1. **`package.json` is still named `"temp_app"`.**
2. **Documentation sprawl** — 32 top-level Markdown files, several point-in-time
   audits, with no index saying which are current.
3. **Migration drift.** `MIGRATION_DRIFT_AUDIT.md` exists, and there are two
   `0001_` migrations (`compliance_policies` and `onboarding_fields`), so ordering
   is ambiguous. Nothing verifies the live schema matches the folder.
4. **Scattered `plan === 'pro'` checks**, per `plans.ts`'s own note.
5. **No route-handler tests** across 58 API routes.
6. **`node_modules` was absent** before this audit — a fresh clone needs
   `npm install` before anything works, including `AGENTS.md`'s instruction to
   read the Next.js docs in `node_modules/next/dist/docs/`.

## Deployment Status

**Live in production on Vercel** (project `launchgrid`, `launchgrid.in`).

Verified on 2026-09-30, from a clean state with no `node_modules`:

| Command | Result |
|---|---|
| `npm install` | **exit 0** |
| `npm run build` | **exit 0** — full production build, all routes compiled |
| `npm test` | **exit 0** — 47 tests, 0 fail |
| `node --import ./tests/resolve-ts.mjs --test "src/**/*.test.ts"` | **exit 0** — 116 tests, 0 fail |

The build output confirms static, SSG and dynamic routes across the marketing
site, portal, storefronts and API, plus middleware.

## Test Status

| Location | Suites | Cases | Result | Run by `npm test`? |
|---|---|---|---|---|
| `tests/reconcile.test.ts` | 6 | 47 | PASS | ✅ |
| `src/lib/intelligence/sources/googleTrends.test.ts` | — | 27 | PASS | ❌ |
| `src/lib/research/fetch/indiamartParser.test.ts` | — | 25 | PASS | ❌ |
| `src/lib/intelligence/claim.test.ts` | — | 20 | PASS | ❌ |
| `src/lib/intelligence/investigation.test.ts` | — | 19 | PASS | ❌ |
| `src/lib/research/qualityGate.test.ts` | — | 9 | PASS | ❌ |
| `src/lib/research/adapters/adapters.test.ts` | — | 8 | PASS | ❌ |
| `src/lib/research/fetch/htmlFetcher.test.ts` | — | 8 | PASS | ❌ |
| **Total** | **30** | **163** | **ALL PASS** | **47 of 163** |

## Current Blockers

### 🔴 Leaked production credentials await rotation

`deploy.ps1` contained every production credential hardcoded and was tracked from
the initial commit `fb0318d` in a **public** repository. An Android keystore was
tracked at `keystore/keystore`.

Remediated in this session: values moved to a git-ignored `.env.deploy.local`,
`deploy.ps1` rewritten to read from it, `keystore/` untracked, `.gitignore`
hardened.

**The exposure itself is not reversible.** The values remain in git history and
were publicly readable. **Rotation is required and is not something an agent
should do** — it needs access to the Supabase, Razorpay and Resend consoles, and
rotating `ENCRYPTION_KEY` may make existing encrypted columns unreadable.

This is P0 in `.ai/TODO.md`.
