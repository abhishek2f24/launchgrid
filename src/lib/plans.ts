/**
 * SINGLE SOURCE OF TRUTH for plan tiers and entitlements.
 * Used by /api/v1/entitlements (mobile + web). Migrate scattered
 * `plan === 'pro'` checks to readFeature() over time.
 *
 * DB enum values: 'free' | 'starter' | 'pro' | 'premium' (legacy naming)
 * Public names:   Free Starter | Get Online | Get Customers | Scale Revenue
 *
 * 'free' is the default for any store without a paid subscription:
 * basic store, 3-product cap, "Made with LaunchGrid" badge shown.
 */

export type PlanTier = 'free' | 'starter' | 'pro' | 'premium'

export interface PlanFeatures {
  max_products: number
  custom_domain: boolean
  whatsapp_recovery: boolean
  email_recovery: boolean
  razorpay_byok: boolean
  gst_automation: boolean
  meta_ads_templates: boolean
  advanced_analytics: boolean
  priority_support: boolean
  hide_powered_by: boolean
}

export const PLANS: Record<PlanTier, { publicName: string; priceMonthly: number; features: PlanFeatures }> = {
  free: {
    publicName: 'Free Starter',
    priceMonthly: 0,
    features: {
      max_products: 3,
      custom_domain: false,
      whatsapp_recovery: false,
      email_recovery: false,
      razorpay_byok: false,
      gst_automation: false,
      meta_ads_templates: false,
      advanced_analytics: false,
      priority_support: false,
      hide_powered_by: false,
    },
  },
  starter: {
    publicName: 'Get Online',
    priceMonthly: 1999,
    features: {
      max_products: 100,
      custom_domain: true,
      whatsapp_recovery: false,
      email_recovery: false,
      razorpay_byok: false,
      gst_automation: false,
      meta_ads_templates: false,
      advanced_analytics: false,
      priority_support: false,
      hide_powered_by: false,
    },
  },
  pro: {
    publicName: 'Get Customers',
    priceMonthly: 9999,
    features: {
      max_products: 100,
      custom_domain: true,
      whatsapp_recovery: true,
      email_recovery: false,
      razorpay_byok: true,
      gst_automation: false,
      meta_ads_templates: true,
      advanced_analytics: true,
      priority_support: false,
      hide_powered_by: true,
    },
  },
  premium: {
    publicName: 'Scale Revenue',
    priceMonthly: 24999,
    features: {
      max_products: 500,
      custom_domain: true,
      whatsapp_recovery: true,
      email_recovery: true,
      razorpay_byok: true,
      gst_automation: true,
      meta_ads_templates: true,
      advanced_analytics: true,
      priority_support: true,
      hide_powered_by: true,
    },
  },
}

export function getPlan(tier: string | null | undefined) {
  return PLANS[(tier as PlanTier) || 'free'] ?? PLANS.free
}
