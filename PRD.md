# Product Requirements Document (PRD)
## LaunchGrid — "Your Business. Live. Tomorrow."

**Version:** 2.0  
**Date:** June 2026  
**Author:** Founder  
**Status:** Decisions Locked — Ready for Build

---

## 1. Executive Summary

LaunchGrid is a **done-for-you business launch platform** that delivers a fully operational online business — website, payments, SEO, branding, analytics, and marketing setup — within 24–48 hours.

**Core positioning:**
> "We help first-time founders get their first sale. Fill a form. We build the store. You're live in 24–48 hours."

LaunchGrid operates as a **Tech Enabler** — we provide the digital infrastructure (software, hosting, UI). The customer is the sole legal and financial owner of their business. This distinction is fundamental to our legal model and product design.

---

## 2. Problem Statement

### The Market Gap

| Option | Cost | Time | Problem |
|--------|------|------|---------|
| DIY (Shopify/Wix) | ₹2k–₹10k/month | 20–100 hrs | User does 80% of work. 80% abandonment. |
| AI Builders (Lovable, Bolt, Durable) | ₹0–₹5k | 1–4 hrs | Website only. No payments, SEO, analytics, products. |
| Agency | ₹50k–₹5,00,000 | 1–3 months | Slow, expensive, inconsistent, requires meetings. |
| **LaunchGrid** | ₹4,999 one-time | **24–48 hours** | **Complete business. Done for you.** |

---

## 3. Decisions Locked (Founder-Approved)

| Decision | Choice |
|----------|--------|
| Architecture | Multi-Tenant Single Codebase |
| Domain model | Subdomain-first (`store.[brand].in`) |
| Legal model | Tech Enabler — customer owns their business |
| Analytics | Customer-owned GA4 / GSC (we use OAuth/Collaborator access) |
| Ads | Customer creates their own Google/Meta Ads account; we configure it |
| Payments (3 tiers) | Free Merchant UPI (2% platform fee) → BYOK (5%) → Razorpay Route (20%) |
| Fulfillment | Routing Model (Supplier API → Customer routes order, keeps profit) |
| Catalog Sourcing | 1-Click Import from Dropship Aggregators (GlowRoad, Roposo, Robu) with Global Margin Slider |
| Billing | Monthly + Yearly (30% discount on annual) |
| Referral | Live day-credit system — referrals = free premium days |
| UI Philosophy | First Sale Mission & Customer Success Dashboard (Gamified progress) |
| Design standard | Premium SaaS-level (Typography & Hierarchy focused like Stripe/Linear) |
| Onboarding | Plan-aware contextual flow — only ask what the current plan needs |

---

## 4. Target Users

### Primary — "The First-Time Founder"
- Age 22–40, Tier 1/2 India
- Has idea, no tech skills, limited time
- Pain: "I've been thinking about starting for 2 years."
- Goal: **First Sale** (Not just a website launch)
- Quote: *"Just set it all up. I'll handle the products."*

### Secondary — "The Offline Business Owner"
- Existing bakery, boutique, salon, jewellery store
- Competitor is online; they need to catch up
- Has budget, zero time, zero digital knowledge
- Highest conversion probability

### Tertiary — "The Niche Entrepreneur"
- Wants to launch a specific niche (Gifts, Home Decor, Cloud Kitchen)
- Needs industry playbooks, supplier list + store + marketing guidance

---

## 5. Legal & Business Model — The Tech Enabler Framework

> [!IMPORTANT]
> LaunchGrid is a **software platform**, not a business registrar, payment processor, or financial intermediary. This is the foundation of our entire legal architecture.

### What We Are
- We provide: software, hosting, templates, AI generation, configuration services
- We do NOT: open companies, process customer funds, handle tax filings, employ their staff

### What the Customer Is
- The sole legal and financial owner of their business
- Responsible for their own GST registration, income tax, business banking
- A Sole Proprietor by default (no LLP/OPC required to start)

### Scope Management: Included vs Not Included
To prevent support nightmares and misaligned expectations, we present this clear breakdown during onboarding:

| Included in LaunchGrid | NOT Included (Customer Responsibility) |
|----------------------|----------------------------------------|
| Website & Hosting    | GST Registration                       |
| Payment Integration  | Company Incorporation (LLP/Pvt Ltd)    |
| Analytics Setup      | Trademark Filing                       |
| SEO Foundation       | Tax Filing & Accounting                |
| Branding & Logo      | Legal Compliance / Terms Writing       |
| Data Portability (CSV Export) |                                        |

### Data Deletion & Portability
If a customer cancels their subscription, they retain full ownership of their data. The dashboard includes a simple "1-Click CSV Export" for their customer list, order history, and product catalog. This mitigates legal risk and builds massive trust.

### Domain Ownership
If a user gets a custom domain through LaunchGrid (Growth plan+), LaunchGrid purchases the domain on their behalf, but the client retains the legal right to transfer it out (e.g., after 6 months of active subscription) to avoid hostage-situation disputes.

### Customer Onboarding Legal Checklist (Built into Dashboard)
When a customer signs up, the platform surfaces a "Getting Started" checklist:

```
Step 1: Get your Udyam Certificate (free, MSME Portal link provided)
Step 2: Open a current bank account (use Udyam as business proof)
Step 3: Complete Payment KYC (PAN-based, done inside our Razorpay/Stripe portal)
Step 4: Verify your business details (GST if applicable)
```

This checklist is educational, not our responsibility to complete for them.

---

## 6. Analytics & Marketing Infrastructure

### 6.1 Google Analytics 4

**Model: Customer-Owned Account, Collaborator Access**

- The customer owns the Google Analytics 4 account (linked to their Gmail).
- During onboarding, they go through a 1-click Google OAuth flow.
- LaunchGrid automatically creates the property in *their* account and adds our service account as a Collaborator/Editor.
- This prevents data privacy issues, ownership disputes, and scaling nightmares associated with a single shared agency account.

**Why this works:**
- Zero friction for customer (automated via API).
- Customer fully owns their data.
- No risk of our master account getting suspended due to one bad tenant.

### 6.2 Google Search Console

**Model: Customer-Owned, Collaborator Access**

- Similar to GA4, we use OAuth to verify the subdomain under the customer's own Search Console account.
- We submit sitemaps and monitor indexing errors via API on their behalf.

**Higher Plan (Pro+):** We actively monitor GSC and send customers monthly SEO health reports (automated email digest)

### 6.3 Google Ads

**Model: Customer Creates Own Account — We Configure**

- We do NOT run ads from our own Google Ads account for customers (legal/financial liability)
- Growth+ customers: We walk them through creating a Google Ads account (guided screen share / async video tutorial)
- Premium customers: We create the campaign structure, ad copy, targeting, and bidding strategy — they just add their billing card

**Why this model:**
- Customer is the legal advertiser (their PAN/GST for ad invoices)
- We have zero financial exposure
- Customer retains full control and ownership of ad history

### 6.4 Meta Pixel & Meta Ads

Same model as Google Ads:
- Premium plan: We install the pixel, configure standard events (Purchase, AddToCart, ViewContent), set up the first campaign structure
- Customer creates their own Meta Business Manager account; we're added as a partner/agency

---

## 7. Payment Architecture — Three-Tier Progressive Model

Payments are handled through a **progressive tier system** — customers start free, upgrade as their volume grows. The platform coaches them at every milestone.

---

### Tier 0: Free Merchant UPI (Zero Setup Cost)

> *"Start selling today. Zero fees. No account required."*

For customers who are just starting — before they hit any revenue — they should NOT use a personal UPI (risk of bank freeze). Instead:

**Platform guides them to set up a Merchant UPI in 5 minutes:**
- Google Pay for Business (gpay.in/business)
- PhonePe Business
- BharatPe

Why Merchant UPI specifically:
- 100% free, takes 5 minutes
- Generates a **Merchant UPI ID / QR Code (P2M — Peer to Merchant)**
- Legally categorizes payments as **business income**, not personal transfer
- Prevents bank account freeze (a major real-world problem for new sellers)
- Customer uploads their QR code / UPI ID into LaunchGrid → displayed on checkout page
- Works immediately, no approval process

**Platform messaging:**
> "Upload your BharatPe / GPay Business QR code. Customers can pay you via UPI instantly. No setup delays."

**Platform fee:** 2% (charged via monthly invoice or deducted from wallet/future route payments). Since 90% start here, this ensures we monetize early volume.

---

### Tier 1: Bring Your Own Keys — BYOK

> *"You've got Razorpay. Connect it here."*

The customer:
1. Creates their own Razorpay account (Udyam certificate — no GST required on Day 1)
2. Gets Key ID + Key Secret from Razorpay dashboard
3. Pastes keys into LaunchGrid Settings → Payments

The platform:
- Guided setup page with step-by-step screenshots + video
- Validates keys with test API call before activation
- Stores keys encrypted in Supabase Vault (never in plaintext)
- Enables: UPI, Cards, Net Banking, Wallets, EMI
- Money flows: Buyer → Razorpay (customer's account) → Customer's Bank

**Platform fee: 5% of each transaction** (charged via a webhook-triggered separate Razorpay payment to our account)

> [!NOTE]
> The 5% is in addition to Razorpay's own ~2% fee. Communicate this clearly. The value proposition: cards, EMI, wallets, automated order management — worth the 5%.

---

### Tier 2: Platform Model via Razorpay Route

> *"One-click KYC. We handle everything. You just sell."*

The customer:
1. Clicks "Enable Premium Payments" in dashboard
2. Goes through **Razorpay-powered KYC inside LaunchGrid** — uploads PAN card (Sole Proprietor)
3. KYC approved in minutes → gets a linked Razorpay sub-account

The platform:
- Uses **Razorpay Route** for automatic payment splitting
- **Tiered Platform Fee Structure:**
  - 15% on the first ₹50,000 in monthly sales
  - Drops to 5% thereafter
- When a buyer pays ₹1,000 (if under ₹50k limit):
  - **LaunchGrid receives: ₹150 (15%)**
  - **Customer receives: ₹850 (85%)** — direct to their bank, same day
- No manual reconciliation, no chasing payments

**Dashboard shows (real-time):**
```
Today's Sales:    ₹8,400
Your Earnings:    ₹6,720  (80%)
Platform Fee:     ₹1,680  (20%)
Razorpay Fee:     ~₹168
Net to Your Bank: ₹6,720
```

> [!IMPORTANT]
> The 20% Route fee is positioned as the "hands-off premium" — they get automatic settlement, dispute management, and our platform revenue share funds their ongoing platform improvements.

**When to recommend which tier:**

| Situation | Recommended Tier |
|-----------|------------------|
| Just launched, testing the idea | Free Merchant UPI |
| Getting consistent orders, wants card payments | BYOK (5%) |
| Scaling fast, wants zero admin work | Route (20%) |
| High volume (₹10L+/month) | BYOK (5%) — lower cost at scale |

---

> [!NOTE]
> The Route fee is on top of the subscription plan fee. Capping it at 5% after the first ₹50k ensures successful merchants don't immediately churn to BYOK when they scale.

---

## 8. Dropshipping & Catalog Management (The "Shopify + Oberlo" Flow)

### 8.1 The Supplier Strategy (Aggregators, not Meesho)
Instead of relying on fragile web-scraping for Meesho (which lacks a public dropshipping API), LaunchGrid integrates directly with B2B dropshipping aggregators that provide structured APIs or CSV catalogs:
- **GlowRoad (Amazon)** — General ecommerce, apparel
- **Roposo Clout** — Trending products, lifestyle
- **Robu.in** — Electronics, RC toys, DIY kits

**Backend Data Pipeline:**
A daily cron job synchronizes supplier catalogs. Base prices and out-of-stock statuses are pulled nightly to ensure client stores never sell unavailable inventory.

### 8.2 The UI/UX: Global Margin Slider & 1-Click Import
To eliminate the massive friction of sourcing inventory, customers are presented with curated catalogs they can import instantly.

**The "Global Margin Rules" UI:**
1. Customer selects a category (e.g., "Smartwatches").
2. The system loads 50 products showing the *Supplier Base Price*.
3. Customer uses a **Global Margin Slider** (e.g., sliding it to `+30%`).
4. The UI instantly calculates and displays the new Retail Price (`Base Price * 1.30`).
5. Customer clicks "Import to my store" → 50 fully populated products (with images, optimized descriptions, and calculated retail prices) go live in 60 seconds.
6. *Note: They can still manually override individual product prices later if they want to run a specific sale.*

### 8.3 Fulfillment: The Routing Model (Low Risk)
To avoid becoming the "Merchant of Record" (which carries severe chargeback and liability risks), we use a Routing Model for order fulfillment rather than an Aggregator Model.

**How it works:**
1. A buyer purchases a product on the customer's LaunchGrid store for ₹1,300.
2. The ₹1,300 goes directly to the customer (via their Tier 0 Merchant UPI, Tier 1 BYOK Razorpay, or Tier 2 Route).
3. LaunchGrid backend detects the order and generates a dashboard alert: *"You have a new order! Click here to fulfill."*
4. The customer clicks the button.
5. LaunchGrid redirects the customer to the supplier portal (e.g., GlowRoad) with the buyer's shipping details pre-filled via API/URL params.
6. The customer pays the supplier the base price (e.g., ₹1,000) using their own funds.
7. The supplier ships the product directly to the buyer. The customer keeps the ₹300 profit.

**Why this is essential:** LaunchGrid provides the software, UI, and data piping. We never touch the inventory funds, we are not liable for shipping delays, and we do not handle consumer refunds/chargebacks.

---

## 9. Pricing & Billing Model

### 9.1 Subscription Plans (Monthly)

> Primary revenue is Subscription. Route (20%) is secondary. Never design company economics assuming transactions are the only survival metric.
> One-time setup fee (launch fee) is separate from subscription.

#### 🟢 Starter — ₹1,999/month (or ₹1,399/month billed annually)

**Platform includes:**
- Store hosted on `yourstore.launchgrid.in`
- Up to 50 products
- Basic analytics dashboard
- Email support
- First Sale Mission (Mission 1 & 2)

**One-time Launch Fee:** ₹4,999

---

#### 🔵 Pro — ₹3,999/month (or ₹2,799/month billed annually)

**Platform includes:**
- Everything in Starter
- Custom domain connection
- Advanced analytics (Customer-owned GA4 + GSC)
- WhatsApp Commerce integration
- Industry Playbook (Competitor lists, pricing guides)
- First Sale Mission (Missions 1–4)

**One-time Launch Fee:** ₹7,999

---

#### 🟣 Premium — ₹5,999/month (or ₹4,199/month billed annually)

**Platform includes:**
- Everything in Pro
- Razorpay Route (auto-split payments — Tiered 15% to 5% fee applies)
- Google Ads + Meta Ads configuration
- Email automation (5 flows)
- Dedicated account manager
- AI Business Coach Insights

**One-time Launch Fee:** ₹12,999

---

### 9.2 Annual Plan — 30% Discount

| Plan | Monthly | Annual (per month) | Annual (total) |
|------|---------|-------------------|----------------|
| Starter | ₹1,999 | ₹1,399 | ₹16,788 |
| Pro | ₹3,999 | ₹2,799 | ₹33,588 |
| Premium | ₹5,999 | ₹4,199 | ₹50,388 |

Annual plans: billed upfront. **No proportional refunds** (account simply remains active until the billing cycle ends) to protect scale revenue and cash flow.

---

## 9. Referral System — Live Day-Credit Mechanic

### Concept

> "Refer people. Earn free days. Get your plan for free."

Every customer gets a unique referral link. Each successful referral (someone signs up and pays) earns them **free days** on their current plan. The math is:

```
Days earned per referral = Plan monthly price ÷ Number of referrals to earn 1 free month

Starter (₹1,999/month):
  ₹1,999 ÷ 30 days = ₹66.6/day
  Per referral earns: ₹100 credit = ~1.5 days free
  20 referrals = 1 month free 

Pro (₹3,999/month):
  ₹3,999 ÷ 30 days = ₹133.3/day
  Per referral earns: ₹400 credit = ~3 days free
  10 referrals = ~30 days free (1 month)

Premium (₹5,999/month):
  Per referral earns: ₹600 credit = ~3 days free
  10 referrals = ~30 days free (1 month)
```

### Live Dashboard Widget

The referral tracker shows **in real-time**:

```
┌─────────────────────────────────────────────────────┐
│  Your Referral Progress                              │
│                                                      │
│  [████████░░░░░░░░░░░░░░░░░░░░] 4/10 referrals      │
│                                                      │
│  Days earned so far: +6 days free                    │
│  Next referral adds: +1.5 days                       │
│  Referrals to free month: 6 more                     │
│                                                      │
│  📎 Your link: launchgrid.in/r/yourcode               │
│  [Copy Link]  [Share on WhatsApp]  [Share on LinkedIn]│
└─────────────────────────────────────────────────────┘
```

### 9.3 "Value Realized" / Time Saved Widget
Placed next to the referral widget to constantly reinforce the platform's value proposition.
```
┌─────────────────────────────────────────────────────┐
│  ✨ Value Realized (Since Launch)                     │
│                                                      │
│  ⏱️ Time Saved: 45 Hours (No coding/setup)           │
│  💰 Money Saved: ₹15,000 (No agency fees)            │
│  🚀 Speed to Market: 3 Weeks faster                  │
└─────────────────────────────────────────────────────┘
```

**Live behavior:**
- As soon as someone signs up using their link → counter increments instantly (WebSocket or Supabase Realtime)
- Days are added to billing cycle immediately
- If customer is on annual plan: free days are calculated proportionally and extend their renewal date
- Toast notification: "🎉 Someone just used your link! +1.5 days added to your account."

### Annual Plan Referral Logic

```
Annual plan cost ÷ 365 days = daily rate
Per referral credit ÷ daily rate = days added

Example (Growth Annual — ₹1,749/month, ₹58/day):
  Per referral: ₹250 credit ÷ ₹58/day = 4.3 days added
  Display: "Share 7 more times to unlock 30 free days"
```

---

## 10. The 12-Step Founder Journey (Customer Success Dashboard)

> "People don't buy websites. They buy relief from pain." 

Most founders think their pain is "building a website". The actual pain is: **"I don't know what to do next."**

To solve analysis paralysis, the LaunchGrid dashboard replaces generic technical steps (e.g., "DNS Setup") with a **12-Step Founder Journey** focused purely on business outcomes.

### 10.1 The Journey & Backend Mapping

```
The UI Shows the Customer (The Outcome)         -> What LaunchGrid is Doing in the Backend
Step 1: ✅ Choose Your Business                  -> Intake form processing, Niche selection
Step 2: ✅ Create Your Brand                     -> AI Logo generation, color palettes, font pairings
Step 3: ✅ Launch Your Store                     -> Provisioning subdomain, pushing codebase, rendering site
Step 4: ✅ Accept Payments                       -> Razorpay Route setup or BYOK API validation
Step 5: ✅ Get Found on Google                   -> Generating sitemaps, writing meta tags, linking Search Console
Step 6: ✅ Track Your Success                    -> Connecting GA4, setting up conversion events
Step 7: ✅ Capture Your First Lead               -> Adding WhatsApp floating button, email popup setup
Step 8: ✅ Drive Your First Visitor              -> Structuring Meta/Google Ads campaign, installing Pixel
Step 9: ✅ Recover Lost Sales                    -> Turning on Abandoned Cart email/WhatsApp automations
Step 10: ✅ Ship Your First Order                -> Integrating shipping partner dashboard (or guide)
Step 11: ✅ Get Your First Review                -> Activating automated post-purchase review request emails
Step 12: ✅ Create a Repeat Buyer                -> Monthly strategy call, retention email flows
```

**How it works:**
- The technical work (DNS, API keys, SSL) happens *underneath* these milestones. 
- The user is only presented with one step at a time to prevent overwhelm.
- Marketing angle: *"Stop guessing what comes next. We guide you from idea to your first sale."*

### 10.2 The Customer Success Dashboard

The dashboard is not just settings; it's the nerve center of their business.

**Core Metrics Shown:**
- Revenue (Total & This Week)
- Orders
- Conversion Rate
- Unique Visitors
- Best Performing Product

**Business Health Score:**
A gamified metric out of 100 to drive engagement and platform adoption.
```
Business Health: 72/100
- SEO: 80/100 (Missing blog posts)
- Products: 60/100 (Missing 5 product descriptions)
- Analytics: 100/100
- Marketing: 45/100 (No abandoned cart email active)
```

**AI Business Coach:**
A contextual AI agent that analyzes their metrics and suggests actions.
- *Scenario:* Revenue down 20% week-over-week.
- *Coach Suggests:* "Traffic is stable but conversion dropped. Consider running a WhatsApp campaign for your new smartwatch collection."

---

## 11. Design Requirements — SaaS-Level, Not AI-Template-Level

> [!IMPORTANT]
> The LaunchGrid platform must look like Linear, Vercel, or Stripe — not like a Durable.co or Wix AI-generated site. This is non-negotiable. Our visual quality is part of our brand promise.

### What DIY Sites Lack (and We Must Have)

| Dimension | Generic DIY Sites | LaunchGrid Standard |
|-----------|-----------------|-------------------|
| Animations | Janky or excessive | Purposeful layout transitions (Framer Motion) |
| Typography | System fonts | Custom variable fonts, tight tracking, crisp hierarchy |
| Color | Safe, muted palettes | Deep dark mode with electric accent colors |
| Layout | Cluttered dashboards | Clean, spacious Bento grids, Stripe-like hierarchy |
| Flow | Overwhelming settings | Progressive disclosure (show only what matters) |

### Specific Visual Techniques Required

We avoid over-engineering with complex animation libraries (no GSAP, no Three.js). We rely on spacing, typography, and clean micro-interactions.

#### Homepage / Landing Page
- **Hero Section:** "Your Business. Live. Tomorrow." Subheadline: "Stop guessing what comes next. We guide you from idea to your first sale."
- **The Wall of Pain (Agitation):** 
  *Does this sound familiar?*
  - "Which platform do I use?" *(Analysis Paralysis)*
  - "How do I get Razorpay to approve me?" *(Payment Anxiety)*
  - "I have 50 products. This will take forever to upload." *(Time Debt)*
  - "People are visiting, but nobody is buying." *(The Conversion Void)*
  - **The Relief:** "Stop guessing what comes next. Let us handle the friction, so you can focus on the product."
- **Bento Grid:** Feature cards in a bento layout — clean borders, subtle hover glow.
- **Social Proof:** Clean numbers, real reviews.

#### Dashboard (Customer Portal)
- **Journey Progress Bar:** Must say "Journey to Your First Sale: 40% Complete" (NOT "Store Build 40% Complete").
- **First Sale Mission:** The 12-Step Founder Journey checklist.
- **Referral & Value Widget:** Circular progress ring and "Value Realized" stats.
- **Analytics Cards:** Clear, scannable numbers. Sparkline graphs.
- **Business Health Score:** Radial dial or progress bar.

#### Upsell Psychology & Locked UI Teasers
For locked steps on lower tiers, do NOT lock "features" (e.g., 🔒 Unlock Google Ads Setup). Lock "outcomes" so it becomes a survival necessity.
- *Example:* 🔒 Step 8: Drive Your First Visitor. (The customer thinks: "My store is live, but I need visitors. I HAVE to unlock this.")
- *Example:* 🔒 Step 9: Recover Lost Sales. (The customer thinks: "People are abandoning carts, I need this to survive.")
Show blurred dummy data with a clear ROI-focused callout: "Stores with abandoned cart flows recover 15% more revenue. Unlock Pro Plan to activate."

### Tech Stack for UI
- **Framer Motion** — Page transitions, layout animations (lightweight)
- **Radix UI** — Accessible component primitives
- **shadcn/ui** — Component system base

---

## 12. Brand Name Shortlist

> [!NOTE]
> No decision needed immediately — but here are the strongest options with rationale.

| Name | Pros | Cons |
|------|------|------|
| **LaunchGrid** | Premium, tech-forward, avoids trademark clutter | Slightly abstract |
| **AeroLaunch** | Fast, dynamic, highly memorable | Less focus on commerce |
| **SyncOS** | Professional, implies automation and connection | May sound purely B2B |
| **Launchly** | Clean, modern, SaaS-sounding | Slightly vague |
| **Bizzly** | Friendly, B2C vibe | Less premium/enterprise |

**Recommendation path:** Check `.in` and `.com` availability for top 3, pick based on availability.

---

## 12B. Compliance & Growth Tracker (Dashboard Feature)

> *"Not just a website builder — a business partner that grows with you."*

This is a **live milestone tracker** on the customer dashboard that monitors their cumulative revenue and triggers actionable, legally-accurate guidance at each threshold.

### The Compliance Timeline

```
Revenue: ₹0 → ₹1,00,000
  ─────────────────────────
  🟢 You're in the clear. Use Merchant UPI (BharatPe/GPay Business).
  No GST. No Razorpay required. No registration needed.
  Focus on: Getting your first 10 orders.

Revenue: ₹1,00,000 (Milestone)
  ─────────────────────────────
  🎉 "Congratulations! ₹1 Lakh earned. You've proven your model."
  
  Next step: "Time to upgrade to Razorpay so you can accept cards,
  EMI, and wallets — and stop verifying screenshots manually."
  
  Platform shows: [Connect Razorpay →] one-click setup

Revenue: ₹15,00,000 (GST Warning Zone — 75% of threshold)
  ────────────────────────────────────────────────────────
  ⚠️ "You're approaching the GST threshold. Here's what applies to you:"
  
  If selling SERVICES:
  → "₹20 Lakh threshold. You have room, but consult a CA this month."
  
  If selling PHYSICAL GOODS (inter-state):
  → "GST is MANDATORY from ₹1 for inter-state sales. Register NOW."
  
  If selling PHYSICAL GOODS (same state only):
  → "₹40 Lakh threshold. You still have time, but prepare your documents."
  
  Platform action: [Book CA Consultation →] (referral link / affiliate)

Revenue: ₹20,00,000 (Hard GST Limit — Services)
  ────────────────────────────────────────────────
  🚨 "URGENT: GST Registration Required"
  "Taking orders without GST registration above ₹20L may result
  in penalties. Register today."
  Platform shows lockout warning on checkout if not registered.

Revenue: ₹40,00,000 (Hard GST Limit — Local Goods)
  ────────────────────────────────────────────────────
  🚨 Same urgent flow as above.
```

### GST Rule Reference (Correct, India-Specific)

| Business Type | GST Mandatory From |
|--------------|--------------------|
| Services | ₹20 Lakh annual turnover |
| Physical goods — inter-state (any state) | **₹1** (mandatory from first rupee) |
| Physical goods — intra-state (same state only) | ₹40 Lakh annual turnover |
| Digital goods / software | ₹20 Lakh (treated as services) |

> [!IMPORTANT]
> The platform MUST ask "Do you ship only within your state or to other states too?" during onboarding to set the correct GST threshold tracker.

### Compliance Tracker UI

```
┌─────────────────────────────────────────────────────────┐
│  📊 Business Compliance Tracker                          │
│                                                          │
│  Total Revenue: ₹87,420                                  │
│                                                          │
│  [████████████████████████░░░░] 87% to ₹1L milestone    │
│                                                          │
│  ✅ Merchant UPI: Active                                 │
│  ⏳ Razorpay: Unlock at ₹1,00,000                       │
│  🔒 GST Registration: Not required yet                   │
│                                                          │
│  Next milestone: ₹12,580 away                           │
│  [What happens at ₹1 Lakh? →]                           │
└─────────────────────────────────────────────────────────┘
```

### Razorpay Onboarding — Correct Messaging

> [!NOTE]
> Razorpay does NOT require ₹20 Lakh or GST. A customer can get Razorpay on **Day 1** with just a free Udyam MSME certificate.
>
> The only reason to delay Razorpay is **cost** — if the customer wants to avoid the 2% Razorpay + 5% platform fee while they're still testing.

Platform messaging at Razorpay upgrade:
> "You don't need GST to use Razorpay. Just your free Udyam MSME certificate. Sign up takes 10 minutes. Here's your step-by-step guide."

---

## 13. User Journey v2.0

```
Visitor lands on LaunchGrid homepage
         ↓
Sees animated hero: "Your Business. Live. Tomorrow."
         ↓
Scrolls through the 12-step journey preview
(Steps beyond their plan are visible but locked/blurred)
         ↓
Clicks "Launch My Business"
         ↓
Step 1: Plan selector
  [Starter] [Growth] [Premium]
  Monthly ↔ Annual toggle (savings shown live)
         ↓
Pays via Razorpay (our revenue account)
         ↓
Step 2: Smart Contextual Onboarding Form
  ← PLAN-AWARE: Only shows fields relevant to chosen plan →
  
  ALL PLANS ask:
    • Business Name
    • Niche / Industry (dropdown)
    • Products or Services description
    • WhatsApp number
    • Contact email
    • Shipping scope: "Only within my state" / "Across India"
      (sets correct GST tracker threshold)
  
  GROWTH+ also asks:
    • Preferred brand colors
    • Target audience description
    • Logo: Upload / AI Generate / Skip
  
  PREMIUM also asks:
    • Top 3 competitors
    • Approximate monthly ad budget
    • Existing domain (if any)
  
  → Fields appear progressively (not all at once)
  → Validation in real-time (no surprise errors at submit)
  → Estimated time shown: "~3 minutes"
         ↓
Dashboard appears immediately after form submit
Step 1 ✅ → Step 2 starts animating: "Building your brand identity..."
         ↓
Steps complete in sequence with live log:
  Step 1: Intake ✅
  Step 2: AI generating content... (progress bar)
  Step 3: Creating logo options... (3 logo previews appear)
  Step 4: Store going live... (URL appears with animation)
  Step 5: Payment setup → Three cards appear:
          [Free UPI]  [Connect Razorpay (5%)]  [Route (20%)]
          Customer selects → guided setup for their choice
         ↓
Compliance Tracker appears:
  "Revenue tracker active. We'll guide you at every milestone."
         ↓
Dashboard: First Sale Mission active!
"Your store is live. Let's get your first visitor."
         ↓
Delivery email: credentials, handbook PDF, onboarding call invite
         ↓
7/30/60-day support window begins
```

### When Customer Upgrades Plan Mid-Journey

New fields required for the upgraded plan appear **at the bottom of the dashboard as a checklist** — not a new form, not a popup:

```
┌─────────────────────────────────────────────────────┐
│  🔵 You upgraded to Growth! Complete these to unlock │
│     your new features:                               │
│                                                      │
│  [ ] Brand color preference  ← takes 30 seconds     │
│  [ ] Target audience description ← takes 1 minute   │
│  [ ] Logo preference: Upload / AI / Keep current     │
│                                                      │
│  Complete these → Analytics + SEO + WhatsApp unlock  │
│  [Complete Now →]                                    │
└─────────────────────────────────────────────────────┘
```

As each field is completed → the corresponding step unlocks and activates immediately.

---

## 14. Feature Breakdown by Phase

### Phase 1 — Service (Weeks 1–8)
Manual delivery. Prove demand. Focus on specific niches (Jewellery, Gifts).

- [ ] Landing page live
- [ ] Payment intake (Razorpay, our account)
- [ ] Intake form (Google Forms)
- [ ] Niche templates (Jewellery, Gift Store, Cloud Kitchen)
- [ ] Industry Playbooks (Supplier list, pricing guide, IG calendar)
- [ ] Manual delivery workflow (Notion CRM)
- [ ] Delivery email + business handbook PDF
- [ ] First 10 customers

### Phase 2 — Platform MVP (Month 2–4)
Build the dashboard. Semi-automate delivery.

- [ ] Multi-tenant Next.js platform live
- [ ] Supabase auth + customer dashboard
- [ ] First Sale Mission UI
- [ ] Business Health Score logic
- [ ] Referral system (live day-credit counter)
- [ ] Monthly + annual billing (Razorpay Subscriptions)
- [ ] BYOK payment connector (Option A)
- [ ] Subdomain provisioning (customer sites)
- [ ] Customer-owned GA4 OAuth flow

### Phase 3 — Growth (Month 4–8)
Automate, scale, add revenue streams.

- [ ] Razorpay Route integration (Option B — auto-split)
- [ ] Dropshipping Supplier Catalog API (GlowRoad/Robu)
- [ ] Global Margin Slider & 1-Click Import
- [ ] AI Business Coach (Insights generation)
- [ ] 1-Click Store Export / Migration Path (to standard Shopify/Next.js repo)
- [ ] WhatsApp Commerce automation

---

## 15. Success Metrics

### Validation (Month 1–2)
| Metric | Target |
|--------|--------|
| Paying customers | 10+ |
| Customer Acquisition Cost (CAC) | < ₹2,000 |
| Lead to Customer Conversion | > 3% |
| Refund requests | 0 |

### Traction (Month 3–6)
| Metric | Target |
|--------|--------|
| Monthly Recurring Revenue | ₹2,00,000+ |
| Time to First Sale (Platform Avg) | < 14 days |
| Customer Activation Rate (Mission 1) | > 80% |
| Referral-driven signups | 25%+ |

### Scale (Month 6–12)
| Metric | Target |
|--------|--------|
| MRR | ₹10,00,000+ |
| 90-Day Retention | > 60% |
| Customer churn | < 5%/month |
| Churn by Plan | Track Starter vs Pro |

---

---

## 16. June 2026 Updates (Mini PRD)

### 16.1 Resilient URL Scraper
Product import now uses a dual-strategy pipeline:
- **Primary:** Jina AI Reader (`r.jina.ai/{url}`) — renders pages in a real browser, bypasses bot detection on Amazon, Flipkart, Meesho, Myntra, etc.
- **Fallback:** Direct fetch with full browser-mimicking headers (`Sec-Ch-Ua`, `Sec-Fetch-*`, etc.)
- Short-link pre-flight resolution (only for `amzn.to`, `fkrt.it`, `bit.ly`, `t.co` etc. — not all URLs, to avoid latency)
- Returns `partial: true` for JS-rendered SPAs with incomplete data
- Products table gains `source_url text` column and `source: 'url_import' | 'manual' | 'dropship'`
- Products page gains `?tab=import` deep-link support (from dashboard banners)

### 16.2 GST Invoicing
- Route: `/store/[slug]/invoice/[orderId]` — public, print-optimized
- Tax computation:
  - `shipping_scope: intra_state` → CGST (50%) + SGST (50%)
  - `shipping_scope: inter_state` → IGST (100%) as single line item
  - GST rate is configurable per merchant (stored in `business_configs.gst_rate`) — NOT hardcoded at 18%
  - Defaults to 18% but merchant sets correct rate for their product category
- Auto-email receipt on Razorpay `payment.captured` webhook via Resend API
- Env var added: `RESEND_API_KEY`

### 16.3 Chrome Extension — Dynamic Domain Support
- Extension queries active tab URL at auth time → detects LaunchGrid hostname → saves as `lg_backend_url` in `chrome.storage.local`
- All API calls use `lg_backend_url` dynamically (supports `localhost:3000` for dev, `launchgrid.in` for prod)
- Auth flow preserves `ext_id` param through full login redirect: `/login?next=/dashboard/extension-auth&ext_id=...`
- **Security:** whitelist enforced — only `localhost`, `launchgrid.in`, `*.launchgrid.in` accepted as valid backend URLs

### 16.4 Database Schema Corrections
- `orders` table: adds `shipping_address JSONB`, `line_items JSONB` (were missing)
- `referrals` table: `referred_tenant_id` → `referred_user_id uuid` (fixes race condition — new users have no tenant at signup time); unique constraint on `(referrer_id, referred_user_id)`
- Shiprocket payload maps real `shipping_address` values from the order record

### 16.5 Dashboard UX Polish
- `PanicStateModal` (new unfulfilled order alert): adds dismiss/close button — was locking merchants out of dashboard
- Setup Wizard Step 2 (Brand): now exposes all **8 colors** and all **5 templates** — matches Storefront Designer (was showing only 4 + 2)
- Products page: `?tab=import` query param activates Import tab directly (enables dashboard banner deep-links)

---

*Document Status: v2.1 — Updated June 2026*
