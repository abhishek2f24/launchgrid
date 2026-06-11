import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { Resend } from 'resend'

// Secure the cron endpoint in production using an auth header
// E.g., Authorization: Bearer CRON_SECRET

export async function GET(req: Request) {
  try {
    // For local dev, we bypass the CRON_SECRET check, but in production we'd enforce it.
    const isDev = process.env.NODE_ENV === 'development'
    const authHeader = req.headers.get('authorization')
    if (!isDev && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const serviceSupabase = createServiceClient()

    // Find orders that:
    // - Are pending payment
    // - Created more than 1 hour ago
    // - Have an email address
    // - Haven't had an abandoned cart email sent yet
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: abandonedOrders, error } = await serviceSupabase
      .from('orders')
      .select('id, tenant_id, customer_name, customer_email, total_amount, created_at, tenants(business_name, subdomain)')
      .eq('payment_status', 'pending')
      .eq('abandoned_email_sent', false)
      .lt('created_at', oneHourAgo)
      .not('customer_email', 'is', null)
      .limit(50)

    if (error) {
      console.error('[CRON_ERROR] fetching orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!abandonedOrders || abandonedOrders.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No abandoned carts found.' })
    }

    let processedCount = 0

    for (const order of abandonedOrders) {
      if (!order.customer_email) continue

      const tenant = Array.isArray(order.tenants) ? order.tenants[0] : order.tenants
      const storeName = tenant?.business_name || 'Our Store'
      const storeUrl = tenant?.subdomain ? `https://${tenant.subdomain}.launchgrid.in` : 'https://launchgrid.in'
      
      const checkoutUrl = `${storeUrl}/checkout?order_id=${order.id}` // Mock link for them to resume

      try {
        await resend.emails.send({
          from: `${storeName} <${process.env.FROM_EMAIL || 'help@launchgrid.in'}>`,
          to: order.customer_email,
          subject: `Did you forget something, ${order.customer_name}?`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Hi ${order.customer_name},</h2>
              <p>We noticed you left some items in your cart at <strong>${storeName}</strong>.</p>
              <p>Your cart total is <strong>₹${order.total_amount}</strong>.</p>
              <p>Don't miss out! Click the button below to securely complete your purchase.</p>
              <br/>
              <a href="${checkoutUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Complete Checkout
              </a>
              <br/><br/>
              <p>If you have any questions or need help, just reply to this email.</p>
              <p>Best,<br/>The ${storeName} Team</p>
            </div>
          `
        })

        // Mark as sent
        await serviceSupabase
          .from('orders')
          .update({ abandoned_email_sent: true })
          .eq('id', order.id)

        processedCount++
      } catch (emailError) {
        console.error(`[CRON_ERROR] Failed to send email for order ${order.id}:`, emailError)
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })

  } catch (err: any) {
    console.error('[CRON_FATAL_ERROR]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
