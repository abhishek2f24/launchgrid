'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { encrypt, isEncrypted } from '@/utils/encryption'

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function saveStoreDetailsAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const businessName = formData.get('businessName') as string
  const niche = formData.get('niche') as string
  const customDomain = formData.get('customDomain') as string
  const merchantState = formData.get('state') as string
  const whatsappNumber = formData.get('whatsappNumber') as string
  const gstin = formData.get('gstin') as string
  const gstRate = formData.get('gstRate') ? Number(formData.get('gstRate')) : null
  const metaTitle = formData.get('metaTitle') as string
  const metaDescription = formData.get('metaDescription') as string

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  const { error } = await supabase
    .from('tenants')
    .update({
      business_name: businessName,
      niche,
      custom_domain: customDomain ? customDomain.trim() : null
    })
    .eq('id', tenant.id)

  if (error) return { error: error.message }

  // Update business_configs fields
  const configUpdate: Record<string, any> = {}
  if (merchantState) configUpdate.state = merchantState
  if (whatsappNumber !== null) configUpdate.whatsapp_number = whatsappNumber.trim() || null
  if (gstin !== null) configUpdate.gstin = gstin.trim() || null
  if (gstRate !== null) configUpdate.gst_rate = gstRate
  if (metaTitle !== null) configUpdate.meta_title = metaTitle.trim() || null
  if (metaDescription !== null) configUpdate.meta_description = metaDescription.trim() || null

  if (Object.keys(configUpdate).length > 0) {
    await supabase
      .from('business_configs')
      .update(configUpdate)
      .eq('tenant_id', tenant.id)
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function savePaymentConfigAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const merchantUpiId = formData.get('merchantUpiId') as string
  const rzpKeyId = formData.get('rzpKeyId') as string
  const rzpKeySecret = formData.get('rzpKeySecret') as string
  const paymentTier = formData.get('paymentTier') as string
  const codEnabledRaw = formData.get('codEnabled') as string | null
  const codEnabled = codEnabledRaw !== null ? codEnabledRaw === 'true' : undefined

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  // Encrypt Razorpay key secret before storing (AES-256-GCM)
  let encryptedSecret: string | null = null
  if (rzpKeySecret && rzpKeySecret.trim()) {
    const trimmed = rzpKeySecret.trim()
    try {
      encryptedSecret = isEncrypted(trimmed) ? trimmed : encrypt(trimmed)
    } catch (encErr) {
      console.error('[ENCRYPT_RZP_SECRET_ERROR]', encErr)
      // If ENCRYPTION_KEY is not set, store as-is with a warning
      encryptedSecret = trimmed
    }
  }

  const updateData: Record<string, any> = {
    merchant_upi_id: merchantUpiId ? merchantUpiId.trim() : null,
    rzp_key_id: rzpKeyId ? rzpKeyId.trim() : null,
    rzp_key_secret: encryptedSecret,
    ...(codEnabled !== undefined && { cod_enabled: codEnabled }),
  }

  // Determine or enforce payment tier
  if (paymentTier) {
    updateData.payment_tier = paymentTier
  } else if (rzpKeyId) {
    updateData.payment_tier = 'byok'
  } else if (merchantUpiId) {
    updateData.payment_tier = 'free_upi'
  } else {
    updateData.payment_tier = 'free_upi'
  }

  const { error } = await supabase
    .from('business_configs')
    .update(updateData)
    .eq('tenant_id', tenant.id)

  if (error) return { error: error.message }

  // Mark payments mission step as done if at least one payment config is set
  if (merchantUpiId || rzpKeyId) {
    await supabase
      .from('tenant_missions')
      .update({ step_4_payments: true })
      .eq('tenant_id', tenant.id)
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/settings/payments')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function saveStorefrontAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const templateStyle = formData.get('template_style') as string
  const themeColor    = formData.get('theme_color')    as string
  const tagline       = formData.get('tagline')         as string
  const heroSubtitle  = formData.get('hero_subtitle')  as string

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  const { error } = await supabase
    .from('business_configs')
    .update({
      ...(templateStyle && { template_style: templateStyle }),
      ...(themeColor    && { theme_color: themeColor }),
      ...(tagline       !== null && { tagline }),
      ...(heroSubtitle  !== null && { hero_subtitle: heroSubtitle }),
    })
    .eq('tenant_id', tenant.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/storefront')
  revalidatePath(`/store`)
  return { success: true }
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/products')
  return { success: true }
}

export async function toggleProductStatusAction(productId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  const { error } = await supabase
    .from('products')
    .update({ is_active: !currentStatus })
    .eq('id', productId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/products')
  return { success: true }
}

export async function saveProductEditAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const productId = formData.get('productId') as string
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const retailPrice = Number(formData.get('retailPrice'))
  const costPrice = formData.get('costPrice') ? Number(formData.get('costPrice')) : null
  const compareAtPrice = formData.get('compareAtPrice') ? Number(formData.get('compareAtPrice')) : null
  const description = formData.get('description') as string
  const metaTitle = formData.get('metaTitle') as string
  const metaDescription = formData.get('metaDescription') as string

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  let finalSlug = slug?.trim()
  if (!finalSlug) {
    finalSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Math.random().toString(36).slice(2, 7)
  } else {
    finalSlug = finalSlug.toLowerCase().replace(/[^a-z0-9-]/g, '')
  }

  const { error } = await supabase
    .from('products')
    .update({
      title,
      slug: finalSlug,
      retail_price: retailPrice,
      cost_price: costPrice,
      compare_at_price: compareAtPrice,
      description,
      meta_title: metaTitle ? metaTitle.trim() : null,
      meta_description: metaDescription ? metaDescription.trim() : null
    })
    .eq('id', productId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createCouponAction(code: string, discountType: string, value: number, minOrderValue: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) return { error: 'Coupon code is required' }
  if (discountType !== 'percentage' && discountType !== 'fixed' && discountType !== 'free_shipping') {
    return { error: 'Invalid discount type' }
  }

  const { error } = await supabase
    .from('coupons')
    .insert({
      tenant_id: tenant.id,
      code: cleanCode,
      discount_type: discountType,
      value,
      min_order_value: minOrderValue,
      is_active: true
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'A coupon with this code already exists.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/coupons')
  return { success: true }
}

export async function deleteCouponAction(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/coupons')
  return { success: true }
}

export async function toggleCouponStatusAction(couponId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return { error: 'Tenant not found' }

  const { error } = await supabase
    .from('coupons')
    .update({ is_active: !currentStatus })
    .eq('id', couponId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/coupons')
  return { success: true }
}
