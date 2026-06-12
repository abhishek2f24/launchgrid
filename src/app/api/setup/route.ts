import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendWelcomeEmail } from '@/lib/emails'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      subdomain,
      niche,
      whatsappNumber,
      shippingScope,
      themeColor,
      templateStyle,
      plan,
      billing
    } = body

    // Validate Subdomain uniqueness
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Subdomain is already taken' }, { status: 400 })
    }

    // Insert Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        owner_id: user.id,
        business_name: businessName,
        subdomain,
        niche,
        health_score: 50 // starting score
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant Error:', tenantError)
      return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
    }

    // Generate default policies
    const termsOfService = `Welcome to ${businessName}. By accessing our store, you agree to these terms. We reserve the right to modify these terms at any time. All products and services are provided "as is".`
    const privacyPolicy = `At ${businessName}, we take your privacy seriously. We collect your shipping and billing details solely for fulfilling your orders. We will not sell your personal data to third parties. Contact us at ${whatsappNumber} for data removal requests.`
    const refundPolicy = `We offer a 7-day return policy for unused items in their original packaging. Please contact our support team at ${whatsappNumber} to initiate a return. Refunds will be processed to the original payment method.`

    // Insert Business Configs
    await supabase.from('business_configs').insert({
      tenant_id: tenant.id,
      whatsapp_number: whatsappNumber,
      shipping_scope: shippingScope,
      theme_color: themeColor,
      template_style: templateStyle,
      terms_of_service: termsOfService,
      privacy_policy: privacyPolicy,
      refund_policy: refundPolicy
    })

    // Subscription record. Two paths:
    //  - Free tier (default, no paid plan selected): status 'active', no expiry.
    //    This is genuinely free-forever — checkout must never be disabled by the
    //    archive-trials cron (which only touches 'trialing' subs).
    //  - A paid plan was chosen: start a 7-day trial of that plan (existing behaviour;
    //    starts as 'starter' to keep within the historical trial flow).
    const isFreeSignup = !plan || plan === 'free'
    const trialStarted = new Date()
    const trialExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await supabase.from('subscriptions').insert({
      tenant_id: tenant.id,
      plan_tier: isFreeSignup ? 'free' : 'starter',
      billing_cycle: billing === 'annual' ? 'annual' : 'monthly',
      status: isFreeSignup ? 'active' : 'trialing',
      trial_started_at: isFreeSignup ? null : trialStarted.toISOString(),
      trial_expires_at: isFreeSignup ? null : trialExpires.toISOString(),
      current_period_end: isFreeSignup ? null : trialExpires.toISOString(),
    })

    // Also set featured_until on the tenant (System 3: Discover Feed)
    await supabase.from('tenants').update({
      featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days on discover
    }).eq('id', tenant.id)

    // Insert Tenant Missions (Checklist)
    await supabase.from('tenant_missions').insert({
      tenant_id: tenant.id,
      step_1_business: true,
      step_2_brand: true,
      step_3_launch: true
    })

    // Send welcome email (best-effort, don't block response)
    sendWelcomeEmail(user.email!, businessName, subdomain).catch((e) =>
      console.error('[SETUP_WELCOME_EMAIL_ERROR]', e)
    )

    return NextResponse.json({ success: true, tenant })

  } catch (err: any) {
    console.error('Onboarding API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
