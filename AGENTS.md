<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project Instructions — LaunchGrid

Commerce platform for Indian SMBs. Next.js 16 + React 19 + Supabase, **live in
production on Vercel** at `launchgrid.in`. See `.ai/CONTEXT.md`.

> These instructions live in `AGENTS.md` on purpose, so one set serves every
> agent tool. `CLAUDE.md` is just `@AGENTS.md` — edit this file, not that one.

## Before Starting Work

1. Read the Next.js warning at the top of this file, and follow it.
2. Read `.ai/CONTEXT.md` — stable facts about the project.
3. Read `.ai/PROJECT_STATUS.md` — what is actually done and verified.
4. Read `.ai/TODO.md` — the prioritised backlog.
5. Read `.ai/AI_HANDOFF.md` — what the last agent did and what to watch out for.
   **It opens with an open security item. Read it.**
6. Inspect the relevant source code.
7. Verify the documentation against the implementation before trusting it.

A fresh clone has no `node_modules`. Run `npm install` first — you need it even
to read the Next.js docs this file points you at.

## Development Rules

- Do not rebuild working functionality.
- Do not assume the documentation is correct. **Source code is the ultimate
  source of truth.** If the docs and the code disagree, fix the docs.
- Keep documentation synchronised with the implementation.
- Run the tests and the build after any change.
- **Never expose secrets. Never commit `.env` files or credentials.** This
  repository has already been burned by exactly that — see `.ai/DECISIONS.md`.

## Project-Specific Rules

**This is live and it handles real payments.** Changes to `api/checkout`,
`api/orders` or `api/webhooks/razorpay` move money.

- **Never hardcode a credential in a tracked file.** Use environment variables.
  `.env.local`, `.env.deploy.local`, `keystore/`, `*.jks` and `*.keystore` are
  git-ignored — keep them that way.
- **`src/utils/supabase/service.ts` bypasses RLS.** Server-side only. Never in a
  client component, never in a route reachable without authorisation.
- **`src/lib/plans.ts` is the single source of truth for entitlements.** Do not
  add new `plan === 'pro'` checks — use `readFeature()`. The DB enum names are
  legacy and differ from the public plan names; keep the comment that says so.
- **Do not weaken `src/lib/research/qualityGate.ts`.** It deliberately refuses to
  charge for a bad report, and its tests encode that commercial guarantee.
- **The research proxy is required in production by design.** Fulfilment refuses
  to start without it rather than delivering empty reports. Do not add a
  direct-fetch fallback.
- **Any schema change needs a numbered migration** in `supabase/migrations/`.
  Migrations are applied **by hand** in the Supabase SQL editor — nothing applies
  them automatically, so say so when you add one.
- Keep pure, testable logic in `src/lib/` and routes/pages in `src/app/`. That
  separation is why 163 tests exist.

## Commands

```bash
npm install          # required on a fresh clone
npm test             # ⚠️ currently runs only 47 of 163 test cases — see .ai/TODO.md P1
npm run lint
npm run build        # full production build; needs no secrets
```

To run the test suites `npm test` currently misses:

```bash
node --import ./tests/resolve-ts.mjs --test "src/**/*.test.ts"
```

Tests use Node's built-in runner with a custom TypeScript loader
(`tests/resolve-ts.mjs`). There is no Jest or Vitest.

## CI

There is **no CI for this web application**. The only workflow,
`.github/workflows/android-ci.yml`, is path-filtered to `launchgrid-android/**`.
Until that changes, run lint, tests and the build locally before pushing.

## After Completing Work

1. Run `npm test`, `npm run lint` and `npm run build`.
2. Also run the `src/**` test suites until the glob in `package.json` is fixed.
3. Update `.ai/PROJECT_STATUS.md`.
4. Update `.ai/TODO.md`.
5. Update `.ai/AI_HANDOFF.md` — this is mandatory, not optional.
6. Record any important architectural decision in `.ai/DECISIONS.md`.
7. Commit the changes.
