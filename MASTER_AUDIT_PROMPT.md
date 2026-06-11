# LaunchGrid — Master Audit Prompt
> Paste this entire prompt into a new Claude session (with the codebase attached or in context) to run a full platform audit.
> Output: Score out of 10 per category + a prioritised TODO list for everything missing.

---

## AUDIT INSTRUCTIONS

You are auditing LaunchGrid — an all-in-one platform for Indian founders to launch a dropshipping/e-commerce business in under 5 minutes. The target customer is a first-time business owner with zero technical knowledge. The primary market is India (Tier 1 + Tier 2 cities, mobile-first, UPI payments, WhatsApp as primary communication channel).

For every category below:
1. Read the relevant source files listed
2. Score it /10 based on the criteria given
3. List what's working well (✅)
4. List what's broken, missing, or subpar (❌)
5. Add every ❌ item to a master TODO list at the end, tagged with priority: 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 NICE-TO-HAVE

At the end, produce:
- A summary scorecard (all categories, one line each)
- An overall platform health score /10
- A prioritised TODO list sorted by impact

---

## CATEGORY 1 — Technical Backend & API (Weight: High)
**Files to read:** `src/app/api/**`, `supabase/migrations/**`, `src/utils/supabase/**`, `src/actions/**`, `middleware.ts`

Score criteria:
- All API routes have auth guards (no unauthenticated access to merchant data)
- RLS policies cover every table (no table left without RLS)
- `subscription_status_enum` includes 'trialing' and 'archived' (migration 0010)
- Service role client (`src/utils/supabase/service.ts`) exists and is only used server-side
- Cron jobs exist for trial archival and email triggers (`/api/cron/**`)
- No N+1 queries in dashboard data fetching
- All API routes return consistent error shapes `{ error: string }`
- Environment variables documented (`.env.example` or README)
- No secrets committed to code (no hardcoded API keys)
- `vercel.json` exists with cron schedules registered
- Middleware correctly guards `/dashboard`, `/setup` routes
- Subdomain reservation lock works and expires correctly

---

## CATEGORY 2 — Database Schema & Migrations (Weight: High)
**Files to read:** `supabase/migrations/0000_initial_schema.sql` through latest migration

Score criteria:
- All enums match what the application code actually inserts (critical: `subscription_status_enum`)
- `store_events` table exists with correct indexes
- `tenant_missions` has `step_5_shared` column
- `subscriptions` has `trial_started_at`, `trial_expires_at`, `trial_email_18h_sent`, `trial_email_23h_sent`
- `tenants` has `featured_until`
- `business_configs` has all required fields: `whatsapp_number`, `gstin`, `gst_rate`, `meta_title`, `meta_description`, `theme_color`, `template_style`
- Indexes on high-traffic tables (orders by tenant_id, products by tenant_id, store_events by store_id)
- Foreign keys all have appropriate ON DELETE behavior
- No orphan records possible (all child tables reference parents with CASCADE or RESTRICT)
- Migration files are sequential and non-conflicting

---

## CATEGORY 3 — Authentication & Security (Weight: Critical)
**Files to read:** `middleware.ts`, `src/app/api/**`, `src/utils/supabase/**`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`

Score criteria:
- Auth state correctly handled on all protected routes
- No API route accessible without valid session (test: call without auth header)
- Tenant isolation enforced at DB level (RLS), not just app level
- No tenant can read another tenant's orders/products/customers
- Service role key not exposed to client-side bundles
- CSRF protection on state-changing API routes
- Rate limiting on subdomain check endpoint (prevent enumeration)
- No user-supplied content rendered as HTML without sanitization
- Password reset flow exists
- Session expiry handled gracefully (redirect to login, not crash)
- `CRON_SECRET` validates all cron invocations

---

## CATEGORY 4 — Frontend Architecture & Code Quality (Weight: Medium)
**Files to read:** `src/app/**`, `src/components/**`, `src/app/(marketing)/layout.tsx`

Score criteria:
- No double-render bugs (marketing layout is passthrough)
- No hydration errors in AnimatedCounter, SectionReveal, or EditorialHeadline
- Framer Motion viewport margins fire early enough (no invisible-on-anchor-jump)
- All `useClient` components are actually client components (correct directive placement)
- No `any` types in critical paths (type safety for tenant, orders, products)
- Error boundaries exist for dashboard widgets
- Loading skeletons on data-dependent components
- No console errors on first load
- Unused imports cleaned up
- Component folder structure is logical (ui-landing / dashboard / store / animations)

---

## CATEGORY 5 — UI/UX Design Quality (Weight: High)
**Files to read:** All components, screenshot the live app if possible

Score criteria:
- Design system is consistent (all buttons use same border-radius, spacing scale)
- Typography hierarchy is clear (Playfair for headlines, Inter for body — used consistently)
- Color tokens used everywhere (no hardcoded hex values in components)
- Dark-text-on-light and light-text-on-dark both readable (contrast ≥ 4.5:1)
- All interactive elements have hover + active states
- All form inputs have focus rings (accessibility)
- Error states are visible and helpful (not just red border, but error message text)
- Empty states are instructive (tell user exactly what to do next)
- Loading states exist on all async actions (no button that just freezes)
- Mobile layout tested: dashboard, store, checkout, onboarding all work on 375px width
- No horizontal scroll on any page (except intentional horizontal carousels)
- Modals have backdrop dismiss + keyboard Escape close

---

## CATEGORY 6 — Onboarding & First-Time User Experience (Weight: Critical)
**Files to read:** `src/app/(marketing)/onboarding/**`, `src/app/setup/**`, `src/app/(portal)/dashboard/**`, `src/components/dashboard/TrialWinTracker.tsx`

Score criteria:
- Onboarding CTA says "Start Free — 24 Hours, No Card Required" (not "₹4,999")
- Time from landing page to store live is under 5 minutes (manually test this)
- Provisioning page animation builds psychological excitement
- Setup page (3 steps) is self-explanatory with zero support needed
- Dashboard greets new user with a clear "next action" (not overwhelming)
- `TrialWinTracker` shows 5-milestone progress during trial
- Milestones tick automatically as user completes actions
- First product import is discoverable within 30 seconds of landing on dashboard
- WhatsApp share button is prominently placed with pre-written message
- The 24-hour trial countdown is shown in hours/minutes, not days
- "Store is live" confirmation moment is emotionally rewarding (animation, celebration)
- Zero dead ends in the onboarding flow (every state has a CTA)

---

## CATEGORY 7 — Dashboard & Merchant Analytics (Weight: High)
**Files to read:** `src/app/(portal)/dashboard/DashboardClient.tsx`, `src/app/(portal)/dashboard/page.tsx`

Score criteria:
- Revenue, orders, conversion rate, active visitors cards all show real data (not static)
- Traffic sources breakdown is shown (even if estimated)
- Conversion funnel (visitors → product views → cart adds → orders) is displayed
- Top products panel shows real products with view/sale counts
- Real visitor data from `store_events` replaces simulated data when events exist
- "Today's Activity" cards show during trial (visitors, product views, cart adds)
- Compliance tracker fires correctly at all GST thresholds
- First Sale Mission shows correct step completion state
- Referral widget shows live paid/pending/days-credited counts
- Dashboard renders in under 2s (check server component data fetching)
- Analytics data updates without requiring a page reload (or revalidation is fast)
- No analytics widgets show data from other tenants (RLS verified)

---

## CATEGORY 8 — Store Builder & Storefront (Weight: High)
**Files to read:** `src/app/store/[slug]/**`, `src/app/(portal)/dashboard/settings/storefront/**`

Score criteria:
- Store home page renders with correct theme/color/template
- Product grid shows all active products with images, prices, compare-at prices
- Product detail page shows all product info + add to cart button
- Cart page calculates totals correctly (including applied coupons)
- Checkout page collects name, phone, email, address correctly
- Checkout fires order creation and payment intent correctly
- Order confirmation page renders after successful payment
- Order tracking page accessible via public URL
- Store reflects correct GST-inclusive pricing based on config
- WhatsApp support button appears on storefront (if number configured)
- Store is mobile-responsive (test on 375px width)
- Product images load correctly (no broken img tags)
- SEO meta tags correct on store home + product pages (Open Graph, Twitter Card)
- Archived trial stores show "temporarily unavailable" on checkout — NOT a 404

---

## CATEGORY 9 — SEO: Technical (Weight: High)
**Files to read:** `src/app/store/[slug]/**`, `src/app/(marketing)/**`, any `generateMetadata` functions

Score criteria:
- Every marketing page has unique, keyword-optimised `<title>` and `<meta description>`
- Store home pages have correct `<title>` = "{BusinessName} — Official Store"
- Product pages have correct `<title>` = "{ProductName} | {BusinessName}"
- Open Graph tags on all pages (og:title, og:description, og:image)
- Twitter Card tags on all pages
- Canonical URLs on all pages (no duplicate content)
- Robots.txt allows indexing of marketing pages, blocks `/dashboard`, `/api`
- XML Sitemap exists at `/sitemap.xml` (or each store has one)
- Schema.org JSON-LD injected: `Organization` on homepage, `Product` on product pages, `BreadcrumbList`
- No pages with `noindex` accidentally set
- Heading hierarchy correct (one H1 per page, H2/H3 for sections)
- Image alt text present on all product images
- Page URLs are human-readable slugs (not UUIDs)
- Internal links between pages (blog → features → pricing → signup)
- `/faq` page exists with FAQ schema
- `/pricing` page exists with feature comparison

---

## CATEGORY 10 — SEO: Content & Marketing Pages (Weight: High)
**Files to read:** `src/app/(marketing)/**` — all pages

Score criteria:
- Homepage headline targets primary keyword ("start online store India" or similar)
- `/faq` page covers 20+ real questions that first-time founders search for
- `/pricing` page has full feature comparison vs competitors (Dukaan, Shopify)
- `/blog` exists with at least 2 published articles targeting long-tail keywords
- `/discover` page exists and is indexable (features new stores)
- Individual blog posts have: H1, meta description, FAQ schema, internal links to features
- All marketing pages pass Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms)
- LaunchGrid appears in Google Search Console (property verified)
- No 404s on linked internal pages
- All footer links resolve correctly
- Footer includes: Pricing, FAQ, Blog, Support, Terms, Privacy, Refund, Contact
- `/vs-dukaan` or `/vs-shopify` comparison pages exist (massive intent traffic)

---

## CATEGORY 11 — Meta Ads & Paid Acquisition Setup (Weight: High)
**Files to read:** `src/app/(portal)/dashboard/settings/**`, homepage code, storefront layout

Check criteria (some require manual verification in Meta Business Manager):
- Meta Pixel ID field exists in `business_configs` table (`meta_pixel_id` column)
- Meta Pixel is injectable on storefront pages (merchant can add their pixel)
- LaunchGrid's own Meta Pixel is installed on marketing pages (for retargeting signups)
- Facebook `_fbp` cookie set correctly on first visit
- Standard events firing: PageView, ViewContent (product page), AddToCart, InitiateCheckout, Purchase
- `/onboarding` page fires `Lead` event on successful form submit
- Dashboard has "Connect Meta Pixel" one-click setup section
- LaunchGrid has ad account, Business Manager, and domain verified at `launchgrid.in`

**Meta Ad Templates (manually verify these exist or need creation):**
- [ ] Awareness ad template: "Launch your store in 5 minutes — no coding"
- [ ] Retargeting ad template: "Your store is almost ready — finish setup"
- [ ] Conversion ad template: "Join 1,200+ founders — ₹999/month"
- [ ] Video ad script: 30-second founder journey (idea → first sale)
- [ ] Carousel ad: 5 feature highlights (analytics, payments, SEO, themes, support)
- [ ] Lookalike audience: seed from existing paid subscribers
- [ ] Target audience: 22–35, India, interests: "entrepreneurship", "dropshipping", "side hustle", "Meesho seller"
- [ ] Retargeting pixel audience: visited `/onboarding` but didn't complete

---

## CATEGORY 12 — Google Search Console & Organic Search (Weight: High)
Check criteria (requires manual verification):
- [ ] Google Search Console property added for `launchgrid.in`
- [ ] Sitemap submitted to GSC
- [ ] Zero "Coverage errors" (404s, server errors on indexed pages)
- [ ] Core Web Vitals report: all pages in "Good" threshold
- [ ] Rich results (FAQ, Product schema) appearing in GSC Enhancement reports
- [ ] Top performing queries identified (what keywords drive traffic)
- [ ] Click-through rate on main keywords > 3% (if data available)
- [ ] Google Analytics 4 property connected to GSC
- [ ] Google My Business profile created for LaunchGrid (improves brand search presence)
- [ ] Bing Webmaster Tools added (secondary but easy win)
- [ ] No manual actions or security issues in GSC

---

## CATEGORY 13 — Email Marketing & Lifecycle Automation (Weight: High)
**Files to read:** `src/app/api/cron/**`, `src/lib/emails.ts`

Score criteria:
- Welcome email sends after signup (immediately)
- Trial warning email sends at T+18h (idempotent — won't double-send)
- Final warning email sends at T+23h (idempotent)
- Post-trial "Your store is archived" email sends when status changes to 'archived'
- Email provider is connected (Resend, SendGrid, or equivalent — not just `console.log`)
- Emails are branded (LaunchGrid logo, name, colors)
- All emails include unsubscribe link (legally required in India)
- "From" address is `hello@launchgrid.in` (not `noreply@`)
- Subject lines are personalised with business name
- Each email has one clear CTA (not multiple links competing)
- Merchant's customers receive: order confirmation, shipped notification, delivery confirmation
- Abandoned cart recovery email fires after 1 hour (check existing implementation)

---

## CATEGORY 14 — WhatsApp Marketing (Weight: High — India-specific)
**Files to read:** `src/app/(portal)/dashboard/**`, `src/app/store/[slug]/**`

Score criteria:
- WhatsApp share button pre-fills message with store name + URL (dashboard)
- Storefront has floating WhatsApp button (customer support)
- "Share store" one-tap on dashboard generates a pre-written WhatsApp message
- Store link in WhatsApp generates a proper link preview (Open Graph image set)
- Abandoned cart recovery includes WhatsApp outreach option (not just email)
- Dashboard nudge: "Share on WhatsApp to get your first visitor" — shown before first order
- WhatsApp number validated on input (must start with +91 or 91 for India)

---

## CATEGORY 15 — Referral & Viral Growth Mechanics (Weight: High)
**Files to read:** `src/app/(portal)/dashboard/DashboardClient.tsx`, `src/app/r/[code]/page.tsx`, `src/app/api/referrals/**`

Score criteria:
- Referral link exists and is correctly formatted (`launchgrid.in/r/{subdomain}`)
- Visiting a referral link sets a cookie/session with the referrer's code
- At signup, referrer code pre-fills in the signup form
- After referred user pays, referrer gets +7 free days
- Dashboard shows paid referrals count, pending count, and days credited
- `launchgrid.in/r/{code}` page exists, shows landing page (not a blank redirect)
- `/api/referrals/activate` marks referral as credited correctly
- "Powered by LaunchGrid" footer link on every store drives free traffic back to homepage
- "Powered by LaunchGrid" link is crawlable by Google (follow link, not nofollow)

---

## CATEGORY 16 — Pricing, Conversion & Revenue Mechanics (Weight: Critical)
**Files to read:** `src/components/signup-journey/S09_Pricing.tsx`, `src/app/(marketing)/pricing/page.tsx`, `src/app/(portal)/dashboard/DashboardClient.tsx`

Score criteria:
- Pricing page has 3 tiers: Free Trial (24h), Starter (₹999/month), Pro (₹2,499/month)
- Free trial CTA says "Start Free" — not a price
- Each plan tier shows a clear feature list (what you get vs what you don't)
- Upgrade modal exists in dashboard with plan comparison
- Urgency is present on pricing page ("X stores launched this week")
- Annual billing option with discount shown
- Money-back guarantee stated (even 7-day is enough)
- Transaction fee model explained (free plan has % fee, paid plans have lower/no fee)
- Pricing page answers objections: "Is this safe?", "What if I want to cancel?", "Will it work for my niche?"
- Upsell moment fires at correct trigger: first order received → "Upgrade to Pro to lower fees"
- Compliance upsell fires at ₹1L milestone
- Trial expiry modal fires at T-1h remaining

---

## CATEGORY 17 — Store Analytics & Conversion Tracking (Weight: High)
**Files to read:** `src/app/api/track/route.ts`, `src/components/store/TrackPageView.tsx`, `src/app/(portal)/dashboard/page.tsx`

Score criteria:
- `/api/track` endpoint exists and accepts `page_view`, `product_view`, `cart_add`, `checkout_start`
- `store_events` table exists with `store_id`, `event_type`, `product_id`, `session_id`, `referrer`, `created_at`
- `TrackPageView` component fires on store home page load (not double-fires on re-render)
- `product_view` event fires on product detail page
- `cart_add` event fires when "Add to Cart" is clicked
- `checkout_start` event fires when checkout page loads
- Dashboard shows today's real visitor count (not simulated)
- Dashboard shows real product view count
- Dashboard shows real cart add count
- Traffic source breakdown uses `referrer` field from events
- Real conversion funnel uses real event counts
- Session deduplication: same session_id doesn't inflate visitor count
- Events table has index on `(store_id, created_at DESC)` for fast queries

---

## CATEGORY 18 — Performance & Core Web Vitals (Weight: High)
**Manual test:** Run Lighthouse on homepage, onboarding page, and a store page

Score criteria:
- Homepage Lighthouse Performance score ≥ 85
- Homepage LCP (Largest Contentful Paint) < 2.5s
- Homepage CLS (Cumulative Layout Shift) < 0.1 (no layout jumps on load)
- Homepage FID / INP < 100ms
- Store page Performance score ≥ 80
- All images use `next/image` (or have `width`/`height` to prevent CLS)
- Fonts are preloaded (Playfair Display, Inter) — no FOUT (Flash of Unstyled Text)
- No render-blocking JavaScript
- Framer Motion animations don't cause layout thrash
- Code splitting: dashboard JS bundle not loaded on marketing pages
- API routes respond in < 500ms under normal load
- Store pages are statically generated or ISR (not full SSR on every request)

---

## CATEGORY 19 — Mobile Experience (Weight: Critical — India is 90%+ mobile)
**Manual test:** Test on iPhone 13 (390px) and a mid-range Android (360px)

Score criteria:
- Homepage horizontal scroll carousel works on touch (swipe feels natural)
- Onboarding form is usable with on-screen keyboard open (inputs not hidden behind keyboard)
- Dashboard is readable without horizontal scroll on 390px
- Product import form usable on mobile
- Storefront checkout works on mobile (address form, payment)
- All touch targets are ≥ 44px (Apple HIG minimum)
- No hover-only interactions on mobile (hover states don't block functionality)
- Font size ≥ 14px on all body text (no squinting required)
- "Share on WhatsApp" opens WhatsApp app directly on mobile (not web.whatsapp.com)
- Trial countdown visible on mobile dashboard

---

## CATEGORY 20 — Accessibility (Weight: Medium)
**Files to read:** All components

Score criteria:
- All images have descriptive `alt` text
- All form inputs have `<label>` elements (not just placeholder)
- Error messages are linked to inputs via `aria-describedby`
- Focus ring visible on all interactive elements (not just styled-away)
- Buttons with icons have `aria-label` (e.g., close button)
- Color is not the only indicator of state (e.g., not just "red border" for errors)
- Modal has focus trap (keyboard can't Tab outside open modal)
- Skip-to-main-content link on all pages
- Screen reader can navigate dashboard without visual layout
- WCAG 2.1 AA contrast ratio on all text (≥ 4.5:1 for normal text, ≥ 3:1 for large)

---

## CATEGORY 21 — Trust, Social Proof & Credibility (Weight: High)
**Files to read:** `src/app/(marketing)/**`, homepage components

Score criteria:
- Live merchant count on homepage is real data (or realistic placeholder with clear update plan)
- Live revenue counter is real or clearly aspirational (not fake)
- Testimonials exist (even 1 real one is better than 0)
- Trust badges visible: "Razorpay Secured", "SSL", "Made in India"
- Legal pages exist and are linked: Terms of Service, Privacy Policy, Refund Policy
- Contact page or support email is visible (builds trust)
- Pricing page has money-back guarantee statement
- "As seen in" or press section (even if empty now, plan for it)
- `/discover` page shows real active stores (social proof the platform works)
- FAQ addresses common trust objections: "Will my data be safe?", "Can I cancel anytime?"

---

## CATEGORY 22 — Organic Growth & Network Effects (Weight: High)
**Files to read:** All storefront pages, marketing pages

Score criteria:
- Every store has "Powered by LaunchGrid" footer link (free backlinks at scale)
- `/discover` page is public and indexed (each featured store = organic traffic)
- Blog covers high-intent keywords: "how to start dropshipping India", "best platform India"
- LaunchGrid URL shortener or `launchgrid.in/r/{code}` referral link is shareable
- Store sharing generates a social-ready link preview (OG image set correctly)
- "Start your own store" CTA on every public storefront (viral loop)
- Blog posts interlink to feature pages and `/onboarding` (link juice flows to conversion pages)
- Free tools planned (GST calculator, profit margin calculator) — each drives organic traffic
- Niche-specific landing pages planned (`/fashion-store`, `/food-business`) — high SEO intent

---

## CATEGORY 23 — Competitive Positioning (Weight: Medium)
**Research:** Compare LaunchGrid vs Dukaan, Shopify, Meesho Supplier, WooCommerce

Score criteria:
- LaunchGrid has a faster onboarding than Dukaan (Dukaan requires manual setup)
- LaunchGrid is cheaper than Shopify for Indian SMBs (Shopify Basic = ~₹1,994/month)
- Unique differentiators clearly stated on homepage and pricing page
- `/vs-dukaan` comparison page exists (or planned)
- `/vs-shopify` comparison page exists (or planned)
- India-specific features highlighted: UPI, WhatsApp, GST, Indian shipping partners
- Dropshipping catalog differentiated from generic platforms (curated Indian suppliers)
- LaunchGrid's 5-minute setup claim is verifiably true (time yourself)

---

## CATEGORY 24 — Notifications & Re-engagement (Weight: Medium)
**Files to read:** Email files, dashboard, store order flow

Score criteria:
- New order notification fires to merchant (email or WhatsApp)
- Trial warning emails fire at correct intervals
- Post-purchase email fires to buyer (order confirmation)
- Abandoned cart recovery email fires after configured delay
- Merchant can configure which notifications they receive
- No notification spam (deduplication flags in DB)
- Notification emails link to the correct dashboard section

---

## CATEGORY 25 — Documentation & Developer Health (Weight: Low-Medium)
**Files to read:** All `.md` files in repo root, README

Score criteria:
- `README.md` explains what LaunchGrid is and how to run it locally
- `.env.example` lists all required environment variables
- `PRODUCT_ROADMAP_V2.md` exists and is up to date
- `FIRST_SUCCESS_EXPERIENCE_SPEC.md` exists with build order
- Migration files are sequential and commented
- No dead code (commented-out blocks in production components)
- No `TODO` comments in critical production paths
- `package.json` scripts cover: dev, build, lint, type-check
- TypeScript has no `tsc --noEmit` errors
- ESLint has no errors (warnings are acceptable)

---

## SCORING MATRIX

After auditing each category, fill this in:

| # | Category | Score /10 | Priority |
|---|----------|-----------|----------|
| 1 | Technical Backend & API | — | High |
| 2 | Database Schema & Migrations | — | High |
| 3 | Authentication & Security | — | Critical |
| 4 | Frontend Architecture | — | Medium |
| 5 | UI/UX Design Quality | — | High |
| 6 | Onboarding & First-Time UX | — | Critical |
| 7 | Dashboard & Merchant Analytics | — | High |
| 8 | Store Builder & Storefront | — | High |
| 9 | SEO: Technical | — | High |
| 10 | SEO: Content & Marketing Pages | — | High |
| 11 | Meta Ads & Paid Acquisition | — | High |
| 12 | Google Search Console | — | High |
| 13 | Email Marketing & Automation | — | High |
| 14 | WhatsApp Marketing | — | High |
| 15 | Referral & Viral Growth | — | High |
| 16 | Pricing & Conversion Mechanics | — | Critical |
| 17 | Store Analytics & Event Tracking | — | High |
| 18 | Performance & Core Web Vitals | — | High |
| 19 | Mobile Experience | — | Critical |
| 20 | Accessibility | — | Medium |
| 21 | Trust & Social Proof | — | High |
| 22 | Organic Growth & Network Effects | — | High |
| 23 | Competitive Positioning | — | Medium |
| 24 | Notifications & Re-engagement | — | Medium |
| 25 | Documentation & Dev Health | — | Low |
| **TOTAL** | **Platform Health Score** | **— / 10** | |

**Weighted score formula:**
- Critical categories (3, 6, 16, 19): average × 1.5
- High categories (1, 2, 5, 7-15, 17-18, 21-22): average × 1.0
- Medium/Low (4, 20, 23-25): average × 0.7
- Divide total by max possible to get final /10

---

## TODO LIST TEMPLATE

At the end of your audit, produce a prioritised TODO list in this format:

```
🔴 CRITICAL — Fix immediately (breaks core flow or loses users)
[ ] [Category X] Description of what's missing/broken

🟠 HIGH — Fix before public launch (hurts conversion or trust)
[ ] [Category X] Description

🟡 MEDIUM — Fix in next sprint (improves experience)
[ ] [Category X] Description

🟢 NICE-TO-HAVE — Backlog (future enhancement)
[ ] [Category X] Description
```

---

## HOW TO USE THIS PROMPT

**Option A — Full audit (recommended):**
Paste this entire file into a new Claude session. Attach or describe the codebase. Claude will work through all 25 categories, score each one, and produce a complete TODO list.

**Option B — Targeted audit:**
Copy only the categories you want to check (e.g., Categories 9, 10, 12 for an SEO audit before launch).

**Option C — Pre-launch checklist:**
Focus on all 🔴 CRITICAL categories first. Only ship when all Critical categories score ≥ 7/10.

**Option D — Weekly health check:**
Run this monthly after significant feature additions to ensure nothing regressed.

---

*Last updated: June 2026 | LaunchGrid Platform Audit Framework*
