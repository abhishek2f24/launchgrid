import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Zap, Receipt, ShoppingCart, MessageSquare, Compass, Eye, HelpCircle } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'

interface FeatureDetail {
  slug: string
  title: string
  tagline: string
  heroBadge: string
  icon: any
  gradient: string
  description: string
  benefits: { title: string; desc: string }[]
  stats: { value: string; label: string }[]
  faqs: { q: string; a: string }[]
}

const FEATURE_DATA: Record<string, FeatureDetail> = {
  'gst-invoicing': {
    slug: 'gst-invoicing',
    title: 'Automated GST Invoicing & Compliance.',
    tagline: 'Auto-calculate tax rates based on buyer state. Print beautiful tax-compliant invoices in one-click.',
    heroBadge: 'Compliance & Tax Support',
    icon: Receipt,
    gradient: 'from-blue-600/20 to-purple-600/20',
    description: 'Operating an e-commerce business in India requires strict compliance with GST rules. LaunchGrid automatically splits taxes into CGST, SGST, and IGST depending on whether the sale is intra-state or inter-state. No manual sheet calculation needed.',
    benefits: [
      { title: 'Intelligent Location Spills', desc: 'Auto-detects buyer shipping state during checkout to determine IGST vs CGST + SGST splits automatically.' },
      { title: 'B2B GSTIN Collection', desc: 'Allows business buyers to input their GSTIN and company name at checkout to claim tax credits.' },
      { title: 'Printable PDF Invoices', desc: 'Generate and email branded, print-ready tax invoices to customers immediately after payment confirmation.' }
    ],
    stats: [
      { value: '100%', label: 'Compliance Accuracy' },
      { value: '0', label: 'Manual calculations' },
      { value: '2 Hours', label: 'Saved per month' }
    ],
    faqs: [
      { q: 'Do I need a GST number to start selling?', a: 'You can start selling under tax exemption limits or as a composite dealer, but once you register, LaunchGrid helps you collect tax from buyers seamlessly.' },
      { q: 'How does LaunchGrid split CGST and SGST?', a: 'If your merchant state and buyer state match, CGST and SGST are split evenly (e.g. 9% each). Otherwise, it applies the full IGST rate (e.g. 18%) to inter-state sales.' }
    ]
  },
  'abandoned-cart': {
    slug: 'abandoned-cart',
    title: 'WhatsApp & Email Cart Recovery.',
    tagline: 'Bring back high-intent visitors on autopilot. Recover up to 22% of lost checkouts.',
    heroBadge: 'Sales Booster',
    icon: ShoppingCart,
    gradient: 'from-amber-600/20 to-red-600/20',
    description: 'Over 70% of e-commerce carts are abandoned. LaunchGrid tracks incomplete checkouts and schedules friendly reminders via email and WhatsApp automatically, offering sweet discount codes to close the loop.',
    benefits: [
      { title: '15-Min Smart Triggers', desc: 'Triggers the recovery sequence exactly when intent is highest, without annoying the customer.' },
      { title: 'Integrated Coupon Codes', desc: 'Automatically appends a limited-time coupon (e.g. FLAT10) to cart links to build urgency.' },
      { title: 'Branded WhatsApp Texts', desc: 'Indian shoppers prefer WhatsApp. Send reminders directly to their chat for double the open rates.' }
    ],
    stats: [
      { value: '22%', label: 'Recovery Rate' },
      { value: '4x', label: 'ROI compared to ads' },
      { value: '10 Min', label: 'Setup time' }
    ],
    faqs: [
      { q: 'Is abandoned cart recovery automatic?', a: 'Yes! Once enabled, LaunchGrid schedules emails and WhatsApp message prompts via background queues without you lifting a finger.' },
      { q: 'Can I customize the recovery messages?', a: 'Absolutely. You can edit the template copy, delay timing, and coupon discount details from your Marketing panel.' }
    ]
  },
  'one-click-checkout': {
    slug: 'one-click-checkout',
    title: 'Zero-Friction One-Page Checkout.',
    tagline: 'Optimized for mobile-first Indian buyers. Less screens, more completed sales.',
    heroBadge: 'Checkout UX Optimizer',
    icon: Zap,
    gradient: 'from-emerald-600/20 to-teal-600/20',
    description: 'Indian mobile shoppers have short attention spans. Multi-step checkouts kill conversions. Our checkout is optimized on a single page, complete with state dropdowns and one-click UPI payments.',
    benefits: [
      { title: 'UPI QR Code Integration', desc: 'Allows buyers to pay instantly using GPay, PhonePe, Paytm, or BHIM UPI by scanning a QR code or clicking a link.' },
      { title: 'Address Optimization', desc: 'Clean form fields tailored for Indian address formats, reducing keystrokes by 50%.' },
      { title: 'Razorpay BYOK Handshake', desc: 'Plug in your own Razorpay keys (Bring Your Own Keys) for direct merchant settlement.' }
    ],
    stats: [
      { value: '3.1s', label: 'Average checkout speed' },
      { value: '35%', label: 'Checkout drop-off reduction' },
      { value: '1 Click', label: 'UPI payments' }
    ],
    faqs: [
      { q: 'Does the UPI payment check status automatically?', a: 'Yes! The page polls the server status and redirects automatically the moment the buyer completes the transfer on their UPI app.' },
      { q: 'Can I use my own payment gateway keys?', a: 'Yes. LaunchGrid supports BYOK for Razorpay, allowing you to bypass platform routing and receive money directly.' }
    ]
  },
  'whatsapp-marketing': {
    slug: 'whatsapp-marketing',
    title: 'WhatsApp Broadcasts & Promos.',
    tagline: 'Send campaigns to your buyer lists with 98% open rates. Scale sales on WhatsApp.',
    heroBadge: 'Growth & Marketing',
    icon: MessageSquare,
    gradient: 'from-green-600/20 to-emerald-600/20',
    description: 'Email is good, but WhatsApp is king in India. Build relationships and run festival sales broadcasts directly to your customer list from the marketing console.',
    benefits: [
      { title: 'Bulk Broadcast Scheduler', desc: 'Upload or generate lists from orders and send bulk promotions with custom links in seconds.' },
      { title: 'Festival Campaign Templates', desc: 'Pre-written templates for Diwali, Holi, and seasonal sales to save copywriting time.' },
      { title: 'WhatsApp Shipping Updates', desc: 'Automatically send tracking URLs and AWB codes directly to customer WhatsApp chats.' }
    ],
    stats: [
      { value: '98%', label: 'Average Open Rate' },
      { value: '5x', label: 'Click-through rate' },
      { value: '1 Click', label: 'Broadcast dispatch' }
    ],
    faqs: [
      { q: 'Do I need a verified business number?', a: 'You can start broadcasting using standard numbers, but we support verified WhatsApp Business API integrations as you scale.' },
      { q: 'Does WhatsApp broadcast comply with anti-spam rules?', a: 'Yes, we provide pre-formatted guidelines and unsubscribe options to ensure high quality metrics.' }
    ]
  }
}

export async function generateStaticParams() {
  return Object.keys(FEATURE_DATA).map(slug => ({ slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const data = FEATURE_DATA[params.slug]
  if (!data) return {}

  const title = `${data.title} | LaunchGrid Features`
  const description = data.tagline

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    }
  }
}

export default async function FeatureLandingPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const data = FEATURE_DATA[params.slug]

  if (!data) notFound()

  const IconComponent = data.icon

  // FAQ Schema JSON-LD
  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24 overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <GrainOverlay />
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl pt-16 md:pt-24 space-y-20">
        
        {/* Breadcrumb / Back */}
        <div>
          <a href="/pricing" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-black transition-colors">
            ← Pricing &amp; Features
          </a>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-black/5 bg-white text-[10px] font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">
              <Sparkles className="w-3 h-3 text-amber-500" /> {data.heroBadge}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-playfair leading-[1.15] text-[var(--color-mark-ink)]">
              {data.title}
            </h1>
            <p className="text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed font-medium">
              {data.tagline}
            </p>
          </div>
          
          <div className="lg:col-span-2 flex justify-center">
            <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${data.gradient} border border-black/5 flex items-center justify-center shadow-inner`}>
              <IconComponent className="w-16 h-16 text-[var(--color-mark-ink)]" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 border-y border-black/5 py-8">
          {data.stats.map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="text-2xl md:text-3xl font-black font-playfair tracking-tight text-[var(--color-mark-ink)]">
                {stat.value}
              </div>
              <div className="text-[10px] font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Detail Narrative */}
        <div className="space-y-6 max-w-3xl">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">Overview</h2>
          <p className="text-sm leading-relaxed text-[var(--color-mark-secondary)] font-medium whitespace-pre-line">
            {data.description}
          </p>
        </div>

        {/* Core Benefits */}
        <div className="space-y-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.benefits.map((b, i) => (
              <div key={i} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-[var(--color-mark-ink)] font-bold text-sm">
                  {i + 1}
                </div>
                <h3 className="font-bold text-sm text-[var(--color-mark-ink)]">{b.title}</h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-8 max-w-3xl">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {data.faqs.map((faq, i) => (
              <div key={i} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-2">
                <h3 className="font-bold text-sm text-[var(--color-mark-ink)] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--color-mark-secondary)]" /> {faq.q}
                </h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="p-8 md:p-12 bg-gradient-to-br from-black to-neutral-900 text-white rounded-[2rem] shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-bold font-playfair tracking-tight">
            Ready to supercharge your business?
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
            Get instant access to {data.title.toLowerCase()} and start taking orders within 15 minutes.
          </p>
          <div className="pt-2">
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all rounded-xl shadow-md active:scale-95"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
