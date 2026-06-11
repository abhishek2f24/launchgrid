import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

// Cache the response for 5 minutes to avoid hammering Supabase on every page load
export const revalidate = 300

export async function GET() {
  try {
    const supabase = createServiceClient()

    const [storesRes, revenueRes] = await Promise.all([
      // Count active tenants
      supabase
        .from('tenants')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Sum all paid orders
      supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'paid'),
    ])

    const storeCount = storesRes.count ?? 0
    const totalRevenue = (revenueRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.total_amount),
      0
    )

    return NextResponse.json(
      { storeCount, totalRevenue },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (err) {
    console.error('[PLATFORM_STATS_ERROR]', err)
    // Return safe fallback values — never expose errors on a public endpoint
    return NextResponse.json({ storeCount: 0, totalRevenue: 0 })
  }
}
