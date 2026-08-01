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
  /** Number of storefronts an account can operate on this plan. */
  max_stores: number
  custom_domain: boolean
  /** Custom domains included with the plan. Extra domain setup is charged separately. */
  included_custom_domains: number
  additional_custom_domain_setup_fee: number | null
  whatsapp_recovery: boolean
  email_recovery: boolean
  razorpay_byok: boolean
  gst_automation: boolean
  meta_ads_templates: boolean
  advanced_analytics: boolean
  priority_support: boolean
  hide_powered_by: boolean
  /** Cached-catalogue reports per calendar month. A null value means unlimited. */
  research_ideas_per_month: number | null
  /**
   * On-demand research credits granted with the plan. null = unlimited.
   *
   * "Unlimited" is bounded by RESEARCH_FAIR_USE_PER_DAY below. Every credit is real
   * residential-proxy spend (~₹2–5), so a literally uncapped plan is an uncapped
   * liability — 10,000 scripted requests would cost ~₹50,000 on a ₹9,999 plan.
   */
  research_credits_included: number | null
}

/**
 * A genuine introductory rate — no fake "original price" to discount
 * against, no manufactured urgency countdown. `introductoryMonthlyPrice`
 * applies for the first `introductoryDays` days after upgrade, then billing
 * reverts to `standardMonthlyPrice`. Disclose both numbers and the real
 * window length wherever this is shown; never render a countdown timer
 * shorter than the actual window.
 */
export interface IntroductoryOffer {
  standardMonthlyPrice: number
  introductoryMonthlyPrice: number
  introductoryDays: number
}

export const PLANS: Record<PlanTier, {
  publicName: string
  priceMonthly: number
  introductoryOffer?: IntroductoryOffer
  features: PlanFeatures
}> = {
  free: {
    publicName: 'Free Starter',
    priceMonthly: 0,
    features: {
      max_products: 3,
      max_stores: 1,
      custom_domain: false,
      included_custom_domains: 0,
      additional_custom_domain_setup_fee: null,
      whatsapp_recovery: false,
      email_recovery: false,
      razorpay_byok: false,
      gst_automation: false,
      meta_ads_templates: false,
      advanced_analytics: false,
      priority_support: false,
      hide_powered_by: false,
      // Monthly allowance for reading CACHED catalogue reports. Separate from research
      // credits (research_credit_ledger), which buy on-demand research of products we
      // have never sourced. Must stay in sync with finalize_research_report (0037).
      research_ideas_per_month: 1,
      research_credits_included: 5,
    },
  },
  starter: {
    publicName: 'Research + Launch',
    priceMonthly: 1999,
    introductoryOffer: {
      standardMonthlyPrice: 1999,
      introductoryMonthlyPrice: 999,
      introductoryDays: 7,
    },
    features: {
      max_products: 100,
      max_stores: 5,
      custom_domain: true,
      included_custom_domains: 1,
      additional_custom_domain_setup_fee: 999,
      whatsapp_recovery: false,
      email_recovery: false,
      razorpay_byok: false,
      gst_automation: false,
      meta_ads_templates: false,
      advanced_analytics: false,
      priority_support: false,
      hide_powered_by: false,
      research_ideas_per_month: 25,
      research_credits_included: 25,
    },
  },
  pro: {
    publicName: 'Research + Scale',
    priceMonthly: 9999,
    introductoryOffer: {
      standardMonthlyPrice: 9999,
      introductoryMonthlyPrice: 4999,
      introductoryDays: 7,
    },
    features: {
      max_products: 100,
      max_stores: 25,
      custom_domain: true,
      included_custom_domains: 5,
      additional_custom_domain_setup_fee: 999,
      whatsapp_recovery: true,
      email_recovery: false,
      razorpay_byok: true,
      gst_automation: false,
      meta_ads_templates: true,
      advanced_analytics: true,
      priority_support: false,
      hide_powered_by: true,
      research_ideas_per_month: 250,
      // null = unlimited, subject to the fair-use cap below.
      research_credits_included: null,
    },
  },
  premium: {
    publicName: 'Scale Revenue',
    priceMonthly: 24999,
    features: {
      max_products: 500,
      max_stores: 50,
      custom_domain: true,
      included_custom_domains: 5,
      additional_custom_domain_setup_fee: 999,
      whatsapp_recovery: true,
      email_recovery: true,
      razorpay_byok: true,
      gst_automation: true,
      meta_ads_templates: true,
      advanced_analytics: true,
      priority_support: true,
      hide_powered_by: true,
      research_ideas_per_month: 500,
      research_credits_included: null,
    },
  },
}

export function getPlan(tier: string | null | undefined) {
  return PLANS[(tier as PlanTier) || 'free'] ?? PLANS.free
}

/**
 * Daily ceiling on on-demand research for plans whose credits are "unlimited".
 *
 * Unlimited must still be bounded: each request is real residential-proxy spend, so an
 * uncapped plan is an uncapped liability. This is a fair-use limit, not a paywall —
 * it sits far above what a merchant researching their own catalogue would ever hit,
 * and only bites scripted bulk use.
 */
export const RESEARCH_FAIR_USE_PER_DAY = 50

export function isResearchUnlimited(tier: string | null | undefined) {
  return getPlan(tier).features.research_ideas_per_month === null
}

/**
 * Marketing/pricing-page plan slugs → DB plan tiers.
 *
 * The pricing page and upgrade links use friendlier slugs ('growth', 'scale') than the
 * DB enum ('pro', 'premium'). Signup previously hardcoded every paid plan to 'starter',
 * so anyone who bought the ₹9,999 or ₹24,999 plan was provisioned — and entitled — as if
 * they had bought the ₹1,999 one. Resolve through here so the two can never drift.
 */
const PLAN_SLUG_TO_TIER: Record<string, PlanTier> = {
  free: 'free',
  basic: 'free',
  starter: 'starter',
  pro: 'starter', // pricing page labels the ₹1,999 tier "Pro"
  growth: 'pro',
  max: 'pro',
  scale: 'premium',
  ultra: 'premium',
  premium: 'premium',
}

export function resolvePlanTier(slug: string | null | undefined): PlanTier {
  if (!slug) return 'free'
  return PLAN_SLUG_TO_TIER[slug.toLowerCase()] ?? 'free'
}
