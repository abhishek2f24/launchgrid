import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

const serviceSupabase = createServiceClient()

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId, paymentStatus, fulfillmentStatus, trackingInfo } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

    // Fetch order first to check ownership and current status
    const { data: order, error: fetchErr } = await serviceSupabase
      .from('orders')
      .select('*, tenants(owner_id)')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const tenant = Array.isArray(order.tenants) ? order.tenants[0] : order.tenants
    if (tenant?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to order' }, { status: 403 })
    }

    const updates: Record<string, any> = {}
    let isMarkedPaid = false
    let isMarkedShipped = false
    let isMarkedDelivered = false

    if (paymentStatus && paymentStatus !== order.payment_status) {
      updates.payment_status = paymentStatus
      if (paymentStatus === 'paid') isMarkedPaid = true
    }

    if (fulfillmentStatus && fulfillmentStatus !== order.fulfillment_status) {
      updates.fulfillment_status = fulfillmentStatus
      if (fulfillmentStatus === 'shipped') isMarkedShipped = true
      if (fulfillmentStatus === 'delivered') isMarkedDelivered = true
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes detected' })
    }

    // Update in DB
    const { error: updateErr } = await serviceSupabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)

    if (updateErr) throw updateErr

    // Trigger Side-effects
    if (isMarkedPaid) {
      try {
        const { deductOrderStock } = await import('@/utils/inventory')
        await deductOrderStock(orderId)
      } catch (stockErr) {
        console.error('[INVENTORY_STOCK_UPDATE_ERROR]', stockErr)
      }
    }

    if (isMarkedShipped) {
      try {
        const { sendFulfillmentNotification } = await import('@/utils/notifications')
        await sendFulfillmentNotification(orderId, 'shipped', trackingInfo)
      } catch (notifErr) {
        console.error('[SHIPPED_NOTIFICATION_ERROR]', notifErr)
      }
    }

    if (isMarkedDelivered) {
      try {
        const { sendFulfillmentNotification } = await import('@/utils/notifications')
        await sendFulfillmentNotification(orderId, 'delivered')
      } catch (notifErr) {
        console.error('[DELIVERED_NOTIFICATION_ERROR]', notifErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[UPDATE_ORDER_STATUS_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
