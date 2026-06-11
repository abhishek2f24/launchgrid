import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import crypto from 'crypto'
import { inngest } from '@/inngest/client'
import { Resend } from 'resend'

// Webhook Secret for signature validation
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_local_testing_secret'

export async function POST(req: Request) {
  try {
    const textBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // 1. Validate Signature
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(textBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(textBody)

    // Only process successful payments
    if (event.event !== 'payment.captured') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    const { order_id, notes } = event.payload.payment.entity
    const provisionalOrderId = notes?.provisional_order_id

    if (!provisionalOrderId) {
      return NextResponse.json({ error: 'Missing provisional order ID' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 2. Fetch order to make sure it exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*, tenants(business_name, subdomain)')
      .eq('id', provisionalOrderId)
      .single()

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 3. Webhook Idempotency Check with Atomic Update
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', provisionalOrderId)
      .eq('payment_status', 'pending')
      .select()

    if (updateError) throw updateError

    // If no rows were updated, it means the order was already processed
    if (!updatedOrders || updatedOrders.length === 0) {
      return NextResponse.json({ status: 'already_processed' }, { status: 200 })
    }

    const paidOrder = updatedOrders[0]

    // Deduct inventory stock
    try {
      const { deductOrderStock } = await import('@/utils/inventory')
      await deductOrderStock(provisionalOrderId)
    } catch (stockErr) {
      console.error('[STOCK_DEDUCTION_ERROR]', stockErr)
    }

    // Check compliance milestones (A-05)
    try {
      const { checkComplianceMilestones } = await import('@/utils/compliance')
      checkComplianceMilestones(paidOrder.tenant_id, Number(paidOrder.total_amount || 0)).catch(err => {
        console.error('[COMPLIANCE_TRIGGER_ERROR]', err)
      })
    } catch (importErr) {
      console.error('[COMPLIANCE_IMPORT_ERROR]', importErr)
    }

    // 4. Send Email Receipt/Invoice via Resend
    if (existingOrder?.customer_email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const tenant = Array.isArray(existingOrder.tenants) ? existingOrder.tenants[0] : existingOrder.tenants
        const storeName = tenant?.business_name || 'Our Store'
        const storeSubdomain = tenant?.subdomain
        const storeUrl = storeSubdomain ? `https://${storeSubdomain}.launchgrid.in` : 'https://launchgrid.in'
        const invoiceUrl = `${storeUrl}/invoice/${existingOrder.id}`

        await resend.emails.send({
          from: `${storeName} <${process.env.FROM_EMAIL || 'receipts@launchgrid.in'}>`,
          to: existingOrder.customer_email,
          subject: `Your invoice for Order #${existingOrder.id.split('-')[0].toUpperCase()}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #333;">
              <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 24px; color: #111;">${storeName}</h2>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Payment Receipt &amp; Tax Invoice</p>
              </div>
              
              <p>Hi <strong>${existingOrder.customer_name}</strong>,</p>
              <p>Thank you for your order! Your payment was captured successfully. Below is a summary of your invoice:</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold; color: #666;">Invoice No:</td>
                    <td style="padding: 5px 0; text-align: right; font-family: monospace;">#${existingOrder.id.split('-')[0].toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold; color: #666;">Date:</td>
                    <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleDateString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold; color: #666;">Amount Paid:</td>
                    <td style="padding: 5px 0; text-align: right; font-weight: bold;">₹${existingOrder.total_amount} (Inclusive of GST)</td>
                  </tr>
                </table>
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${invoiceUrl}" style="background-color: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">
                  View &amp; Print Full Invoice →
                </a>
              </p>
              
              <div style="border-top: 1px solid #eee; margin-top: 40px; padding-top: 20px; font-size: 11px; color: #999; text-align: center; line-height: 1.6;">
                <p>This email was sent on behalf of ${storeName} by LaunchGrid.</p>
                <p>For any queries, please get in touch with support at ${storeUrl}.</p>
              </div>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('[WEBHOOK_EMAIL_ERROR]', emailErr)
      }
    }

    // 4. Cancel the Abandoned Cart Queue
    await inngest.send({
      name: 'cart/payment.captured',
      data: { provisionalOrderId }
    })

    // 5. Mission Trigger: Update First Sale Mission
    await supabase
      .from('tenant_missions')
      .update({ step_8_first_visitor: true })
      .eq('tenant_id', existingOrder.tenant_id)

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('[WEBHOOK_ERROR]', err)
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

