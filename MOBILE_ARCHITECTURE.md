# LaunchGrid Mobile — Architecture & Implementation Plan
**Roles:** Staff Mobile + Backend Engineering, Solutions Architecture, Product, UX, DevOps
**Premise:** The app is an extension of the existing platform — one backend, one database, one source of truth.
**Grounding:** This design is written against LaunchGrid's *actual* stack (Supabase Auth/Postgres/Realtime, Next.js API routes on Vercel, Razorpay, Inngest, Resend, Sentry) — not a generic template. Several "standard" mobile recommendations change because of it, and they're called out explicitly.

---

## 1. Stack Decision

### React Native + Expo. Confirmed — but for LaunchGrid-specific reasons.

| Criterion | RN + Expo | Flutter | Why it matters here |
|---|---|---|---|
| Code sharing with existing codebase | **High** — TypeScript types, validation, Supabase client, even business constants shared via a monorepo package | None (Dart) | You have a TS Next.js codebase and (effectively) one engineer |
| Supabase SDK maturity | First-class (`supabase-js` works in RN) | Good but separate ecosystem | Auth/Realtime/storage come free |
| Dev speed | Fastest: Expo Router, EAS builds, OTA updates | Fast, but new language + toolchain | OTA updates let you fix bugs without store review — critical solo |
| Hiring (India) | Largest JS pool | Growing | Future team |
| Performance | Sufficient (dashboard/CRUD app, not a game) | Better raw perf | LaunchGrid mobile is lists + forms + charts |
| Maintenance | One language everywhere | Two ecosystems | The whole point of this exercise |

**Final stack:**
- **Expo (managed) + Expo Router** (file-based, mirrors Next.js mental model)
- **TanStack Query** — server state, caching, offline persistence
- **Zustand** — UI/local state only (never server data)
- **supabase-js** — auth, Realtime, storage (NOT direct DB writes — see §3)
- **Expo Notifications + FCM/APNs** — push
- **Sentry (sentry-expo)** — same org/project family as web
- **MMKV + expo-secure-store** — storage (encrypted cache / tokens)
- **RevenueCat — deferred, with a caveat the generic advice misses (§6)**

### Monorepo
Move to a pnpm workspace monorepo (low-risk, incremental):
```
launchgrid/
├── apps/
│   ├── web/        ← existing Next.js app (moved, not rewritten)
│   └── mobile/     ← Expo app
├── packages/
│   ├── shared/     ← types, zod schemas, constants (PLANS, score weights), utils
│   └── api-client/ ← typed fetch wrappers for /api/* used by mobile (and future web refactor)
```
`packages/shared` is where the plan-tier vocabulary finally gets one source of truth (`PLANS`), fixing the web's current three-name problem as a side effect.

---

## 2. System Architecture

```
┌─────────────┐        ┌─────────────┐
│  Web (Next) │        │ Mobile (RN) │
└──────┬──────┘        └──────┬──────┘
       │  HTTPS (REST /api/v1/*)     │
       ├──────────────┬──────────────┤
       │              ▼              │
       │   ┌─────────────────────┐   │     ┌──────────────┐
       │   │ Next.js API routes  │───┼────▶│   Inngest    │ (jobs: digests,
       │   │ (Vercel) = THE API  │   │     └──────────────┘  trial emails, push fan-out)
       │   └──────────┬──────────┘   │
       │              ▼              │
       │   ┌─────────────────────┐   │
       └──▶│      Supabase       │◀──┘  supabase-js direct for:
           │  Auth · Postgres ·  │      • Auth (sessions/refresh)
           │  RLS · Realtime ·   │      • Realtime subscriptions (read)
           │  Storage            │      • Storage uploads (product photos)
           └─────────────────────┘
                      │
              Postgres triggers → push-queue table → Inngest → FCM/APNs
```

**The rule that keeps one source of truth:** all **writes** that contain business logic (create product, fulfil order, apply coupon, change plan) go through the existing Next.js API routes. Mobile never re-implements logic, and never writes business tables directly. Supabase is used directly from mobile only for the three things it's strictly better at: auth, realtime *reads*, and file uploads. RLS (already in place) is the second line of defense.

### API architecture & versioning
- Namespace existing routes as **`/api/v1/*`** (alias current `/api/*` → v1 via re-export; zero breakage for web).
- Contract: every response `{ data, error: { code, message } | null }`; every error has a machine `code` (mobile maps codes → UX, never parses messages).
- Versioning strategy: **additive-only within v1** (new fields OK, renames/removals require v2). Mobile clients send `x-app-version`; a `/api/v1/meta` endpoint returns `min_supported_version` → app shows a force-upgrade screen below it. This is what actually prevents the "old apps break" problem at 1M users.
- **Retry strategy:** TanStack Query defaults + custom: GETs retry 3× exponential (1s/4s/16s) on network/5xx only; **mutations never auto-retry** except idempotent ones explicitly marked (fulfil order ships an `Idempotency-Key` header; add the same key check the Razorpay webhook already uses).

---

## 3. Realtime Synchronization

**Recommendation: Supabase Realtime (Postgres CDC over WebSockets). Not raw WebSockets, not SSE.**
Why: it's already in the stack (the provisioning screen uses it), it's authenticated by the same JWT + RLS you already maintain, it requires zero new infrastructure, and it scales past this product's horizon. Building a WebSocket server on Vercel is fighting the platform; SSE gives one-way only and you'd still need Supabase for auth context.

**Pattern: "notify, then refetch" — not "trust the payload."**
```ts
// apps/mobile/src/lib/realtime.ts
supabase.channel(`tenant:${tenantId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders',
       filter: `tenant_id=eq.${tenantId}` },
      () => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  .on('postgres_changes', { ...products... },
      () => queryClient.invalidateQueries({ queryKey: ['products'] }))
  .on('postgres_changes', { ...subscriptions... },
      () => queryClient.invalidateQueries({ queryKey: ['entitlements'] }))
  .subscribe()
```
Change events only *invalidate* TanStack Query caches; the refetch goes through the API, so the data the UI shows always passed through the single business-logic layer. This one decision eliminates an entire class of web/mobile drift bugs. Web gets the same treatment later (replace polling on the dashboard).

Scale note: one channel per tenant (not per table), RLS-scoped. Supabase Realtime handles ~250k concurrent connections on paid tiers; at the point that's a constraint, swap the transport (channel abstraction stays).

---

## 4. Offline-First Strategy

Merchants check orders in lifts, metros, and shops with bad WiFi. Design: **read-anywhere, queue-writes, last-write-wins-with-receipts.**

- **Reads:** TanStack Query + `persistQueryClient` → MMKV. Orders, products, analytics snapshot, and the Launch Readiness state render instantly from cache with a quiet "as of 09:41" staleness chip when offline.
- **Writes offline:** a small **outbox** (MMKV queue). Allowed offline: order status changes, product edits/drafts, coupon toggles. Disallowed offline (fail fast with honest UI): payments config, plan changes, anything money-moving.
- **Replay:** on reconnect, outbox replays in order with idempotency keys; UI shows per-item sync state (pending → synced / failed).
- **Conflict resolution:** server-side `updated_at` compare-and-set. Mutations carry `base_updated_at`; on mismatch the API returns `409 CONFLICT` with the server row → mobile shows a "this changed on web" diff card (keep mine / take theirs). For order *status*, conflicts auto-resolve forward-only (packed → shipped can't regress) — encode the status state machine in `packages/shared` so web and mobile agree by construction.
- **Cache invalidation:** realtime invalidation (§3) when online; TTL fallback (5 min stale-time) otherwise; hard purge on logout.

---

## 5. Authentication

Supabase Auth end-to-end — no parallel system.

- **Methods:** email/password (exists) · **Phone OTP** (Supabase native — *make this the primary mobile path; this audience lives on phone numbers, not email*) · Google (`signInWithIdToken` via native Google Sign-In) · **Apple — required by App Store review if any social login exists** (`expo-apple-authentication` → `signInWithIdToken`).
- **Sessions:** supabase-js auto-refresh; tokens in **expo-secure-store** (Keychain/Keystore), never AsyncStorage. Session persistence across launches via a custom storage adapter wired to secure store.
- **Multi-device:** native to Supabase (independent refresh tokens per device). Add a `devices` table (device_id, platform, push_token, last_seen) written at login — this powers both push routing and a "logged-in devices" settings screen.
- **Biometrics:** `expo-local-authentication` (Face ID/Touch ID/Android Biometric) gates *app access*, not the token — unlock decrypts the MMKV cache key. Optional setting, default prompted after first order (when there's something worth protecting).
- **Device verification:** new device → Resend email "New login on {device}"; high-value actions (payout config change) require re-auth.

---

## 6. Subscriptions & Entitlements

**The caveat the generic stack advice misses:** LaunchGrid bills via Razorpay in INR and sells a *business SaaS*. Apple/Google require In-App Purchase for digital features unlocked in-app — with 15–30% fees and no Razorpay. Three lawful paths:

1. **Companion-app model (recommended for v1):** the mobile app does **not sell subscriptions**. Like Netflix/Shopify's apps: plans display read-only ("manage your plan at launchgrid.in"), all upgrades happen on web. Zero store fees, zero RevenueCat needed, fastest to ship, fully compliant.
2. **IAP via RevenueCat (v2, optional):** add Apple/Google billing as *additional* payment rails. RevenueCat webhooks → a new `billing_events` table → the same `subscriptions` row web reads. Worth it only when data shows mobile-originated upgrade intent. Price mobile plans ~20% higher to absorb store fees, or push annual-on-web.
3. External-purchase links: regulatory landscape is shifting; revisit at v2, don't architect around it.

**Entitlement architecture (the part that must ship in v1):**
- Single source of truth: the existing `subscriptions.plan_tier` row.
- New endpoint **`GET /api/v1/entitlements`** → `{ plan, features: { max_products: 100, whatsapp_recovery: true, ai_ads: false, ... }, limits_used: {...} }` computed server-side from one `PLAN_FEATURES` map in `packages/shared`. **Web migrates to the same map** — this kills the scattered `plan === 'pro'` checks (and the starter/growth/scale naming mess) in one move.
- Mobile caches entitlements (TanStack), subscribes to `subscriptions` realtime changes → invalidate → UI gates flip within ~1s of a web upgrade. Same path in reverse when IAP lands. That's the Claude/Notion/Canva behavior: upgrade anywhere, unlocked everywhere, no manual config.
- **Feature flags** (distinct from entitlements): a `feature_flags` table (flag, audience, rollout %) served in the same `/entitlements` response. Start dead simple; adopt PostHog/GrowthBook only when experimentation demands it.

---

## 7. Push Notifications

**Infrastructure:** Postgres trigger on insert-worthy events → `notification_queue` table → **Inngest** consumer (already in stack) → Expo Push API (wraps FCM + APNs; revisit raw FCM only at serious scale) → receipts logged, dead tokens pruned.

| Category | Trigger | Notification (actionable, not spammy) | Default |
|---|---|---|---|
| **Orders** | order insert | "₹1,299 order from Priya — Kurta Set" → deep-link to order, **Fulfil** action button | ON, instant |
| Customer | abandoned checkout | "Someone left ₹899 in their cart" → one-tap send coupon | ON, max 2/day |
| Revenue | daily 8pm (Inngest cron) | "Today: ₹4,200 · 3 orders · 38 visitors" → dashboard | ON, skipped if zero activity (no shame pings) |
| Growth | weekly AI digest | One finding + one action (Conversion Analyzer output) | ON, weekly |
| Marketing | festival calendar, campaign windows | "Diwali is in 3 weeks — top sellers prep now" | OPT-IN |
| System | billing, trial, payout issues | "Trial ends tomorrow — your store stays, checkout pauses" | ON, cannot fully disable billing-critical |

Rules: every notification deep-links to the exact screen with the action pre-staged; per-category toggles in settings; hard cap 4/day except order alerts; quiet hours 22:00–08:00 IST except orders (merchant-configurable). **Order alerts are the #1 retention feature of the entire app — they get instant delivery, sound, and an Android high-priority channel.**

---

## 8. Mobile Dashboard & Mobile-First Features

**Dashboard = the web's co-pilot model, compressed.** Screen 1 answers "what should I do next?": Launch Readiness ring + ONE next action (impact + time, same `packages/shared` scoring) → today strip (revenue, orders, visitors — realtime) → unfulfilled orders (the actual to-do list) → one AI insight. Phases (Launch → ₹1L+) rotate emphasis exactly as on web — same data, same formulas, zero duplicated logic.

**Better-on-mobile features, priority order:**
1. **Instant order alert → one-tap fulfilment** (notification action: confirm → packed → share tracking via WhatsApp sheet) — the reason the app exists
2. **Camera product creation**: photo(s) → background-clean + Gemini (existing integration) writes title/description/price suggestion → publish in <60s. The mobile twin of the URL importer
3. **WhatsApp share tooling**: every entity (product, coupon, store) has a share affordance generating pre-written messages (native share sheet)
4. **Barcode scan** for inventory lookup/stock updates (expo-camera)
5. **Order voice notes** → transcribed to internal order notes (merchants think in voice)
6. **Status-story generator**: product → branded 9:16 image card for WhatsApp Status/Instagram Stories (the #1 Indian micro-commerce marketing channel)
7. **COD risk badge** on order alerts (when the trust-score work lands)
8. **Daily "since you were here"** rollup on app open (exists on web, native feels better)
9. AI Growth Coach chat surface; AI Store Auditor ("scan my store" → 3 fixes); receipt scanning for expense logs (later phases, same `/api/v1/ai/*` endpoints as web)

---

## 9. Security

- Tokens: **expo-secure-store** (hardware-backed Keychain/Keystore)
- Local cache: **MMKV with encryption key held in secure store** (biometric-gated)
- **Certificate pinning** via `expo-build-properties` + custom fetch (pin Supabase + launchgrid.in leaf certs, ship backup pins, OTA-update rotation runbook)
- Biometric unlock (§5); re-auth for payout/billing-config screens
- Device registry + new-device email (§5)
- RLS as the always-on second wall: even a compromised client can only touch its tenant's rows
- Secrets: none in the bundle beyond the Supabase anon key (public by design); EAS Secrets for build-time config
- App-level: jailbreak/root detection → warn-only (don't lock out; Indian device landscape), screenshot blocking on payout screens (Android `FLAG_SECURE`)

---

## 10. Analytics

Extend the existing in-house event pipeline (`store_events` pattern) with a `merchant_events` table — same philosophy: own your data, no vendor lock for core funnels.

- **Schema:** `merchant_events(tenant_id, user_id, event, props jsonb, platform, app_version, created_at)` — batched client → `POST /api/v1/events` (web adopts it too; one funnel store).
- **Canonical events:** `app_open, signup_started/completed, store_created, product_added{method}, payments_connected, store_shared, first_order_celebrated, notification_opened{category}, upgrade_viewed/started/completed, checklist_step_done{step}` + screen views.
- **The metrics that matter:** activation (signup → first product < 24h), readiness-score progression, D1/D7/D30 retention by phase, push opt-in + open rates by category, churn signals (no app open 7d + no orders → triggers a win-back, not a report).
- Crash/perf: Sentry (shared org with web — one pane). Defer Amplitude/PostHog until the team needs self-serve dashboards; the data model above exports cleanly when that day comes.

---

## 11. CI/CD

GitHub Actions + **EAS** (Expo Application Services):

```
PR        → lint · tsc · unit tests (jest) · shared-package contract tests
main      → EAS build (internal) → E2E smoke (Maestro on emulator) → TestFlight/Play Internal
release/* → EAS production build → staged rollout (10% → 50% → 100%, halt on crash spike)
hotfix    → EAS Update (OTA) for JS-only fixes — minutes, no store review
```
- **Channels:** `development` / `preview` (staging Supabase project) / `production`
- **Crash/monitoring:** Sentry for crashes + release health (crash-free sessions gate the staged rollout); Firebase Crashlytics optional duplicate on Android only if Play vitals demand it — don't run two crash SDKs by default
- Store metadata as code: `eas metadata` (fastlane-style)

**Testing pyramid + coverage gates:**
- Unit (Jest + RTL): `packages/shared` **90%+** (pricing, score, status machine — the logic both platforms trust); mobile lib/hooks 80%
- Integration: API client against a seeded local Supabase (the same one web tests use)
- E2E (Maestro — simpler than Detox, CI-friendly): 6 golden flows — login (OTP), see order, fulfil order, add product via camera, offline order view, entitlement gate. E2E must pass for release builds.
- Overall line-coverage gate: 70% (gate on *critical-path* coverage, not vanity totals)

---

## 12. App Store Readiness

- **Apple:** Sign in with Apple (required, §5) · privacy "nutrition labels" (account info, products, photos for product creation, coarse analytics — no tracking-across-apps → no ATT prompt needed) · companion-app billing wording: never mention prices/upgrades in-app without IAP (review rejection trigger) — "Manage plan on the web" with **no** tappable link (Apple rule) · permissions with purpose strings only at moment of use (camera → first product photo; notifications → after first order or during onboarding with the order-alert pitch)
- **Google Play:** Data-safety form mirroring the privacy policy (§ updated this sprint) · target API level current · staged rollout
- **Listing:** name "LaunchGrid — Business Manager"; screenshots tell the story: order alert lock-screen → one-tap fulfil → camera product creation → readiness score → revenue dashboard; description leads with "Your business in your pocket — know the second someone buys."
- **In-app onboarding:** login → (no store? "finish setup on web in 15 min" handoff with QR; store? straight to dashboard) → notification permission pitch framed as "never miss an order."

---

## 13. Roadmap

| Phase | Weeks | Ships | Exit criteria |
|---|---|---|---|
| **0 — Foundations** | 1–2 | Monorepo, `packages/shared` (plans/score/status), `/api/v1` aliasing, `/entitlements` endpoint, web migrated to shared PLAN map | Web unchanged in behavior, one plan vocabulary |
| **1 — Companion MVP** | 3–7 | Auth (email+OTP), dashboard (score/today/orders), order list+detail+fulfil, **push order alerts**, realtime, Sentry, EAS pipeline | Closed beta: 20 merchants, crash-free >99%, order-alert delivery <5s |
| **2 — Store ops** | 8–11 | Products (list/edit), camera product creation, coupons, WhatsApp share kit, offline reads+outbox, biometrics | Beta merchants run a full sale week without opening web |
| **3 — Launch** | 12–14 | Google/Apple sign-in, analytics dashboard, settings, store listings, staged rollout | Public on both stores |
| **4 — Growth layer** | 15+ | AI coach/auditor surfaces, status-story generator, barcode, RevenueCat IAP (if data justifies), web realtime adoption | Mobile DAU/MAU > 40% of active merchants |

**Scaling posture:** Vercel API + Supabase (with PgBouncer, read replicas at need) carry this architecture to ~1M merchants; the designed seams — transport behind the realtime abstraction, push behind the queue table, entitlements behind one endpoint — are exactly where you'd swap components, without a rewrite. The discipline that actually keeps the no-rewrite promise is organizational: **no business rule may exist only in the mobile repo.** If mobile needs logic, it lands in the API or `packages/shared` first.

---

*Companion docs: MERCHANT_JOURNEY_DESIGN.md (the UX this app implements), LAUNCH_READINESS.md (platform prerequisites — plan-tier unification is Phase 0 here for a reason).*
