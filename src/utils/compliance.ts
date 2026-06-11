import { createServiceClient } from '@/utils/supabase/service'
import { Resend } from 'resend'

const serviceSupabase = createServiceClient()

export async function checkComplianceMilestones(tenantId: string, currentOrderAmount: number) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[COMPLIANCE] Missing RESEND_API_KEY. Skipping notification.')
      return
    }

    // 1. Fetch tenant details and owner_id
    const { data: tenant, error: tenantErr } = await serviceSupabase
      .from('tenants')
      .select('id, business_name, owner_id')
      .eq('id', tenantId)
      .single()

    if (tenantErr || !tenant) {
      console.error('[COMPLIANCE] Tenant not found:', tenantErr)
      return
    }

    // 2. Fetch owner's email
    const { data: owner, error: ownerErr } = await serviceSupabase
      .from('users')
      .select('email')
      .eq('id', tenant.owner_id)
      .single()

    if (ownerErr || !owner?.email) {
      console.error('[COMPLIANCE] Tenant owner email not found:', ownerErr)
      return
    }

    const ownerEmail = owner.email

    // 3. Fetch all paid orders for this tenant to compute total revenue
    const { data: orders, error: ordersErr } = await serviceSupabase
      .from('orders')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'paid')

    if (ordersErr) {
      console.error('[COMPLIANCE] Failed to fetch orders for revenue calculation:', ordersErr)
      return
    }

    const newRevenue = (orders || []).reduce((acc: number, o: any) => acc + Number(o.total_amount || 0), 0)
    const oldRevenue = newRevenue - currentOrderAmount

    const milestones = [
      { limit: 100000, label: '₹1L', subject: '🎉 ₹1L Milestone Reached: Time to Upgrade to Razorpay' },
      { limit: 1500000, label: '₹15L', subject: '⚠️ ₹15L Compliance Milestone: Prepare for GST Registration' },
      { limit: 2000000, label: '₹20L', subject: '🚨 ₹20L Milestone: GST Registration Required Immediately' },
      { limit: 3500000, label: '₹35L', subject: '⚠️ ₹35L Compliance Alert: Approaching Intra-State GST Limit' },
      { limit: 4000000, label: '₹40L', subject: '🚨 ₹40L Milestone: Store Checkout Locked' }
    ]

    const resend = new Resend(process.env.RESEND_API_KEY)
    const storeName = tenant.business_name || 'Your LaunchGrid Store'

    for (const milestone of milestones) {
      // Check if this payment caused the total revenue to cross the milestone
      if (oldRevenue < milestone.limit && newRevenue >= milestone.limit) {
        console.log(`[COMPLIANCE] Store ${storeName} crossed ${milestone.label} milestone (${oldRevenue} -> ${newRevenue}). Sending email.`)

        let body = ''
        if (milestone.limit === 100000) {
          body = `
            <h2 style="color: #8b5cf6;">Congrats on reaching ₹1L in sales! 🎉</h2>
            <p>Your store <strong>${storeName}</strong> has officially crossed ₹1,00,000 in cumulative paid revenue.</p>
            <p><strong>Next Step to Scale:</strong> Switch to Razorpay BYOK (Bring Your Own Keys). This unlocks credit card payments, EMI plans, and net banking for your customers, and reduces your LaunchGrid transaction commission to <strong>5%</strong>.</p>
            <p>Go to your dashboard settings under <strong>Payments</strong> to set this up.</p>
          `
        } else if (milestone.limit === 1500000) {
          body = `
            <h2 style="color: #d97706;">Action Recommended: Approaching GST Threshold (₹15L) ⚠️</h2>
            <p>Your store <strong>${storeName}</strong> has crossed ₹15,00,000 in paid revenue.</p>
            <p>Under Indian tax regulations, service-based providers or platforms must register for GST when annual turnover reaches ₹20 Lakhs. Because obtaining a GSTIN takes 3-7 business days, we advise starting your GST registration process now to prevent any future business interruptions.</p>
          `
        } else if (milestone.limit === 2000000) {
          body = `
            <h2 style="color: #dc2626;">Urgent: ₹20L Milestone Crossed — GST Required 🚨</h2>
            <p>Your store <strong>${storeName}</strong> has crossed ₹20,00,000 in paid revenue.</p>
            <p>You have reached the official GST threshold for service providers. Please submit your GSTIN in your LaunchGrid dashboard settings panel to keep your store checkouts fully active.</p>
          `
        } else if (milestone.limit === 3500000) {
          body = `
            <h2 style="color: #d97706;">Action Recommended: Approaching ₹40L Goods Limit (₹35L) ⚠️</h2>
            <p>Your store <strong>${storeName}</strong> has crossed ₹35,00,000 in paid revenue.</p>
            <p>You are now just ₹5 Lakhs away from the ₹40 Lakhs GST threshold for intra-state goods sellers in India. We recommend completing your GST registration immediately to avoid automatic storefront checkout lockouts.</p>
          `
        } else if (milestone.limit === 4000000) {
          body = `
            <h2 style="color: #dc2626;">CRITICAL: ₹40L Threshold Reached — Store Checkouts Locked 🚨</h2>
            <p>Your store <strong>${storeName}</strong> has reached ₹40,00,000 in paid revenue.</p>
            <p>Under Indian e-commerce GST compliance mandates, checkouts have been temporarily locked for your store. To re-enable checkout instantly, please submit your valid GSTIN in your dashboard settings page.</p>
          `
        }

        await resend.emails.send({
          from: `LaunchGrid Compliance <compliance@launchgrid.in>`,
          to: ownerEmail,
          subject: milestone.subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #333; line-height: 1.6;">
              <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px; color: #111;">LaunchGrid</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #dc2626; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Compliance Advisor</p>
              </div>
              ${body}
              <br/>
              <p style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666;">
                This is an automated system email sent to you as a registered merchant on LaunchGrid.
              </p>
            </div>
          `
        })
      }
    }
  } catch (err) {
    console.error('[COMPLIANCE] Error checking milestones:', err)
  }
}
