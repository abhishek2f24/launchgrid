import { createServiceClient } from '@/utils/supabase/service'
import { Resend } from 'resend'

export async function sendFulfillmentNotification(orderId: string, type: 'shipped' | 'delivered', trackingInfo?: { awb: string; courier: string; url: string }) {
  const supabase = createServiceClient()

  try {
    // 1. Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, tenants(business_name, subdomain)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error(`[NOTIFICATION_ERROR] Failed to fetch order details for order ${orderId}:`, orderError)
      return
    }

    const tenant = Array.isArray(order.tenants) ? order.tenants[0] : order.tenants
    const storeName = tenant?.business_name || 'Our Store'
    const subdomain = tenant?.subdomain
    const shortOrderId = orderId.split('-')[0].toUpperCase()

    // 2. Mock WhatsApp Notification
    const whatsappTemplate = type === 'shipped'
      ? `📦 Hi ${order.customer_name}, your order #${shortOrderId} from ${storeName} has been shipped! tracking code: ${trackingInfo?.awb || 'N/A'} via ${trackingInfo?.courier || 'our delivery partner'}. Track here: ${trackingInfo?.url || `https://${subdomain}.launchgrid.in/track/${orderId}`}`
      : `🎉 Hi ${order.customer_name}, your order #${shortOrderId} from ${storeName} has been delivered! We hope you love your purchase. Reply to this message if you have any questions!`

    console.log(`\n=================== [MOCK WHATSAPP NOTIFICATION] ===================\nTo: ${order.customer_phone}\nMessage: ${whatsappTemplate}\n===================================================================\n`)

    // 3. Send Branded Email via Resend
    if (process.env.RESEND_API_KEY && order.customer_email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.FROM_EMAIL || 'notifications@launchgrid.in'
      const storeUrl = subdomain ? `https://${subdomain}.launchgrid.in` : ''

      let subject = ''
      let htmlContent = ''

      if (type === 'shipped') {
        subject = `🚚 Your order #${shortOrderId} from ${storeName} has shipped!`
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #333;">
            <h2 style="color: #2563eb; margin-top: 0;">🚚 Your Order is on the Way!</h2>
            <p>Hi <strong>${order.customer_name}</strong>,</p>
            <p>Good news! Your order from <strong>${storeName}</strong> has been shipped and is on its way to you.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${shortOrderId}</p>
              <p style="margin: 5px 0;"><strong>Courier:</strong> ${trackingInfo?.courier || 'Our delivery partner'}</p>
              <p style="margin: 5px 0;"><strong>AWB Tracking Number:</strong> <span style="font-family: monospace;">${trackingInfo?.awb || 'Pending'}</span></p>
            </div>
            
            ${trackingInfo?.url ? `
              <p style="text-align: center; margin-top: 25px;">
                <a href="${trackingInfo.url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">
                  Track Your Package →
                </a>
              </p>
            ` : ''}
            
            <p style="margin-top: 30px; font-size: 13px; color: #666;">
              If you have any questions about your delivery, please contact support at ${storeUrl || 'our store'}.
            </p>
          </div>
        `
      } else if (type === 'delivered') {
        subject = `🎉 Delivered: Your order #${shortOrderId} from ${storeName} has arrived!`
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #333;">
            <h2 style="color: #059669; margin-top: 0;">🎉 Your Package Has Arrived!</h2>
            <p>Hi <strong>${order.customer_name}</strong>,</p>
            <p>According to our records, your order from <strong>${storeName}</strong> has been delivered.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${shortOrderId}</p>
              <p style="margin: 5px 0;"><strong>Delivery Status:</strong> Completed successfully</p>
            </div>
            
            <p>We hope you love your new items! If you're happy with your purchase, please consider leaving us a review.</p>
            
            <p style="margin-top: 30px; font-size: 13px; color: #666;">
              If you did not receive your package or need help with returns, please contact us directly.
            </p>
          </div>
        `
      }

      await resend.emails.send({
        from: `${storeName} <${fromEmail}>`,
        to: order.customer_email,
        subject,
        html: htmlContent
      })
      console.log(`[NOTIFICATION] Successfully sent ${type} email to ${order.customer_email} for order ${orderId}`)
    }
  } catch (err) {
    console.error(`[NOTIFICATION_ERROR] Unexpected error sending ${type} notification:`, err)
  }
}
