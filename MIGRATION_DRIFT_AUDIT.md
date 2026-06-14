# Production Migration Drift Audit

**Date:** 2026-06-13
**Method:** Diffed every DDL statement in `supabase/migrations/*.sql` against the live prod
schema, read from the PostgREST OpenAPI (`GET {SUPABASE_URL}/rest/v1/`, service role) plus
per-column/table probe queries and the storage bucket list. App impact found by grepping
`src/` and `launchgrid-android/`.

## TL;DR

Migrations **0000–0014** are fully applied. **0021** was applied today (the `payment_method` fix).
**The entire 0015–0020 batch was never run against production** — 6 logical migrations across 7 files.

Several are not cosmetic: `cod_enabled`, the `'free'` plan tier, and the UTM/track columns are
referenced by **buyer-facing checkout, new-store signup, and all storefront visitor tracking** —
those paths hit `column/table does not exist` (HTTP 400/404) in prod today.

## Applied vs not applied

| Migration | Defines | Prod status |
|---|---|---|
| 0000_initial_schema | base tables + enums | ✅ applied |
| 0001_compliance_policies | business_configs.privacy_policy/terms_of_service/refund_policy | ✅ applied |
| 0001_onboarding_fields | tenants.logo_url; business_configs.theme_color/template_style | ✅ applied |
| 0002_abandoned_carts | orders.abandoned_email_sent | ✅ applied |
| 0003_add_product_fields | products.description/cost_price/image_urls/source/source_url | ✅ applied |
| 0004_add_rzp_secret | business_configs.rzp_key_secret | ✅ applied |
| 0005_fix_referrals_and_orders | orders.shipping_address/line_items; referrals.referred_user_id/referrer_code; subscriptions.referral_credit_days | ✅ applied |
| 0006_add_merchant_state | business_configs.state | ✅ applied |
| 0007_add_gst_invoice_fields | business_configs.gstin/gst_rate/tagline/hero_subtitle | ✅ applied |
| 0008_add_coupons | coupons table; orders.coupon_code/discount_amount | ✅ applied |
| 0009_add_seo_custom_fields | products + business_configs meta_title/meta_description | ✅ applied |
| 0010_product_variants | products.has_variants/stock; product_variants table | ✅ applied |
| 0011_order_items_variants | order_items.variant_id/variant_title | ✅ applied |
| 0012_inventory_rpc | decrement_product_stock / decrement_variant_stock RPCs | ✅ applied |
| 0013_add_delivered_status | fulfillment_status enum += 'delivered' | ✅ applied |
| 0014_trial_engine | trial cols, store_events table, featured_until, step_5_shared, status enum += trialing/archived | ✅ applied |
| **0015_audit_fixes** | referral_status += 'paid'; referral_clicks table; referrals.pending_credit_days/activated_at | ❌ **NOT applied** |
| **0016_cod_enabled** | business_configs.cod_enabled | ❌ **NOT applied** |
| **0017_trial_email_columns** | subscriptions.trial_email_day5_sent/day6_sent | ❌ **NOT applied** |
| **0018_utm_and_purchase_events** | store_event_type += 'purchase'; store_events.utm_source/utm_medium/utm_campaign | ❌ **NOT applied** |
| **0019_devices** | devices table (push tokens) | ❌ **NOT applied** |
| **0020_free_tier** | plan_tier enum += 'free' (before starter); subscriptions default → 'free' | ❌ **NOT applied** |
| **0020_product_images_bucket** | storage bucket `product-images` + policies (no buckets exist at all) | ❌ **NOT applied** |
| 0021_add_order_payment_method | orders.payment_method | ✅ applied (today) |

> Note: `subscriptions.referral_credit_days` (also in 0015) IS present — it was already added by
> 0005, so that one line is a no-op. Everything else in 0015 is missing.

## Latent breakage in app code (confirmed grep hits)

Ordered by severity. All column/table names below were probed and return 400/404 in prod.

### 🔴 CRITICAL — `cod_enabled` missing (0016)
- `src/app/store/[slug]/checkout/page.tsx:24` — `.select('... business_configs(merchant_upi_id, rzp_key_id, cod_enabled)')` → **400 on every storefront checkout load**.
- `src/app/api/setup/route.ts:75` — `business_configs` insert includes `cod_enabled: true`. The insert is unchecked (`await` with no error handling), so it **silently fails and the new store gets NO `business_configs` row at all** → its checkout then has no payment config.
- `src/app/(portal)/dashboard/settings/payments/page.tsx:23` & `PaymentsFormClient.tsx` — payments settings read `cod_enabled` → 400.
- `src/actions/portal.ts:117` — conditional update on `cod_enabled`.

### 🔴 HIGH — `'free'` plan tier missing (0020_free_tier)
- `src/app/api/setup/route.ts:90` — free signups insert `plan_tier: 'free'` → **400**, so the subscription row isn't created. The headline **"Free Starter" onboarding is broken at signup** (store created, but no business_configs *and* no subscription).
- App read paths (`store/[slug]/layout.tsx`, `entitlements/route.ts`, etc.) all fall back to `'free'` in code, so reads are fine — only the **insert** breaks.

### 🔴 HIGH — UTM columns + `'purchase'` event missing (0018)
- `src/app/api/track/route.ts:36-38` — every event insert writes `utm_source/medium/campaign` → **400 → all storefront tracking silently fails** (no `page_view`/`product_view`/`purchase` rows recorded for real merchants). The mobile "Visitors today" and dashboard analytics depend on these rows.
- `src/app/api/track/route.ts:24` + `src/components/store/CheckoutForm.tsx:87` — send `event_type: 'purchase'`, but the enum lacks `'purchase'` → 400 even ignoring UTM.
- `src/app/(portal)/dashboard/page.tsx:82` — `.select('referrer, utm_source, utm_medium, utm_campaign')` → 400 → dashboard analytics page errors.

### 🟠 MEDIUM — `devices` table missing (0019)
- `src/app/api/v1/devices/route.ts:29` — `service.from('devices').upsert(...)` → **404**; mobile push-token registration fails (caught as a `Result`, so login still works).
- `src/lib/push.ts:18,66,169` — reads/deletes `devices` to send push → **no push notifications can ever be sent**.
- `src/app/api/v1/account/route.ts:38` — account deletion deletes from `devices` → 404 (non-fatal).

### 🟠 MEDIUM — referral program (0015)
- `src/app/r/[code]/page.tsx:24` — insert into `referral_clicks` → **404**, referral-link clicks aren't logged.
- `src/app/api/referrals/activate/route.ts:53,77` — updates `status: 'paid'`, `activated_at`, `pending_credit_days` → **400**, referral activation/credit is broken.

### 🟠 MEDIUM — product image uploads (0020_product_images_bucket)
- No storage buckets exist in the project at all. Any upload to the `product-images` bucket (dashboard product photos / planned mobile camera flow) has nowhere to land.

### 🟡 LOW — trial nudge emails (0017)
- `src/app/api/cron/trial-emails/route.ts:25,45,56,73` — filters/updates `trial_email_day5_sent`/`day6_sent` → **400**, the day-5/day-6 trial emails never send. Only affects paid-trial signups.

## What still needs to be run (prod)

Runners already exist for 3 of these; 4 need a runner or the Supabase SQL editor.
**Recommended order — fix the buyer/signup path first:**

| # | Migration | How to apply | Caveat |
|---|---|---|---|
| 1 | 0016_cod_enabled | needs runner / SQL editor | plain `ALTER`, safe |
| 2 | 0020_free_tier | needs runner / SQL editor | has `ALTER TYPE ... ADD VALUE` — run statements **individually**, not in a transaction |
| 3 | 0018_utm_and_purchase_events | `node run-migration-0018.js` ✅ | runner already splits the `ADD VALUE` correctly |
| 4 | 0019_devices | `node run-migration-0019.js` ✅ | plain |
| 5 | 0020_product_images_bucket | `node run-migration-0020.js` ✅ | this runner targets the *bucket* file (not free_tier) |
| 6 | 0015_audit_fixes | needs runner / SQL editor | has `ALTER TYPE ... ADD VALUE 'paid'` — run individually |
| 7 | 0017_trial_email_columns | needs runner / SQL editor | plain |

For 0015 / 0016 / 0017 / 0020_free_tier, either paste the SQL into the Supabase SQL editor (it
runs each statement separately, which the `ADD VALUE` lines require) or clone the
`run-migration-0021.js` pattern. **The `ALTER TYPE ... ADD VALUE` statements in 0015 and
0020_free_tier must NOT be wrapped in a transaction** — run them as standalone statements.

> All applications above are **additive** (new columns/tables/enum values/bucket). None drop or
> alter existing data. Applying migrations requires a direct DB connection, which the auto-mode
> classifier blocks — run these yourself.

## Root cause / suggestion

There is no automated migration pipeline; migrations are hand-applied via `run-migration-00NN.js`
and the batch from 0015 onward was simply never run. Before trusting that a column exists in prod,
check the live OpenAPI rather than the migrations folder. Worth adding a CI step or a single
`run-all-pending.js` that records applied migrations in a `schema_migrations` table.
