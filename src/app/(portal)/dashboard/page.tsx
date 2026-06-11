import { getActiveTenant, getTenantOrders, getTenantProductCount, getTenantReferralStats, getTenantProducts } from '@/utils/supabase/queries'
import { DashboardClient } from './DashboardClient'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const result = await getActiveTenant()

  if (!result) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-10 font-inter">
        <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)]">Dashboard Unavailable</h1>
        <p className="text-[var(--color-mark-secondary)]">Please complete your onboarding to provision a tenant database.</p>
      </div>
    )
  }

  const { tenant } = result
  const supabase = await createClient()

  // Real visitor metrics for the onboarding win tracker and analytics dashboard
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    orders, productCount, referralStats, products,
    visitorCountRes, todayViewsRes, todayProductViewsRes, todayCartAddsRes,
    allProductViewsRes, allCartAddsRes, allCheckoutStartsRes,
    referrerEventsRes
  ] = await Promise.all([
    getTenantOrders(tenant.id),
    getTenantProductCount(tenant.id),
    getTenantReferralStats(tenant.id),
    getTenantProducts(tenant.id),
    // all-time page views (total unique visitors proxy)
    supabase
      .from('store_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.id)
      .eq('event_type', 'page_view'),
    // today page views
    supabase
      .from('store_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.id)
      .eq('event_type', 'page_view')
      .gte('created_at', today.toISOString()),
    // today product views
    supabase
      .from('store_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.id)
      .eq('event_type', 'product_view')
      .gte('created_at', today.toISOString()),
    // today cart adds
    supabase
      .from('store_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.id)
      .eq('event_type', 'cart_add')
      .gte('created_at', today.toISOString()),
    // all-time product views (for funnel)
    supabase
      .from('store_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.id)
      .eq('event_type', 'product_view'),
    // all-time cart adds (for funnel)
    supabase
      .from('store_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.id)
      .eq('event_type', 'cart_add'),
    // all-time checkout starts (for funnel)
    supabase
      .from('store_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.id)
      .eq('event_type', 'checkout_start'),
    // referrer breakdown (for traffic sources)
    supabase
      .from('store_events')
      .select('referrer')
      .eq('store_id', tenant.id)
      .eq('event_type', 'page_view')
      .limit(2000),
  ])

  const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)

  // Classify referrers into traffic source buckets
  const referrerRows = referrerEventsRes.data ?? []
  const trafficSources = referrerRows.reduce<Record<string, number>>((acc, row) => {
    const ref = (row.referrer || '').toLowerCase()
    let bucket = 'Direct'
    if (ref.includes('whatsapp') || ref.includes('wa.me')) bucket = 'WhatsApp'
    else if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo')) bucket = 'Organic Search'
    else if (ref.includes('facebook') || ref.includes('instagram') || ref.includes('twitter') || ref.includes('t.co') || ref.includes('linkedin') || ref.includes('youtube')) bucket = 'Social Media'
    else if (ref !== '') bucket = 'Referral'
    acc[bucket] = (acc[bucket] || 0) + 1
    return acc
  }, {})

  return (
    <DashboardClient
      tenant={tenant}
      orders={orders}
      revenue={revenue}
      productCount={productCount}
      referralCount={referralStats.paidCount}
      referralPending={referralStats.pendingCount}
      referralCreditDays={referralStats.creditDays}
      products={products}
      visitorCount={visitorCountRes.count ?? 0}
      todayViews={todayViewsRes.count ?? 0}
      todayProductViews={todayProductViewsRes.count ?? 0}
      todayCartAdds={todayCartAddsRes.count ?? 0}
      allTimeProductViews={allProductViewsRes.count ?? 0}
      allTimeCartAdds={allCartAddsRes.count ?? 0}
      allTimeCheckoutStarts={allCheckoutStartsRes.count ?? 0}
      trafficSources={trafficSources}
    />
  )
}
