import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET(
  request: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  try {
    const params = await props.params;
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ payment_status: order.payment_status })
  } catch (err: any) {
    console.error('[ORDER_STATUS_POLL_ERROR]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
