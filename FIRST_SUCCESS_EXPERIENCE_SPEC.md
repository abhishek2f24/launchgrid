# LaunchGrid — First Success Experience: Implementation Spec
> Owner: Abhishek | Written: June 2026
> Goal: Every new founder sees their store live, gets a real visitor, and has a visceral reason to pay — all within 24 hours of signing up.

---

## Overview

This spec covers 5 tightly-coupled systems that together create the "First Success Experience" — the conversion flywheel from free trial signup to paid subscriber.

```
Signup → [System 1: 24-Hour Trial] → Dashboard with [System 2: Win Tracker]
                                               ↓
                                   [System 4: Store Analytics] shows real visitors
                                               ↓
                                   [System 5: Conversion Triggers] at 18h and 23h
                                               ↓ (side stream)
                                   [System 3: Discover Feed] features new store publicly
```

---

## CRITICAL: Existing Bug to Fix First

**The `subscription_status_enum` is missing 'trialing'.**
The schema in `0000_initial_schema.sql` defines:
```sql
CREATE TYPE subscription_status_enum AS ENUM ('active', 'past_due', 'canceled');
```
But `/api/setup/route.ts` inserts `status: 'trialing'`. This will throw a Postgres enum error on every signup.

Fix this in **Migration 0010** (first thing you build).

---

## System 1: 24-Hour Trial Engine

### What it does
When a new user completes setup, they get a 24-hour free trial. Their store is fully functional. At T+18h they get a warning email. At T+23h a final email. At T+24h their store checkout is disabled (archived), but their dashboard and store page stay visible — showing them what they built and asking them to pay to reactivate.

### DB Changes — Migration 0010

File: `supabase/migrations/0010_trial_engine.sql`

```sql
-- Fix the missing 'trialing' status + add 'archived'
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'trialing';
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'archived';

-- Add trial timestamp columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- Add featured_until to tenants (used by System 3)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Add trial_email_18h_sent and trial_email_23h_sent flags to prevent duplicate sends
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_email_18h_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_email_23h_sent BOOLEAN DEFAULT FALSE;
```

Run this before ANY other System 1 work. Without it, `/api/setup` is broken for every new user.

### Change `/api/setup/route.ts`

**Current CTA says "7-day trial" — change to 24-hour trial.**

In `src/app/api/setup/route.ts`, find the subscription insert (around line 76) and replace:

```ts
// REPLACE THIS:
await supabase.from('subscriptions').insert({
  tenant_id: tenant.id,
  plan_tier: planTier,
  billing_cycle: billingCycle,
  status: 'trialing',
  current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
})

// WITH THIS:
const trialStarted = new Date()
const trialExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

await supabase.from('subscriptions').insert({
  tenant_id: tenant.id,
  plan_tier: 'starter',        // all trials start as starter
  billing_cycle: 'monthly',
  status: 'trialing',
  trial_started_at: trialStarted.toISOString(),
  trial_expires_at: trialExpires.toISOString(),
  current_period_end: trialExpires.toISOString(),
})

// Also set featured_until on the tenant (System 3)
await supabase.from('tenants').update({
  featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days on discover
}).eq('id', tenant.id)
```

### Change the Onboarding CTA Button

File: `src/app/(marketing)/onboarding/page.tsx`, line 180.

```tsx
// REPLACE:
{loading ? 'Processing...' : 'Reserve & Generate Store (₹4,999)'} <ArrowRight className="w-4 h-4" />

// WITH:
{loading ? 'Setting up your store...' : 'Start Free — 24 Hours, No Card Required'} <ArrowRight className="w-4 h-4" />
```

Also update the sub-headline above the form (line 99):
```tsx
// REPLACE:
Enter your details to reserve your domain and generate your store instantly.

// WITH:
Your store goes live in 60 seconds. Free for 24 hours. No credit card needed.
```

### Trial Archival Cron Job

File: `src/app/api/cron/archive-trials/route.ts`

This runs every hour via Vercel Cron. It finds all trials where `trial_expires_at < NOW()` and `status = 'trialing'`, sets them to `status = 'archived'`.

```ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service' // uses service role key

export async function GET(request: Request) {
  // Security: Vercel sends this header on cron invocations
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'archived' })
    .eq('status', 'trialing')
    .lt('trial_expires_at', now)
    .select('id, tenant_id')

  if (error) {
    console.error('Archive cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`Archived ${data?.length ?? 0} expired trials`)
  return NextResponse.json({ archived: data?.length ?? 0 })
}
```

Register in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/archive-trials", "schedule": "0 * * * *" },
    { "path": "/api/cron/trial-emails",   "schedule": "*/30 * * * *" }
  ]
}
```

Add `CRON_SECRET=<random_string>` to your `.env.local` and Vercel environment variables.

### Store Archived Guard in Store Layout

File: `src/app/store/[slug]/layout.tsx`

When a trial is archived, the buyer-facing checkout should fail gracefully. The store page and product pages remain visible (social proof), but the checkout button should show "This store is temporarily unavailable."

In `src/app/store/[slug]/layout.tsx`, fetch the tenant's subscription status and pass it down via a context or prop. Then in `src/app/store/[slug]/checkout/page.tsx`, check the status and render an "Upgrade needed" message instead of the payment form.

**Fulfillment criteria for System 1:**
- [ ] Migration 0010 runs without errors
- [ ] New signup creates subscription with `status = 'trialing'`, `trial_expires_at = NOW() + 24h`
- [ ] `featured_until = NOW() + 7 days` set on tenant at signup
- [ ] Onboarding CTA says "Start Free — 24 Hours, No Card Required"
- [ ] Dashboard trial countdown shows correct hours/minutes remaining
- [ ] After trial expires, `/api/cron/archive-trials` sets `status = 'archived'`
- [ ] Archived store: checkout page shows "Store temporarily unavailable" instead of payment form
- [ ] Store home page + product pages still render for archived stores (don't 404)

---

## System 2: Onboarding Win Tracker

### What it does
A widget on the dashboard shows a 5-milestone checklist that fills in as the founder completes actions during their 24-hour trial. Each completed milestone gives them a psychological "win" and propels them toward the next action.

### Milestones

| # | Milestone | Trigger | Time |
|---|-----------|---------|------|
| 1 | Store generated | `tenant_missions.step_1_business = true` | T+0 min |
| 2 | First product added | `products count > 0` for this tenant | T+5 min |
| 3 | Payment method configured | `business_configs.merchant_upi_id IS NOT NULL OR rzp_key_id IS NOT NULL` | T+10 min |
| 4 | Store link copied/shared | New column `step_5_shared` in `tenant_missions` | T+15 min |
| 5 | First real visitor | `store_events count > 0` where `event_type = 'page_view'` | T+60 min |

Milestone 4 requires a small DB change:

```sql
-- Add to migration 0010 or as 0011:
ALTER TABLE tenant_missions ADD COLUMN IF NOT EXISTS step_5_shared BOOLEAN DEFAULT FALSE;
```

### New Component: `TrialWinTracker`

File: `src/components/dashboard/TrialWinTracker.tsx`

This is a client component rendered only when `isTrial` is true. It lives at the very top of the dashboard, above all other content.

```tsx
'use client'

interface WinTrackerProps {
  step1Done: boolean  // tenant_missions.step_1_business
  step2Done: boolean  // productCount > 0
  step3Done: boolean  // upi or rzp configured
  step4Done: boolean  // tenant_missions.step_5_shared
  step5Done: boolean  // has store_events
  trialExpiresAt: string
  tenantId: string
}
```

**Visual design:**
- Dark card with a green-to-amber progress bar spanning the top
- 5 circles in a row (done = green check, active = pulsing dot, pending = grey)
- Below each circle: milestone label
- Below all circles: "X of 5 wins unlocked • Trial ends in Yh Zm"
- On milestone 5 completion: burst animation + message "You got your first real visitor! Your store is working."

**Share button tracking (Milestone 4):**
The existing "Share Store" button in `DashboardClient.tsx` (line 296) calls WhatsApp. Add a server action call after it:

```ts
// src/actions/missions.ts — add this action
export async function markStoreShared(tenantId: string) {
  const supabase = await createClient()
  await supabase
    .from('tenant_missions')
    .update({ step_5_shared: true })
    .eq('tenant_id', tenantId)
}
```

In `DashboardClient.tsx`, wrap the Share Store button in a client-side click handler that fires `markStoreShared(tenant.id)` after the WhatsApp link opens.

### Wiring into Dashboard

In `src/app/(portal)/dashboard/page.tsx` (the server component that renders `DashboardClient`), add the props query to check milestone completion:

```ts
// Fetch store_events count (for milestone 5)
const { count: visitorCount } = await supabase
  .from('store_events')
  .select('id', { count: 'exact', head: true })
  .eq('store_id', tenant.id)
  .eq('event_type', 'page_view')

// Then pass to TrialWinTracker:
const missions = tenant.tenant_missions?.[0] || {}
const step3Done = !!(config.merchant_upi_id || config.rzp_key_id)
```

Render `<TrialWinTracker>` at the top of `DashboardClient` only when `isTrial` is true.

**Fulfillment criteria for System 2:**
- [ ] `step_5_shared` column added to `tenant_missions`
- [ ] `TrialWinTracker` component created at `src/components/dashboard/TrialWinTracker.tsx`
- [ ] Component shows correct completion state for all 5 milestones
- [ ] Milestone 4 (share) updates DB when share button is clicked
- [ ] Milestone 5 (visitor) lights up when first `page_view` event exists
- [ ] Tracker is hidden after trial converts to paid (not shown for active subscribers)
- [ ] Progress bar fills proportionally as milestones complete

---

## System 3: LaunchGrid Discover Feed

### What it does
A public `/discover` page shows recently-launched stores. Every new store is auto-featured for 7 days. Visiting founders see "stores like theirs" doing real business — social proof that the platform works.

### DB Changes (already included in Migration 0010)
`tenants.featured_until TIMESTAMPTZ` — set to `created_at + 7 days` in `/api/setup`.

Add an RLS policy so the discover page can read public tenants:
```sql
-- In migration 0010 or separately:
CREATE POLICY "Public can view featured tenants" ON tenants
  FOR SELECT USING (
    featured_until > NOW()
    AND is_active = TRUE
  );
```

### New Page: `/discover`

File: `src/app/(marketing)/discover/page.tsx`

This is a server component (no 'use client' needed — fetch at build time with revalidation).

```ts
// Fetch featured stores
const { data: stores } = await supabase
  .from('tenants')
  .select(`
    id,
    business_name,
    subdomain,
    niche,
    created_at,
    featured_until
  `)
  .gt('featured_until', new Date().toISOString())
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(24)
```

**Page layout:**
- Hero: "Stores launched on LaunchGrid this week" with a count badge
- Subtitle: "Every store here was built in under 5 minutes by a first-time founder."
- Grid of store cards (3 columns desktop, 2 tablet, 1 mobile):
  - Store name (business_name)
  - Niche badge (Fashion / Home Decor / etc.)
  - `{subdomain}.launchgrid.in` — clickable link that opens the store
  - "Launched X days ago" relative time
  - A soft "New" badge if launched within 24 hours
- Bottom CTA: "Want your store featured here? Start free →" → links to `/onboarding`

**Revalidation:** `export const revalidate = 3600` (refresh the page data hourly).

### Add Discover to Navigation

In your marketing layout/navbar (wherever the nav links are), add:
- "Discover" → `/discover` in the nav links
- "Discover" → `/discover` in the footer

**Fulfillment criteria for System 3:**
- [ ] `featured_until` is set correctly on new signups (7 days from creation)
- [ ] RLS policy allows public SELECT on tenants where `featured_until > NOW()`
- [ ] `/discover` page renders correctly with store grid
- [ ] Stores launched in last 24h show "New" badge
- [ ] Page revalidates hourly (ISR)
- [ ] CTA at bottom links to `/onboarding`
- [ ] "Discover" link added to navbar and footer

---

## System 4: Store Visitor Analytics

### What it does
Every visitor to a store fires a lightweight event. During the 24-hour trial, the dashboard shows the founder their real visitor count, product views, and cart adds. Seeing real numbers (even small ones) is the most powerful conversion trigger.

### DB Changes — Migration 0010 (continued)

```sql
CREATE TYPE store_event_type_enum AS ENUM ('page_view', 'product_view', 'cart_add', 'checkout_start');

CREATE TABLE store_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type store_event_type_enum NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id TEXT,          -- random ID generated client-side, not linked to auth
  referrer TEXT,            -- document.referrer — traffic source detection
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dashboard queries
CREATE INDEX store_events_store_id_idx ON store_events(store_id, created_at DESC);
CREATE INDEX store_events_store_type_idx ON store_events(store_id, event_type);

-- RLS: only the store owner can read their events
ALTER TABLE store_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can read their events" ON store_events
  FOR SELECT USING (
    store_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Service role can insert (used by the tracking API)
CREATE POLICY "Service role can insert events" ON store_events
  FOR INSERT WITH CHECK (true);
-- Note: revoke this policy after confirming service role bypass works in your setup
```

### Tracking API Endpoint

File: `src/app/api/track/route.ts`

This endpoint is called from the storefront (buyer-facing pages). It must be fast and never crash buyer UX. Use the service role client so it works without buyer authentication.

```ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { store_id, event_type, product_id, session_id, referrer } = body

    // Validate event type
    const validTypes = ['page_view', 'product_view', 'cart_add', 'checkout_start']
    if (!store_id || !event_type || !validTypes.includes(event_type)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = createServiceClient()
    await supabase.from('store_events').insert({
      store_id,
      event_type,
      product_id: product_id || null,
      session_id: session_id || null,
      referrer: referrer || null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never let tracking errors crash — silently swallow
    return NextResponse.json({ ok: true })
  }
}
```

### Fire Events from Storefront Pages

You need to fire events from the buyer-facing store pages. The cleanest way is a small hook in the store layout.

File: `src/app/store/[slug]/layout.tsx` — add a client component wrapper that fires on mount:

```tsx
// src/components/store/TrackPageView.tsx
'use client'
import { useEffect, useRef } from 'react'

export function TrackPageView({ storeId, productId }: { storeId: string, productId?: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const sessionId = sessionStorage.getItem('lg_sid') || Math.random().toString(36).slice(2)
    sessionStorage.setItem('lg_sid', sessionId)

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: storeId,
        event_type: productId ? 'product_view' : 'page_view',
        product_id: productId || null,
        session_id: sessionId,
        referrer: document.referrer || null,
      }),
      // keepalive so it fires even if user navigates away immediately
      keepalive: true,
    }).catch(() => {}) // never crash
  }, [storeId, productId])

  return null
}
```

Add `<TrackPageView storeId={tenant.id} />` to `src/app/store/[slug]/layout.tsx`.
Add `<TrackPageView storeId={tenant.id} productId={product.id} />` to `src/app/store/[slug]/product/[productId]/page.tsx`.

For cart adds, fire in the add-to-cart button click handler in the product page:
```ts
fetch('/api/track', { method: 'POST', headers: {...}, body: JSON.stringify({
  store_id: storeId, event_type: 'cart_add', product_id: productId, session_id: sessionId
}), keepalive: true }).catch(() => {})
```

### Dashboard Analytics Cards (Trial Mode)

The existing `DashboardClient.tsx` currently uses **simulated** visitor data (lines 258–264). During the trial, replace these with real data from `store_events`.

In `src/app/(portal)/dashboard/page.tsx` (server component), add:

```ts
// Real analytics query
const today = new Date()
today.setHours(0, 0, 0, 0)

const { count: todayViews } = await supabase
  .from('store_events')
  .select('id', { count: 'exact', head: true })
  .eq('store_id', tenant.id)
  .eq('event_type', 'page_view')
  .gte('created_at', today.toISOString())

const { count: todayProductViews } = await supabase
  .from('store_events')
  .select('id', { count: 'exact', head: true })
  .eq('store_id', tenant.id)
  .eq('event_type', 'product_view')
  .gte('created_at', today.toISOString())

const { count: todayCartAdds } = await supabase
  .from('store_events')
  .select('id', { count: 'exact', head: true })
  .eq('store_id', tenant.id)
  .eq('event_type', 'cart_add')
  .gte('created_at', today.toISOString())
```

Pass these as props to `DashboardClient`. In `DashboardClient`, replace `simulatedVisitors` with `realVisitors` (from props) when the value is > 0, falling back to simulated only when no real data exists yet.

Add a "Today's Activity" mini-card row visible during trial:
```
[ 📍 Today's Visitors: 7 ] [ 👁 Product Views: 23 ] [ 🛒 Cart Adds: 4 ]
```
These cards should appear directly inside the `TrialWinTracker` section.

**Fulfillment criteria for System 4:**
- [ ] `store_events` table created with correct indexes and RLS
- [ ] `/api/track` endpoint accepts POST, inserts via service role, never crashes
- [ ] `TrackPageView` component fires on store home page load
- [ ] Product page fires `product_view` event on load
- [ ] Add-to-cart button fires `cart_add` event
- [ ] Dashboard server component queries real event counts for today
- [ ] Real analytics shown in dashboard (not simulated) when events exist
- [ ] "Today's Activity" cards show in TrialWinTracker during trial

---

## System 5: Conversion Triggers

### What it does
Three automated triggers push the founder to upgrade: an email at T+18h, a final email at T+23h, and a persistent countdown banner on the dashboard that shows time remaining. At T+1h-remaining, a modal appears warning the store is about to archive.

### Dashboard Countdown Banner (already scaffolded)

**Good news:** `DashboardClient.tsx` already has a trial banner (lines 353–388). It reads `trialDaysLeft` from `currentPeriodEnd`. It already shows:
- N days left (needs to show hours/minutes, not days)
- Expired state with red styling

**Change needed:** Update the countdown display to show hours and minutes during the 24-hour trial.

In `DashboardClient.tsx`, replace the `trialDaysLeft` calculation (lines 246–248):

```ts
// REPLACE:
const trialDaysLeft = currentPeriodEnd 
  ? Math.max(0, Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
  : 0
const isTrialExpired = isTrial && trialDaysLeft <= 0

// WITH:
const trialMsLeft = currentPeriodEnd 
  ? Math.max(0, new Date(currentPeriodEnd).getTime() - Date.now())
  : 0
const trialHoursLeft = Math.floor(trialMsLeft / (60 * 60 * 1000))
const trialMinutesLeft = Math.floor((trialMsLeft % (60 * 60 * 1000)) / (60 * 1000))
const isTrialExpired = isTrial && trialMsLeft <= 0
const trialCountdown = trialHoursLeft > 0 
  ? `${trialHoursLeft}h ${trialMinutesLeft}m` 
  : `${trialMinutesLeft} minutes`
```

Update the banner text (line 368) to use `trialCountdown` instead of `${trialDaysLeft} Days`.

**Live countdown:** To make the banner tick in real time, add a `useEffect` that calls `setInterval` every 60 seconds and forces a re-render:
```ts
const [, forceUpdate] = useState(0)
useEffect(() => {
  const interval = setInterval(() => forceUpdate(n => n + 1), 60_000)
  return () => clearInterval(interval)
}, [])
```

### T-1h Archival Warning Modal

When `trialMsLeft < 3600000` (1 hour remaining) and `trialMsLeft > 0`, show a modal.

File: `src/components/dashboard/TrialExpiryModal.tsx`

```tsx
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function TrialExpiryModal({ trialMsLeft, onUpgrade }: { trialMsLeft: number, onUpgrade: () => void }) {
  const [dismissed, setDismissed] = useState(false)
  const showModal = trialMsLeft < 3600000 && trialMsLeft > 0 && !dismissed

  const minutesLeft = Math.floor(trialMsLeft / 60000)

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] p-10 max-w-md w-full text-center shadow-2xl"
          >
            <div className="text-5xl mb-4">⏰</div>
            <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-3">
              {minutesLeft} minutes left.
            </h2>
            <p className="font-inter text-[var(--color-mark-secondary)] text-sm leading-relaxed mb-8">
              Your store and everything you built will be archived in {minutesLeft} minutes. 
              Upgrade now to keep your store live — your products, your orders, your domain.
            </p>
            <button
              onClick={onUpgrade}
              className="w-full bg-[var(--color-mark-ink)] text-white font-inter font-bold py-4 rounded-xl text-sm mb-3 hover:bg-black/90 transition-colors"
            >
              Keep My Store Live →
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] font-medium"
            >
              I understand, I'll lose everything
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

Wire into `DashboardClient.tsx` — render `<TrialExpiryModal trialMsLeft={trialMsLeft} onUpgrade={() => setShowUpgradeModal(true)} />`.

### Email Triggers Cron Job

File: `src/app/api/cron/trial-emails/route.ts`

Runs every 30 minutes. Queries subscriptions where trial is active and either 18h or 23h mark has been crossed, but the corresponding email hasn't been sent yet.

```ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Find trials that crossed the 18-hour mark and haven't been emailed
  const h18Mark = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString()
  const h23Mark = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString()

  // 18h email targets: trial_started_at < (now - 18h) AND NOT sent AND still trialing
  const { data: targets18h } = await supabase
    .from('subscriptions')
    .select('id, tenant_id, trial_started_at, trial_expires_at')
    .eq('status', 'trialing')
    .eq('trial_email_18h_sent', false)
    .lt('trial_started_at', h18Mark)

  for (const sub of (targets18h ?? [])) {
    // Fetch tenant + user email
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name, subdomain, owner_id, users(email)')
      .eq('id', sub.tenant_id)
      .single()

    if (tenant?.users) {
      const userEmail = (tenant.users as any).email
      const hoursLeft = Math.round(
        (new Date(sub.trial_expires_at).getTime() - now.getTime()) / (60 * 60 * 1000)
      )
      await sendTrialEmail(userEmail, tenant.business_name, tenant.subdomain, hoursLeft, '18h')
      await supabase
        .from('subscriptions')
        .update({ trial_email_18h_sent: true })
        .eq('id', sub.id)
    }
  }

  // 23h email targets: same pattern
  const { data: targets23h } = await supabase
    .from('subscriptions')
    .select('id, tenant_id, trial_started_at, trial_expires_at')
    .eq('status', 'trialing')
    .eq('trial_email_23h_sent', false)
    .lt('trial_started_at', h23Mark)

  for (const sub of (targets23h ?? [])) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name, subdomain, owner_id, users(email)')
      .eq('id', sub.tenant_id)
      .single()

    if (tenant?.users) {
      const userEmail = (tenant.users as any).email
      await sendTrialEmail(userEmail, tenant.business_name, tenant.subdomain, 1, '23h')
      await supabase
        .from('subscriptions')
        .update({ trial_email_23h_sent: true })
        .eq('id', sub.id)
    }
  }

  return NextResponse.json({ ok: true, sent18h: targets18h?.length, sent23h: targets23h?.length })
}
```

### `sendTrialEmail` Function

File: `src/lib/emails.ts`

LaunchGrid likely uses Resend or Nodemailer. Add:

```ts
export async function sendTrialEmail(
  to: string,
  businessName: string,
  subdomain: string,
  hoursLeft: number,
  type: '18h' | '23h'
) {
  const storeUrl = `https://${subdomain}.launchgrid.in`
  const upgradeUrl = `https://launchgrid.in/dashboard`

  const subject = type === '18h'
    ? `⏰ ${hoursLeft}h left — ${businessName} needs you`
    : `🚨 Final hour — your store archives in ${hoursLeft}h`

  const htmlBody = type === '18h'
    ? `
      <h2>Your free trial is running out.</h2>
      <p>You built <strong>${businessName}</strong> from scratch today. Your store is live at <a href="${storeUrl}">${storeUrl}</a>.</p>
      <p>You have <strong>${hoursLeft} hours</strong> before it's archived. Everything you built — your products, your domain, your store — disappears.</p>
      <p>Upgrade now to keep everything live for ₹999/month.</p>
      <a href="${upgradeUrl}" style="background:#1a1a18;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Keep My Store Live →</a>
    `
    : `
      <h2>Last chance.</h2>
      <p><strong>${businessName}</strong> archives in 1 hour.</p>
      <p>Your store has been visited by real people today. Don't let that go. Upgrade in the next hour to keep everything.</p>
      <a href="${upgradeUrl}" style="background:#1a1a18;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Upgrade Now →</a>
    `

  // Replace with your actual email provider (Resend, Nodemailer, etc.):
  // await resend.emails.send({ from: 'LaunchGrid <hello@launchgrid.in>', to, subject, html: htmlBody })
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`) // placeholder until email provider connected
}
```

### Upgrade/Pricing Modal (already exists in DashboardClient)

`DashboardClient.tsx` already has a `showUpgradeModal` state (line 236) and renders `<PanicStateModal>` — but there's no actual upgrade modal component. You need to build one.

File: `src/components/dashboard/UpgradeModal.tsx`

A modal that appears when `showUpgradeModal` is true, showing:
- Two plan cards: **Starter ₹999/month** and **Pro ₹2,499/month**
- Features list for each (from your pricing page)
- "Start Starter Plan" and "Start Pro Plan" buttons
- Both buttons route to `/api/billing/create-checkout` (Razorpay subscription) — or for now, to a WhatsApp message: `https://api.whatsapp.com/send?text=I want to upgrade LaunchGrid for ${businessName}` as a fallback until Razorpay subscriptions are wired.

**Fulfillment criteria for System 5:**
- [ ] Trial countdown shows hours and minutes (not days) in dashboard banner
- [ ] Banner ticks live every minute via `setInterval`
- [ ] `TrialExpiryModal` appears when < 1h remaining, dismissed by user click
- [ ] `/api/cron/trial-emails` runs every 30 minutes via Vercel Cron
- [ ] 18h email sends exactly once per trial (idempotent via `trial_email_18h_sent` flag)
- [ ] 23h email sends exactly once per trial (idempotent via `trial_email_23h_sent` flag)
- [ ] Email content includes store name, store URL, and upgrade link
- [ ] `UpgradeModal` component renders plan comparison + CTA buttons
- [ ] `vercel.json` crons registered for both cron routes
- [ ] `CRON_SECRET` env var set in Vercel dashboard

---

## Service Client Utility (Required by All Systems)

The cron jobs and tracking API use Supabase with a service role key (bypasses RLS). You need this utility if it doesn't exist:

File: `src/utils/supabase/service.ts`

```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  })
}
```

Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (get it from Supabase Dashboard → Settings → API → service_role key). **Never expose this key to the browser.** Only use it in server-only files (API routes, cron jobs).

---

## Environment Variables Checklist

Add these to `.env.local` and your Vercel project settings:

```
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
CRON_SECRET=<generate: openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://launchgrid.in
```

---

## Build Order (Suggested)

Build in this sequence to avoid blockers:

1. **Migration 0010** — fixes the 'trialing' enum bug. Test: run the migration, then sign up a new account and confirm `subscriptions.status = 'trialing'` is written without error.

2. **`/utils/supabase/service.ts`** — needed by cron + tracking. Test: import and call it from a test route, confirm you can query `tenants` without RLS restriction.

3. **`/api/track` + `store_events` table** — can be built and tested immediately by hitting the endpoint with curl. Test: `curl -X POST https://localhost:3000/api/track -d '{"store_id":"...","event_type":"page_view"}'` and check Supabase.

4. **`TrackPageView` component** — add to store pages. Test: visit your store as a buyer (or in incognito), then check Supabase `store_events` table for a new row.

5. **System 2: TrialWinTracker** — visible in dashboard. Test: go through signup → see 3/5 milestones pre-filled, manually trigger share button, watch milestone 4 tick.

6. **System 3: `/discover` page** — standalone page. Test: visit `/discover` and confirm your own new store appears.

7. **System 5: Countdown + modals** — update banner, add modal. Test: change `trial_expires_at` to `NOW() + 1 hour` for your test account in Supabase Studio, reload dashboard, confirm modal appears.

8. **System 5: Cron jobs** — test locally by calling the route with `Authorization: Bearer <CRON_SECRET>`. Test: insert a subscription with `trial_started_at = NOW() - 19 hours`, call `/api/cron/trial-emails`, confirm email log fires and `trial_email_18h_sent = true`.

9. **Onboarding CTA copy** — update button text. Test: visually confirm the button says the right text.

---

## What NOT to Build (Out of Scope for This Sprint)

- Razorpay subscription integration (Razorpay supports recurring subscriptions via their API — this is a separate sprint)
- Real email provider setup (wire `sendTrialEmail` to Resend once you have an account — placeholder log is fine for now)
- Stripe / international payments
- Push notifications (mobile app sprint)
- The "LaunchGrid Showcase" campaign page `/merchants` (separate from `/discover`)

---

## Definition of Done (Full System)

The "First Success Experience" is complete when a new user can:

1. Land on `/onboarding`, see "Start Free — 24 Hours, No Card Required"
2. Complete setup and arrive at dashboard with a working 24-hour trial
3. See the `TrialWinTracker` showing their 5 milestones with 3 pre-filled
4. Add a product → watch Milestone 2 tick ✓
5. Share their store → watch Milestone 4 tick ✓
6. Visit their own store in incognito → fire a real `page_view` event → watch Milestone 5 tick ✓
7. See "Today's Visitors: 1" on the dashboard — real data
8. Find their store on `/discover`
9. Receive an email at 18 hours
10. See the `TrialExpiryModal` appear at < 1h remaining
11. See the archived state if they don't upgrade (store checkout disabled)
