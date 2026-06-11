import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { Resend } from 'resend'
import { decrypt, isEncrypted } from '@/utils/encryption'
import { rateLimit, getClientIp } from '@/utils/rateLimit'

export async function POST(req: Request) {
  // Rate limit: 20 order attempts per IP per 10 minutes
  const ip = getClientIp(req)
  const rl = rateLimit(`create-order:${ip}`, { limit: 20, windowMs: 10 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { tenantId, items, total, customerDetails, couponCode } = await req.json()

    if (!tenantId || !items?.length || !total || !customerDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Validate coupon and calculate discount on the server for security (Sprint 1 coupon system)
    let discountAmount = 0
    let validatedCouponCode = null

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('code, discount_type, value, min_order_value, is_active')
        .eq('tenant_id', tenantId)
        .ilike('code', couponCode.trim())
        .single()

      if (coupon && coupon.is_active && Number(total) >= Number(coupon.min_order_value)) {
        validatedCouponCode = coupon.code
        if (coupon.discount_type === 'percentage') {
          discountAmount = parseFloat(((Number(total) * Number(coupon.value)) / 100).toFixed(2))
        } else if (coupon.discount_type === 'fixed') {
          discountAmount = Math.min(Number(total), Number(coupon.value))
        }
      }
    }

    const finalAmount = Math.max(0, Number(total) - discountAmount)

    // Fetch tenant payment config and details
    const { data: config } = await supabase
      .from('business_configs')
      .select('merchant_upi_id, rzp_key_id, rzp_key_secret, payment_tier')
      .eq('tenant_id', tenantId)
      .single()

    const { data: tenantDetails } = await supabase
      .from('tenants')
      .select('business_name, subdomain, owner_id')
      .eq('id', tenantId)
      .single()

    // Check subscription status to block expired stores (R-02)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const isTrial = sub?.status === 'trialing'
    const isExpired = sub
      ? (isTrial && sub.current_period_end && new Date(sub.current_period_end) < new Date()) || sub.status === 'archived'
      : false

    if (isExpired) {
      return NextResponse.json({ error: 'Store checkout is disabled. Subscription has expired.' }, { status: 403 })
    }

    // Create provisional order in DB (C-05 shipping address includes state)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        customer_email: customerDetails.email || null,
        shipping_address: {
          street: customerDetails.address,
          city: customerDetails.city,
          state: customerDetails.state,
          pincode: customerDetails.pincode,
        },
        total_amount: finalAmount,
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        line_items: items,
        coupon_code: validatedCouponCode,
        discount_amount: discountAmount,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Populate order_items table for structured queries and Shiprocket mapping
    const orderItemsToInsert = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId || item.id,
      variant_id: item.variantId || null,
      variant_title: item.variantTitle || null,
      quantity: item.quantity,
      price_at_purchase: item.retail_price || item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)

    // Trigger Inngest Abandoned Cart Recovery (A-06)
    try {
      const { inngest } = await import('@/inngest/client')
      await inngest.send({
        name: 'cart/abandoned.start',
        data: {
          provisionalOrderId: order.id,
          customerEmail: customerDetails.email || null,
          customerPhone: customerDetails.phone,
        }
      })
    } catch (inngestErr) {
      console.error('[INNGEST_ABANDONED_CART_ERROR]', inngestErr)
    }

    // Notify Merchant and Buyer via Resend if RESEND_API_KEY is available (H-01 / A-01 / A-02)
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const storeName = tenantDetails?.business_name || 'Our Store'
        const fromEmail = process.env.FROM_EMAIL || 'notifications@launchgrid.in'
        const shortOrderId = order.id.split('-')[0].toUpperCase()

        // Get merchant email
        let merchantEmail = ''
        if (tenantDetails?.owner_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', tenantDetails.owner_id)
            .single()
          merchantEmail = userData?.email || ''
        }

        // 1. Send Order Notification to Merchant (A-01)
        if (merchantEmail) {
          await resend.emails.send({
            from: `LaunchGrid <${fromEmail}>`,
            to: merchantEmail,
            subject: `🎉 New Order received: ₹${total} on ${storeName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #333;">
                <h2 style="color: #8b5cf6; margin-top: 0;">🎉 You got a new order!</h2>
                <p>Congratulations! A new order has been placed on <strong>${storeName}</strong>.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #666;">Order Details</h3>
                  <p style="margin: 5px 0;"><strong>Order ID:</strong> #${shortOrderId}</p>
                  <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerDetails.name} (${customerDetails.phone})</p>
                  <p style="margin: 5px 0;"><strong>Shipping To:</strong> ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} - ${customerDetails.pincode}</p>
                  <p style="margin: 5px 0;"><strong>Total Value:</strong> ₹${total}</p>
                </div>
                <p style="text-align: center; margin-top: 25px;">
                  <a href="https://launchgrid.in/dashboard/orders/${order.id}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">
                    View Order Details &amp; Fulfill →
                  </a>
                </p>
              </div>
            `
          })
        }

        // 2. Send Order Confirmation Email to Buyer (A-02)
        if (customerDetails.email) {
          const storeUrl = tenantDetails?.subdomain ? `https://${tenantDetails.subdomain}.launchgrid.in` : ''
          await resend.emails.send({
            from: `${storeName} <${fromEmail}>`,
            to: customerDetails.email,
            subject: `Order Confirmed: #${shortOrderId} at ${storeName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #333;">
                <h2 style="margin-top: 0; color: #111;">Order Confirmed!</h2>
                <p>Hi <strong>${customerDetails.name}</strong>,</p>
                <p>Thank you for shopping with us. We have received your order and are preparing it for shipment.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Order ID:</strong> #${shortOrderId}</p>
                  <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} - ${customerDetails.pincode}</p>
                  <p style="margin: 5px 0;"><strong>Order Total:</strong> ₹${total} (Free Shipping)</p>
                </div>
                
                <p>We'll notify you as soon as your package has shipped! For questions, reply to this email or contact customer support.</p>
                
                ${storeUrl ? `<p style="text-align: center; margin-top: 25px;"><a href="${storeUrl}/invoice/${order.id}" style="background-color: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">View Invoice →</a></p>` : ''}
              </div>
            `
          })
        }
      } catch (emailErr) {
        console.error('[CHECKOUT_NOTIFICATION_EMAIL_ERROR]', emailErr)
      }
    }

    // If Razorpay BYOK is configured, create a Razorpay order via REST API
    if (config?.rzp_key_id && config?.rzp_key_secret && config.payment_tier === 'byok') {
      // Decrypt the stored key secret (may be encrypted or plain-text for legacy rows)
      let rzpSecret = config.rzp_key_secret
      try {
        if (isEncrypted(rzpSecret)) rzpSecret = decrypt(rzpSecret)
      } catch (decErr) {
        console.error('[DECRYPT_RZP_SECRET_ERROR]', decErr)
        // Fall through — use as-is (may fail at Razorpay but won't crash checkout)
      }
      const authHeader = Buffer.from(`${config.rzp_key_id}:${rzpSecret}`).toString('base64')
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount * 100, // paise
          currency: 'INR',
          receipt: order.id.substring(0, 40),
          notes: { provisional_order_id: order.id },
        }),
      })

      if (!rzpRes.ok) {
        const err = await rzpRes.json()
        console.error('Razorpay order creation failed:', err)
        // Fall through to UPI
      } else {
        const rzpOrder = await rzpRes.json()
        return NextResponse.json({
          success: true,
          orderId: order.id,
          razorpayOrderId: rzpOrder.id,
        })
      }
    }

    // UPI fallback: return UPI deep link
    if (config?.merchant_upi_id) {
      const upiLink = `upi://pay?pa=${encodeURIComponent(config.merchant_upi_id)}&pn=${encodeURIComponent('LaunchGrid Store')}&am=${finalAmount}&tn=${encodeURIComponent(`Order ${order.id.substring(0, 8)}`)}&cu=INR`
      return NextResponse.json({
        success: true,
        orderId: order.id,
        upiLink,
      })
    }

    // No payment config — order accepted for manual processing
    return NextResponse.json({ success: true, orderId: order.id })

  } catch (err: any) {
    console.error('[CHECKOUT_ERROR]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
