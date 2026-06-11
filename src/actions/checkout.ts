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
}

type CheckoutPayload = {
  tenantId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  cartItems: CartItem[]
}

export async function initiateCheckout(payload: CheckoutPayload) {
  const supabase = createServiceClient()

  try {
    const { tenantId, cartItems, customerName, customerEmail, customerPhone } = payload

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' }
    }

    // 1. Fetch source-of-truth prices and reserved stock
    const productIds = cartItems.map((item) => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, retail_price, global_catalog_id, title, reserved_quantity')
      .eq('tenant_id', tenantId)
      .in('id', productIds)

    if (productsError || !products || products.length !== cartItems.length) {
      return { success: false, error: 'Invalid products in cart or price mismatch.' }
    }

    let orderTotal = 0
    const validatedOrderItems = []

    // 2. JIT Inventory Check & Total Calculation
    for (const item of cartItems) {
      const dbProduct = products.find((p) => p.id === item.productId)
      if (!dbProduct) continue

      if (dbProduct.global_catalog_id) {
        const inventory = await checkSupplierInventory(dbProduct.global_catalog_id, item.quantity)
        if (!inventory.inStock) {
          return { success: false, error: `Oops! "${dbProduct.title}" just sold out.` }
        }
      }

      // Calculate total
      const itemTotal = Number(dbProduct.retail_price) * item.quantity
      orderTotal += itemTotal

      validatedOrderItems.push({
        product_id: dbProduct.id,
        quantity: item.quantity,
        price_at_purchase: dbProduct.retail_price,
        current_reserved: dbProduct.reserved_quantity || 0
      })
    }

    // 3. Increment Local Inventory Locks (15 min expiry)
    // Normally done via Supabase RPC for atomic safety, handling inline for Phase 1.
    const reservationExpiry = new Date()
    reservationExpiry.setMinutes(reservationExpiry.getMinutes() + 15)

    for (const item of validatedOrderItems) {
      await supabase
        .from('products')
        .update({ 
          reserved_quantity: item.current_reserved + item.quantity,
          reservation_expires_at: reservationExpiry.toISOString()
        })
        .eq('id', item.product_id)
    }

    // 4. Create the Provisional Order
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        total_amount: orderTotal,
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
      order_id: order.id
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
    if (itemsError) throw new Error('Failed to save order items')

    // 5. Fire Abandoned Cart Queue (Delayed by 15 mins automatically by Inngest)
    await inngest.send({
      name: 'cart/abandoned.start',
      data: {
        provisionalOrderId: order.id,
        tenantId,
        customerEmail,
        customerPhone,
      }
    })

    // 6. Generate Razorpay Order ID & Handshake
    const mockRazorpayOrderId = `order_rzp_${Math.random().toString(36).substring(7)}`

    return {
      success: true,
      provisionalOrderId: order.id,
      razorpayOrderId: mockRazorpayOrderId,
      amount: orderTotal,
    }

  } catch (error: unknown) {
    console.error('[CHECKOUT_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred during checkout.' }
  }
}
