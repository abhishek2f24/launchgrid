import { getActiveTenant } from '@/utils/supabase/queries'
import { Settings, Link as LinkIcon, Smartphone, CreditCard, Palette, ChevronRight, MessageCircle, FileText } from 'lucide-react'
import { saveStoreDetailsAction, savePaymentConfigAction } from '@/actions/portal'
import Link from 'next/link'

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

export default async function SettingsPage() {
  const result = await getActiveTenant()

  if (!result) {
    return <div className="p-8">No tenant found.</div>
  }

  const { tenant } = result
  const config = tenant.business_configs?.[0] || {}

  return (
    <div className="p-8 max-w-4xl mx-auto font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2">Settings.</h1>
        <p className="text-sm text-[var(--color-mark-secondary)]">Manage your store configuration and payments.</p>
      </div>

      <div className="space-y-6">

        {/* Storefront Design CTA */}
        <Link
          href="/dashboard/settings/storefront"
          className="group flex items-center gap-5 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
            <Palette className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--color-mark-ink)] text-sm mb-0.5">Storefront Design</h3>
            <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed">
              Change your store template, accent color, and hero text. 5 templates, 8 colors.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Store Details */}
        <form action={async (formData) => {
          'use server';
          await saveStoreDetailsAction(formData);
        }} className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-4">
            <div className="p-2 bg-black/5 rounded-lg text-[var(--color-mark-ink)]">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-mark-ink)]">Store Details</h2>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Business Name</label>
              <input
                type="text"
                name="businessName"
                defaultValue={tenant.business_name}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Niche / Category</label>
              <input
                type="text"
                name="niche"
                defaultValue={tenant.niche || ''}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Business Location State</label>
              <select
                name="state"
                defaultValue={config.state || 'Maharashtra'}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              >
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Used to determine CGST/SGST vs IGST on invoices.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">
                <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                WhatsApp Business Number
              </label>
              <input
                type="text"
                name="whatsappNumber"
                placeholder="e.g. 919876543210 (with country code, no +)"
                defaultValue={config.whatsapp_number || ''}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Enables the WhatsApp chat widget on your store. Include country code without +.</p>
            </div>
            
            {/* Custom SEO Meta tags */}
            <div className="pt-4 border-t border-black/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">Search Engine Optimization (SEO)</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Homepage Meta Title</label>
                  <input
                    type="text"
                    name="metaTitle"
                    placeholder="e.g. My Premium Apparel Store | Curated Clothing Online"
                    defaultValue={config.meta_title || ''}
                    className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
                  />
                  <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Appears in Google Search results. Keep under 60 characters.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Homepage Meta Description</label>
                  <textarea
                    name="metaDescription"
                    placeholder="e.g. Discover our latest collection of hand-crafted jewelry, premium garments, and home decor items. Free shipping across India."
                    defaultValue={config.meta_description || ''}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/[0.02] border border-black/10 rounded-xl text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Google search description snippet. Keep under 160 characters.</p>
                </div>
              </div>
            </div>

            {/* Tracking & Ads */}
            <div className="pt-4 border-t border-black/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">Tracking &amp; Ads</span>
              </div>
              <p className="text-[11px] text-[var(--color-mark-secondary)] mb-4 font-medium">
                Connect your ad accounts. We automatically send ViewContent, AddToCart, InitiateCheckout and Purchase events to your pixel — so you can run Meta and Google ads with proper conversion tracking.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Meta Pixel ID</label>
                  <input
                    type="text"
                    name="metaPixelId"
                    placeholder="e.g. 123456789012345"
                    defaultValue={config.meta_pixel_id || ''}
                    inputMode="numeric"
                    className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
                  />
                  <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Events Manager → Data Sources → your pixel. Numbers only.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Google Analytics 4 ID</label>
                  <input
                    type="text"
                    name="ga4MeasurementId"
                    placeholder="e.g. G-XXXXXXXXXX"
                    defaultValue={config.ga4_measurement_id || ''}
                    className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
                  />
                  <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">GA4 Admin → Data Streams → Measurement ID. Also works for Google Ads via linked accounts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* GST / Invoice Config */}
          <div className="pt-4 border-t border-black/5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[var(--color-mark-secondary)]" />
              <span className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">GST &amp; Invoice</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">GSTIN</label>
                <input
                  type="text"
                  name="gstin"
                  placeholder="e.g. 27AAPFU0939F1ZV"
                  defaultValue={config.gstin || ''}
                  maxLength={15}
                  className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-mono font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Shown on tax invoices. Required if turnover &gt; ₹20L.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">GST Rate (%)</label>
                <select
                  name="gstRate"
                  defaultValue={String(config.gst_rate ?? 18)}
                  className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18% (Standard)</option>
                  <option value="28">28%</option>
                </select>
                <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Applied on all GST invoices. Check your product HSN code.</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="px-5 py-2.5 bg-[var(--color-mark-ink)] text-white text-sm font-bold rounded-xl hover:bg-black/90 shadow-md transition-transform active:scale-95">
              Save Details
            </button>
          </div>
        </form>

        {/* Domains */}
        <form action={async (formData) => {
          'use server';
          await saveStoreDetailsAction(formData);
        }} className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <LinkIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-mark-ink)]">Domains</h2>
          </div>

          <div className="space-y-4 max-w-xl">
            <input type="hidden" name="businessName" value={tenant.business_name} />
            <input type="hidden" name="niche" value={tenant.niche || ''} />
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">LaunchGrid Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={tenant.subdomain}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-black/[0.04] border border-black/5 rounded-xl text-sm font-bold text-[var(--color-mark-secondary)] cursor-not-allowed"
                />
                <span className="text-sm font-bold text-[var(--color-mark-secondary)]">.launchgrid.in</span>
              </div>
              <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">Subdomain cannot be changed after setup.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Custom Domain <span className="normal-case text-xs text-green-600 font-bold ml-1">Included on all plans ✓</span></label>
              <input
                type="text"
                name="customDomain"
                placeholder={`e.g. ${(tenant.subdomain || 'mystore').replace(/-/g, '')}.in`}
                defaultValue={tenant.custom_domain || ''}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1 font-medium">
                A domain of your own builds customer trust, ranks better on Google, and is yours forever.
                Point your domain&apos;s CNAME to <code className="font-mono bg-black/5 px-1 rounded">cname.vercel-dns.com</code> and save — SSL is automatic.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <button type="submit" className="px-5 py-2.5 bg-[var(--color-mark-ink)] text-white text-sm font-bold rounded-xl hover:bg-black/90 shadow-md transition-transform active:scale-95">
              Save Domain
            </button>
          </div>
        </form>

        {/* Payments */}
        <form action={async (formData) => {
          'use server';
          await savePaymentConfigAction(formData);
        }} className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 border-b border-black/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-mark-ink)]">Payment Configuration</h2>
            </div>
            <span className="px-2.5 py-1 bg-black/5 text-[var(--color-mark-ink)] rounded-lg text-[10px] font-bold uppercase tracking-widest">
              Tier: {config.payment_tier || 'free_upi'}
            </span>
          </div>

          <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5 flex items-center justify-between">
                Merchant UPI ID
                {config.merchant_upi_id && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded">Active</span>}
              </label>
              <input
                type="text"
                name="merchantUpiId"
                placeholder="e.g. yourname@okaxis"
                defaultValue={config.merchant_upi_id || ''}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1.5 font-medium">Free Merchant UPI — 2% platform fee applies.</p>
            </div>

            <div className="pt-4 border-t border-black/5">
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">
                Razorpay Key ID (BYOK)
                {config.rzp_key_id && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded ml-2">Connected</span>}
              </label>
              <input
                type="text"
                name="rzpKeyId"
                placeholder="rzp_live_..."
                defaultValue={config.rzp_key_id || ''}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-mono font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-[var(--color-mark-secondary)] mt-1.5 font-medium">BYOK — 5% platform fee applies. Key secret is stored encrypted.</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <button type="submit" className="px-5 py-2.5 bg-[var(--color-mark-ink)] text-white text-sm font-bold rounded-xl hover:bg-black/90 shadow-md transition-transform active:scale-95">
              Update Payments
            </button>
            <a href="/dashboard/settings/payments" className="text-sm font-semibold text-blue-600 hover:underline">
              Configure Route / KYC →
            </a>
          </div>
        </form>

      </div>
    </div>
  )
}
