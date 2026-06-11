import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function POST(req: Request) {
  try {
    const { tenantId, code, orderAmount } = await req.json()

    if (!tenantId || !code || orderAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch the coupon (case-insensitive check)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('code, discount_type, value, min_order_value, is_active')
      .eq('tenant_id', tenantId)
      .ilike('code', code.trim())
      .single()

    if (error || !coupon) {
      return NextResponse.json({ valid: false, message: 'Invalid coupon code' })
    }

    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, message: 'Coupon is expired or inactive' })
    }

    if (Number(orderAmount) < Number(coupon.min_order_value)) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order value of ₹${coupon.min_order_value} required for this coupon`,
      })
    }

    // Calculate discount amount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = parseFloat(((Number(orderAmount) * Number(coupon.value)) / 100).toFixed(2))
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = Math.min(Number(orderAmount), Number(coupon.value))
    } else if (coupon.discount_type === 'free_shipping') {
      // For this system, shipping is already free by default, but we can treat it as a token discount of 0
      discountAmount = 0
    }

    return NextResponse.json({
      valid: true,
      couponCode: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.value,
      discountAmount,
    })

  } catch (err: any) {
    console.error('[COUPON_VALIDATE_ERROR]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
