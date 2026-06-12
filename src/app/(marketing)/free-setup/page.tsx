import { Metadata } from 'next'
import { ArrowRight, CheckCircle2, Clock, MessageSquare, ShieldCheck } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'

// Set this to the founder's WhatsApp Business number (country code, no +) to enable
// the "WhatsApp me" CTA, e.g. '919876543210'. Empty string hides the button.
const FOUNDER_WHATSAPP = ''

const WA_MESSAGE = encodeURIComponent(
  'STORE — mujhe apni dukaan ka free online store setup chahiye. Shop ka naam: '
)

export const metadata: Metadata = {
  title: 'Free Store Setup — We Build It For You in 15 Minutes',
  description:
    'First 10 businesses: we personally set up your online store free — products, UPI & COD checkout, GST invoices, WhatsApp selling. You just send 5 product photos.',
  alternates: { canonical: 'https://launchgrid.in/free-setup' },
  openGraph: {
    title: 'Free Store Setup — We Build It For You in 15 Minutes',
    description:
      'First 10 businesses: we personally set up your online store free. You just send 5 product photos.',
    url: 'https://launchgrid.in/free-setup',
    type: 'website',
    images: [{ url: 'https://launchgrid.in/og/sell-online.png', width: 1024, height: 1024 }],
  },
}

const STEPS = [
  { icon: MessageSquare, title: 'Send 5 product photos', desc: 'WhatsApp us your shop name, 5 product photos and prices. That is genuinely all we need.' },
  { icon: Clock, title: 'We build it in 15 minutes', desc: 'Your store goes live at yourname.launchgrid.in — products, UPI & COD checkout, GST-ready invoicing, order alerts on your phone.' },
  { icon: CheckCircle2, title: 'You share, orders come', desc: 'Put the link on your WhatsApp status and Instagram bio. Every order pings your phone. Fulfil with one tap.' },
]

export default function FreeSetupPage() {
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24 overflow-hidden">
      <GrainOverlay />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-4xl pt-16 md:pt-24 space-y-16">

        <div className="space-y-6 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-black/5 bg-white text-[10px] font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">
            <ShieldCheck className="w-3 h-3 text-amber-500" /> First 10 businesses only
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-playfair leading-[1.15]">
            We'll set up your online store. Free. While you watch.
          </h1>
          <p className="text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed font-medium">
            Agencies charge ₹15,000–50,000 for a website you can't even edit. We'll build your
            LaunchGrid store for you — products, UPI &amp; Cash on Delivery checkout, GST invoices,
            WhatsApp selling — in about 15 minutes, completely free. Don't like it? Delete it.
            Nothing to lose except the customers you're missing.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {FOUNDER_WHATSAPP ? (
              <a
                href={`https://wa.me/${FOUNDER_WHATSAPP}?text=${WA_MESSAGE}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#25D366] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all rounded-xl shadow-md active:scale-95"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp "STORE" to claim
              </a>
            ) : (
              <a
                href="/onboarding?utm_source=free_setup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-xl shadow-md active:scale-95"
              >
                Claim my free setup <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <a
              href="/onboarding?utm_source=free_setup_diy"
              className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-black transition-colors"
            >
              I'll build it myself →
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">{i + 1}</div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--color-mark-secondary)]" />
                  <h3 className="font-bold text-sm text-[var(--color-mark-ink)]">{s.title}</h3>
                </div>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium">{s.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="p-8 bg-white border border-black/5 rounded-2xl shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-lg font-bold font-playfair tracking-tight">Why free?</h2>
          <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed font-medium">
            Simple: LaunchGrid grows when your store grows. The free plan is genuinely free —
            you only ever pay if you upgrade for bigger catalogs and advanced features later.
            Setting up the first stores personally is how we make sure every one of them succeeds.
          </p>
        </div>

      </div>
    </div>
  )
}
