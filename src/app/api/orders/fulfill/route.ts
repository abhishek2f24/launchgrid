import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

const serviceSupabase = createServiceClient()

// Shiprocket standard Order Item contract
interface ShiprocketOrderItem {
  name: string
  sku: string
  units: number
  selling_price: string
  discount: string
  tax: string
  hsn: number
}

// Shiprocket standard Create Order Request contract
interface ShiprocketCreateOrderRequest {
  order_id: string
  order_date: string
  pickup_location: string
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_address_2: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  order_items: ShiprocketOrderItem[]
  payment_method: 'Prepaid' | 'COD'
  shipping_charges: number
  giftwrap_charges: number
  transaction_charges: number
  total_discount: number
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

// Shiprocket standard Create Order Response contract
interface ShiprocketCreateOrderResponse {
  order_id: number
  channel_order_id: string
  shipment_id: number
  status: string
  status_code: number
  onboarded_courier_action: number
  awb_code: string
  courier_company_id: string
  courier_name: string
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

    // Fetch order details
    const { data: order, error: orderError } = await serviceSupabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.fulfillment_status !== 'unfulfilled') {
      return NextResponse.json({ error: 'Order is already fulfilled' }, { status: 400 })
    }

    // MAP DB order to Shiprocket Contract
    const shiprocketPayload: ShiprocketCreateOrderRequest = {
      order_id: order.id,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: 'Primary', // Must match their Shiprocket pickup location string
      billing_customer_name: order.customer_name.split(' ')[0],
      billing_last_name: order.customer_name.split(' ').slice(1).join(' ') || '',
      billing_address: order.shipping_address?.street || '123 Customer St',
      billing_address_2: '',
      billing_city: order.shipping_address?.city || 'Mumbai',
      billing_pincode: order.shipping_address?.pincode || '400001',
      billing_state: order.shipping_address?.state || 'Maharashtra',
      billing_country: 'India',
      billing_email: order.customer_email || 'no-reply@launchgrid.in',
      billing_phone: order.customer_phone || '0000000000',
      shipping_is_billing: true,
      order_items: order.order_items.map((item: any) => ({
        name: item.products.title,
        sku: item.products.slug,
        units: item.quantity,
        selling_price: item.price_at_purchase.toString(),
        discount: '0',
        tax: '0',
        hsn: 0
      })),
      payment_method: order.payment_status === 'paid' ? 'Prepaid' : 'COD',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total_amount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    }

    // ---------------------------------------------------------
    // SHIPROCKET INTEGRATION MOCK
    // ---------------------------------------------------------
    // If we had the real API key, we would POST to Shiprocket here.
    const isMockMode = !process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD
    
    let shiprocketResponse: ShiprocketCreateOrderResponse

    if (isMockMode) {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 800))
      
      shiprocketResponse = {
        order_id: Math.floor(Math.random() * 10000000),
        channel_order_id: order.id,
        shipment_id: Math.floor(Math.random() * 10000000),
        status: "NEW",
        status_code: 1,
        onboarded_courier_action: 1,
        awb_code: `AWB${Math.floor(Math.random() * 1000000000)}`,
        courier_company_id: "1",
        courier_name: "Blue Dart Mock"
      }
    } else {
      // REAL IMPLEMENTATION (Commented out until auth token logic is added)
      /*
      const token = await getShiprocketToken()
      const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(shiprocketPayload)
      })
      shiprocketResponse = await res.json()
      if (!res.ok) throw new Error('Shiprocket API failed')
      */
      throw new Error('Real Shiprocket credentials provided but API execution is not fully un-commented.')
    }

    // ---------------------------------------------------------
    // UPDATE DATABASE
    // ---------------------------------------------------------
    await serviceSupabase
      .from('orders')
      .update({ 
        fulfillment_status: 'routed_to_supplier',
      })
      .eq('id', order.id)

    // Send fulfillment notification (Sprint 1 / Customer Retention)
    try {
      const trackingUrl = `https://shiprocket.co/tracking/${shiprocketResponse.awb_code}`
      const { sendFulfillmentNotification } = await import('@/utils/notifications')
      await sendFulfillmentNotification(order.id, 'shipped', {
        awb: shiprocketResponse.awb_code,
        courier: shiprocketResponse.courier_name,
        url: trackingUrl
      })
    } catch (notifErr) {
      console.error('[FULFILL_NOTIFICATION_ERROR]', notifErr)
    }

    return NextResponse.json({ 
      success: true, 
      shipment: shiprocketResponse,
      tracking_url: `https://shiprocket.co/tracking/${shiprocketResponse.awb_code}`
    })

  } catch (err: any) {
    console.error('[FULFILL_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
