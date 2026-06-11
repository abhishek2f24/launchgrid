# LaunchGrid Merchant Journey — Complete Experience Design
**Panel:** Product (Shopify), Growth (Duolingo), Design (Linear), Onboarding (Stripe), Behavioral Psychology, Retention, PLG
**Principle:** The user should never ask "what should I do next?" LaunchGrid always knows.
**Identity:** A business co-pilot, not a software dashboard.
**Implementation note:** This builds on what's already shipped — the Merchant Success Score card (DashboardClient), tenant_missions schema, trial engine, store_events funnel, and the idea-input hero. Where this doc says "exists," it's live code; where it says "build," it's new.

---

## 1. The One Question

Every screen in LaunchGrid answers a single question the merchant is silently asking:

> **"Am I ready to make money yet?"**

The answer is the **Launch Readiness Score (0–100)** — already shipped in v1 as the Success Score card. This document makes it the spine of the entire product: every page, email, nudge, and upgrade prompt derives from the score and the merchant's current **phase**.

### Score formula (exists, refined here)
| Milestone | Points | Emotional framing (use this copy, never the mechanical version) |
|---|---|---|
| Store live | 10 | "Your store has an address on the internet." |
| 3+ products with photos | 15 | "You have something to sell." (partial credit: 7 for 1–2) |
| Payments connected | 15 | "Customers can now pay you instantly." |
| Store shared once | 15 | "The world knows you exist." |
| First 10 visitors | 10 | "People are looking at your products." |
| First cart add | 5 | "Someone wants what you sell." |
| **First order** | **30** | "You are officially in business." |

Bands map to **Store Status** (professional, not gamified):
`0–35 Building` · `36–65 Ready` · `66–85 Selling` · `86–100 Growing`

### The recommendation block (build — extends the shipped card)
Every incomplete milestone carries three metadata fields, surfaced as:

```
Launch Readiness: 55 / 100 — Ready

Next highest-impact action: Connect payments
Why it matters: Customers can pay the moment they want to buy
Time required: 3 minutes
```

Impact statements must be honest and directional ("stores with payments connected convert checkout intent into orders"), never invented statistics. Time estimates must be real (test them).

---

## 2. The Complete Journey, Screen by Screen

### Stage 1 — Landing (exists, v2 shipped)
Idea input in hero → `?idea=` carries to onboarding. The journey begins before signup: the visitor has already *typed their dream*. That's commitment-consistency working before the account exists.

### Stage 2 — Store Creation BEFORE Signup (exists: /onboarding)
Name, niche, subdomain — no password yet. The provisioning theater ("Forging your empire") builds anticipation. **Key psychology: the user must have something to lose before being asked to commit.** By signup, they own a store-in-waiting.

### Stage 3 — Signup (exists, refine)
Frame as claiming, not registering: headline **"Save your store"** instead of "Create account." Email + password only; referral collapsed. Post-signup → dashboard, never a confirmation dead-end.

### Stage 4 — First Login: The Co-Pilot Moment (build)
The dashboard's first render is NOT the full command center. It's a single focused panel:

```
┌──────────────────────────────────────────────┐
│  {Business name} is live at {subdomain}.     │
│  launchgrid.in                               │
│                                              │
│  Launch Readiness: 25/100 — Building         │
│  ─────────●──────────────────────            │
│                                              │
│  Your store needs products.                  │
│  Fastest way: paste any Meesho/Amazon link.  │
│                                              │
│  [ Paste a product link ]  [ Add manually ]  │
│                                              │
│  ⌄ Everything else (revenue, visitors,       │
│    settings) unlocks below as you build      │
└──────────────────────────────────────────────┘
```

Analytics cards render **collapsed/dimmed** until there is data to show (no zero-walls). Implementation: gate the metrics rows behind `score >= 36`, show the SuccessScoreCard full-width before that.

### Stage 5 — First Product (exists, refine)
- URL import is the hero path; manual is secondary.
- After 1st product: "1 of 3 — stores with 3+ products get taken seriously. Add 2 more?" with one-click "import similar" suggestions.
- After 3rd: status flips Building → Ready. Full-width moment: **"Your store is now capable of accepting orders."**

### Stage 6 — Payments (exists, reframe)
- UPI path first (2 min), Razorpay BYOK as "when you're ready for cards."
- Completion copy: **"Customers can now pay you instantly."** Never "Configuration saved."
- Add a ₹1 self-test button: "Send yourself ₹1 to see what your customers see." (Verifies setup AND creates the first real checkout experience — the merchant becomes their own first customer.)

### Stage 7 — Domain (progressive discovery, the template for all premium gates)
```
Your store address
● launchgrid.in/yourbrand        — live now, free
○ yourbrand.in                   — custom domain
  Builds trust · Better SEO · Yours forever
  Included from the Starter plan → [See how it looks]
```
"[See how it looks]" renders their actual store under the custom domain in a preview frame — **show value before restriction.** Never a lock icon without a preview.

### Stage 8 — Customization (exists: StorefrontDesigner)
Positioned AFTER products and payments (revenue-critical steps first). One nudge only: "Stores with a logo get more repeat visits — add yours (1 min)."

### Stage 9 — Marketing Setup (exists, sequence it)
Unlocks visually at score ≥ 50. Order: (1) Share to WhatsApp (free, instant), (2) first coupon with pre-written share message, (3) Meta Pixel/GA4 connect ("be ready for ads before you spend a rupee"), (4) AI Ad Creator tease (see §5).

### Stage 10 — First Order (exists: PanicStateModal → reframe as Celebration + Guide)
Two-beat experience: **Beat 1 — celebrate:** full-screen, confetti-free, typographic: "Your first order. You're officially in business." with order details. **Beat 2 — guide:** "Here's what to do in the next 24 hours: confirm → pack → mark shipped." The existing panic modal becomes this guided checklist. Then: "Customers trust sellers who reply fast — want order alerts on WhatsApp?" (retention hook planted at peak emotion).

### Stage 11 — Growth Phase (build — see §6)

---

## 3. Merchant Command Center (dashboard architecture)

Three zones, strictly ordered:

**Zone 1 — The Answer (always first):** Launch Readiness Score + status + next action + impact + time. Exists; extend with impact/time metadata.

**Zone 2 — The Pulse (appears at score ≥ 36):** Today's revenue, orders, visitors — real numbers only (shipped). One AI insight line when data exists: "Your visitors peak 7–9 pm — share your store in the evening."

**Zone 3 — The Depth (collapsed by default):** funnel, traffic sources, campaigns, top products (all exist). Expanded state remembered per merchant.

Phase-aware: the same three zones, but contents rotate by phase (§6). The dashboard is a *living document of their business*, not a fixed layout.

---

## 4. Progress System (professional, not gamified)

No badges, trophies, streaks, or points-as-currency. The score IS the progress system, because it maps 1:1 to business reality. Three presentation rules:

1. **Progress is stated as capability, not completion.** "Your store can now accept orders" — never "Step 4 done ✓" as the primary line (checkmark is secondary).
2. **Progress is visible everywhere, identical everywhere.** Same score in dashboard, settings header, WhatsApp digest, emails. One number, one truth.
3. **Progress never decreases visibly.** If a milestone breaks (payment disconnected), it becomes an alert in Zone 1, not a score drop announcement.

The existing 12-step "First Sale Mission" grid collapses into the score card's checklist (12 steps → 7 milestones). Steps 8–12's plan-gating moves to the premium teasing system (§5) — **progress milestones must never be paywalled** (a merchant who can't afford Growth can still reach 100; they just do GST manually).

---

## 5. Premium Strategy: Tease, Preview, Unlock

**Rule: every premium feature is visible, previewable, and one of three gate types:**

| Gate type | Pattern | Examples |
|---|---|---|
| **Taste** | First use free, upgrade for unlimited | AI Ad Creator: "Generate your first ad free" · 1 free WhatsApp recovery/mo |
| **Preview** | Render real output, blurred/partial | Revenue forecast chart with their real data, last 3 weeks visible, forecast blurred: "Your next 30 days, projected — Growth plan" |
| **Threshold** | Free until a real limit | 50 products → "Your catalog is growing — Growth removes the cap" at item 45, not 50 |

**Placement rule:** upsells appear at the *moment of need*, never as banners. Hit product cap → upsell. First order arrives → "automate your GST invoice for this order" tease. Cart abandoned → "this customer left ₹1,299 behind; WhatsApp recovery would have messaged them in 30 minutes."

**Tone rule:** every upsell leads with the merchant's data ("this customer," "your forecast," "your 45 products") — the feature is already working for them in preview; payment just turns it on.

### Upgrade flow (build, extends existing UpgradeModal)
1. Trigger shows feature-specific modal: their data + the locked outcome + plan price framed against their numbers ("You made ₹4,200 this week. Growth is ₹2,999/mo." — only when favorable, else omit).
2. One screen, one button, Razorpay checkout inline.
3. **Unlock moment (the Notion/Cursor standard):** no settings to configure. On `subscriptions.plan_tier` change: all gates evaluate live (feature flags read plan from the subscription record — no per-feature toggles). Return to the *exact screen that triggered the upgrade* with the feature now active and a single toast: "Revenue forecasting is on. Here's yours."
4. Post-upgrade email: "What just unlocked for {store}" — 3 items max, each linking to the live feature with their data.

---

## 6. Growth Journey: Five Phases

Phase is computed from real data (orders, revenue), stored on tenant, drives Zone contents:

| Phase | Entry | Zone 1 focus | Zone 2/3 adds | AI co-pilot says |
|---|---|---|---|---|
| **1 · Launch** | signup | Readiness score | — | "Add products → share → first sale" |
| **2 · First Sale** | score 100 / order 1 | "Repeat it": share playbook, coupon nudges | Conversion funnel unlocks meaningfully | "Your buyer came from WhatsApp. Post 2 more groups today." |
| **3 · First ₹10,000** | ₹10k revenue | Weekly revenue target bar (self-set) | AOV, repeat-customer rate | "3 of 8 orders were Kurta Set. Raise its price ₹50 or bundle it." |
| **4 · First ₹1,00,000** | ₹1L revenue | Margin & ops: GST tracker front-and-center, RTO rate | Cohorts, campaign ROI (utm data — shipped) | "You're ₹38k from the GST threshold. Start registration now, it takes 7 days." |
| **5 · Scale** | ₹1L/mo run-rate | Growth levers: ads ROI, catalog expansion | Forecasting, LTV | "Your ad CAC is ₹62 against ₹410 AOV. Double the budget on Campaign 2." |

Phase transitions get one full-width moment each, written as identity shifts: Phase 2 → "You're a seller now." Phase 4 → "You're running a real business — let's protect it (GST, returns, margins)."

---

## 7. Smart Empty States (replace every zero)

Formula: **Current truth → nearest action → what it looks like when working.**

| Screen | Replace "No X yet" with |
|---|---|
| Orders | "Your first order will appear here. You're {100−score} points from launch-ready — next: {action}." + ghost order row showing what one looks like |
| Customers | "Every buyer lands here automatically with their WhatsApp number — your future remarketing list." |
| Coupons | "Stores using a launch coupon get their first sale sooner. Create FIRST10 — we've pre-filled it." (one-click create) |
| Analytics (no traffic) | Shipped: 3-step first-visitors playbook |
| Marketing | "You have {n} customers to talk to" or, if 0: "This page becomes powerful after your first sale. For now: share your store." |

Ghost/preview rows use an obvious "example" treatment (dashed border + EXAMPLE label) — never fake-real data (house rule).

---

## 8. Retention System (daily return without spam)

**The carrier is WhatsApp, not email.** One message per day maximum, only when there's a reason:

1. **Good news first policy:** order received (instant), daily digest only if visitors > 0 ("12 people visited today. 3 viewed Kurta Set."), weekly digest always (the AI Conversion Analyzer output — one finding, one action).
2. **Money left behind:** abandoned checkout alert with one-tap coupon send (exists partially — wire to WhatsApp).
3. **Store Health line** in every digest: payments OK · stock OK · {n} unfulfilled orders. Health problems are the only "bad news" messages sent.
4. **Opportunity drip (max 1/week):** SEO ("your product titles are missing sizes — fix 3 in 2 minutes"), price tests, restock suggestions — generated from real store data, each with a deep link to the exact fix screen.

In-app: the dashboard greets returning merchants with a **"Since you were here"** line (new visitors, carts, orders since last login) — the slot-machine pull, honestly earned.

---

## 9. Merchant Psychology Framework (rules for all copy & design)

1. **Capability, not completion** — every confirmation states what the business can now do.
2. **Future-self visualization** — previews always use *their* store name, products, data (domain preview, forecast preview, ad creative preview).
3. **Commitment consistency** — the journey starts with their idea typed in the hero; every subsequent step references it ("your jewellery store").
4. **Loss framing only for real losses** — abandoned carts and expiring trials are real; fake countdowns are banned (house rule, enforced).
5. **Effort justification** — show the work done: "You built this in 14 minutes" on store-live moment.
6. **No shame states** — zero sales is never the merchant's failure; it's always "the next action hasn't happened yet."
7. **One next action** — never present two recommended steps. The co-pilot decides; the merchant can always see the full checklist by expanding.

---

## 10. Build Order (impact ÷ effort, assumes current codebase)

| # | Item | Builds on | Effort |
|---|---|---|---|
| 1 | Impact + time metadata on Success Score card next-action | Shipped card | S — **shipping with this doc** |
| 2 | First-login focused mode (Zone gating by score) | DashboardClient zones | S |
| 3 | Empty-state pass (orders/customers/coupons/marketing pages) | §7 table | S |
| 4 | Capability-framing copy pass on all confirmations | existing toasts/modals | S |
| 5 | Phase computation + phase-aware Zone 1 | orders/revenue data exists | M |
| 6 | Domain progressive-discovery screen (preview pattern) | settings | M |
| 7 | Threshold/taste/preview gates + auto-unlock on plan change | UpgradeModal, subscriptions | M |
| 8 | WhatsApp digest engine (good-news policy) | Inngest + WA API | L |
| 9 | First-order two-beat celebration (replace panic modal) | PanicStateModal | M |
| 10 | "Since you were here" greeting | store_events | S |

---

*The product never stops answering "Am I ready to make money yet?" — at score 25 the answer is "almost, here's the 3-minute step," at score 100 it becomes "yes — here's how to make more." Retention is just that answer staying useful forever.*
