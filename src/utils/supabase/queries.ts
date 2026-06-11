import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function getActiveTenant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch the tenant for this user
  let { data: tenant, error } = await supabase
    .from('tenants')
    .select('*, subscriptions(*), business_configs(*), tenant_missions(*)')
    .eq('owner_id', user.id)
    .limit(1)
    .single()

  if (error || !tenant) {
    if (error) {
      console.error('Tenant fetch error in getActiveTenant:', error)
    }
    // Ensure the user exists in public.users to satisfy foreign key constraints later
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
    })

    // If there is no tenant, redirect to the onboarding setup wizard
    redirect('/setup')
  }

  return { user, tenant }
}

export async function getTenantOrders(tenantId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function getTenantProducts(tenantId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, global_dropship_catalog(title, image_urls, base_price)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function getTenantProductCount(tenantId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  if (error) return 0
  return count ?? 0
}

export async function getTenantReferralCount(tenantId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_tenant_id', tenantId)
    .eq('status', 'paid') // only count converted referrals

  if (error) return 0
  return count ?? 0
}

/**
 * Returns the total pending and paid referral counts for a tenant,
 * plus the accumulated referral_credit_days from their subscription.
 */
export async function getTenantReferralStats(tenantId: string): Promise<{
  paidCount: number
  pendingCount: number
  creditDays: number
}> {
  const supabase = await createClient()

  const [paidRes, pendingRes, subRes] = await Promise.all([
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_tenant_id', tenantId)
      .eq('status', 'paid'),
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_tenant_id', tenantId)
      .eq('status', 'pending'),
    supabase
      .from('subscriptions')
      .select('referral_credit_days')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return {
    paidCount:    paidRes.count    ?? 0,
    pendingCount: pendingRes.count ?? 0,
    creditDays:   subRes.data?.referral_credit_days ?? 0,
  }
}
