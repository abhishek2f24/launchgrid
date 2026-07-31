# Handoff Prompt — LaunchGrid Research Module

Copy everything below this line into the other AI as its instructions, alongside both project folders (`launchgrid` and the SourceIQ/`alibaba` prototype folder it was ported from). Do not summarize or paraphrase it — paste it verbatim so nothing gets lost in translation.

---

## 1. Context — what this is and why it exists

LaunchGrid is a Next.js 16 / React 19 / Supabase SaaS that lets Indian sellers launch an online store in ~15 minutes (marketing site + merchant dashboard + subdomain-based storefronts). A second, separate prototype ("SourceIQ") existed as a local Node/Express/SQLite tool that helped sellers *decide what to sell and from whom* before building a store — landed cost, supplier confidence, profitability, and a "decision cockpit" verdict.

Those two products are being merged into one: LaunchGrid gets a new **Research** module (dashboard tab) so the full journey is research → decide → build → launch → sell, all in one login, one design system, one codebase. SourceIQ's Express/SQLite app is being retired — **do not** port its auth, billing, or database layer, only the pure scoring math.

The merge is **in progress, not finished**. Foundational plumbing and a first working UI are done and manually verified end-to-end against a real dev Supabase project. This document tells you exactly what exists, how it's wired, what's still missing, and the traps that will bite you if you don't read this first.

## 2. Non-negotiable ground rules

1. **Follow existing conventions exactly.** Every file below was written to match patterns already present elsewhere in this repo (see §5). Before writing new code, find the closest existing analog (another `src/actions/*.ts`, another `supabase/migrations/*.sql`, another dashboard page) and copy its shape. Do not introduce a new pattern (a new client-fetch convention, a new table-naming style, a new component library) without a very good reason.
2. **Never touch the original SourceIQ/alibaba prototype folder.** It's the deprecated source being phased out, has its own test suite (116 tests), and its own now-different product policy (see §4.6). Read from it for reference only.
3. **RLS first.** Every new table needs Row Level Security matching the `user_id = auth.uid()` or tenant-ownership pattern already used (see §5.3). Never ship a table without RLS policies.
4. **Verify by actually running it**, not just by typechecking. This session hit two real bugs (`.js` import extensions, a hardcoded port in `proxy.ts`) that `tsc --noEmit` and ESLint both passed cleanly on — they only surfaced when the dev server was actually clicked through in a browser. Typecheck + lint are necessary but not sufficient. See §7 for the exact verification checklist to repeat after every change.
5. **Don't fabricate data or silently guess.** This module's entire design philosophy is "evidence over claims" — every number either comes from real stored data or is explicitly labeled as a default/assumption. If you're tempted to hardcode a plausible-looking number instead of computing it or leaving it null with an honest label, stop and ask.
6. **Ask before schema changes that could be destructive**, and before running anything against a real Supabase project (check `.env.local` — if it points at a live project, confirm with the user before applying migrations, matching what was done in this session).

## 3. Tech stack (LaunchGrid)

- Next.js 16.2.7 (App Router), React 19.2.4, TypeScript 5, Tailwind v4
- Supabase (Postgres + Auth), accessed via `@supabase/ssr` (`createClient()` from `@/utils/supabase/server` for RLS-respecting server-side calls; `createServiceClient()` from `@/utils/supabase/service` only when RLS must be bypassed, e.g. writing to another tenant's `products` table during the promote-to-store bridge)
- Server Actions (`'use server'` files in `src/actions/*.ts`) are the primary data-mutation mechanism — not a REST API layer
- shadcn/ui components in `src/components/ui/*`, but the **portal dashboard pages use a separate, lighter "mark" theme** (see §5.2) — do not apply the dark `DESIGN_SYSTEM.md` aesthetic to dashboard/portal pages, that spec describes the marketing/landing site only
- No test suite currently covers `src/actions/research.ts` or the Research UI — there is nothing to run for it yet; all verification so far has been manual (browser click-through)

## 4. What already exists (do not redo this)

### 4.1 Ported scoring engines — `src/lib/research/engines/`
Pure, framework-agnostic TypeScript copied verbatim from the SourceIQ prototype's `src/engines/`:
- `landedCost.ts`, `profitability.ts`, `manufacturerConfidence.ts`, `quality.ts`, `opportunityScore.ts`, `decisionCockpit.ts`, `decisionConfidence.ts`, `sourcingScenarios.ts`, `finalProductSpec.ts`, `reviewAnalysis.ts`, `marketNormalization.ts`, `textSimilarity.ts`

**Deliberately NOT ported**: `imageHash.ts` and `dedup.ts` (needed the `jimp` package, not installed here, and nothing in the Research module calls them yet — they're for a future product-clustering phase, not this one).

**Import convention inside this folder**: plain relative imports, NO `.js` extension (e.g. `from './opportunityScore'`, never `from './opportunityScore.js'`). The original SourceIQ files used NodeNext-style `.js` extensions on relative imports; that pattern was already fixed in `decisionConfidence.ts` (the only file that had it) but if you copy anything else from the original prototype folder, **strip any `.js` extension off relative imports** — TypeScript's bundler mode silently allows it, but webpack (which this repo's dev server runs on, see §6.2) throws `Module not found` at runtime.

### 4.2 Database schema — `supabase/migrations/0023_research_module.sql` and `0024_research_decision_cockpit.sql`
Already applied to the dev Supabase project referenced in `.env.local` (`pxbyhxjjepjuchalaola`). Tables, all RLS-protected by `user_id = auth.uid()` (directly, or via a join up to `product_ideas.user_id` for child tables):

- `research_projects` (id, user_id, name, created_at)
- `product_ideas` (id, research_project_id, user_id, name, category, subcategory, target_retail_price, max_preferred_moq, **max_initial_investment**, **has_compliance_evidence**, status: `researching | launch_ready | promoted | archived`, tenant_id, product_id, promoted_at) — `tenant_id`/`product_id` are null until the idea is promoted into a real store product
- `research_suppliers` (id, product_idea_id, supplier_name, platform, country, city, currency, moq, lead_time_days, store_url, year_established, and a set of boolean evidence flags: customisation_capability, audit_report_available, business_licence_available, factory_address_disclosed, factory_video_available, export_history, plus a handful more matching `ManufacturerSignals` in `manufacturerConfidence.ts`)
- `research_price_tiers` (id, supplier_id, quantity, unit_price, currency, incoterm)
- `research_supplier_scores` (id, supplier_id, manufacturer_confidence_score, manufacturer_confidence_label, quality_score, quality_label, breakdown_json)
- `research_landed_cost_scenarios` (id, product_idea_id, supplier_id, quantity, inputs_json, outputs_json, confidence)
- `research_profitability_scenarios` (id, product_idea_id, channel, landed_cost_scenario_id, scenario_type, inputs_json, outputs_json)
- `research_opportunity_scores` (id, product_idea_id, supplier_id, score, recommendation, breakdown_json, score_version)
- `research_usage` (id, user_id, period_month, ideas_created) — powers the monthly quota, see §4.4

**Important**: `research_projects`/`product_ideas` are scoped by `user_id`, **not `tenant_id`**. A user can research many product ideas before ever creating a store/tenant (tenant creation happens later, in the onboarding `/setup` flow — see §6.3). Do not require a tenant to exist for any Research CRUD except the final promote step.

### 4.3 Server actions — `src/actions/research.ts`
All `'use server'`, using `createClient()` (RLS-respecting) except the promote-to-product step which uses `createServiceClient()` to write into another table (`products`) that belongs to the tenant, not directly to `research_authenticated as the user (still gated by first fetching the caller's own tenant via `owner_id = auth.uid()`, so no cross-tenant write is actually possible — it's a service-client call for convenience, not a security bypass).

Exports, grouped:
- **Projects/ideas**: `createResearchProject`, `listResearchProjects`, `createProductIdea` (enforces the monthly quota, see §4.4), `listProductIdeas`, `setComplianceEvidence`
- **Suppliers**: `addSupplier`, `addPriceTier`, `scoreSupplier` (calls `calculateManufacturerConfidence` + `calculateQualityScore`, stores the result)
- **Calculations**: `runLandedCost`, `runProfitability`, `runOpportunityScore` (also flips `product_ideas.status` to `launch_ready` when the recommendation is `Strong launch candidate` or `Order samples and validate`)
- **Report assembly**: `getResearchReport(productIdeaId)` — the single call the UI uses to fetch everything: the idea, suppliers (+ their scores + price tiers), latest opportunity score, all landed-cost/profitability scenarios, **plus a computed `decisionCockpit` block and a computed `sourcingScenarios` block**, assembled fresh on every call from whatever's currently stored (not persisted separately — cheap to recompute, always current)
- **Bridge**: `promoteResearchToProduct(productIdeaId)` — creates a real `products` row (draft, `is_active: false`) pre-filled from the research data, stores sourcing metadata in `products.metadata` JSONB, requires the caller to already own a tenant (returns a friendly error telling them to finish store setup first if not)

**Two internal (non-exported) assembly functions live in this same file** — read them before changing anything:
- `assembleDecisionCockpit(...)` — wires `buildReadinessMatrix` / `buildBlockers` / `buildVerdict` / `computeRecommendedOrder` / `computeCompleteness` / `computeDecisionConfidence` together from the latest stored opportunity-score breakdown + landed-cost output + idea fields. This is a **simplified port** of the original SourceIQ `report.ts`'s `buildDecisionConfidence` — it hardcodes 5 decision-confidence contributors (compliance, MOQ negotiation, sample quality, freight confirmation, fee confirmation) rather than the original's fuller set, because some of those needed data this MVP doesn't collect yet (marketplace listings, review counts). If you add marketplace/review data collection later, revisit this function to add back contributors like demand-evidence confidence.
- `buildSourcingScenarios(...)` — ports `report.ts`'s Domestic/China-pilot/China-scale scenario builder. Needs a supplier with `country` exactly `'india'` (case-insensitive) for the domestic route, and a supplier whose `country` contains `'china'` for the China routes. Returns `null` if there's no target retail price or no matching supplier at all — this is correct, expected behavior for incomplete data, not a bug.

### 4.4 Billing/entitlements — `src/lib/plans.ts`
Added `research_ideas_per_month: number` to `PlanFeatures` and to all four tiers (`free: 2`, `starter: 10`, `pro: 30`, `premium: 100`). Research is **bundled into existing plans**, not a separate paid add-on — this was an explicit user decision, don't change the pricing model without re-confirming. `createProductIdea` checks `research_usage` (keyed by `user_id` + first-of-month date) against this quota before allowing a new idea; the row for a new month simply doesn't exist yet, no cron/reset job needed.

### 4.5 UI — `src/app/(portal)/dashboard/research/`
Three screens, all matching the light "mark" theme (see §5.2), not the dark marketing theme:
- `page.tsx` + `ResearchHomeClient.tsx` — list of research projects + create form
- `[projectId]/page.tsx` + `ProjectDetailClient.tsx` — list of product ideas in a project + create-idea form (name, category, target retail price, max first-order budget)
- `[projectId]/[ideaId]/page.tsx` + `IdeaDetailClient.tsx` — the big one: supplier add/score, price tiers, landed cost, profitability, the opportunity-score compute step (5 manual sliders + auto-derived values shown separately, see below), and the full decision-cockpit render (verdict banner, blockers, readiness matrix, recommended order, decision-confidence contributors, sourcing-scenario table), plus the "Build my store" CTA (only rendered when `idea.status` is `launch_ready` or `promoted`)

**Auto-derivation** (`deriveAutoComponents` inside `IdeaDetailClient.tsx`): 6 of the 11 `OpportunityComponents` fields are computed automatically from real stored data (margin from the latest profitability run, manufacturer confidence + quality from the latest supplier score, MOQ suitability + capital requirement from MOQ vs. budget, compliance from the `has_compliance_evidence` toggle) with a neutral `50` fallback and an honest "why" string shown in the UI whenever the underlying data doesn't exist yet. Only 5 fields remain manual sliders: demand, competition gap, differentiation, return risk, shipping suitability — these are genuinely subjective without a review-ingestion/marketplace-listing pipeline, which doesn't exist yet (see §8).

**Nav**: `src/components/dashboard/SidebarNavClient.tsx` — added a "Research" entry (Compass icon) to both the desktop sidebar (between Dashboard and Products) and the mobile bottom nav (replaced the "SEO" icon there — SEO is still reachable from desktop/settings).

### 4.6 Product-policy change already applied
The sourcing-scenario recommendation (`pickSourcingVerdict` in `sourcingScenarios.ts`) is **growth/profit-optimized with no compliance gate** — it always recommends whichever route has the best contribution margin, full stop. The original SourceIQ prototype's version of this function forces "Domestic validation" to win whenever a compliance/quality blocker is open, regardless of margin — **that safety-first behavior was explicitly removed per user instruction** ("we will do everything that will help us in user acquisition and revenue growth... never recommend china is not applicable now"). Compliance/quality status still surfaces elsewhere (readiness matrix, blockers list) as informational context, it just never overrides this particular recommendation. **Do not reintroduce the old gating logic** — if you're referencing the original prototype's `sourcingScenarios.ts` for anything, know that its `pickSourcingVerdict` signature and behavior have diverged (the ported copy takes only `(scenarios)`, no `hasComplianceOrQualityBlocker` second argument).

## 5. Codebase conventions to match exactly

### 5.1 File/folder conventions
- Server actions: one file per feature area in `src/actions/`, all functions `'use server'`, return shape `{ data: T } | { error: string }` for anything that can fail (see the `ActionResult<T>` type at the top of `research.ts` — reuse or mirror this pattern, don't invent a different result shape)
- Migrations: `supabase/migrations/NNNN_description.sql`, sequential 4-digit prefix, one migration per logical change, always `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent, safe to re-run)
- Dashboard pages: `src/app/(portal)/dashboard/<feature>/page.tsx` is a thin async Server Component that fetches initial data via a server action, then hands it to a co-located `*Client.tsx` (`'use client'`) component that owns all interactivity and re-fetches via the same server actions on demand (see `products/page.tsx` + `ProductsPageClient.tsx` as the reference example, or the new `research/` folder itself)
- `params` in dynamic route Server Components are `Promise<{...}>` in this Next.js version — always `await params` (see any `src/app/store/[slug]/page.tsx`-style file for the exact pattern)

### 5.2 Two separate design systems — do not mix them up
- **`DESIGN_SYSTEM.md`** describes a dark, indigo/violet, Linear/Vercel/Stripe-style aesthetic. This is **aspirational documentation for the marketing/landing site**, not what's actually implemented in the merchant dashboard.
- **The actual portal/dashboard theme** (what merchants see day-to-day, what the Research UI matches) is a **light, warm off-white theme** defined as CSS custom properties in `src/app/globals.css`: `--color-mark-base: #FAFAF8`, `--color-mark-ink: #1A1A18` (primary text), `--color-mark-secondary: #4A4A44`, `--color-mark-green/amber/red` for semantic status, `--accent-primary: #8b5cf6` (violet-500), `--accent-secondary: #06b6d4` (cyan-500). Cards are `bg-white border border-black/5 rounded-[1.5rem]` or `rounded-2xl`, buttons are solid `bg-[var(--accent-primary)] text-white rounded-xl` for primary actions. **Follow `src/app/(portal)/dashboard/products/ProductsPageClient.tsx` as the reference for exact spacing/radius/color conventions** — it's the most fully-realized example of this theme in the existing codebase.

### 5.3 RLS pattern
Tenant-owned tables: `FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))`. User-owned tables (like everything in Research): `FOR ALL USING (user_id = auth.uid())` directly, or via a join chain up to a table that has `user_id` for child tables (see the `research_price_tiers` policy in migration 0023 for the join-chain pattern).

### 5.4 Auth/tenant lookups
`getActiveTenant()` in `src/utils/supabase/queries.ts` is the canonical way dashboard pages get the current user's tenant — it also lazily upserts the `public.users` row (there is **no database trigger** syncing `auth.users` → `public.users`; it happens in application code, only inside `getActiveTenant()` and in the signup flow's downstream calls) and redirects to `/login` or `/setup` as needed. If you write a new dashboard page that needs a tenant, call this, don't reinvent tenant-fetching.

## 6. Known environment gotchas (read before you run anything)

### 6.1 `lightningcss` missing native binding
This machine's `node_modules` was missing `lightningcss-darwin-arm64` (the installed optional dependency was a Windows binary, `lightningcss-win32-x64-msvc`, suggesting the lockfile was generated on a different machine/OS). Fixed here with `npm install lightningcss-darwin-arm64@1.32.0 --no-save`. If you hit `Cannot find module '../lightningcss.darwin-arm64.node'`, that's this — install the matching native package for whatever platform you're actually running on.

### 6.2 Turbopack dev mode is currently broken for this repo — use `--webpack`
`next dev` (which defaults to Turbopack in Next 16) fails with `Error: An error occurred while loading instrumentation hook: Could not parse module '[project]/instrumentation.ts', file not found` even though the file exists and is valid. This reproduced consistently and is unrelated to the Research module changes. Workaround: run `next dev --webpack` instead. Production `next build` was not fully verified either (it separately hit the lightningcss issue above before getting further) — **if you need to verify a production build, expect to troubleshoot Turbopack/webpack config further, don't assume `next build` works cleanly yet.**

### 6.3 `src/proxy.ts` hardcodes `localhost:3000` as "the main domain"
This file's subdomain-routing logic (`isMainDomain` check) only recognizes `hostname === 'localhost:3000'` as the main app; any other port gets treated as a merchant storefront subdomain and rewritten to `/store/<hostname>/...`, which 404s. **Always run the dev server on port 3000 exactly** when testing locally, or fix this hardcoded check first if you genuinely need a different port.

### 6.4 Supabase Auth email rate limits
The connected dev Supabase project has default auth email rate limits (hit "email rate limit exceeded" after 1-2 signup attempts in quick succession). For repeated local testing, create confirmed test users directly via the Admin API (`supabase.auth.admin.createUser({ email, password, email_confirm: true })` using the service-role key) instead of going through the public `/signup` form repeatedly. Remember to also upsert the corresponding `public.users` row (see §5.4 — there's no automatic trigger) if you bypass the normal signup flow this way.

### 6.5 `.claude/launch.json`
A launch config was added at the **alibaba/SourceIQ project's** `.claude/launch.json` (not inside `launchgrid/`) pointing at `http://localhost:3000` for browser-preview tooling, because that tool's config file lives relative to whichever project directory the assistant session's cwd was. If you're working from a fresh session rooted directly in the `launchgrid` folder, you may need to create an equivalent `launchgrid/.claude/launch.json` instead.

## 7. Verification checklist — run this after every change, in this order

1. `node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` from the `launchgrid` root (not `npx tsc` — a permissions issue in some sandboxes blocks the `.bin` shim; calling the JS entrypoint directly sidesteps it) — must return zero errors across the **whole project**, not just files you touched
2. `node ./node_modules/eslint/bin/eslint.js <paths you touched>` — same permissions note applies, use the direct path
3. Actually start the dev server (`next dev --webpack -p 3000`, see §6.2/§6.3) and click through the affected flow in a real browser — this is what caught the two real bugs in this session that steps 1-2 missed entirely
4. If you touched any Supabase schema, confirm the migration applies cleanly against the dev project (`psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/00NN_x.sql`) before assuming it works

## 8. What's still missing — do not claim these are done

- **Final product spec + market-problem differentiation** (`finalProductSpec.ts` is ported but nothing calls it yet) — needs a review-ingestion pipeline (collecting and analyzing customer reviews for complaint clusters) that doesn't exist in LaunchGrid at all yet. This is a real, separate subsystem, not a quick addition.
- **Marketplace listing collection** (for real demand/competition-gap evidence instead of manual sliders) — needs either a scraping pipeline or a browser extension, neither ported.
- **Alerts / reorder feedback loop** onto the store dashboard (price drops, MOQ changes feeding back into inventory decisions post-launch) — needs the above data collection to exist first; wiring an "alerts" feature with no real external data flowing in would just be decorative.
- **Full onboarding-to-promote path not end-to-end tested**: the "Build my store" bridge (`promoteResearchToProduct`) was verified by reading the code and confirming its gating logic renders/hides correctly, but the actual product-creation write was **not** clicked through in this session (the test product idea never reached `launch_ready` status because the test data deliberately had open blockers). Before considering this bridge production-ready, create a test idea with no blockers, let it reach `launch_ready`, click "Build my store," and confirm a real draft row appears correctly in `/dashboard/products`.
- **Images/animations**: prompts for hero imagery, empty-state illustrations, and specific Framer Motion animation specs were written to `RESEARCH_MODULE_VISUAL_PROMPTS.md` in this repo root, but **no actual images have been generated or motion code written** — the current UI is intentionally plain functional Tailwind with zero animation, so the data flow could be verified first.
- **No automated tests** exist for anything in `src/actions/research.ts` or the Research UI components. All verification to date has been manual browser click-through in one session — this is a real gap for anything you'd consider "done" going forward.

## 9. Suggested next task (if you need a starting point)

Pick up at the "full onboarding-to-promote path" item in §8: create a test product idea, feed it enough positive supplier/manual scores to cross the `launch_ready` threshold (`recommendation === 'Strong launch candidate'` or `'Order samples and validate'` in `opportunityScore.ts`), complete a store setup via `/setup` if the test user doesn't have a tenant yet, click "Build my store," and confirm the resulting `products` row (title, retail_price, metadata.sourcing_supplier, metadata.landed_cost_per_unit) looks correct in both the database and the `/dashboard/products` UI. Report back with what you find before starting anything else.
