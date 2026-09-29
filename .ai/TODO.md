# TODO

From the 2026-09-30 audit. Every item names a real file and a verified gap.

## P0 — Critical

### Rotate every production credential exposed in git history
- **Location:** `deploy.ps1` (now remediated), git history from commit `fb0318d`
- **Problem:** Every production credential was hardcoded in `deploy.ps1`, tracked
  from the initial commit, in a **public** GitHub repository. The file has been
  fixed and the values moved to a git-ignored `.env.deploy.local`, but **git
  history still contains them and they were publicly readable.** Assume compromised.
- **Expected result:** All of the following rotated, and Vercel env vars updated:
  1. **Supabase** — `service_role` key, JWT secret, database password
     (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_PASSWORD`,
     and the three `POSTGRES_*_URL`s that embed it)
  2. **Razorpay** — `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`
  3. **Resend** — `RESEND_API_KEY`
  4. **`CRON_SECRET`** — regenerate
  5. **`ENCRYPTION_KEY`** — ⚠️ check what it encrypts *before* rotating; existing
     encrypted columns may become unreadable without a re-encryption step
- **Verification:** The app still works on Vercel with the new values; Supabase
  logs and Razorpay transactions reviewed for unauthorised access in the exposure
  window.
- **⚠️ This is not an agent task.** It requires console access and product
  judgement. Do not attempt it automatically.
- **Also consider:** making the repository private, and purging history with
  `git filter-repo` (note: rewrites every commit hash and breaks existing clones,
  and still does not undo the public exposure).

### Remove the hardcoded webhook-secret fallback
- **Location:** `src/app/api/webhooks/razorpay/route.ts`
- **Problem:**
  `const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_local_testing_secret'`
  If the env var is ever unset in production, the endpoint silently validates
  against a default string that is **publicly known** — this file is in a public
  repo. An attacker could forge `payment.captured` events and mark orders paid.
  `deploy.ps1` itself carries a note to replace this value in Vercel, which means
  it has at some point been the live value.
- **Expected result:** Throw at module load when `RAZORPAY_WEBHOOK_SECRET` is
  missing, so a misconfiguration fails loudly instead of accepting forged events.
  Keep the test secret in `.env.local` for development.
- **Verification:** With the var unset, the route errors rather than serving. With
  it set, a genuine Razorpay webhook still succeeds.

## P1 — High

### Make `npm test` run all the tests
- **Location:** `package.json` → `"test"`
- **Problem:** The glob is `tests/**/*.test.ts`, which matches only
  `tests/reconcile.test.ts`. **116 of 163 test cases never run** — seven suites
  under `src/lib/` covering the research and intelligence products.
- **Verified:** Running them explicitly gives **116 pass, 0 fail**, so the tests
  are healthy; only the wiring is wrong. Regressions in research or intelligence
  currently pass `npm test` unnoticed.
- **Expected result:** Extend the glob to cover `src/**/*.test.ts` as well, e.g.
  `--test "tests/**/*.test.ts" "src/**/*.test.ts"`.
- **Verification:** `npm test` reports **163 tests, 0 fail.**

### Add CI for the web application
- **Location:** new workflow beside `.github/workflows/android-ci.yml`
- **Problem:** The only workflow builds `launchgrid-android` and is path-filtered
  to that folder. Nothing checks the Next.js app — no lint, typecheck, test or
  build — on any push or PR, for a live production application.
- **Expected result:** A workflow running `npm ci`, `npm run lint`, `npm test`
  (after the fix above) and `npm run build` on push and PR. Note the build needs
  no secrets: it completed successfully in this audit from a clean install.
- **Verification:** The workflow goes green, and a deliberately broken type fails it.

### Use a constant-time comparison for the webhook signature
- **Location:** `src/app/api/webhooks/razorpay/route.ts`
- **Problem:** `expectedSignature !== signature` is not constant-time.
- **Expected result:** `crypto.timingSafeEqual` over equal-length buffers, with a
  length check first (`timingSafeEqual` throws on a length mismatch).
- **Verification:** Genuine webhooks still process; forged signatures still 400.

## P2 — Medium

### Resolve migration ordering and drift
- **Location:** `supabase/migrations/` (48 files), `MIGRATION_DRIFT_AUDIT.md`
- **Problem:** Migrations are applied by hand in the Supabase SQL editor and
  nothing verifies the live schema matches the folder. There are **two `0001_`
  migrations** (`0001_compliance_policies.sql` and `0001_onboarding_fields.sql`),
  so apply order is ambiguous. `MIGRATION_DRIFT_AUDIT.md` existing at all suggests
  drift has bitten before.
- **Expected result:** Adopt the Supabase CLI so migrations are applied and
  tracked reproducibly, or at minimum document the canonical order and add a
  schema-diff check.
- **Verification:** A fresh database built from `supabase/migrations/` matches
  production.

### Add tests for the API route handlers
- **Location:** `src/app/api/` — 58 route handlers
- **Problem:** All 163 tests cover `src/lib` pure logic. Not one of the 58 routes
  is tested, including checkout, order fulfilment and the payments webhook —
  the paths where a bug costs money.
- **Expected result:** Start with `webhooks/razorpay` (valid signature, invalid
  signature, missing signature, non-`payment.captured` event, the credit-pack
  branch, and idempotency on a duplicate event).
- **Verification:** `npm test` covers them.

### Finish the `readFeature()` migration
- **Location:** `src/lib/plans.ts` and its callers
- **Problem:** The file's own header says to migrate scattered `plan === 'pro'`
  checks to `readFeature()`. Both patterns coexist, so entitlement logic has two
  sources of truth in practice.
- **Expected result:** No raw `plan === '…'` comparisons outside `plans.ts`.
- **Verification:** `grep -rn "plan === '" src/` returns only `plans.ts`.

### Rename the package
- **Location:** `package.json` → `"name": "temp_app"`
- **Expected result:** `"launchgrid"`.

## P3 — Nice to Have

### Index the top-level documentation
- **Location:** 32 top-level `.md` files
- **Problem:** Product, GTM, design, audit and spec documents sit together with no
  index. Several are point-in-time and now historical, and a reader cannot tell
  which is current.
- **Expected result:** A `docs/README.md` index, with superseded audits moved to
  `docs/history/` or banner-marked.
- **Note:** `AGENTS.md` must stay where it is — `CLAUDE.md` is literally `@AGENTS.md`.

### Audit the sibling subprojects
- **Location:** `launchgrid-extension/`, `launchgrid-ads/`, `launchgrid-android/`
- **Problem:** Three subprojects live in this repository and were not audited in
  depth on 2026-09-30. `launchgrid-android` has its own CI; the other two have none.
- **Note:** `launchgrid-android/app/build.gradle.kts` and its
  `google-services.json` contain a Supabase anon key and a Google API key. Both are
  low-severity (they ship inside APKs by design), but the anon key should be
  re-checked after the Supabase rotation in P0.
