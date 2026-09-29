# Project Context

Verified against the source on 2026-09-30. If this contradicts the code, the code
wins — fix this file.

> **This repository already has extensive documentation** — 32 top-level Markdown
> files covering product, GTM, design, audits and specs. This `.ai/` set does not
> duplicate them; it records the *verified engineering state* and points at the rest.

## Project Name

**LaunchGrid** (`launchgrid.in`). Note `package.json` still says `"name": "temp_app"`.

## Project Purpose

A commerce platform for Indian small businesses: hosted storefronts, order and
payment handling, customer marketing, and an on-demand supplier/market **research**
product. It also serves as the web home for a family of mobile apps.

## Target Users

Indian SMBs and D2C sellers. The marketing site positions against Shopify, Dukaan
and Bikayi (`(marketing)/vs-shopify`, `/vs-dukaan`, `/vs-bikayi`).

## Business Goal

Subscription SaaS with four tiers plus paid research credit packs.

`src/lib/plans.ts` is marked **"SINGLE SOURCE OF TRUTH for plan tiers and
entitlements"**:

| DB enum (legacy) | Public name |
|---|---|
| `free` | Free Starter |
| `starter` | Get Online |
| `pro` | Get Customers |
| `premium` | Scale Revenue |

Entitlements include `max_products`, `max_stores`, `custom_domain`,
`included_custom_domains`, `whatsapp_recovery`, `email_recovery`, `razorpay_byok`.
Free tier: basic store, 3-product cap, "Made with LaunchGrid" badge.

## Tech Stack

- **Next.js 16.2.7** (App Router), **React 19.2.4**, TypeScript
- **Tailwind CSS v4** + shadcn + `@base-ui/react`, `framer-motion`, `lucide-react`
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) — Postgres, auth, storage
- **Inngest** — background jobs
- **Resend** — transactional email
- **Razorpay** — payments (India)
- **Sentry** (`@sentry/nextjs`) — error tracking
- **Google Gemini** (`@google/genai`) — generative features
- **jose** — JWT
- **Vercel** — hosting (project `launchgrid`, id in `.vercel/project.json`)
- Tests: **Node's built-in test runner**, no Jest/Vitest, with a custom TS loader
  at `tests/resolve-ts.mjs`

## Repository Structure

This is effectively a monorepo. The Next.js app is the root; several sibling
projects live alongside it.

```
src/
  app/          176 files — App Router
    (marketing)/  public site: blog, tools, comparisons, pricing, onboarding
    (portal)/     dashboard: orders, products, customers, research, ads,
                  marketing, coupons, seo, settings, investigate, extension
    api/          58 route handlers
    apps/         legal pages for 9 mobile apps
    store/[slug]/ tenant storefronts
  components/   86 files
  lib/          72 files — plans, emails, webhooks, seo, research, intelligence,
                calculators, generators, documents, codes, images, supabase
  actions/      7 server-action modules
  inngest/      client + 4 functions
  data/         apps, tools, roadmap, landing
  utils/        supabase helpers (client, server, service, middleware, bearer)
supabase/migrations/   48 SQL migrations
tests/                 reconcile.test.ts + resolve-ts.mjs loader
launchgrid-android/    separate Android app (has its own CI)
launchgrid-extension/  Chrome extension
launchgrid-ads/        Remotion-based ad generation
design-system/ docs/ marketing/ ads/ scripts/ public/
```

## Core Features

See `.ai/PROJECT_STATUS.md` for verified status.

## APIs

58 route handlers under `src/app/api/`. Groups:

| Group | Purpose |
|---|---|
| `checkout/` | create-order, send-otp, verify-otp, validate-coupon |
| `orders/` | fulfill, mark-paid, update-status, `[orderId]/status` |
| `webhooks/razorpay` | payment capture → orders and research credit packs |
| `research/` | ingest-supplier, my-ideas, public-search, public-categories, report, worker |
| `marketing/` | broadcast, social-post, stats |
| `cron/` | abandoned-carts, archive-trials, trial-emails |
| `v1/` | account, devices, entitlements, meta — the **mobile/extension API** |
| `apps/<slug>/` | privacy-policy and delete-account pages for 9 mobile apps |
| others | ads/generate, coach/insights, products, referrals, settings, setup, support, track, shopping/feed, stats, early-access, extension/whoami, inngest |

## Database

**Supabase Postgres**, with **48 migrations** in `supabase/migrations/`, from
`0000_initial_schema.sql` to `0045_order_payment_reference.sql`. Multi-tenant —
`tenant_id` appears throughout.

Migrations are applied **by hand in the Supabase SQL editor**; there is no
automated migration step in CI or deploy. `MIGRATION_DRIFT_AUDIT.md` exists,
which suggests drift has been a real problem.

## Authentication

**Supabase Auth**. Helpers in `src/utils/supabase/`:
- `client.ts` / `server.ts` — SSR-aware clients
- `service.ts` — service-role client (bypasses RLS; server-only)
- `middleware.ts` — session refresh
- `bearer.ts` — bearer-token auth for the mobile/extension `v1` API
- `queries.ts`

RLS is used — migration `0028_fix_public_demo_leak.sql` is evidence it is actively
maintained.

## Integrations

Razorpay (payments + webhooks), Supabase, Inngest (4 functions:
`provision-tenant-store`, `sync-dropship-catalog`, `handle-abandoned-cart`,
`webhook-dispatch`), Resend, Sentry, Google Gemini, and a residential proxy vendor
for research fulfilment (`RESEARCH_PROXY_ENDPOINT` — ScraperAPI or Bright Data).

## Infrastructure and Deployment

**Vercel.** `.vercel/project.json` records project `launchgrid`.

**CI is `.github/workflows/android-ci.yml` only** — it builds
`launchgrid-android` and is path-filtered to that folder. **There is no CI for the
Next.js application at all**: no lint, no typecheck, no tests, no build check.

## Environment Configuration

`.env.example` documents the research-fulfilment variables with unusually good
comments. From `deploy.ps1` (now reading them from a git-ignored file), the full
production set is:

`ENCRYPTION_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_JWT_SECRET`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`,
`POSTGRES_PRISMA_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`,
`POSTGRES_DATABASE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`,
`FROM_EMAIL`, `ADMIN_EMAIL`, `SUPPORT_EMAIL`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_WHATSAPP_NUMBER`, plus `RESEARCH_PROXY_ENDPOINT`,
`RESEARCH_PROXY_KEY`, `RESEARCH_WORKER_SECRET`.

Local values live in `.env.local` and `.env.deploy.local` — **both git-ignored**.
`.env.deploy.local.example` is committed as a template.

## ⚠️ Security Considerations — read this first

**On 2026-09-30 a credential exposure was found and partially remediated.**

`deploy.ps1` had **every production credential hardcoded** and had been tracked in
git since the initial commit `fb0318d`, in a **public** GitHub repository. An
Android keystore was also tracked at `keystore/keystore` (commit `a4647cc`).

Remediated in this session: values moved to a git-ignored `.env.deploy.local`,
`deploy.ps1` rewritten to read them, `keystore/` untracked, `.gitignore` hardened.

**The exposure is not undone.** The values remain in git history and were publicly
readable. **Every one of those credentials must be treated as compromised and
rotated** — Supabase service-role key and JWT secret, the Postgres password and
URLs, the Razorpay key secret and webhook secret, the Resend API key, and
`ENCRYPTION_KEY` / `CRON_SECRET`. See `.ai/TODO.md` P0.

Ongoing rules:
- Never hardcode a credential in a tracked file. Use environment variables.
- `.env.local`, `.env.deploy.local`, `keystore/`, `*.jks`, `*.keystore` are
  git-ignored. Keep them that way.
- `src/utils/supabase/service.ts` bypasses RLS. Server-side only, never in a
  client component or a route reachable without authorisation.

## Coding Conventions

- TypeScript throughout; `src/lib` holds pure, testable logic and `src/app` holds
  routes and pages.
- Comments explain *why* — `src/lib/plans.ts` and the Razorpay webhook are good
  examples. Match that.
- Tests colocate next to the code in `src/lib/**/*.test.ts` (though see the P1
  finding about them not running).
- Commit messages use Conventional Commits (`feat:`, `fix:`, `chore:`).

## Things Future AI Agents Must Know

1. **Read `AGENTS.md` first.** `CLAUDE.md` is just `@AGENTS.md`, and it warns:
   "This is NOT the Next.js you know. This version has breaking changes — APIs,
   conventions, and file structure may all differ from your training data. Read
   the relevant guide in `node_modules/next/dist/docs/` before writing any code."
   Next.js 16 is newer than most training data. **Take this seriously.**
2. **`npm test` runs only 47 of 163 test cases.** The glob is `tests/**/*.test.ts`,
   which misses seven suites under `src/`. See `.ai/TODO.md` P1.
3. **There is no CI for the web app.** The only workflow builds the Android
   subproject.
4. **Migrations are applied by hand.** Nothing enforces that the database matches
   `supabase/migrations/`.
5. **`src/lib/plans.ts` is the source of truth for entitlements**, and it says so.
   Its header notes scattered `plan === 'pro'` checks should migrate to
   `readFeature()` over time — do not add new ones.
6. **This is not the only "launchgrid" on this machine.** `Documents/launchgrid`
   is an unrelated Flutter app (`gst_sahayak`).
