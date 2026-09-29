# AI Handoff

**Last AI:** Claude (Opus 5)
**Last Updated:** 2026-09-30

> This file is the communication layer between AI agents. **Any agent doing work
> on this repository must update it before finishing.**

## 🔴 Read this first

A **production credential exposure** was found in this repository on 2026-09-30.
`deploy.ps1` contained every production secret as a hardcoded literal and had
been tracked since the initial commit `fb0318d`, in a **public** GitHub
repository. An Android keystore was tracked at `keystore/keystore`.

The code has been remediated (see below). **The exposure has not been undone** —
the values are still in git history and were publicly readable. **Rotation is
required and is a human task**, not an agent one. It is P0 in `.ai/TODO.md`.

If rotation has since been completed, update this section to say so.

## Current Project State

LaunchGrid is a **live production** commerce platform for Indian SMBs on Next.js
16 / React 19, deployed on Vercel at `launchgrid.in`, backed by Supabase with 48
migrations. 176 files under `src/app`, 58 API routes, 72 library modules, 86
components, and three sibling subprojects (Android, Chrome extension, Remotion ads).

It builds cleanly and **all 163 test cases pass** — but `npm test` only runs 47
of them.

**Branch:** `main`, previously clean and level with `origin/main` at `578b903`.

## What Was Already Built

All of it. This session built no features. See `.ai/PROJECT_STATUS.md` for the
verified list; headline areas: multi-tenant storefronts, OTP checkout with
coupons, Razorpay payments and webhook, order management, a four-tier plan and
entitlement system, an on-demand supplier research product with a commercial
quality gate, an intelligence/investigation subsystem, settlement reconciliation
tooling, 4 Inngest background jobs, 3 cron routes, a marketing site with 45+
calculator pages, legal pages for 9 mobile apps, and a `v1` API for mobile and
extension clients.

## What I Verified

Read directly, not assumed:

- `src/app/api/webhooks/razorpay/route.ts` — signature handling end to end, and
  the `research_credits` branch with its explanatory comment
- `src/lib/plans.ts` — the four tiers, the legacy-vs-public naming note, and the
  stated `readFeature()` migration intent
- `src/inngest/functions.ts` — confirmed the four function ids
- `src/utils/supabase/` — client, server, service (RLS-bypassing), middleware,
  bearer, queries
- `supabase/migrations/` — counted **48**; noted two share the `0001_` prefix
- `.github/workflows/android-ci.yml` — confirmed it is path-filtered to
  `launchgrid-android/**` and **does not cover the web app**
- `CLAUDE.md` → `@AGENTS.md`, and the Next.js-16 warning it contains
- `.env.example` — the research-proxy rationale
- Counted `@Test`-equivalent cases across all 8 test files: **163**

**Ran, from a clean state with no `node_modules`:**

| Command | Result |
|---|---|
| `npm install` | **exit 0** |
| `npm run build` | **exit 0** — full production build |
| `npm test` | **exit 0** — 47 tests, 0 fail |
| `node --import ./tests/resolve-ts.mjs --test "src/**/*.test.ts"` | **exit 0** — 116 tests, 0 fail |

**Secret scan** across all tracked files for live-key patterns — this is how the
`deploy.ps1` exposure was found. Also confirmed `.env.local` is **not** tracked,
and that `supabase/migrations/0004_add_rzp_secret.sql` is only an
`ALTER TABLE … ADD COLUMN` with no literal value in it.

**Repository visibility:** confirmed **public** (unauthenticated GitHub API
returns 200).

## What I Changed During This Session

Security remediation plus documentation. **No application code, route, component,
migration or build config was modified.**

1. **`deploy.ps1`** — the 23 hardcoded credential literals were moved to a
   git-ignored `.env.deploy.local` (so deploys keep working) and replaced with
   `(Get-Secret "NAME")` calls. Added a loader that reads that file and exits with
   a clear message if it is missing or a value is blank.
2. **`.env.deploy.local.example`** — new, key names only, committed as a template.
3. **`keystore/`** — untracked with `git rm --cached`. The files remain on disk.
4. **`.gitignore`** — added `.env.deploy.local`, `*.local`, `keystore/`, `*.jks`,
   `*.keystore`, with `!.env.deploy.local.example`. Verified no already-tracked
   file became ignored.
5. **`.ai/`** and this handoff — new documentation.

`node_modules/` was installed locally during the audit. It is git-ignored.

## Files Changed

Modified: `deploy.ps1`, `.gitignore`
Created: `.env.deploy.local.example`, `.ai/CONTEXT.md`, `.ai/PROJECT_STATUS.md`,
`.ai/TODO.md`, `.ai/AI_HANDOFF.md`, `.ai/ARCHITECTURE.md`, `.ai/DECISIONS.md`
Removed from git tracking (still on disk): `keystore/keystore`
Created but git-ignored: `.env.deploy.local`

**Not touched:** `CLAUDE.md`, `AGENTS.md`, and all 30 other top-level Markdown
files. `CLAUDE.md` was deliberately left as `@AGENTS.md` — see Important Warnings.

## Tests Run

```
npm test                                                        →  47 pass, 0 fail
node --import ./tests/resolve-ts.mjs --test "src/**/*.test.ts"  → 116 pass, 0 fail
```

**163 test cases, all passing.** `npm test` alone reports only 47 — see Known
Problems.

## Build Status

**PASS.** `npm run build` exited 0 from a clean `npm install`, compiling static,
SSG and dynamic routes across the marketing site, portal, storefronts and API,
plus middleware. **No secrets were needed to build.**

## Deployment Status

**Live in production on Vercel** — project `launchgrid`, `launchgrid.in`.
Database migrations are applied **by hand** in the Supabase SQL editor.

## Known Problems

1. **🔴 Leaked credentials await rotation.** See the top of this file.
2. **The Razorpay webhook falls back to a hardcoded secret**
   (`'whsec_local_testing_secret'`) when the env var is unset. That string is
   public, so a misconfiguration would let anyone forge `payment.captured` events
   and mark orders paid.
3. **`npm test` runs 47 of 163 cases.** The glob misses seven suites under
   `src/`. Verified healthy — 116 pass when run explicitly — so it is a wiring
   gap, but regressions in research and intelligence go unnoticed.
4. **No CI for the web app.** The only workflow builds the Android subproject.
5. **Webhook signatures compared with `!==`** rather than `crypto.timingSafeEqual`.
6. **Migration drift risk.** Applied by hand, two migrations share `0001_`, and
   `MIGRATION_DRIFT_AUDIT.md` suggests this has bitten before.
7. **No tests for any of the 58 API routes.**
8. **`package.json` is still named `"temp_app"`.**

## Recommended Next Steps

In priority order — detail in `.ai/TODO.md`:

1. **Rotate every exposed credential** (P0) — human task, console access needed.
   ⚠️ Check what `ENCRYPTION_KEY` protects before rotating it.
2. **Remove the webhook-secret fallback** so a missing env var fails loudly (P0).
3. **Fix the `npm test` glob** to cover `src/**/*.test.ts` (P1). One line, and it
   triples real coverage.
4. **Add CI for the web app** — lint, typecheck, test, build (P1). The build needs
   no secrets, so nothing blocks this.
5. Use `crypto.timingSafeEqual` for the signature comparison (P1).

## Important Warnings

Things a future agent must **not** accidentally break:

- **This is a live production application handling real payments.** Changes to
  `api/checkout`, `api/orders` or `api/webhooks/razorpay` move money.
- **Read `AGENTS.md` before writing any code.** Next.js 16 differs from most
  training data; it instructs reading `node_modules/next/dist/docs/` first. That
  requires `npm install` — a fresh clone has no `node_modules`.
- **Do not replace `CLAUDE.md`.** It is deliberately just `@AGENTS.md` so one set
  of agent instructions serves every tool. Edit `AGENTS.md` instead.
- **Never hardcode a credential in a tracked file.** This repository has already
  been burned by exactly that.
- **`src/utils/supabase/service.ts` bypasses RLS.** Server-side only — never in a
  client component, and never in a route reachable without authorisation.
- **`src/lib/plans.ts` is the source of truth for entitlements.** Do not add new
  `plan === 'pro'` checks; use `readFeature()`.
- **The DB plan enum names are legacy and differ from the public names.** Keep the
  comment that explains it.
- **Do not weaken `lib/research/qualityGate.ts`.** It deliberately refuses to
  charge for a bad report; its tests encode the commercial guarantee.
- **The research proxy is required in production by design.** The app refuses to
  start fulfilment without it rather than delivering empty reports. Do not add a
  direct-fetch fallback.
- **Any schema change needs a numbered migration** in `supabase/migrations/`, and
  someone must apply it by hand — nothing does it automatically.
- **`.env.local`, `.env.deploy.local`, `keystore/` are git-ignored.** Keep them so.

## Suggested First Action For Next AI

**Fix the `npm test` glob in `package.json`** so it also matches
`src/**/*.test.ts`. It is a one-line change, all 116 currently-skipped tests
already pass so nothing breaks, and it immediately makes the research and
intelligence subsystems — the product's most valuable and most-tested code —
actually protected by the test command. It is also the prerequisite for the CI
workflow in P1 being worth anything.

The credential rotation is more urgent, but it is a human task requiring console
access, not an agent one.
