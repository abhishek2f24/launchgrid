# Technical Requirements Document (TRD)
## LaunchGrid — Platform Architecture

**Version:** 2.0  
**Date:** June 2026  
**Author:** Founder  
**Status:** Decisions Locked — Ready for Build

---

## 1. Architecture Decision: Multi-Tenant Single Codebase

### Why Multi-Tenant

> 1,00,000 signups → ~1,000 paying. We cannot afford per-customer Vercel deploys at scale.

**Multi-tenant means:**
- One Next.js application serves ALL customer stores
- Tenant is identified by subdomain: `storename.launchgrid.in`
- Each request → middleware reads subdomain → fetches tenant config from DB → renders with tenant's data
- Zero per-customer infrastructure cost

**Comparison:**

| Model | Per-customer cost | 1,000 paying customers |
|-------|------------------|----------------------|
| Individual Vercel deploys | ~$20/deploy/month | $20,000/month |
| Multi-tenant (ours) | ~$0.001/customer | $1–50/month total |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LAUNCHOS PLATFORM                         │
│                                                              │
│  ┌──────────────────────┐  ┌───────────────────────────┐    │
│  │   launchgrid.in        │  │   *.launchgrid.in           │    │
│  │   Marketing site     │  │   Customer Stores          │    │
│  │   + Customer Portal  │  │   (Multi-tenant)           │    │
│  └──────────┬───────────┘  └───────────┬───────────────┘    │
│             │                          │                      │
│             └──────────┬───────────────┘                      │
│                        │                                      │
│              ┌─────────▼──────────┐                          │
│              │   Next.js 15 App   │                          │
│              │   (Single Deploy)  │                          │
│              └─────────┬──────────┘                          │
│                        │                                      │
│         ┌──────────────┼──────────────┐                      │
│         ▼              ▼              ▼                       │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐              │
│   │ Supabase │  │ Razorpay │  │  AI Services │              │
│   │ Database │  │  Route   │  │  (GPT-4o,    │              │
│   │ + Auth   │  │          │  │   Replicate) │              │
│   │ + Vault  │  │          │  └──────────────┘              │
│   └──────────┘  └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Core Platform

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.x | SSR + SSG + API routes |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| UI Components | shadcn/ui + Radix UI | Latest | Accessible primitives |
| Animation | Framer Motion | 12.x | Spring animations, layout transitions |
| Animation (complex) | (Removed) | | Focus on spacing/typography instead |
| 3D | (Removed) | | Focus on clean SaaS aesthetics |
| Icons | Lucide React | Latest | Clean SVGs |
| Mobile Companion | Kotlin + Jetpack Compose | Phase 2/3 | High-performance Native Android App |

### Backend & Data

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Database | Supabase (PostgreSQL) | All data storage |
| Auth | Supabase Auth | Customer authentication |
| Data Pipelines | Python + PySpark | Cross-tenant analytics processing |
| ML & Scoring | Azure ML Studio | AI Coach & Business Health Score generation |
| Real-time | Supabase Realtime | Referral counter live updates |
| Secrets | Supabase Vault | Encrypted API key storage |
| File storage | Supabase Storage | Logos, brand assets |
| Email | Resend | Transactional emails |
| Queue | Supabase pg_cron | Scheduled jobs (billing, referral resets, dropship caching) |

### Payments

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Platform revenue | Razorpay Subscriptions | Monthly/annual billing |
| Customer BYOK | Razorpay API (their keys) | Option A payments |
| Auto-split | Razorpay Route | Option B payments (85/15 split) |

### AI & Automation

| Task | Tool | Cost/Use |
|------|------|---------|
| Content generation | OpenAI GPT-4o | ~₹30/site |
| Logo generation | Replicate (FLUX-dev) | ~₹20/logo |
| Product descriptions | **Gemini Flash** (`gemini-2.0-flash`) | Free tier 15 RPM/1M tpd; $0.075/1M at scale — preferred over GPT-4o |
| Blog articles | GPT-4o | ~₹40/5 articles |
| SEO keyword research | GPT-4o + Google API | ~₹10/site |

### Infrastructure

| Layer | Technology |
|-------|-----------|
| Hosting | Vercel (single deployment) |
| CDN | Vercel Edge Network |
| Wildcard subdomain | Vercel wildcard domain (`*.launchgrid.in`) |
| Analytics (ours) | Vercel Analytics + Mixpanel |
| Customer GA4 | Google Analytics Admin API v1 |
| Monitoring | Vercel + Supabase built-in |

---

## 4. Multi-Tenant Implementation

### 4.1 Subdomain Routing

Every request to `*.launchgrid.in` hits the same Next.js app.

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  
  // Skip for main domain and www
  if (['launchgrid', 'www', 'api'].includes(subdomain)) {
    return NextResponse.next()
  }
  
  // Rewrite to tenant-aware route
  const url = request.nextUrl.clone()
  url.pathname = `/store/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### 4.2 Tenant Resolution

```typescript
// lib/tenant.ts
export async function getTenant(slug: string): Promise<Tenant | null> {
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', slug)
    .single()
  
  return data
}

// app/store/[slug]/page.tsx
export default async function StorePage({ params }: { params: { slug: string } }) {
  const tenant = await getTenant(params.slug)
  
  if (!tenant) notFound()
  if (!tenant.is_active) return <InactiveStore tenant={tenant} />
  
  return <StoreLayout tenant={tenant} />
}
```

### 4.3 Vercel Wildcard Domain Setup

In Vercel dashboard:
- Add domain: `*.launchgrid.in`
- DNS: `*.launchgrid.in CNAME cname.vercel-dns.com`
- No per-customer domain setup required

---

## 5. Database Schema v3.0 (Strict Multi-Tenant RLS & Vault)

> **Security Note:** Every table (except the global catalog) implements strict Row Level Security (RLS). Furthermore, `business_configs.rzp_key_secret_id` maps to Supabase Vault (`pgsodium`) to prevent catastrophic API key leaks.

-- ============================================
-- CORE INFRASTRUCTURE
-- ============================================
CREATE TABLE subdomain_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  niche TEXT,
  health_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing & Referrals
CREATE TYPE plan_tier_enum AS ENUM ('starter', 'pro', 'premium');
CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'annual');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'past_due', 'canceled');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_tier plan_tier_enum NOT NULL,
  billing_cycle billing_cycle_enum NOT NULL,
  status subscription_status_enum DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  razorpay_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE referral_status_enum AS ENUM ('pending', 'credited');

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  -- NOTE: referred_user_id (not referred_tenant_id) — new users have no tenant at signup time
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  days_credited INTEGER DEFAULT 7,
  status referral_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (referrer_tenant_id, referred_user_id)
);

-- Guided Execution
CREATE TABLE tenant_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  step_1_business BOOLEAN DEFAULT FALSE,
  step_2_brand BOOLEAN DEFAULT FALSE,
  step_3_launch BOOLEAN DEFAULT FALSE,
  step_4_payments BOOLEAN DEFAULT FALSE,
  step_8_first_visitor BOOLEAN DEFAULT FALSE,
  step_9_recover_sales BOOLEAN DEFAULT FALSE,
  step_10_first_order BOOLEAN DEFAULT FALSE,
  step_11_delivered BOOLEAN DEFAULT FALSE,
  step_12_review_collected BOOLEAN DEFAULT FALSE,
  step_13_repeat_customer BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Infrastructure & Integrations
CREATE TYPE payment_tier_enum AS ENUM ('free_upi', 'byok', 'route');
CREATE TYPE shipping_scope_enum AS ENUM ('intra_state', 'inter_state');

CREATE TABLE business_configs (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  payment_tier payment_tier_enum DEFAULT 'free_upi',
  merchant_upi_id TEXT,
  rzp_key_id TEXT,
  rzp_key_secret_id UUID, -- References vault.secrets(id) for pgsodium
  rzp_route_account_id TEXT,
  ga4_measurement_id TEXT,
  meta_pixel_id TEXT,
  whatsapp_number TEXT,
  shipping_scope shipping_scope_enum DEFAULT 'intra_state',
  template_style TEXT DEFAULT 'minimal',   -- 'minimal'|'bold'|'luxury'|'warm'|'vibrant'
  theme_color TEXT DEFAULT 'purple',       -- accent color id
  tagline TEXT,
  hero_subtitle TEXT,
  gst_rate NUMERIC DEFAULT 18,             -- configurable, NOT hardcoded. 5|12|18|28
  gstin TEXT,                              -- merchant's GSTIN once registered
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalog & Dropshipping
CREATE TABLE global_dropship_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id TEXT NOT NULL,
  supplier_sku TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  image_urls TEXT[],
  stock_status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, supplier_sku)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  global_catalog_id UUID REFERENCES global_dropship_catalog(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  retail_price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),                    -- for margin display
  compare_at_price NUMERIC(10,2),
  image_urls TEXT[],
  category TEXT,
  source TEXT DEFAULT 'manual',               -- 'manual' | 'url_import' | 'dropship'
  source_url TEXT,                            -- original URL for url_import products
  is_active BOOLEAN DEFAULT TRUE,
  reserved_quantity INTEGER DEFAULT 0,
  reservation_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Transactions & Routing
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE fulfillment_status_enum AS ENUM ('unfulfilled', 'routed_to_supplier', 'shipped');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  shipping_address JSONB,      -- { line1, line2, city, state, pincode, country }
  line_items JSONB,            -- [{ product_id, title, qty, price }] for display/invoice
  subtotal NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status payment_status_enum DEFAULT 'pending',
  fulfillment_status fulfillment_status_enum DEFAULT 'unfulfilled',
  platform_fee_collected NUMERIC(10,2) DEFAULT 0,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC(10,2) NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- RLS ensures that a logged in founder can ONLY read/write data where tenant_id = their_tenant_id.
-- (Full RLS policy SQL commands are applied in migration 0000_initial_schema.sql)
```

## 6. Technical Workflows & Guardrails

### 6.1 Subdomain Reservation Locks
To prevent race conditions during short onboarding, the availability check queries both `tenants` and `subdomain_locks`. If available, an entry is inserted into `subdomain_locks` with a 15-minute `expires_at`. A CRON job sweeps expired locks. 

### 6.2 The 15-Second Async Provisioning (Serverless Task Orchestration)
To bypass Vercel serverless timeouts (10-60s) and achieve the 15-second "Immediate Win," we decouple heavy processing using a Next.js-native orchestrator like **Inngest**, **Trigger.dev**, or **Upstash QStash**.

**The Architecture:**
1. **The Fast Path (Synchronous, 0s-15s):** Next.js inserts the Tenant, secures the Subdomain, and sets up barebones configs.
2. **Event Emission (15s):** Next.js fires `inngest.send({ name: "tenant/provision.start", data: { tenantId } })` and returns a `200 OK` to redirect the user to the dashboard.
3. **Parallel Execution (Background Workers, 15s-120s):** The orchestrator triggers background jobs in parallel (AI Brand Generation, Dropship Catalog Import, SEO Foundation).
4. **WebSocket UI Updates (120s+):** As jobs complete, they update a `provisioning_status` JSONB column in `tenants`. Supabase Realtime pushes WebSockets to silently replace placeholders in the dashboard UI.

#### Required Async Queues
- **Queue 1: High-Priority Store Generation (`tenant.provision`)**
  - *Trigger*: Successful payment webhook.
  - *Concurrency*: High (run steps in parallel).
  - *Retry Logic*: Up to 3 times with exponential backoff (e.g., if Replicate times out). Fallbacks to text-based logos if AI APIs fail completely.
- **Queue 2: Scheduled Dropship Syncs (`catalog.sync`)**
  - *Trigger*: CRON job at 2:00 AM IST.
  - *Action*: Fetches master CSV/API from GlowRoad/Robu, updating `global_dropship_catalog` to ensure JIT checks run against data <24 hours old.
- **Queue 3: Time-Delayed Marketing (`cart.abandoned`)**
  - *Trigger*: User initiates checkout (fires a delayed job).
  - *Cancellation*: If Razorpay webhook confirms payment before expiry, send a cancel event to abort the automation.
  - *Workflow*: Wait 15 mins -> Email. Wait 45 mins (1 hour total) -> WhatsApp. Wait 23 hours (24 hours total) -> WhatsApp with 10% discount code.

### 6.3 Local Inventory Locks
Because supplier APIs (GlowRoad) do not support cart holds without payment, we manage double-sell protections locally.
During checkout (`initiateCheckout`):
1. `checkSupplierInventory` (API mock) ensures baseline availability.
2. We increment `reserved_quantity` in our `products` table and set `reservation_expires_at = NOW() + 15m`.
3. True availability becomes `(stock_quantity - reserved_quantity)`.
4. If the provisional order expires, the `reserved_quantity` is rolled back.

---

## 6. Referral System — Technical Implementation

### 6.1 Referral Code Generation

```typescript
// lib/referral.ts
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)

export async function createReferralCode(tenantId: string) {
  const code = nanoid() // e.g., 'k3m9x2qp'
  
  await supabase
    .from('referral_codes')
    .insert({ tenant_id: tenantId, code })
  
  return code // Link: launchgrid.in/r/k3m9x2qp
}
```

### 6.2 Referral Attribution on Signup

```typescript
// When a new customer signs up via referral link
async function processReferral(referralCode: string, newTenantId: string) {
  // Find referrer
  const { data: referrer } = await supabase
    .from('referral_codes')
    .select('tenant_id, tenants(plan, billing_cycle)')
    .eq('code', referralCode)
    .single()
  
  if (!referrer) return
  
  // Calculate days to credit based on referrer's plan
  const daysToCredit = calculateDaysCredit(referrer.tenants.plan)
  const amountCredit = calculateAmountCredit(referrer.tenants.plan)
  
  // Record the referral event
  await supabase.from('referral_events').insert({
    referrer_tenant_id: referrer.tenant_id,
    referred_tenant_id: newTenantId,
    referral_code: referralCode,
    days_credited: daysToCredit,
    amount_credited: amountCredit
  })
  
  // Extend subscription period
  await extendSubscription(referrer.tenant_id, daysToCredit)
  
  // Update referral code stats
  await supabase.rpc('increment_referral_count', {
    p_tenant_id: referrer.tenant_id,
    p_days: daysToCredit
  })
}

function calculateDaysCredit(plan: string): number {
  const credits = {
    starter: 1.5,  // ₹100 / (₹1999/30) = 1.5 days
    pro: 3.0,      // ₹400 / (₹3999/30) = 3.0 days
    premium: 3.0   // ₹600 / (₹5999/30) = 3.0 days
  }
  return credits[plan] || 1.5
}
```

### 6.3 Live Referral Counter (Supabase Realtime)

```typescript
// components/ReferralWidget.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

export function ReferralWidget({ tenantId, plan }: Props) {
  const [referralCount, setReferralCount] = useState(0)
  const [daysEarned, setDaysEarned] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    // Initial load
    loadReferralStats()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`referrals:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referral_events',
          filter: `referrer_tenant_id=eq.${tenantId}`
        },
        (payload) => {
          // New referral came in!
          setReferralCount(prev => prev + 1)
          setDaysEarned(prev => prev + payload.new.days_credited)
          triggerCelebration(payload.new.days_credited)
        }
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [tenantId])

  const triggerCelebration = (daysAdded: number) => {
    setJustAdded(true)
    showToast(`🎉 Someone just signed up! +${daysAdded} days added`)
    setTimeout(() => setJustAdded(false), 3000)
  }

  const targetReferrals = 10
  const progress = Math.min(referralCount / targetReferrals, 1)

  return (
    <motion.div 
      layout
      className="referral-widget"
    >
      {/* Circular SVG progress ring */}
      <ReferralRing progress={progress} count={referralCount} target={targetReferrals} />
      
      {/* Days earned counter */}
      <AnimatePresence>
        {justAdded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="days-badge"
          >
            +{daysEarned.toFixed(1)} days earned
          </motion.div>
        )}
      </AnimatePresence>
      
      <p>{targetReferrals - referralCount} more referrals = 1 month FREE</p>
      
      <ShareButtons referralCode={referralCode} />
    </motion.div>
  )
}
```

---

## 7. First Sale Mission — State Machine

### 7.1 Mission Definitions

```typescript
// lib/missions.ts

export const MISSIONS = [
  { id: 1, name: 'Choose Your Business', tasks: [{ id: 'idea_intake', label: 'Complete intake form', type: 'config' }] },
  { id: 2, name: 'Create Your Brand', tasks: [{ id: 'brand_setup', label: 'Approve AI logo & colors', type: 'action' }] },
  { id: 3, name: 'Launch Your Store', tasks: [{ id: 'domain_live', label: 'Provision subdomain', type: 'config' }] },
  { id: 4, name: 'Accept Payments', tasks: [{ id: 'payment_kyc', label: 'Setup Razorpay or UPI', type: 'action' }] },
  { id: 5, name: 'Get Found on Google', tasks: [{ id: 'seo_indexing', label: 'Generate sitemap & Meta tags', type: 'oauth' }] },
  { id: 6, name: 'Track Your Success', tasks: [{ id: 'analytics_setup', label: 'Connect GA4', type: 'oauth' }] },
  { id: 7, name: 'Capture Your First Lead', tasks: [{ id: 'setup_popup', label: 'Enable WhatsApp button', type: 'config' }] },
  { id: 8, name: 'Drive Your First Visitor', tasks: [{ id: 'first_ad', label: 'Setup Meta/Google Ads', type: 'config' }] },
  { id: 9, name: 'Recover Lost Sales', tasks: [{ id: 'abandoned_cart', label: 'Enable Abandoned Cart email', type: 'config' }] },
  { id: 10, name: 'Ship Your First Order', tasks: [{ id: 'first_fulfillment', label: 'Integrate shipping partner', type: 'action' }] },
  { id: 11, name: 'Get Your First Review', tasks: [{ id: 'review_automation', label: 'Enable post-purchase email', type: 'config' }] },
  { id: 12, name: 'Create a Repeat Buyer', tasks: [{ id: 'repeat_purchase', label: 'Retention email flows', type: 'event' }] }
]
```

### 7.2 Mission UI Component

```typescript
// components/FirstSaleMission.tsx
'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'

export function FirstSaleMission({ activeMissionId, tasks, completedTaskIds }: Props) {
  const mission = MISSIONS.find(m => m.id === activeMissionId)
  
  return (
    <div className="mission-card">
      <h3>🎯 Mission {mission.id}: {mission.name}</h3>
      
      <div className="task-list">
        {mission.tasks.map((task, index) => {
          const isCompleted = completedTaskIds.includes(task.id)
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`task-item ${isCompleted ? 'completed' : 'pending'}`}
            >
              {isCompleted ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-gray-400" />}
              <span>{task.label}</span>
              {!isCompleted && task.type === 'action' && (
                <button className="task-action-btn">Do it now</button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 8. Payment Architecture — Three-Tier

### 8.1 LaunchGrid Subscription Billing (Our Revenue)

```typescript
// Razorpay Subscriptions for monthly/annual billing

async function createSubscription(tenantId: string, plan: string, cycle: string) {
  const planId = getRazorpayPlanId(plan, cycle)
  
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: cycle === 'monthly' ? 12 : 1,
    quantity: 1,
    customer_notify: 1,
    notes: { tenant_id: tenantId }
  })
  
  await supabase.from('subscriptions').insert({
    tenant_id: tenantId,
    plan,
    billing_cycle: cycle,
    razorpay_subscription_id: subscription.id,
    status: 'active'
  })
  
  return subscription
}
```

### 8.2 Tier 0 — Free Merchant UPI

```typescript
// Customer uploads their Merchant UPI QR code
async function saveMerchantUPI(
  tenantId: string, 
  upiId: string, 
  qrImageFile: File,
  provider: 'gpay_business' | 'phonepe_business' | 'bharatpe'
) {
  // Upload QR code to Supabase Storage
  const { data: upload } = await supabase.storage
    .from('payment-assets')
    .upload(`${tenantId}/merchant-qr.png`, qrImageFile)
  
  const qrUrl = supabase.storage
    .from('payment-assets')
    .getPublicUrl(`${tenantId}/merchant-qr.png`).data.publicUrl
  
  await supabase.from('payment_configs').upsert({
    tenant_id: tenantId,
    active_tier: 'upi',
    merchant_upi_id: upiId,
    merchant_qr_url: qrUrl,
    upi_provider: provider
  })
  
  // On checkout page: display QR + UPI ID
  // Customer manually verifies payment screenshot (for now)
  // At ₹1L revenue → platform prompts Razorpay upgrade
}
```

### 8.3 Tier 1 — BYOK (5% Platform Fee)

```typescript
// Store customer's Razorpay keys (encrypted)
async function savePaymentKeys(tenantId: string, keyId: string, keySecret: string) {
  // Store key secret in Supabase Vault
  const { data: vaultEntry } = await supabase.rpc('vault.create_secret', {
    secret: keySecret,
    name: `razorpay_secret_${tenantId}`
  })
  
  await supabase.from('payment_configs').upsert({
    tenant_id: tenantId,
    active_tier: 'byok',
    razorpay_key_id: keyId,
    razorpay_key_secret_vault_id: vaultEntry.id,
    byok_platform_fee_percent: 5
  })
  
  // Validate keys by firing a small test transaction payload
  const isValid = await testRazorpayKeysWithPayload(keyId, keySecret)
  if (!isValid) throw new Error('Invalid Razorpay Keys: Test payload failed.')
  
  await supabase
    .from('payment_configs')
    .update({ byok_verified: true })
    .eq('tenant_id', tenantId)
}

// Collect platform fee (5%) on each order via webhook
async function collectByokPlatformFee(orderId: string, orderAmount: number) {
  const platformFee = Math.round(orderAmount * 0.05)
  
  // Create a charge on OUR Razorpay account for the platform fee
  // This is triggered by the order payment webhook
  const charge = await ourRazorpay.orders.create({
    amount: platformFee,
    currency: 'INR',
    notes: { 
      type: 'platform_fee',
      source_order_id: orderId 
    }
  })
  
  return charge
}

// Customer order flow — uses THEIR keys
async function createCustomerOrder(tenantId: string, orderData: OrderData) {
  const config = await getPaymentConfig(tenantId)
  const secretKey = await supabase.rpc('vault.decrypted_secret', {
    secret_id: config.razorpay_key_secret_vault_id
  })
  
  const customerRazorpay = new Razorpay({
    key_id: config.razorpay_key_id,
    key_secret: secretKey.data
  })
  
  return await customerRazorpay.orders.create({
    amount: orderData.total,
    currency: 'INR'
  })
}
```

### 8.4 Tier 2 — Razorpay Route (80/20 Auto-Split)

```typescript
// Onboard customer to Route (one-time KYC)
async function onboardToRoute(tenantId: string, kycData: KYCData) {
  const linkedAccount = await razorpay.accounts.create({
    email: kycData.email,
    profile: {
      category: 'ecommerce',
      subcategory: 'fashion_and_lifestyle',
      addresses: { registered: kycData.address }
    },
    legal_business_name: kycData.businessName,
    legal_info: { pan: kycData.pan }  // PAN-based Sole Proprietor KYC
  })
  
  await supabase.from('payment_configs').upsert({
    tenant_id: tenantId,
    active_tier: 'route',
    razorpay_linked_account_id: linkedAccount.id,
    route_kyc_status: 'in_review'
  })
  
  return linkedAccount
}

// Process order with Flat 8% auto-split (Managed Commerce fee)
async function createRouteOrder(tenantId: string, amount: number) {
  const config = await getPaymentConfig(tenantId)
  
  // Flat 8% to prevent churn on high-volume stores
  const platformFeePercent = 0.08
  
  const customerShare = Math.round(amount * (1 - platformFeePercent))
  // Remaining 8% stays in our Razorpay account automatically
  
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    transfers: [{
      account: config.razorpay_linked_account_id,
      amount: customerShare,
      currency: 'INR',
      notes: { 
        tenant_id: tenantId,
        applied_fee_percent: platformFeePercent * 100
      }
    }]
  })
  
  return order
}
```

---
## 8.5 Compliance Tracker — Revenue Milestone Engine

```typescript
// lib/compliance.ts

const MILESTONES = {
  RAZORPAY_PROMPT:     100_000_00,   // ₹1,00,000 in paise
  GST_WARNING:       1_500_000_00,   // ₹15,00,000 in paise (75% of services threshold)
  GST_REQUIRED_SERVICES: 2_000_000_00, // ₹20,00,000
  GST_REQUIRED_GOODS_LOCAL: 4_000_000_00, // ₹40,00,000
  // Interstate goods: GST required from ₹1 — tracked differently
}

export async function processOrderForCompliance(
  tenantId: string, 
  orderAmountPaise: number
) {
  const tracker = await supabase
    .from('compliance_trackers')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()
  
  const newRevenue = tracker.data.total_revenue + orderAmountPaise
  
  // Update total revenue
  await supabase
    .from('compliance_trackers')
    .update({ total_revenue: newRevenue })
    .eq('tenant_id', tenantId)
  
  // Check milestones and fire notifications
  await checkMilestones(tenantId, tracker.data, newRevenue)
}

async function checkMilestones(
  tenantId: string, 
  tracker: ComplianceTracker, 
  newRevenue: number
) {
  // Milestone 1: ₹1 Lakh — Prompt Razorpay upgrade
  if (!tracker.notified_1lakh && newRevenue >= MILESTONES.RAZORPAY_PROMPT) {
    await sendDashboardNotification(tenantId, {
      type: 'milestone_1lakh',
      title: '🎉 ₹1 Lakh Earned!',
      message: 'You\'ve proven your model. Time to upgrade to Razorpay for cards, EMI, and wallets.',
      cta: { label: 'Connect Razorpay →', action: 'open_payment_settings' },
      priority: 'success'
    })
    await supabase
      .from('compliance_trackers')
      .update({ notified_1lakh: true })
      .eq('tenant_id', tenantId)
  }
  
  // Milestone 2: GST Warning (depends on business type)
  const gstWarningThreshold = tracker.gst_warning_threshold
  if (!tracker.notified_gst_warning && newRevenue >= gstWarningThreshold) {
    const message = getGSTWarningMessage(tracker.business_type, tracker.shipping_scope)
    await sendDashboardNotification(tenantId, {
      type: 'gst_warning',
      title: '⚠️ Approaching GST Threshold',
      message,
      cta: { label: 'Book CA Consultation →', action: 'open_ca_referral' },
      priority: 'warning'
    })
    await supabase
      .from('compliance_trackers')
      .update({ notified_gst_warning: true })
      .eq('tenant_id', tenantId)
  }
  
  // Milestone 3: GST Hard Limit
  if (!tracker.notified_gst_required && !tracker.gst_registered) {
    if (newRevenue >= tracker.gst_threshold) {
      await sendDashboardNotification(tenantId, {
        type: 'gst_required',
        title: '🚨 GST Registration Required',
        message: 'You must register for GST. Penalties apply for non-compliance.',
        cta: { label: 'Register for GST Now →', action: 'open_gst_guide' },
        priority: 'danger'
      })
    }
  }
}

// Set correct GST threshold based on business type
export function computeGSTThresholds(
  businessType: 'services' | 'goods_intrastate' | 'goods_interstate',
  shippingScope: 'state_only' | 'all_india'
) {
  if (businessType === 'goods_interstate' || shippingScope === 'all_india') {
    // Interstate goods: GST mandatory from ₹1
    // We flag this immediately on onboarding, not a revenue milestone
    return {
      gst_threshold: 100,                     // ₹1 in paise — immediate
      gst_warning_threshold: 100,
      immediate_gst_required: true
    }
  }
  
  if (businessType === 'goods_intrastate') {
    const threshold = 4_000_000_00              // ₹40 Lakh
    return {
      gst_threshold: threshold,
      gst_warning_threshold: Math.round(threshold * 0.75), // ₹30 Lakh warning
      immediate_gst_required: false
    }
  }
  
  // Services (default)
  const threshold = 2_000_000_00               // ₹20 Lakh
  return {
    gst_threshold: threshold,
    gst_warning_threshold: Math.round(threshold * 0.75), // ₹15 Lakh warning
    immediate_gst_required: false
  }
}
```

## 8.6 Smart Onboarding — Plan-Aware Field Logic

```typescript
// lib/onboarding-fields.ts

export const ONBOARDING_FIELDS = {
  // Required for ALL plans — collected at initial signup
  base: [
    { id: 'business_name',        label: 'Business Name',                  type: 'text',     required: true },
    { id: 'niche',                label: 'What do you sell?',               type: 'select',   required: true },
    { id: 'products_description', label: 'Describe your products/services', type: 'textarea', required: true },
    { id: 'whatsapp_number',      label: 'WhatsApp Number',                 type: 'tel',      required: true },
    { id: 'contact_email',        label: 'Business Email',                  type: 'email',    required: true },
    { id: 'shipping_scope',       label: 'Do you ship outside your state?', type: 'radio',    required: true,
      options: [
        { value: 'state_only',  label: 'Within my state only' },
        { value: 'all_india',   label: 'Across India' }
      ]
    }
  ],
  
  // Growth plan additional fields
  growth: [
    { id: 'primary_color',     label: 'Preferred brand color',        type: 'color_picker', required: false },
    { id: 'target_audience',   label: 'Who is your target customer?', type: 'textarea',     required: false },
    { id: 'logo_preference',   label: 'Logo',                         type: 'logo_choice',  required: false,
      options: [
        { value: 'ai_generate', label: 'Generate with AI' },
        { value: 'upload',      label: 'Upload my own' },
        { value: 'skip',        label: 'Skip for now' }
      ]
    }
  ],
  
  // Premium plan additional fields
  premium: [
    { id: 'competitors',         label: 'Top 3 competitors',             type: 'tag_input',  required: false },
    { id: 'monthly_ad_budget',   label: 'Monthly ads budget (₹)',        type: 'number',     required: false },
    { id: 'existing_domain',     label: 'Existing domain (if any)',      type: 'text',       required: false }
  ]
}

// Get fields for a given plan — base fields always included
export function getFieldsForPlan(plan: 'starter' | 'growth' | 'premium') {
  const fields = [...ONBOARDING_FIELDS.base]
  if (plan === 'growth' || plan === 'premium') fields.push(...ONBOARDING_FIELDS.growth)
  if (plan === 'premium') fields.push(...ONBOARDING_FIELDS.premium)
  return fields
}

// Get ONLY the new fields needed when upgrading from one plan to another
export function getUpgradeFields(
  fromPlan: 'starter' | 'growth' | 'premium',
  toPlan: 'starter' | 'growth' | 'premium'
) {
  if (fromPlan === 'starter' && toPlan === 'growth') return ONBOARDING_FIELDS.growth
  if (fromPlan === 'starter' && toPlan === 'premium') 
    return [...ONBOARDING_FIELDS.growth, ...ONBOARDING_FIELDS.premium]
  if (fromPlan === 'growth' && toPlan === 'premium') return ONBOARDING_FIELDS.premium
  return []
}

// Returns completion percentage for a given plan's fields
export function getOnboardingCompletion(
  responses: Partial<OnboardingResponses>,
  plan: 'starter' | 'growth' | 'premium'
): { percent: number; missingFields: string[] } {
  const required = getFieldsForPlan(plan).filter(f => f.required)
  const missing = required.filter(f => !responses[f.id as keyof OnboardingResponses])
  return {
    percent: Math.round(((required.length - missing.length) / required.length) * 100),
    missingFields: missing.map(f => f.label)
  }
}
```



```typescript
// lib/analytics-admin.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import analyticsAdmin from '@google-analytics/admin'

const adminClient = new analyticsAdmin.AnalyticsAdminServiceClient({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
})

export async function createGA4PropertyForTenant(tenant: Tenant) {
  // Create property in our GA4 account
  const [property] = await adminClient.createProperty({
    property: {
      displayName: tenant.business_name,
      timeZone: 'Asia/Kolkata',
      currencyCode: 'INR',
      industryCategory: 'SHOPPING'
    }
  })
  
  // Create web data stream for their subdomain
  const [stream] = await adminClient.createWebDataStream({
    parent: property.name,
    webDataStream: {
      displayName: tenant.subdomain,
      defaultUri: `https://${tenant.subdomain}.launchgrid.in`
    }
  })
  
  // Store in DB
  await supabase.from('analytics_configs').upsert({
    tenant_id: tenant.id,
    ga4_property_id: property.name,
    ga4_measurement_id: stream.measurementId,
    ga4_stream_id: stream.name
  })
  
  // If customer wants admin access — add their Gmail as editor
  // await addUserToProperty(property.name, tenant.owner_email, 'EDITOR')
  
  return { propertyId: property.name, measurementId: stream.measurementId }
}
```

---

## 10. Animation System & Design Tokens

### 10.1 Global Design Tokens

```css
/* globals.css */
:root {
  /* Colors */
  --color-bg: #080812;
  --color-surface: #0f0f23;
  --color-surface-2: #161628;
  --color-border: rgba(255,255,255,0.08);
  --color-primary: #6366f1;      /* Indigo */
  --color-accent: #a78bfa;       /* Violet */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-text: #e2e8f0;
  --color-text-muted: #64748b;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #a78bfa 100%);
  --gradient-mesh: radial-gradient(at 40% 20%, #6366f133 0%, transparent 50%),
                   radial-gradient(at 80% 0%, #a78bfa22 0%, transparent 50%),
                   radial-gradient(at 0% 50%, #818cf822 0%, transparent 50%);
  
  /* Glassmorphism */
  --glass-bg: rgba(255,255,255,0.03);
  --glass-border: rgba(255,255,255,0.08);
  --glass-blur: blur(12px);
  
  /* Typography */
  --font-sans: 'Inter Variable', 'Inter', sans-serif;
  --font-display: 'Cal Sans', 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing scale */
  --space-1: 0.25rem;
  /* ... */
  
  /* Animation */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
}
```

### 10.2 Framer Motion (Clean UI Transitions)

We use Framer Motion for simple, lightweight layout transitions to avoid heavy payloads.

```typescript
// components/FadeIn.tsx
'use client'

import { motion } from 'framer-motion'

export function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

---

## 11. Folder Structure — Monorepo

```
launchgrid/
├── apps/
│   └── web/                          # Main Next.js app
│       ├── app/
│       │   ├── (marketing)/          # launchgrid.in pages
│       │   │   ├── page.tsx          # Homepage
│       │   │   ├── pricing/
│       │   │   └── portfolio/
│       │   ├── (portal)/             # Customer dashboard
│       │   │   ├── dashboard/
│       │   │   │   ├── page.tsx      # Main dashboard + step journey
│       │   │   │   ├── referrals/
│       │   │   │   ├── analytics/
│       │   │   │   ├── settings/
│       │   │   │   │   └── payments/ # BYOK / Route setup
│       │   │   │   └── store/
│       │   └── store/[slug]/         # Multi-tenant customer stores
│       │       ├── page.tsx          # Homepage (niche template)
│       │       ├── shop/
│       │       ├── product/[slug]/
│       │       ├── cart/
│       │       ├── checkout/
│       │       ├── blog/
│       │       └── api/
│       │           ├── orders/
│       │           ├── payments/
│       │           └── webhooks/
│       ├── components/
│       │   ├── marketing/            # Landing page components
│       │   ├── portal/               # Dashboard components
│       │   │   ├── FirstSaleMission/
│       │   │   ├── BusinessHealth/
│       │   │   ├── ReferralWidget/
│       │   │   └── PaymentSetup/
│       │   ├── store/                # Customer store components
│       │   └── ui/                   # shadcn/ui base components
│       ├── lib/
│       │   ├── supabase/
│       │   ├── razorpay/
│       │   ├── analytics/
│       │   ├── referral/
│       │   ├── missions/
│       │   └── ai/
│       ├── hooks/
│       └── middleware.ts
├── packages/
│   ├── ui/                           # Shared design system
│   ├── database/                     # Supabase client + types
│   └── config/                       # Shared config
└── supabase/
    ├── migrations/
    └── functions/                    # Edge functions
```

---

## 12. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay (LaunchGrid account — for our subscriptions)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# AI Services
OPENAI_API_KEY=
REPLICATE_API_TOKEN=

# Google (Service Account for GA4 Admin API)
GOOGLE_SERVICE_ACCOUNT_JSON=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://launchgrid.in
NEXT_PUBLIC_STORE_DOMAIN=launchgrid.in
```

---

## 13. Security

| Requirement | Implementation |
|-------------|---------------|
| API key storage | Supabase Vault (encrypted) — never in .env or plaintext DB |
| Customer data isolation | Row Level Security (RLS) on all tables |
| Auth | Supabase Auth with email magic link |
| Razorpay webhook verification | HMAC SHA-256 signature check on every webhook |
| Subdomain XSS | CSP headers, no cross-tenant data access in middleware |
| Rate limiting | Vercel Edge middleware rate limiter |
| HTTPS | Auto via Vercel |
| Secret rotation | Supabase Vault supports secret versioning |

---

## 14. Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| LCP | < 2.5s | Next.js Image, Vercel CDN, static generation |
| INP | < 100ms | Minimal client JS, code splitting |
| CLS | < 0.1 | Fixed image dimensions, no layout shift |
| PageSpeed (mobile) | > 85 | Tailwind purge, font display swap |
| TTFB | < 200ms | Vercel Edge, Supabase read replicas |
| Animation FPS | 60fps | GPU-accelerated transforms only (no layout thrashing) |

---

---

## 15. June 2026 Technical Updates

### 15.1 URL Product Scraper — Dual Strategy
Route: `POST /api/products/fetch-url`

**Strategy 1 — Jina AI Reader (primary):**
```
GET https://r.jina.ai/{target_url}
Headers: Accept: application/json, X-Return-Format: markdown, X-With-Images-Summary: true
```
- Renders in real browser → bypasses bot detection on Amazon, Flipkart, Myntra etc.
- Returns `data.title`, `data.description`, `data.content` (markdown), `data.images[]`
- Price extracted via regex from markdown content (₹, Rs., MRP, INR patterns)
- No API key required (free); `JINA_API_KEY` env var increases rate limits

**Strategy 2 — Direct fetch fallback:**
- Full browser-mimicking headers: `Sec-Ch-Ua`, `Sec-Fetch-Dest`, `Sec-Fetch-Mode`, `Sec-Fetch-Site`, `Sec-Fetch-User`, `Upgrade-Insecure-Requests`
- Parses JSON-LD `@type:Product`, OG tags, `<title>` tag
- Used when Jina fails or for unprotected Shopify/WooCommerce stores

**Short-link redirect resolution:**
- Conditional: only fires for known short-link hostnames: `amzn.to`, `fkrt.it`, `bit.ly`, `tinyurl.com`, `t.co`
- NOT applied to all URLs (avoids 500ms latency penalty on standard URLs)
- Returns `partial: true` flag for JS-rendered SPAs with incomplete data

### 15.2 GST Invoice Page
Route: `GET /store/[slug]/invoice/[orderId]` — public, no auth

**Tax computation:**
```typescript
const isInterState = order.shipping_scope === 'inter_state'
const gstRate = businessConfig.gst_rate  // configurable, e.g. 18
const taxableValue = order.total_amount / (1 + gstRate / 100)
const taxAmount = order.total_amount - taxableValue

if (isInterState) {
  igst = taxAmount  // single line item
} else {
  cgst = taxAmount / 2  // split equally
  sgst = taxAmount / 2
}
```

**Important:** GST rate comes from `business_configs.gst_rate` — never hardcoded. Different product categories have different rates (5%, 12%, 18%, 28%).

**Print optimization:** `@media print` CSS hides navigation/CTAs. `window.print()` called on button click.

**Auto-email trigger:** Razorpay `payment.captured` webhook → Resend API sends receipt email with link to invoice URL.

### 15.3 Chrome Extension — Dynamic Backend URL

```javascript
// content-script.js — detect LaunchGrid backend
const hostname = window.location.hostname
const ALLOWED_HOSTS = ['localhost', 'launchgrid.in']
const isAllowed = ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))

if (isAllowed) {
  const backendUrl = hostname.includes('localhost')
    ? `http://${hostname}:${window.location.port || 3000}`
    : 'https://launchgrid.in'
  chrome.storage.local.set({ lg_backend_url: backendUrl })
}
```

Auth flow with `ext_id` preserved through login:
```
/login?next=/dashboard/extension-auth&ext_id=chrome-extension-abc123
  ↓ user logs in
/dashboard/extension-auth?ext_id=chrome-extension-abc123
  ↓ server generates short-lived token
redirect to chrome-extension://abc123/auth-callback.html#token=...
```

**Security rule:** `lg_backend_url` is only written when the current page is on a whitelisted host. A malicious site cannot set it to a fake backend.

### 15.4 API Auth — Dual Mode (Session + Bearer)

All routes the Chrome extension calls must support both auth methods:
```typescript
// Check session cookie first, fall back to Bearer token
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    if (data?.user) // authenticated via extension token
  }
}
```

### 15.5 Required Schema Migrations (June 2026)

```sql
-- Products: URL import columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text;

-- Orders: shipping and line items
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS line_items jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount numeric(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- Business configs: theming + GST
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS template_style text DEFAULT 'minimal';
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'purple';
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS hero_subtitle text;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 18;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS gstin text;

-- Referrals: fix race condition (user exists before tenant)
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_user_id uuid REFERENCES auth.users(id);
ALTER TABLE referrals ADD CONSTRAINT IF NOT EXISTS referrals_unique_pair
  UNIQUE (referrer_tenant_id, referred_user_id);

-- order_items (if not yet created)
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1,
  price_at_purchase numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### 15.6 New Environment Variables (June 2026)
```env
RESEND_API_KEY=            # Invoice auto-email on payment capture
GEMINI_API_KEY=            # Product description rewriting (preferred over OpenAI)
JINA_API_KEY=              # Optional — increases Jina rate limits (free without key)
SHIPROCKET_EMAIL=          # Phase 3 (mock in Phase 1)
SHIPROCKET_PASSWORD=       # Phase 3
```

---

*Document Status: v2.1 — Updated June 2026*
