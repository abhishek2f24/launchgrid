# LaunchGrid Backend Data Schema

LaunchGrid operates on a single-codebase, multi-tenant PostgreSQL database hosted on Supabase. Security, speed, and strict tenant isolation are the foundational pillars of this schema.

## 1. Security Architecture
- **Row Level Security (RLS)**: Every tenant-specific table has RLS enabled. Policies mandate that `owner_id = auth.uid()`, preventing cross-tenant data leaks.
- **Supabase Vault (pgsodium)**: Sensitive credentials (like Razorpay Key Secrets) are never stored in plaintext. They are mapped via `UUID` to the Supabase Vault (`vault.secrets`) and decrypted in-memory by the Next.js server during API calls.
- **Service Role Bypasses**: The checkout system runs on public subdomains. To write orders safely without exposing RLS logic to the client, Server Actions use the Supabase Service Role key under strict server-side validation.

## 2. Core Entities

### Auth & Tenants
- `users`: Links directly to Supabase `auth.users`. Stores the founder's email and phone.
- `tenants`: The anchor table. Every other table cascades from `tenant_id`. Stores the `subdomain`, `custom_domain`, and `business_name`.

### Billing & Virality
- `subscriptions`: Tracks the tenant's LaunchGrid plan (`starter`, `pro`, `premium`), the billing cycle, and the Razorpay subscription ID.
- `referrals`: Powers the viral loop. Tracks `referrer_tenant_id`, `referred_tenant_id`, and `days_credited`.

### The Guided Execution Engine
- `tenant_missions`: A boolean-driven state machine (`step_1_business`, `step_10_first_order`) that powers the dashboard checklist.

## 3. E-Commerce Engine

### Infrastructure & Settings
- `business_configs`: Stores SEO data, WhatsApp numbers, shipping scopes, and the critical `payment_tier` (`free_upi`, `byok`, `route`).

### Dropship Catalog
- `global_dropship_catalog`: A non-tenant global table synced via CRON from suppliers (GlowRoad/Robu).
- `products`: Tenant-specific inventory. Links to `global_catalog_id`. Stores the custom `retail_price` set by the merchant's Global Margin Slider.

### The JIT Checkout Pipeline
- `orders`: Contains `payment_status` and `fulfillment_status`. Crucially includes `expires_at` (30-minute timer) to power the Abandoned Cart recovery engine if Razorpay webhooks do not fire.
- `order_items`: Maps products to orders. Crucially locks in `price_at_purchase` so historical revenue isn't affected by future catalog price updates.

## 4. The Webhook Fulfillment Flow
1. Next.js creates an `order` in `payment_status: 'pending'`.
2. Buyer pays via Razorpay.
3. Razorpay fires a webhook to `/api/webhooks/razorpay`.
4. Endpoint verifies cryptographic signature.
5. Endpoint checks `if (order.payment_status === 'paid') return 200` (Idempotency).
6. Endpoint updates order to `paid` and flips `tenant_missions.step_10_first_order` to `true`.
7. Supabase Realtime pushes the update to the frontend dashboard.
