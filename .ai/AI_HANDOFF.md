# AI Handoff

**Last AI:** Claude (Opus 5)
**Last Updated:** 2026-11-02

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

## 2026-10-10 — AdFree AppLock page: preview image, truthful claims, Firebase disclosure (Claude Opus 5.5)

Worked from the AppLock repo session; only AdFree AppLock files and the shared
app-page/deletion helpers changed.

- **Privacy policy** (`src/app/apps/adfree-applock/privacy-policy.html/route.ts`):
  the 25 Sep version said "no analytics SDK" / "we collect nothing", but the app
  ships Firebase Analytics, Crashlytics, Remote Config and Cloud Messaging. Now
  discloses each (data, purpose, opt-outs), dated 10 Oct 2026. **Play Data Safety
  must say the same** — being updated in Play Console in the same change.
- **Deletion page:** `buildDeletionPage` gained an optional `serviceProviderNote`
  (only AppLock sets it) so the page no longer says "Nothing… no analytics".
  Other apps render exactly as before.
- **`src/data/apps.ts` AppLock entry:** removed false claims (PIN "4–12 digits",
  "auto-lock newly installed apps", "no data collected"); rating updated to the
  real Play figure (3.6 from 68, checked 10 Oct).
- **Preview image:** added `public/apps/adfree-applock/{icon.png, feature.png,
  screenshots/01-06.jpg}` (real current-UI screenshots from the app). The page
  now emits og:image / twitter:image (feature graphic) and screenshot + image in
  SoftwareApplication JSON-LD. `[slug]/page.tsx` now sets `twitter.images`
  explicitly for every app that has a feature graphic.

Verified: `npm test` 47/47, `src/**` tests 116/116, eslint on changed files,
`npm run build`, and the rendered HTML via `next start` — NOTE the proxy only
treats `localhost:3000` as the main domain; on any other port send
`Host: launchgrid.in` or every route 404s as a "merchant subdomain".

Not done here: deploying (push to main), Google Search Console indexing request.

## 2026-11-02 — ChessGrid: chess.launchgrid.in and the prize winners tool (Claude Opus 5)

A second product on its own subdomain, built from a reverse-engineering spec of
**ChessWinners v2.0** (a 2019 desktop prize-distribution program by Zaheer Beig,
BSD-style licence). It decides which player wins which prize in a chess
tournament from one Excel workbook, entirely in the browser.

- **Routing:** `src/proxy.ts` now checks `RESERVED_SUBDOMAINS`
  (`src/lib/reservedSubdomains.ts`) **before** the merchant-storefront rewrite,
  so `chess.launchgrid.in/x` serves `/chess/x`. Paths that already start with
  `/chess` are not prefixed twice, so every internal link works on both hosts.
  `checkSubdomainAvailability` in `src/actions/onboarding.ts` now refuses
  reserved names — previously a merchant could have registered `www`, `api` or
  `chess` and got a storefront no visitor could reach.
- **The rules:** `src/lib/chess/winners.ts`, a faithful port including the
  original's quirks, with `inputWarnings()` reporting them instead of silently
  "fixing" them. `tests/chessWinners.test.ts` (21 cases) pins the specification's
  worked example in both modes and every documented quirk.
- **Excel:** `src/lib/chess/workbook.ts` reads and writes with **ExcelJS**
  (dynamically imported — it is ~900 KB) and builds the sample workbook.
- **Pages:** `src/app/chess/` — hub, `/winners` (client tool in
  `src/components/chess/WinnersTool.tsx`), `/winners/guide`, `/about`, plus a
  subdomain `sitemap.ts` and a `robots.txt` route handler (Next's `robots.ts`
  convention only works at the app root).
- **Licence:** `src/lib/chess/licence.ts` holds the required credit; it is shown
  on first use, on `/about` and in the generated workbook's footer. Do not remove
  it, and do not market the site using the author's name.

**Still a human task:** point the `chess` DNS record at Vercel and add
`chess.launchgrid.in` as a domain on the project. Until then the routes are only
reachable at `launchgrid.in/chess/*`.

Verified: `npm test` 80/80, `src/**` tests 116/116, eslint clean on every changed
file, `npm run build`, and an end-to-end run in the browser — the sample workbook
through the real UI produces exactly the winners the specification's worked
example lists, in both modes. Host routing checked with `Host:` headers for
`chess.launchgrid.in`, `launchgrid.in` and a merchant subdomain.

## 2026-11-02 (later) — ChessGrid reads the real chess-results files (Claude Opus 5)

The first version only accepted a hand-built ChessWinners workbook. Organisers
do not have one; they have two .xls files that chess-results.com gave them and
a prize list of their own. The tool now takes those directly, and the printed
prize list is the deliverable.

- **`src/lib/chess/swissManager.ts`** parses the Swiss-Manager export shape that
  both the "Final ranking" and "Category prizes" lists share: a tournament
  line, a section line, then blocks of players under an optional category
  label. Columns are read **by header name** — the sex column's header is
  empty, and chess-results emits different column sets per tournament. Two
  things found only by looking at a real file: a tie leaves the Rank cell
  **blank** on the second player (dropping those rows loses players), and the
  footer's "2025/12/11" is the only safe place to read the tournament year
  from, because a Birth cell is the same shape.
- **`src/lib/chess/allocate.ts`** hands every prize out in descending order of
  money, each to the best-placed player in its category who has not won yet.
  That is the whole "one prize per player" rule, and it makes the cascade
  (4th overall vacates the veterans' first prize) fall out by itself.
- **`src/lib/chess/importFiles.ts`** reconciles the three files: it extends the
  truncated category lists from the full ranking (chess-results prints only as
  many players as it has prize ranks for, so the lists run out mid-cascade),
  builds the categories an organiser's sheet implies but the export never had
  (`Un`/`Ur` → Unrated, `Below_1500` → rated under 1500), and prefills the
  amounts where the match is certain. Anything uncertain is reported, never
  guessed.
- **Reading** moved to SheetJS (`src/lib/chess/readSheet.ts`) because
  chess-results hands out **.xls**, which ExcelJS cannot read. ExcelJS still
  writes the output. SheetJS is vendored at `vendor/xlsx-0.20.3.tgz` — see
  `.ai/DECISIONS.md` for why not the npm copy.
- **UI**: `WinnersTool.tsx` is now drop-files → check amounts → print. Results
  recompute as the amounts are typed. `PrizeList.tsx` is the same component on
  screen and on paper (`print:` variants; the shell hides itself when printing).
  The ChessWinners workbook mode still works, by its own rules, through
  `legacyAdapter.ts`; drop that workbook in *beside* a chess-results export and
  its `sort` sheet is read as the prize list instead.

Verified against the organiser's own files (Bhatt Chess Academy 12th Rapid,
54 players, 7 category blocks, 34 prizes): every prize row matched a category,
₹37,700 allocated, nobody twice, and the one prize that genuinely had nobody
left is reported rather than dropped. Checked in the browser with those files
and in Node end to end into the .xlsx. `npm test` 100/100, `src/**` 116/116,
eslint clean on changed files, `npm run build`.

Watch out for: the files live in the user's Downloads, not in the repo — the
fixtures in `tests/chessResults.test.ts` copy their shape with invented names.

## 2026-11-02 (later still) — no HTTPS on any subdomain (Claude Opus 5)

No code changed. Checking the chess deploy turned up a production gap that is
bigger than ChessGrid, now written up as the first P1 in `.ai/TODO.md`.

The certificate production serves has `SAN: DNS:launchgrid.in` and nothing
else — **no wildcard**. So every subdomain dies at the TLS handshake, not at
routing: `chess.launchgrid.in` and an invented `zzz-nonexistent.launchgrid.in`
both give `ECONNRESET` on SNI, while plain HTTP serves all of them fine (a
wildcard `*.launchgrid.in` → `cname.vercel-dns.com` already exists in DNS).

That means **merchant storefronts are affected too**. Vercel issues a cert per
domain *added to the project*, and nothing here ever adds one — no Vercel
domains API call anywhere in `src`/`scripts`, no Vercel vars in `.env.example`.
A merchant finishing onboarding gets a `tenants` row, working DNS, and a URL
that fails in every browser; `/discover` links stores at exactly that URL.

Two caveats on the finding: the Vercel dashboard was not visible from here, so
a store domain added by hand could exist, and `/discover` listed no stores, so
no live tenant subdomain was testable.

Fixing chess is one click (add the host; the CNAME is there). Fixing storefronts
is not — the nameservers are GoDaddy, so a wildcard cert needs either Vercel
nameservers or a maintained `_acme-challenge` TXT record, and the durable answer
is to call the Vercel domains API from `src/actions/onboarding.ts` at signup.

## 2026-11-02 (third pass) — ChessGrid: prizes typed on the page, and rating bands (Claude Opus 5)

Three things the organiser reported after using it on a real event.

**1. Rating bands were wrong, and this is the important one.** A player rated
1452 appeared in the "under 1600" category when an "under 1500" prize also
existed. Bands sit beside each other: under 1600 means 1500–1599. The legacy
ChessWinners path had this right from the start (`closestLimit`, Mode 1); the
chess-results path never got it. The rule now lives in
`src/lib/chess/categorySpec.ts` and both paths share it, and a bounded band
prints its range — `Under 1600 (1500–1599)` — so narrowing is visible when the
lower prize is added. Checked against the organiser's own 54-player file: the
real 1452 player (Taksh Vyas) moves to under 1500.

**2. The prize spreadsheet was not being recognised** — `F`, `Ph`, `Un`,
`Below_1500` all failed to match. Rather than widen the matching, categories are
now **rules over the ranking list**, picked from a dropdown on the page: Overall,
Best female, Unrated, every Type and Gr value (S60, Ph, …), and any rating band.
One row per prize; finishing a row makes the next appear. `src/lib/chess/prizePlan.ts`
turns the rows into what `allocate()` wants, which is untouched. A prize sheet
still works if they have one — it now seeds the rows, and an amount that cannot
be placed arrives as a row with the dropdown open. That closes the TODO P2 about
naming an unmatched category, which is removed.

**3. The list is remembered** (`src/lib/chess/savedSetup.ts`) in this browser's
localStorage, tagged with the tournament name so next month's event starts empty.
Every read and write is guarded — a private window throws rather than returning
null, and failing to remember must never break the page.

**The only required upload is now the Final ranking export.** Category prizes is
optional and adds its own blocks as extra pickable categories.

Verified: 40 chess test cases (19 new in `tests/chessPrizePlan.test.ts`), 235
tests overall across both suites, eslint and `npm run build` clean, and the form
driven end to end in the browser — rows auto-append, the band label narrows, the
list is restored after a reload.

Watch out for: the dev server's console holds 52 **stale** errors naming imports
(`parseWorkbook`, `MissingSheetError`) that the turn-1 version of
`WinnersTool.tsx` had. The current file does not import them and the production
build is clean; they are a stale module graph, not a live fault.
