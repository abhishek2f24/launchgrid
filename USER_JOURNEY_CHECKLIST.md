# LaunchGrid — Full User Journey Checklist
> Based on actual code audit. Screens, fields, and options as they exist today.
> Gaps and bugs are flagged with ⚠️.

---

## SCREEN 1 — Landing Page

**CTA:** "Start My Journey" button  
**Route:** → `/onboarding`

---

## SCREEN 2 — Onboarding Form `/onboarding`

**Fields:**
- [ ] Email address
- [ ] Business Name
- [ ] Niche (dropdown, 4 options):
  - Fashion & Apparel
  - Food & Snacks
  - Electronics
  - Home & Decor
- [ ] Subdomain (text input with live availability check)
  - Debounced check against DB
  - Shows ✓ "Available!" in green or ✗ "Taken" in red
  - Auto-lowercases, strips special characters

**Submit:** "Reserve My Store" → `/onboarding/provisioning`

---

## SCREEN 3 — Provisioning Terminal `/onboarding/provisioning`

**What user sees:** Animated fake terminal with 6 steps (~2 seconds each):
1. Reserving subdomain...
2. Setting up database...
3. Configuring storefront...
4. Enabling payments...
5. Launching store...
6. ✓ Done!

> ⚠️ NOTE: This is purely cosmetic animation — no real DB calls happen here.
> Real provisioning happens after signup via `/api/setup`.

**Auto-redirects to:** `/signup` (with `?email=` and `?subdomain=` query params)

---

## SCREEN 4 — Signup `/signup`

**Fields:**
- [ ] Full Name
- [ ] Email (pre-filled from `?email=` query param)
- [ ] Password
- [ ] Referral Code (optional, pre-filled from `?ref=` query param, can be manually typed)
- [ ] Consent checkbox: "I agree to the Terms of Service and Privacy Policy"

**Submit:** "Create Account"  
**Auth:** Supabase `signUp(email, password)` with metadata `{ full_name, subdomain, niche, referral_code }`  
**On success:** → `/setup` (if new) or → `/dashboard` (if returning)

---

## SCREEN 5 — Setup Wizard `/setup` (3 steps)

### Step 1 — Business Details
- [ ] Store Name (text input)
- [ ] Subdomain (.launchgrid.in) — pre-filled, editable
- [ ] Industry/Niche (dropdown, 5 options):
  - Apparel
  - Food & Beverages
  - Electronics
  - Home & Living
  - Other

**Button:** "Next →"

---

### Step 2 — Brand
- [ ] Theme Color (8 options — matches Storefront Designer):
  - 🟣 Purple (#7c3aed)
  - 🔵 Blue (#2563eb)
  - 🟢 Emerald (#059669)
  - 🌹 Rose (#e11d48)
  - 🟡 Amber (#d97706)
  - 🩵 Cyan (#0891b2)
  - 🟠 Orange (#ea580c)
  - ⬜ Slate (#475569)

- [ ] Template Style (5 options — matches Storefront Designer):
  - Minimal
  - Bold
  - Luxury Editorial
  - Warm & Friendly
  - Vibrant & Bold

> ✅ FIXED (June 2026): Setup wizard now shows all 8 colors and 5 templates, matching the full Storefront Designer.

**Button:** "Next →"

---

### Step 3 — Settings
- [ ] WhatsApp Number (text input, e.g. 9876543210)
- [ ] Shipping Scope (radio, 2 options):
  - Intra-State (same state only — ₹40L GST exemption applies)
  - Inter-State / Pan-India (GST mandatory from ₹1)

**Submit:** "Launch My Store 🚀"  
**API call:** POST `/api/setup`  
**On success:** `window.location.href = '/dashboard'`

---

## SCREEN 6 — Dashboard `/dashboard`

### Header
- Store status badge: "Store Empty" (amber pulse) or "Store Live" (green pulse)
- "View Store" button → opens `https://[subdomain].launchgrid.in`

### Action Banner (always visible)
If 0 products:
- [ ] "Import Products →" → `/dashboard/products` (Import tab)
- [ ] "Add Manually" → `/dashboard/products`

If on Starter with products:
- [ ] "View My Store →" → opens store URL

### Welcome Card (ImmediateWinCard)
- Dismissable card with store URL and first steps
- Shows until user clicks × to close

---

### First Sale Mission (12 Steps)

| Step | Title | Done When | Locked On |
|------|-------|-----------|-----------|
| 1 | Reserve Subdomain | Always done after setup | Never |
| 2 | Build Brand | Always done after setup | Never |
| 3 | Import Catalog | products > 0 | Never — links to `/dashboard/products` |
| 4 | Accept Payments | `tenant_missions.step_4_payments` set | Never — links to `/dashboard/settings` |
| 5 | Launch Store | `tenant_missions.step_3_launch` set | Never |
| 6 | Drive First Traffic | orders.length > 0 | Never |
| 7 | Get First Order | orders.length > 0 | Never |
| 8 | Fulfill the Order | Not implemented | Starter plan — needs Pro+ |
| 9 | Track Revenue | Not implemented | Starter plan — needs Pro+ |
| 10 | Handle GST | Not implemented | Starter plan — needs Pro+ |
| 11 | Scale With Ads | Not implemented | Starter plan — needs Pro+ |
| 12 | Earn First Month (₹30K) | Not implemented | Starter plan — needs Pro+ |

**Upgrade prompt:** shown for Starter plans — "Upgrade" button opens upgrade modal

---

### Metrics Cards (4)
- Total Revenue (₹, animated counter)
- Orders (count)
- Conversion Rate (% — currently hardcoded 2% if orders > 0)
- Active Visitors (currently hardcoded 5 if orders > 0)

---

### Referral Widget
- Paid referrals count / Pending count / Free days earned
- Referral link: `launchgrid.in/r/[subdomain]` — copy button
- Earn 7 free days per paid referral
- Working capital warning: "Keep ₹5,000 liquid for T+2 settlement"

---

### AI Coach & Compliance Panel
**Compliance thresholds tracked:**
- ✅ Under all limits → green status
- ₹1L — nudge to upgrade to Razorpay BYOK
- ₹15L — start GST registration (services)
- ₹20L — GST mandatory (services)
- ₹35L — approaching ₹40L (goods intra-state)
- ₹40L — checkout locked, GST required
- Inter-state + any revenue → GST required immediately

**Coach Insight card:** static tip about running Meta conversion ads

---

## SCREEN 7 — Products `/dashboard/products`

### Tab 1 — My Products
**Empty state (0 products):** 2 action cards
- "Add Product" → `/dashboard/products/add`
- "Import from URL" → switches to Import tab

**With products — table columns:**
- Product (image + title)
- Price (retail_price)
- Status (active/inactive badge)
- Source badge: "Imported" (emerald) for url_import, none for manual
- ⋯ More button — ⚠️ NO ACTION (edit page not built)

---

### Tab 2 — Import from URL
- [ ] URL input (paste any product page URL)
- [ ] "Fetch Product" button → POST `/api/products/fetch-url`

**After successful fetch, shows extracted data:**
- [ ] Title (editable)
- [ ] Description (editable)
- [ ] Price (editable)
- [ ] Images carousel (up to 6, first selected by default)
- [ ] Source site badge (e.g. "amazon.in")

**Supported sites** (any with OpenGraph or JSON-LD structured data):
- Amazon, Flipkart, Meesho, GlowRoad, Roposo, Myntra, Nykaa, Ajio, Snapdeal
- Any Shopify store, WooCommerce store

> ⚠️ JS-rendered SPAs (like some mobile-first sites) will return `partial: true` — warns user data is incomplete.

- [ ] "Add to My Store" → POST `/api/products/add`

**On success:** product added to My Products list optimistically, tab switches to "My Products"

---

### Manual Add Page `/dashboard/products/add`
- [ ] Title
- [ ] Description
- [ ] Retail Price
- [ ] Cost Price (optional, for margin calculation)
- [ ] Image URL
- [ ] Category

---

## SCREEN 8 — Settings `/dashboard/settings`

### Storefront Design CTA (purple gradient card)
→ Links to `/dashboard/settings/storefront`

### Store Details (editable)
- [ ] Business Name
- [ ] Niche / Category (free text)
- Save button → server action `saveStoreDetailsAction`

### Domains
- [ ] LaunchGrid Subdomain (read-only — cannot be changed after setup)
- [ ] Custom Domain (Pro+ only) — user enters e.g. `mystore.com`, must CNAME → `cname.vercel-dns.com`
  > ⚠️ Custom domain field has no save action wired up yet

### Payment Configuration
- [ ] Merchant UPI ID (e.g. `yourname@okaxis`) — 2% platform fee
  - Shows "Active" badge if set
- [ ] Razorpay Key ID BYOK (`rzp_live_...`) — 5% platform fee
  - Shows "Connected" badge if set
- Current tier shown (free_upi / byok / route)
- Save button → server action `savePaymentConfigAction`
- "Configure Route / KYC →" link → `/dashboard/settings/payments`

---

## SCREEN 9 — Storefront Designer `/dashboard/settings/storefront`

### Template Selection (5 options, each with live mini preview)
- [ ] **Minimal** — clean white, centered layout
- [ ] **Bold** — dark background, high contrast
- [ ] **Luxury Editorial** — cream `#faf8f4`, editorial spacing, dot accents
- [ ] **Warm & Friendly** — warm gradient bg, rounded pill badges
- [ ] **Vibrant & Bold** — dark `#0d0d0d`, radial glow hero, accent-tinted cards

### Accent Color (8 swatches)
- [ ] Purple (#7c3aed)
- [ ] Blue (#2563eb)
- [ ] Emerald (#059669)
- [ ] Rose (#e11d48)
- [ ] Amber (#d97706)
- [ ] Cyan (#0891b2)
- [ ] Orange (#ea580c)
- [ ] Slate (#475569)

### Hero Text
- [ ] Tagline (main headline, e.g. "Fresh Drops. Every Week.")
- [ ] Hero Subtitle (subheadline, e.g. "Free shipping on orders above ₹499")

### Save
- Sticky save bar at bottom with "Preview Store →" link
- Saves to POST `/api/settings/storefront` → updates `business_configs`

---

## SCREEN 10 — Payment Configuration `/dashboard/settings/payments`

### Tier 0 — Merchant UPI (Free)
- 0% transaction fee, 2% platform fee
- Upload BharatPe / GPay Business QR
- "Configure UPI" button (currently just a button, no modal)

### Tier 1 — Bring Your Keys (BYOK)
- Razorpay API keys — accepts Cards, EMI, Wallets
- 5% platform fee
- "Connect Keys" button (currently just a button, no modal)

### Tier 2 — LaunchGrid Route (Premium)
- 1-click KYC
- Compliance + disputes handled by LaunchGrid
- 15% fee drops to 5% as volume grows
- "Complete KYC" button (currently just a button, no modal)

### COD (Cash on Delivery)
- Disabled by default for Starter and Pro
- Recommended to enable only after ₹50,000 in prepaid revenue

### GST Compliance Note
- Inter-state sellers: GST mandatory from ₹1
- Intra-state goods: exempt up to ₹40L
- Intra-state services: exempt up to ₹20L

---

## SCREEN 11 — Orders `/dashboard/orders`
> Page exists but content not audited in detail

---

## SCREEN 12 — Customers `/dashboard/customers`
> Page exists but content not audited in detail

---

## META ADS INTEGRATION — NOT BUILT ⚠️

**Current status:** Not implemented anywhere in the codebase.

**Where it's referenced:**
- Step 11 "Scale With Ads" in First Sale Mission (locked on Starter, no destination)
- AI Coach insight card: static tip mentioning Meta conversion campaigns
- No `/dashboard/ads` page, no Meta Pixel setup, no Campaign Builder UI exists

**What would need to be built:**
- Meta Business Manager OAuth connection
- Pixel installation on store pages (`store/[slug]`)
- Campaign creation flow (budget, audience, creative)
- Ad performance reporting

---

## SUMMARY — WHAT'S WORKING END-TO-END ✅

- [x] Onboarding form → provisioning animation → signup
- [x] Account creation with referral code
- [x] Setup wizard (3 steps) → dashboard
- [x] First Sale Mission tracking (steps 1–7 auto-complete from real data)
- [x] Add products manually
- [x] Import products from URL (OpenGraph/JSON-LD extraction)
- [x] Store live at `[subdomain].launchgrid.in` with 5 templates
- [x] Storefront Designer: 5 templates, 8 colors, hero text
- [x] UPI payment config
- [x] Razorpay BYOK key storage
- [x] WhatsApp widget on store
- [x] GST compliance tracking with revenue thresholds
- [x] Referral system with 7-day credit per paid referral
- [x] Plan-gated powered-by footer (hidden on Premium/Enterprise)

## WHAT'S BROKEN OR MISSING ⚠️

| Issue | Impact | Fix Needed |
|-------|--------|------------|
| ~~Setup wizard only 4 colors + 2 templates~~ | ✅ Fixed June 2026 — now shows 8 colors + 5 templates | — |
| Product edit page not built | ⋯ button on products table does nothing | Build `/dashboard/products/edit/[id]` |
| Custom Domain save action not wired | Custom domain field in settings doesn't save | Add save to `saveStoreDetailsAction` |
| `source_url` DB column may not exist | URL imports will 500 error | Run migration: `ALTER TABLE products ADD COLUMN source_url text` |
| Dashboard ActionBanner links to `/dashboard/products/import` | Goes to redirect page | Update href to `/dashboard/products` |
| Meta Ads (Step 11) locked + not built | Mission feels incomplete | Build ads integration or add external link |
| Steps 8–12 auto-completion not wired | Always shows as not done even on Pro | Wire mission tracking to real events |
| Conversion Rate + Active Visitors hardcoded | Misleading metrics | Connect to real analytics |
