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

## Decision: Products get a reserved subdomain of launchgrid.in, served from the same app

**Decision** — `chess.launchgrid.in` is a name in `RESERVED_SUBDOMAINS`
(`src/lib/reservedSubdomains.ts`) that `src/proxy.ts` rewrites onto `/chess/*`
in the existing Next.js app, rather than a separate deployment.

**Reason** — The same reason the marketing site, portal and storefronts share a
codebase: one deployment and one set of components for a single maintainer. The
subdomain exists so the product reads as its own thing to chess organisers, who
are not the seller audience the rest of the site addresses.

**Consequences** — Every page is reachable at two URLs
(`chess.launchgrid.in/winners` and `launchgrid.in/chess/winners`); the canonical
tags and the chess sitemap name the subdomain, and internal links use the
`/chess/...` form so they work on both. A reserved name can no longer be
registered as a merchant subdomain — which also closed a real hole, since `www`
and `api` were registrable before this.

## Decision: Copy ChessWinners' quirks instead of fixing them, and warn instead

**Decision** — `src/lib/chess/winners.ts` reproduces the original desktop
program's behaviour exactly, bugs included (unrated players excluded from Mode 1
rating bands, a "Main" trophy never awarded, Mode 2 age categories without a
capital U matching girls only, a lost prize when rows are unsorted).
`inputWarnings()` reports each situation on screen.

**Reason** — Organisers run both tools over the same workbook during a
transition. A tool that hands out different prizes than the one they have used
for years is not "better", it is wrong, and the disagreement surfaces at a prize
ceremony. Warning them about their sheet fixes the underlying problem — the
sheet — without changing the answer.

**Alternatives** — Fixing the rules silently (rejected: unexplainable
differences); a toggle per quirk (rejected: nobody can answer those questions).

**Consequences** — Two cases deviate, both because the original simply crashes:
cash below a trophy row, and a category that is only a row number, raise a clear
error. `tests/chessWinners.test.ts` encodes the agreement, so breaking it breaks
the suite.

## Decision: ExcelJS for both reading and writing the chess workbooks

**Decision** — `src/lib/chess/workbook.ts` uses ExcelJS on both halves, loaded
with a dynamic `import()` inside the handlers.

**Reason** — The output needs merged cells, fills and borders, which the free
SheetJS edition cannot write; using ExcelJS to read as well avoids a second
spreadsheet dependency, and the npm build of SheetJS lags the version published
on its own CDN. ExcelJS is ~900 KB, so it must not sit in the page's first load.

**Consequences** — Cell text comes from ExcelJS's own formatting rather than
Excel's display string, which is equivalent for the columns this tool reads
(whole numbers and plain text) but could differ for exotic number formats. Only
.xlsx is accepted; the original's library could also read .xls.

## Decision: chess-results exports are the input, not a workbook we invented

**Decision** — The prize tool's primary input is the pair of .xls files
chess-results.com already produces. Category membership is taken from its
"Category prizes" export rather than re-derived from rating and age rules.

**Reason** — Every organiser has those files the moment the last round ends.
The first version asked them to build a two-sheet workbook by hand, which is
both work and a chance to get the categories wrong; the tournament software has
already decided who is a veteran and who is in which band, and it is the
authority.

**Consequences** — The parser has to tolerate real-world Swiss-Manager output
(blank Rank cells on ties, an unnamed sex column, varying column sets, the
footer). chess-results truncates each category list to the prize ranks it
printed, so the lists have to be extended from the full ranking or the
one-prize cascade runs out of players. Categories an organiser's prize sheet
implies but the export never had are built from the ranking and flagged for
checking.

## Decision: SheetJS is vendored, not taken from npm

**Decision** — `vendor/xlsx-0.20.3.tgz`, installed as `"xlsx":
"file:vendor/xlsx-0.20.3.tgz"`.

**Reason** — chess-results hands out .xls, which ExcelJS cannot read, so
SheetJS is needed. SheetJS stopped publishing to npm at 0.18.5, which carries a
prototype-pollution advisory (CVE-2023-30533) a hostile workbook can reach —
and this code runs on a `*.launchgrid.in` origin. The current build is only
distributed from the vendor's own CDN; committing the tarball keeps the build
reproducible and offline instead of fetching a third-party URL during every
Vercel deploy.

**Consequences** — A 2.4 MB blob in git, and upgrading means downloading a new
tarball rather than bumping a version. ExcelJS stays for writing, since the
free SheetJS build cannot write cell styles; both are dynamically imported.

## Decision: Prize categories are rules over the ranking, picked on the page

**Date:** 2026-11-02
**Context:** The first two versions of the prize tool asked the organiser to
supply the prize money in a spreadsheet — either a ChessWinners workbook or a
two-column "category, amount" sheet — and matched its category names to ours
(`src/lib/chess/allocate.ts`, `matchCategory`). On the organiser's real list it
kept failing on the categories every Indian tournament has: `F`, `Ph`, `Un`,
`Below_1500`. Each failure was reported honestly and left an empty box, which
is better than guessing but still left them typing.

**Decision:** A category is now described as a **rule over the ranking list**
(`src/lib/chess/categorySpec.ts`): overall, female, unrated, a rating band, or a
value of the Type/Gr column. The rules are read off the ranking file and offered
in a dropdown, one row per prize, so nothing has to be recognised from a
spreadsheet. The ranking export is the only required upload.

**Why:**
- The ranking list already contains the sex column and the Type/Gr columns the
  tournament software put the veterans and the PH players in. The information
  was there; the vocabulary mismatch was self-inflicted.
- Name matching fails silently in the direction that matters — an unmatched
  female prize looks exactly like a female prize the organiser did not offer.
- It also closes the "let organisers name a category the tool could not match"
  TODO: an amount that cannot be placed arrives as a row with its money set and
  the dropdown open, which is the same affordance as every other row.

**Consequences:** The prize-sheet reader is kept, because an organiser who has
one loses nothing — it now *seeds the rows* instead of being the only input.
The ChessWinners workbook path is untouched. The rows live in localStorage,
tagged with the tournament name, so a refresh does not cost the afternoon's
typing; that is per-browser and per-laptop by design, since there is no account
to attach it to and nothing is uploaded.

## Decision: Rating prizes are bands, bounded by the next limit declared

**Date:** 2026-11-02
**Context:** With prizes for "under 1600" and "under 1500" on the same list, the
chess-results path put a player rated 1452 in both, so they could take the
larger under-1600 prize and leave the under-1500 prize to someone weaker. The
legacy ChessWinners path had never done this — `closestLimit` in
`src/lib/chess/winners.ts` has implemented the band rule since the first
version, for Mode 1 — so the two paths through the tool disagreed.

**Decision:** An "under N" category covers only the players between the
next-lower declared limit and N-1. `closestLimit` is now shared from
`src/lib/chess/categorySpec.ts` and both paths use the same rule. A bounded band
prints its real range: `Under 1600 (1500–1599)`.

**Why:** It is how tournaments are run — the bands sit beside each other rather
than nesting, so the strongest player in each band wins its prize. A threshold
reading does not just mis-sort; it hands the bigger prize to the lower-rated
player, which is the complaint an organiser gets at the ceremony. Showing the
resolved range back is part of the fix: adding an under-1500 prize silently
narrows the under-1600 prize, and the organiser has to be able to see that.

**Consequences:** A single "under N" prize with nothing beneath it still covers
everyone below N, so the simple case is unchanged. Unrated players are in no
band at all and need their own Unrated prize. Pinned in
`tests/chessPrizePlan.test.ts` with the real 1452 case.
