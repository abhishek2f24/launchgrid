import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

    const { data: updatedOrders, error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', orderId)
      .select('tenant_id, total_amount')

    if (error) {
      console.error('Failed to mark order as paid:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (updatedOrders && updatedOrders.length > 0) {
      const paidOrder = updatedOrders[0]

      // Deduct inventory stock for the order items
      try {
        const { deductOrderStock } = await import('@/utils/inventory')
        await deductOrderStock(orderId)
      } catch (stockErr) {
        console.error('[STOCK_DEDUCTION_ERROR]', stockErr)
      }

      try {
        const { checkComplianceMilestones } = await import('@/utils/compliance')
        checkComplianceMilestones(paidOrder.tenant_id, Number(paidOrder.total_amount || 0)).catch(err => {
          console.error('[COMPLIANCE_TRIGGER_ERROR]', err)
        })
      } catch (importErr) {
        console.error('[COMPLIANCE_IMPORT_ERROR]', importErr)
      }

      // Cancel Inngest abandoned cart recovery (A-06)
      try {
        const { inngest } = await import('@/inngest/client')
        await inngest.send({
          name: 'cart/payment.captured',
          data: { provisionalOrderId: orderId }
        })
      } catch (inngestErr) {
        console.error('[INNGEST_CANCELLATION_ERROR]', inngestErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[MARK_PAID_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
