# LaunchGrid — Launch Readiness Review
**Date:** June 11, 2026 · **Mode:** Founder pre-launch audit (iterative fix loop)
**Scope of this session's fixes:** see "Fixed today" below — these are live in the codebase pending your local `npm run build` + deploy.

---

## Final Score: 68 / 100 — *Launchable as a controlled beta, not a public blast*

| Area | Score | One-line verdict |
|---|---|---|
| Product | 8/10 | Core flows complete and unusually deep (UPI, COD+OTP, GST, import) |
| UX | 7/10 | Co-pilot dashboard + focused mode shipped; portal-wide consistency pass pending |
| Performance | 6/10 | Heavy motion on landing; no image CDN; untested Lighthouse mobile |
| Legal | 7/10 | Policies present + DPDP-grade privacy shipped today; entity details & merchant ToS gaps |
| Monetization | 4/10 | **Upgrade path is a WhatsApp message — no self-serve billing. Biggest gap.** |
| Retention | 5/10 | Score/phase/digest design done; WhatsApp engine not built (needs API account) |
| Marketing | 7/10 | SEO/GEO layer solid, asset pack ready; zero real testimonials/case studies yet |
| Scalability | 7/10 | Multi-tenant schema sound; rate limiting partial; no load testing |

---

## Fixed today (this session's loop)
1. **Upgrade flow went to placeholder WhatsApp number 919999999999 with wrong prices (₹999/₹3,999 vs public ₹1,999/₹9,999).** Revenue-zero bug. → Now env-driven (`NEXT_PUBLIC_UPGRADE_WHATSAPP`), prices/names aligned to the pricing page, and falls back to /pricing if env is unset so no upgrade intent is ever lost.
2. **OG image 404 on every social share** (metadata pointed to non-existent /og-image.png). → File-convention opengraph-image now serves; broken references removed (root, homepage, pricing).
3. **Trial length said "24 hours" in 6 places and "7 days" in 8 others** (DB truth: 7 days). Trust-killer + potential unfair-trade issue. → All user-facing copy unified to 7 days.
4. **Password reset didn't exist** ("Forgot?" linked to `#`). Guaranteed day-one support tickets + lost accounts. → Full flow shipped: /forgot-password (email link via Supabase) + /reset-password (session-validated, expired-link state, auto-login).
5. **Privacy policy didn't disclose GTM, ad pixels, UTM tracking, or processors** — DPDP + Meta-policy exposure now that tracking is live. → Rewritten: processor list, merchant-pixel disclosure, retention, grievance officer, DPDP roles.
6. Earlier in session (same loop, prior passes): fake metric tickers and fictional testimonials removed; simulated dashboard data replaced with real; funnel + UTM attribution wired end-to-end; Launch Readiness Score with impact/time guidance; hero idea-input; checkout trust signals.

---

## Critical — must fix before public launch (you, not code)
1. **Set `NEXT_PUBLIC_UPGRADE_WHATSAPP`** to a real number you answer — today this is your entire billing system. Then build self-serve Razorpay subscriptions within 30 days (4/10 monetization score is mostly this).
2. **Run `supabase/migrations/0018_utm_and_purchase_events.sql`** — UTM attribution and purchase-funnel events silently no-op without it.
3. **Run `npm run build` locally** — ~40 files changed this session; the sandbox cannot compile here. Fix anything red before deploy.
4. **Plan-tier unification:** DB uses `starter/pro/premium`, pricing page uses `starter/growth/scale`, modal sold a third set (now aligned cosmetically). Pick one vocabulary, migrate the enum, create `src/lib/plans.ts` as single source of truth. Until then any billing automation will mis-gate features.
5. **Legal entity details:** Terms/contact pages need the registered entity name, address, and CIN. Required for Razorpay live mode and DPDP grievance compliance.
6. **Test the full money path once with real money:** signup → store → product → real ₹10 UPI order → webhook → order appears → fulfil. No launch until this passes on production.

## High priority — within 7 days
- Recruit 5–10 concierge beta merchants → first sales → consented case studies (unblocks the empty RealStoresGallery and all marketing).
- Razorpay self-serve subscription checkout (replaces WhatsApp upgrades).
- Lighthouse mobile pass on landing (motion-heavy sections; target ≥85 on a mid-range Android).
- WhatsApp Business API account (Interakt/Gupshup) → order alerts first, digests second.
- Returns/refund workflow v1 (policy page exists; product flow doesn't).
- Verify Supabase backups + test a restore (currently assumed, never tested).

## Medium — within 30 days
- Merchant-facing ToS addendum (marketplace/processor relationship, COD liability, payout terms).
- Shiprocket/Delhivery integration (the #1 post-first-order need).
- Rate limiting on auth + checkout endpoints (track API has it; auth doesn't).
- Pricing experiment from BOARDROOM_AUDIT (₹999 entry tier A/B) — current mid-tier pricing remains the biggest conversion risk.
- AI Ad Creator v1 + Conversion Analyzer digest (designs in MERCHANT_JOURNEY_DESIGN.md).

## Nice to have — roadmap
- Bio-link page (Stan Store parity) · COD trust network · merchant community · First-Sale public cards · capital/working-capital exploration (5-year vision docs).

---

## The founder one-liner
The product is more ready than the business. Code-wise you can launch tomorrow; revenue-wise you have a WhatsApp number for a billing system, zero real testimonials, and a pricing scheme with three names per plan. Spend the next 7 days on: one real money-path test, ten concierge merchants, and Razorpay subscriptions — then launch loudly with MARKETING_ASSETS.md.
