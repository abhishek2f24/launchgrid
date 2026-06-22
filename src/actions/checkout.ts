'use server'

import { createServiceClient } from '@/utils/supabase/service'
import { inngest } from '@/inngest/client'


// --- Mock Supplier API ---
async function checkSupplierInventory(sku: string, requestedQuantity: number) {
  await new Promise((resolve) => setTimeout(resolve, 800))
  if (Math.random() > 0.95) return { inStock: false }
  return { inStock: true }
}

type CartItem = {
  productId: string
  quantity: number
  variantId?: string
}

type CheckoutPayload = {
  tenantId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  cartItems: CartItem[]
  couponCode?: string
}

export async function initiateCheckout(payload: CheckoutPayload) {
  const supabase = createServiceClient()

  try {
    const { tenantId, cartItems, customerName, customerEmail, customerPhone, couponCode } = payload

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' }
    }

    // 1. Fetch source-of-truth products
    const productIds = cartItems.map((item) => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, retail_price, global_catalog_id, title, reserved_quantity, has_variants, stock')
      .eq('tenant_id', tenantId)
      .in('id', productIds)

    if (productsError || !products || products.length !== cartItems.length) {
      return { success: false, error: 'Invalid products in cart or price mismatch.' }
    }

    // 2. Fetch variants if needed
    const variantIds = cartItems.map((item) => item.variantId).filter(Boolean) as string[]
    let variants: any[] = []
    if (variantIds.length > 0) {
      const { data: fetchedVariants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .in('id', variantIds)
      if (!variantsError && fetchedVariants) {
        variants = fetchedVariants
      }
    }

    let orderTotal = 0
    const validatedOrderItems = []

    // 3. JIT Inventory Check & Total Calculation
    for (const item of cartItems) {
      const dbProduct = products.find((p) => p.id === item.productId)
      if (!dbProduct) continue

      let itemPrice = Number(dbProduct.retail_price)
      let variantTitle = null
      let variantId = null

      if (dbProduct.has_variants) {
        if (!item.variantId) {
          return { success: false, error: `Please select an option for "${dbProduct.title}".` }
        }
        const variant = variants.find((v) => v.id === item.variantId && v.product_id === dbProduct.id)
        if (!variant) {
          return { success: false, error: `Selected option for "${dbProduct.title}" is invalid.` }
        }
        if (variant.stock < item.quantity) {
          return { success: false, error: `Oops! The option "${variant.title}" for "${dbProduct.title}" has insufficient stock.` }
        }
        if (variant.price !== null && variant.price !== undefined) {
          itemPrice = Number(variant.price)
        }
        variantTitle = variant.title
        variantId = variant.id
      } else {
        if (dbProduct.stock < item.quantity) {
          return { success: false, error: `Oops! "${dbProduct.title}" has insufficient stock.` }
        }
      }

      if (dbProduct.global_catalog_id) {
        const inventory = await checkSupplierInventory(dbProduct.global_catalog_id, item.quantity)
        if (!inventory.inStock) {
          return { success: false, error: `Oops! "${dbProduct.title}" just sold out.` }
        }
      }

      // Calculate total
      const itemTotal = itemPrice * item.quantity
      orderTotal += itemTotal

      validatedOrderItems.push({
        product_id: dbProduct.id,
        quantity: item.quantity,
        price_at_purchase: itemPrice,
        current_reserved: dbProduct.reserved_quantity || 0,
        variant_id: variantId,
        variant_title: variantTitle
      })
    }

    // 4. Validate Coupon / Voucher code
    let discountAmount = 0
    let validatedCoupon = null
    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('code', couponCode.trim())
        .eq('is_active', true)
        .maybeSingle()

      if (couponError || !coupon) {
        return { success: false, error: 'Invalid or expired coupon code.' }
      }

      if (coupon.min_order_value && orderTotal < Number(coupon.min_order_value)) {
        return { success: false, error: `Coupon requires a minimum order value of ₹${coupon.min_order_value}.` }
      }

      validatedCoupon = coupon
      if (coupon.discount_type === 'percentage') {
        discountAmount = orderTotal * (Number(coupon.value) / 100)
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = Number(coupon.value)
      } else if (coupon.discount_type === 'free_shipping') {
        discountAmount = 0 // shipping is free by default
      }
      
      // Ensure discount doesn't exceed total
      discountAmount = Math.min(orderTotal, discountAmount)
    }

    const finalTotal = Math.max(0, orderTotal - discountAmount)

    // 5. Increment Local Inventory Locks (15 min expiry)
    const reservationExpiry = new Date()
    reservationExpiry.setMinutes(reservationExpiry.getMinutes() + 15)

    for (const item of validatedOrderItems) {
      if (!item.variant_id) {
        await supabase
          .from('products')
          .update({ 
            reserved_quantity: item.current_reserved + item.quantity,
            reservation_expires_at: reservationExpiry.toISOString()
          })
          .eq('id', item.product_id)
      }
    }

    // 6. Create the Provisional Order
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        total_amount: finalTotal,
        discount_amount: discountAmount,
        coupon_code: validatedCoupon ? validatedCoupon.code : null,
        payment_status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (orderError || !order) throw new Error('Failed to create provisional order')

    // Insert Order Items
    const itemsToInsert = validatedOrderItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      order_id: order.id,
      variant_id: item.variant_id,
      variant_title: item.variant_title
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
    if (itemsError) throw new Error('Failed to save order items')

    // 7. Fire Abandoned Cart Queue (Delayed by 15 mins automatically by Inngest)
    await inngest.send({
      name: 'cart/abandoned.start',
      data: {
        provisionalOrderId: order.id,
        tenantId,
        customerEmail,
        customerPhone,
      }
    })

    // 8. Generate Razorpay Order ID & Handshake
    const mockRazorpayOrderId = `order_rzp_${Math.random().toString(36).substring(7)}`

    return {
      success: true,
      provisionalOrderId: order.id,
      razorpayOrderId: mockRazorpayOrderId,
      amount: finalTotal,
    }

  } catch (error: unknown) {
    console.error('[CHECKOUT_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred during checkout.' }
  }
}

