-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE ARCHITECTURE
-- ============================================

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

CREATE TABLE subdomain_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. BILLING & REFERRALS
-- ============================================

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
  referred_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  days_credited INTEGER DEFAULT 3,
  status referral_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. GUIDED EXECUTION SYSTEM
-- ============================================

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

-- ============================================
-- 4. INFRASTRUCTURE & INTEGRATIONS
-- ============================================

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CATALOG & DROPSHIPPING ENGINE
-- ============================================

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
  slug TEXT NOT NULL,
  retail_price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  reserved_quantity INTEGER DEFAULT 0,
  reservation_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- ============================================
-- 6. TRANSACTIONS & ROUTING
-- ============================================

CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE fulfillment_status_enum AS ENUM ('unfulfilled', 'routed_to_supplier', 'shipped');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status payment_status_enum DEFAULT 'pending',
  fulfillment_status fulfillment_status_enum DEFAULT 'unfulfilled',
  platform_fee_collected NUMERIC(10,2) DEFAULT 0,
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
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_dropship_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Owners can manage their tenants" ON tenants
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Tenant isolation for subscriptions" ON subscriptions
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant isolation for referrals" ON referrals
  FOR ALL USING (referrer_tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()) OR referred_tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant isolation for tenant_missions" ON tenant_missions
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant isolation for business_configs" ON business_configs
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant isolation for products" ON products
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant isolation for orders" ON orders
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant isolation for order_items" ON order_items
  FOR ALL USING (order_id IN (SELECT id FROM orders WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())));

CREATE POLICY "Global catalog is readable by authenticated users" ON global_dropship_catalog
  FOR SELECT TO authenticated USING (true);
