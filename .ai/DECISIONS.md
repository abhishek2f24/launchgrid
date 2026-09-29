# Architecture Decisions

Evidenced from the code, its comments and the git history. Where a reason is not
recorded in the project, this file says so rather than inventing one.

## Decision: One Next.js App Router codebase for marketing, portal and storefronts

**Decision** — Three route groups — `(marketing)`, `(portal)` and `store/[slug]` —
in a single application, plus `api/v1` for mobile and extension clients.

**Reason** — Not documented. The effect is one deployment, one auth layer and one
set of shared components serving three audiences.

**Alternatives** — Separate apps per audience, which would mean duplicated auth,
components and deploys for a single-maintainer project.

**Consequences** — Low operational overhead, and `src/app` has grown to 176 files.
A change to shared components can affect all three audiences at once, which is
part of why the absence of CI for this app matters so much.

## Decision: Supabase as the whole backend

**Decision** — Postgres, auth and storage all from Supabase, with no separate
API service. Server work happens in route handlers, server actions and Inngest.

**Reason** — Not documented.

**Consequences** — No backend to operate, and RLS does the authorisation work
(actively maintained — see `0028_fix_public_demo_leak.sql`). The trade is that
`utils/supabase/service.ts` bypasses RLS entirely, so every use of it is a place
where authorisation must be enforced by hand.

## Decision: Razorpay for payments

**Decision** — Razorpay, with UPI support and a signature-verified webhook.

**Reason** — Not documented in a comment, but it follows from the market: the
product targets Indian SMBs, and migration `0029_upi_qr_and_fee_ledger.sql` plus
commit `a17e905` "record the UPI reference that proves a payment" show UPI is
central. Stripe does not serve this market the same way.

**Consequences** — Payments are India-specific. The webhook is the critical
integration point and is where two of the findings in `.ai/TODO.md` sit.

## Decision: Branch the webhook on purpose before the order lookup

**Decision** — `api/webhooks/razorpay` checks `notes.purpose === 'research_credits'`
before looking up an order.

**Reason** — Quoted from the file: "A different kind of purchase from a storefront
order, so it branches before the order lookup below (a credit pack has no `orders`
row to find)."

**Consequences** — Two payment products share one webhook cleanly. Worth
preserving if a third is added.

## Decision: A single typed source of truth for plan entitlements

**Decision** — `src/lib/plans.ts` declares `PlanTier` and `PlanFeatures` and is
marked "SINGLE SOURCE OF TRUTH for plan tiers and entitlements."

**Reason** — Stated in the file. It also records the intent: "Migrate scattered
`plan === 'pro'` checks to readFeature() over time."

**Consequences** — Web and mobile share one definition via `api/v1/entitlements`.
The migration is unfinished, so both patterns coexist today — P2 in `.ai/TODO.md`.
The file also documents that DB enum values are legacy names that no longer match
the public plan names, which is the kind of thing that silently causes bugs when
undocumented.

## Decision: Keep the legacy DB enum names

**Decision** — The database keeps `'free' | 'starter' | 'pro' | 'premium'` while
the public names are Free Starter / Get Online / Get Customers / Scale Revenue.

**Reason** — Stated in `plans.ts` as "(legacy naming)". The rename happened in
marketing, not in the schema.

**Consequences** — A permanent translation layer, but no risky data migration on a
live billing system. Correct call; just never remove the comment that explains it.

## Decision: Require a residential proxy for research fulfilment, and fail without one

**Decision** — `RESEARCH_PROXY_ENDPOINT` and `RESEARCH_PROXY_KEY` are required in
production, and fulfilment refuses to start without them.

**Reason** — Quoted at length from `.env.example`: "Supplier directories block
datacenter IPs (IndiaMART returns 429/shell, Alibaba a CAPTCHA), so server-side
fulfilment must egress via residential proxy. The endpoint is a template so the
vendor is swappable without code changes. Required in production — the app refuses
to start fulfilment without them rather than silently falling back to direct
fetches that deliver empty reports."

**Consequences** — A vendor dependency and a running cost, and a swappable one by
design. The refuse-rather-than-degrade stance is the same instinct as the quality
gate below, and it is the right one for something customers pay per-report for.

## Decision: A quality gate that refuses to charge for a bad report

**Decision** — `lib/research/qualityGate.ts` blocks delivery on empty harvests,
missing currencies, low-confidence extractions and irrelevant suppliers.

**Reason** — Not stated in a comment, but the test names state it plainly: "fails
an empty harvest rather than charging for it", "fails hard when a currency is
missing, never guessing one", "REFUSES a report whose suppliers sell something
else", "still delivers, with a warning, when relevance is partial".

**Consequences** — Some paid requests produce nothing, deliberately. This is the
strongest engineering decision in the repository: the guarantee is encoded in
tested code rather than in a support policy.

## Decision: Node's built-in test runner instead of Jest or Vitest

**Decision** — `node --test` with a custom TypeScript loader at
`tests/resolve-ts.mjs`.

**Reason** — **Reason not documented.** The effect is no test-framework dependency
and a very fast suite (163 cases in well under a second).

**Consequences** — Minimal tooling, but the glob must be maintained by hand — and
it currently misses 116 of 163 cases, which a conventional framework's default
discovery would have caught. P1 in `.ai/TODO.md`.

## Decision: Apply database migrations by hand

**Decision** — 48 SQL files in `supabase/migrations/`, applied in the Supabase SQL
editor. `deploy.ps1` even prints reminders naming specific files to run.

**Reason** — **Reason not documented.**

**Consequences** — Nothing guarantees the live schema matches the folder.
`MIGRATION_DRIFT_AUDIT.md` exists, which suggests this has already caused trouble,
and two migrations share the `0001_` prefix so ordering is ambiguous. P2 in
`.ai/TODO.md`.

## Decision: CI for the Android subproject only

**Decision** — `.github/workflows/android-ci.yml` is path-filtered to
`launchgrid-android/**`.

**Reason** — **Reason not documented.**

**Consequences** — The Android subproject gets a build check on every relevant
push; the production web application gets none. Given the build completes cleanly
from a fresh install with no secrets, there is no technical obstacle to adding it.
P1 in `.ai/TODO.md`.

## Decision: `CLAUDE.md` delegates entirely to `AGENTS.md`

**Decision** — `CLAUDE.md` contains exactly one line: `@AGENTS.md`.

**Reason** — Not stated, but the intent is clear: one set of agent instructions
for every tool, rather than per-vendor copies that drift.

**Consequences** — `AGENTS.md` is the real file. Its content is a warning that
this Next.js version differs from training data and that
`node_modules/next/dist/docs/` should be read first — which also means **a fresh
clone must run `npm install` before an agent can follow its own instructions.**

## Decision: Hardcode credentials in `deploy.ps1` (REVERSED 2026-09-30)

**Decision (original)** — `deploy.ps1` carried every production credential as a
literal and was committed.

**Reason** — **Reason not documented.** Presumably convenience: one script that
configures a whole Vercel project.

**Consequences** — Every production secret was publicly readable in a public
repository from the initial commit `fb0318d` onward.

**Decision (current, 2026-09-30)** — Values moved to a git-ignored
`.env.deploy.local`; `deploy.ps1` reads them and exits with a clear error if the
file is missing; `.env.deploy.local.example` is committed as a template;
`keystore/` untracked; `.gitignore` hardened.

**Consequences** — The script still works, and no secret is tracked. **The
historical exposure is not undone** — rotation is P0 in `.ai/TODO.md`.
