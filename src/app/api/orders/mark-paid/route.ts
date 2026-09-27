import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId, paymentReference } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

    // The seller types this off their UPI app while looking at the payment, so
    // it arrives with stray spaces and mixed case. Store it the way it is
    // printed, minus the noise, or store nothing at all — an empty string would
    // read as "reference recorded" in every later query.
    const reference =
      typeof paymentReference === 'string' && paymentReference.trim().length > 0
        ? paymentReference.trim().slice(0, 64)
        : null

    const { data: updatedOrders, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        ...(reference ? { payment_reference: reference } : {}),
      })
      .eq('id', orderId)
      .select('tenant_id, total_amount')

    if (error) {
      console.error('Failed to mark order as paid:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // RLS scopes this update to the caller's own tenant, so an order belonging
    // to someone else simply matches no rows. Reporting success for that would
    // tell the seller a payment was recorded when nothing was written.
    if (!updatedOrders || updatedOrders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    {
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
