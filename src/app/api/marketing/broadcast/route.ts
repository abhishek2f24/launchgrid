import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { Resend } from 'resend'

const serviceSupabase = createServiceClient()

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { channel, campaignName, subject, body } = await req.json()
    if (!channel || !campaignName || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Fetch tenant details
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('id, business_name, subdomain')
      .eq('owner_id', user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const storeName = tenant.business_name || 'Our Store'
    const storeUrl = `https://${tenant.subdomain}.launchgrid.in`
    const parsedBody = body.replace(/\{\{store_url\}\}/g, storeUrl)

    // 2. Fetch distinct customer contacts from orders
    const { data: orders } = await serviceSupabase
      .from('orders')
      .select('customer_name, customer_email, customer_phone')
      .eq('tenant_id', tenant.id)

    const customersMap = new Map()
    orders?.forEach(order => {
      const key = order.customer_email || order.customer_phone
      if (!key) return
      if (!customersMap.has(key)) {
        customersMap.set(key, {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone
        })
      }
    })

    const customers = Array.from(customersMap.values())
    let sentCount = 0

    if (channel === 'email') {
      const emailsToSend = customers.filter(c => !!c.email)
      
      if (process.env.RESEND_API_KEY && emailsToSend.length > 0) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.FROM_EMAIL || 'newsletter@launchgrid.in'
        
        for (const customer of emailsToSend) {
          const personalBody = parsedBody.replace(/\{\{customer_name\}\}/g, customer.name)
          
          await resend.emails.send({
            from: `${storeName} <${fromEmail}>`,
            to: customer.email,
            subject: subject || `Special update from ${storeName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #333;">
                <h2 style="color: #111; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">${storeName}</h2>
                <p>Hi <strong>${customer.name}</strong>,</p>
                <div style="line-height: 1.6; font-size: 14px; white-space: pre-wrap; color: #444;">${personalBody}</div>
                <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 11px; color: #999; text-align: center;">
                  You are receiving this because you placed an order at ${storeName}.
                </div>
              </div>
            `
          })
          sentCount++
        }
      } else {
        // Mock sending if API Key is not set
        console.log(`\n=================== [MOCK EMAIL BROADCAST: ${campaignName}] ===================`)
        emailsToSend.forEach(c => {
          console.log(`Sending to: ${c.email} | Subject: ${subject}`)
          sentCount++
        })
        console.log(`======================================================================\n`)
      }
    } else if (channel === 'whatsapp') {
      const whatsappToSend = customers.filter(c => !!c.phone)
      
      console.log(`\n=================== [MOCK WHATSAPP BROADCAST: ${campaignName}] ===================`)
      whatsappToSend.forEach(c => {
        const personalBody = parsedBody
          .replace(/\{\{customer_name\}\}/g, c.name)
        console.log(`To: ${c.phone} | Msg: ${personalBody}`)
        sentCount++
      })
      console.log(`==========================================================================\n`)
    }

    return NextResponse.json({ success: true, sentCount })
  } catch (err: any) {
    console.error('[MARKETING_BROADCAST_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
