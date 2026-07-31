# Handoff Prompt — Integrate "Research" into the LaunchGrid Homepage & Site Flow

Paste everything below this line into the other AI verbatim, alongside the `launchgrid` folder (and `HANDOFF_RESEARCH_MODULE.md` in its repo root, which this prompt assumes you've already read — it explains what the Research module is, where it lives, and its conventions). This prompt is scoped narrowly to the **marketing homepage and site-wide navigation/flow**, not the dashboard module itself.

---

## 1. The problem this solves

LaunchGrid's homepage currently tells a single story: "you already know what to sell — type it in, we build the store." The Research module now exists (dashboard-only, not yet surfaced anywhere on the public site) and answers a *different, earlier* question: "you don't know what to sell yet, or you want to validate a product idea, source a supplier, and see a real margin before committing capital." Right now there is **zero mention of Research anywhere on the public site** — no nav link, no hero mention, no step in the 12-step journey, no FAQ entry, no SEO metadata. Your job is to add it, without breaking or slowing down the existing high-intent "I already know what to sell, build it now" path.

## 2. The decision already made — two entry paths, not a forced funnel

Do **not** force every visitor through a "research first" step before they can reach signup. The current hero converts sellers who already know their product (the PRD's highest-conversion segment — existing offline business owners). Making them wade through a research pitch first is friction with no payoff for them.

Instead, present **two clearly labeled entry paths side by side**, from the very first fold:
- **"I know what to sell → Build my store"** — the existing fast path, unchanged in spirit, still leads to `/onboarding`
- **"Not sure yet? → Research a product idea first"** — new path, leads into a lightweight public-facing research experience that funnels back into signup once the visitor has a validated idea

This is a two-CTA hero, not a redesigned single-path hero. Confirm this understanding before writing any code — if you think a single unified path is better, stop and ask the user first; this specific decision (two paths, not one) was already made deliberately in a prior planning conversation and should not be silently overridden.

## 3. Exact current state — read this before touching anything

### 3.1 Hero — `src/components/signup-journey/S01_TheThought.tsx` (156 lines)
This is the entire hero section. Currently:
- Headline: "You've thought about it for years. Launch it in 15 minutes."
- Sub-copy: "LaunchGrid turns your idea into a real online store — products, UPI & COD payments, GST handled. Most people never start. You're about to."
- A single input + submit form (`startBuilding`) where the visitor types a product idea (e.g. "handmade jewellery", cycling placeholder text from `IDEA_PLACEHOLDERS`) and clicking the button (labeled "Build my store" / "Build" on mobile) does `router.push('/onboarding?idea=' + idea)`.
- Below the form: a row of trust badges ("Free starter plan available", "Plans from ₹1,399/mo", etc.)
- Below that: a real-stats strip (store count, total merchant revenue) that only renders once real data loads from `/api/stats/platform` — **never fabricate fallback numbers here, this file already has a comment enforcing that, respect it**.

**What to change here**: add a second, visually distinct CTA next to/below the existing form — something like a text link or secondary button reading "Not sure what to sell? Research a product idea first →" that routes to the new public research entry point (see §4). Do not remove or restyle the existing idea-input form; it stays exactly as the primary path. The new CTA must read as secondary (smaller, lower visual weight, e.g. `text-[var(--color-mark-secondary)] underline` rather than a solid button) so it doesn't compete with or slow down the primary conversion path.

### 3.2 The 12-step method section — `src/components/signup-journey/S06_TheMethod.tsx` + `src/data/landing/content.ts` (`methodSteps` array, lines 45–58)
This renders a scroll-driven vertical timeline of 12 steps, currently: Reserve Subdomain → Build Brand → Import Catalog → Accept Payments → Launch Store → Drive Traffic → Get First Order → Fulfill → Track Revenue → Handle GST → Scale With Ads → Earn First Month. **Every one of these 12 steps assumes you already know your product** — step 01 starts at "reserve your subdomain," there is no step for "decide what to sell."

**What to change here**: add a new **step `00`** (or renumber everything by one — your call, but if you renumber, update the `id` field on every entry since it's rendered as literal text) at the very front of the `methodSteps` array:
```
{ id: '00', mission: 'Decide What to Sell', pain: "I don't know what will actually sell.", solution: "Research real suppliers, landed cost, and margin before you commit a rupee.", outcome: "You know your numbers before you build." }
```
Match the existing tone exactly (short pain/solution/outcome triplet, plain language, no jargon) — look at steps 01 and 07 as the best examples of the voice to match. Do not touch the `StepCard` component or the scroll-progress line logic in `S06_TheMethod.tsx` itself; the array is the only thing that needs a new entry.

### 3.3 Navigation — `src/components/signup-journey/JourneyNav.tsx`
Desktop nav currently has, in order: logo → Pricing → Compare (`/vs-shopify`) → Tools (dropdown with 6 calculator/generator tools) → (there is more further down in the file — a mobile menu and likely a final CTA button; read the rest of the file, it's 239 lines, before editing so you don't duplicate a CTA that already exists).

**What to change here**: add a "Research" nav link between "Pricing" and "Compare", matching the exact existing `<Link>` markup pattern (same className string, same hover states) used for the Pricing link. Point it at whatever public research route you build (see §4) — **not** at `/dashboard/research`, which requires login and would 404-redirect a logged-out visitor to `/login`, killing the click. Also check whether `JourneyNav.tsx` renders a duplicate/mobile version of this nav (it likely does, given the `Menu`/`X` icons imported) — if so, add the same link there too, keeping both in sync.

### 3.4 Marketing site route group — `src/app/(marketing)/`
Existing sibling routes at this level (peers of the homepage) include `/pricing`, `/features`, `/faq`, `/blog`, `/discover`, `/tools/*`, `/vs-shopify`, `/vs-dukaan`, `/vs-bikayi`, `/sell-online`, `/support`, `/join`, `/onboarding`, `/free-setup`. This confirms the convention: a new top-level marketing page is a new folder here, e.g. `src/app/(marketing)/research/page.tsx`, following the same `layout.tsx` wrapper every other page in this group uses. **Do not build this as part of the `(portal)` dashboard route group** — that group requires auth (see `src/app/(portal)/layout.tsx`, which redirects to `/login` if there's no session) and this new page must be reachable by a logged-out visitor.

### 3.5 Homepage composition — `src/app/(marketing)/page.tsx` (417 lines)
The homepage is explicitly documented as "5 movements" (see the comment block at lines 7–12 and `WEBSITE_REDESIGN_PLAN.md` §2.2, read that doc for the full rationale before changing section order). Current order: `S01_TheThought` (hero) → `S02_ThePain` → `S04_TheTransformation` → `S06_TheMethod` → `S07_LiveDemo` → `S05_TheMoney` → `S08_SocialProof` → `S_FAQ` → `S10_FinalCTA` → `Footer`. This file also contains **five `schema.org` JSON-LD blocks** (Organization, WebSite, SoftwareApplication, FAQPage, WebPage) used for SEO rich results — do not touch the JSON-LD mechanism itself, but you likely need to **add new FAQ entries** to the `FAQPage` block (see §5) and consider whether `SoftwareApplication.featureList` (line ~172) should gain a line item for the research capability.

## 4. What to actually build

### 4.1 A public, logged-out-friendly Research landing/demo page
Route: `src/app/(marketing)/research/page.tsx` (new folder + file, following the exact structural pattern of an existing simple marketing page — `src/app/(marketing)/sell-online/page.tsx` or `src/app/(marketing)/discover/page.tsx` are good references for "content page inside the marketing layout, not the full 5-movement homepage composition").

This page's job: let a logged-out visitor type a product idea and see *why* research matters, without requiring signup to get some value. Two acceptable approaches — pick whichever is less engineering risk, and say which one you picked:

- **(a) Static/illustrative demo**: show a fixed, clearly-labeled *example* research report (e.g. "Here's what researching 'mesh laundry bag' looks like") using real-looking but explicitly-labeled-as-sample data, ending in a strong CTA to sign up and run it for real. Lower engineering risk — no auth, no live Supabase calls needed on a public page.
- **(b) Live but gated**: let the visitor type an idea and run a *limited* real calculation (e.g. just the landed-cost calculator, or just manufacturer-confidence scoring on a sample supplier) via a public API route, then gate the full decision-cockpit behind signup. Higher engineering risk (need a public, rate-limited API route that doesn't require the existing auth-gated server actions in `src/actions/research.ts` — those all call `requireUser()` and will reject unauthenticated calls) — do not attempt this without first checking whether such a public/rate-limited pattern already exists elsewhere in the codebase (the `/tools/*` calculators under `(marketing)/tools/` are unauthenticated and client-side-only; that's your best reference if you go this route).

Whichever you pick, the page's primary CTA must route to `/signup` (or `/onboarding` if that's the correct next step — check which one the existing hero form uses, it's `/onboarding` per §3.1) so a convinced visitor converts immediately, not into a dead end.

### 4.2 Wire the new nav link, hero secondary CTA, and method-step entry
As specified in §3.1–§3.3, pointing at `/research` (or whatever exact path you gave the new page in §4.1).

### 4.3 SEO/schema updates in `src/app/(marketing)/page.tsx`
- Add at least one new FAQ entry to the `FAQPage` JSON-LD block (§3.5) answering something like "Can LaunchGrid help me decide what to sell?" — match the exact answer style/length of the existing 10 entries (2–4 sentences, plain language, ends with a concrete benefit).
- Consider adding "Product research and supplier sourcing tools" (or similar, matching the existing terse feature-list phrasing) to `SoftwareApplication.featureList`.
- Do **not** add a new schema.org block type for this — reuse the existing five-block structure, just extend the arrays inside it.

## 5. What NOT to do

- Do not remove, replace, or meaningfully slow down the existing single-input hero form — it's the primary, highest-converting path and must stay exactly as fast as it is today.
- Do not put the new public research page behind login — the entire point is to let an undecided, logged-out visitor get value before signing up.
- Do not call any function from `src/actions/research.ts` directly from a public/marketing page — every one of those functions starts with `requireUser()` and will silently return `{ error: 'Not signed in' }` for a logged-out visitor. If you need real research-engine math on a public page, import the pure engine functions directly from `src/lib/research/engines/*` (they have zero auth/DB dependency) rather than the server actions that wrap them.
- Do not invent fabricated statistics, testimonials, or "X people researched this today" counters anywhere on this page — this codebase has an explicit, repeated pattern (see the real-stats-only comment in `S01_TheThought.tsx`, and the note in `page.tsx`'s comment block about `S08_SocialProof` replacing fictional testimonials with real data) of never showing fake numbers. If you don't have a real number, don't show a number.
- Do not change the order of the 5 homepage "movements" listed in §3.5 without re-reading `WEBSITE_REDESIGN_PLAN.md` first — that ordering was a deliberate narrative decision documented elsewhere in this repo.

## 6. Verification checklist

Same as the main handoff doc's §7 (`HANDOFF_RESEARCH_MODULE.md`), repeated here for convenience:
1. `node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — zero errors, whole project
2. `node ./node_modules/eslint/bin/eslint.js <paths touched>` — zero errors
3. Actually run `next dev --webpack -p 3000` (see that doc's §6.2–§6.3 for why `--webpack` and why port 3000 specifically) and click through: homepage hero shows both CTAs correctly, the secondary CTA routes to the new page, the new page renders without requiring login, the nav link appears and routes correctly on both desktop and mobile, the new 12→13-step method entry renders in the right position and expands/collapses like its siblings
4. Confirm the JSON-LD blocks in `page.tsx` still parse as valid JSON (they're rendered via `dangerouslySetInnerHTML` — a syntax error here fails silently in the browser, so paste the block into a JSON validator if you're unsure)

## 7. Suggested order of work

1. Decide and confirm (a) vs (b) from §4.1 for the new research page's depth
2. Build `src/app/(marketing)/research/page.tsx`
3. Add the secondary hero CTA (§3.1)
4. Add the nav link, desktop + mobile (§3.3)
5. Add the new method step (§3.2)
6. Add the FAQ/schema updates (§4.3)
7. Run the full verification checklist (§6)
8. Report back with screenshots or a clear description of what the two-path hero and new page look like before considering this done
