import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { JourneyNav } from '@/components/signup-journey/JourneyNav'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { Footer } from '@/components/signup-journey/Footer'
import { Metadata } from 'next'

interface BlogPostData {
  title: string
  category: string
  date: string
  readTime: string
  content: string[]
  faqs: { question: string; answer: string }[]
}

const blogPosts: Record<string, BlogPostData> = {
  'start-dropshipping-india': {
    title: 'How to start dropshipping in India with zero inventory investment',
    category: 'Guides',
    date: 'June 5, 2026',
    readTime: '6 min read',
    content: [
      'Dropshipping has emerged as one of the most popular business models in India for aspiring entrepreneurs. Unlike traditional e-commerce, dropshipping allows you to sell products directly to buyers without buying bulk inventory upfront or managing a warehouse.',
      'Here is the exact step-by-step roadmap to launch your dropshipping business in India:',
      '1. Identify a Niche: Avoid generic stores. Focus on specific verticals like home decor, minimalist jewelry, or fitness accessories where passion drives buying decisions.',
      '2. Find Suppliers: Use reliable dropship platforms or local Indian suppliers (e.g. GlowRoad, Robu) that offer high-quality products, shipping across India, and Cash on Delivery (COD) capabilities.',
      '3. Launch Your Storefront: Use LaunchGrid to deploy a premium, conversion-optimized storefront in 15 seconds. Ensure you configure UPI payment processing.',
      '4. Run Targeted Campaigns: Start with low-budget Meta conversion ads or seed products to micro-influencers on Instagram to drive your first visitors.'
    ],
    faqs: [
      {
        question: 'Do I need GST to start dropshipping in India?',
        answer: 'If you are selling goods within your own state, you do not need GST registration until your annual turnover exceeds ₹40 Lakhs. However, for inter-state sales, GST registration is required. LaunchGrid helps you start with a trial, but you should register for GST once your sales pick up.'
      },
      {
        question: 'What is the minimum investment required?',
        answer: 'You do not need money for inventory, but we recommend keeping at least ₹5,000 liquid capital to fund initial orders before Razorpay/UPI settlements land in your account.'
      }
    ]
  },
  'gst-compliance-ecommerce': {
    title: 'How does GST compliance work for online ecommerce stores in India?',
    category: 'Compliance',
    date: 'May 28, 2026',
    readTime: '8 min read',
    content: [
      'Navigating tax compliance is one of the biggest challenges for ecommerce founders in India. Staying compliant prevents heavy fines and ensures smooth payment settlement.',
      'Understanding the GST Thresholds:',
      'For standard intra-state trade, you must register for GST once your turnover crosses ₹40 Lakhs (for goods) or ₹20 Lakhs (for services). However, online portals like Amazon or Shopify require a GSTIN from day one. LaunchGrid allows UPI-based direct checkouts, giving you room to test your store before filing for a GSTIN.',
      'How Taxes Split on Invoices:',
      'If you sell to a customer in the same state as your business location, CGST (Central GST) and SGST (State GST) are split equally (e.g., 9% + 9% for a 18% tax tier). If the customer is in another state, a single IGST (Integrated GST) of 18% is applied. LaunchGrid automates this calculation on every generated invoice based on customer state selections.'
    ],
    faqs: [
      {
        question: 'Is GST mandatory for selling online in India?',
        answer: 'Technically, any inter-state commerce requires GST registration under section 24 of the CGST Act. However, local state-level sales can be conducted under the GST threshold limit.'
      },
      {
        question: 'What is the standard GST rate for dropshipped goods?',
        answer: 'Most consumer electronics, clothing, and home accessories fall under the 18% GST rate bracket.'
      }
    ]
  },
  'what-is-abandoned-cart-recovery': {
    title: 'What is abandoned cart recovery: Recovering lost sales on auto-pilot',
    category: 'Optimization',
    date: 'May 14, 2026',
    readTime: '5 min read',
    content: [
      'Almost 70% of shoppers add items to their cart but leave before completing checkout. In e-commerce, this is known as cart abandonment.',
      'Why shoppers abandon checkout:',
      'High shipping fees, complex multi-step forms, and lack of trusted payment options are the top reasons. To counter this, LaunchGrid utilizes a single-page checkout design and automatically calculates shipping fees as free.',
      'The Recovery Loop:',
      'If a buyer enters their details but fails to complete payment, LaunchGrid starts a 30-minute timer. Once expired, it triggers automated emails and WhatsApp messages offering a direct link to resume checkout, occasionally adding a limited-time coupon discount. This setup recovers up to 25% of lost checkouts automatically.'
    ],
    faqs: [
      {
        question: 'How do you trigger cart recovery?',
        answer: 'LaunchGrid monitors checkout initiation. If an order remains in "pending" payment status for 30 minutes, it automatically executes the recovery flow.'
      },
      {
        question: 'Can I customize the recovery messages?',
        answer: 'Yes, merchants can configure recovery message templates and discounts inside the dashboard settings.'
      }
    ]
  },
  'best-dukaan-alternatives-india': {
    title: 'Best Dukaan Alternatives in India (2026): An Honest Comparison',
    category: 'Comparisons',
    date: 'June 13, 2026',
    readTime: '9 min read',
    content: [
      'If you built your store on Dukaan and you are now looking for an alternative, you are not alone. Many Indian sellers who started on app-only store builders have run into the same walls: an app-only storefront that does not feel like a real website, limited control over checkout, and pricing that climbs as soon as you want features that should be standard. This guide compares the genuine alternatives available to Indian sellers in 2026 — honestly, including where each one is weaker — so you can pick the right home for your business.',
      'What to actually look for in a Dukaan alternative:',
      '1. A real storefront, not just an app link. Your customers should land on a clean, mobile-fast website at your own subdomain (or custom domain) — something you can share on WhatsApp status, Instagram bio, and Google. A store that only lives inside an app is harder to share and harder to trust.',
      '2. Payments that fit India. UPI and Cash on Delivery (COD) are non-negotiable for most Indian buyers. COD in particular is what converts first-time customers who do not yet trust your brand. If a platform makes COD hard to enable, that is a red flag.',
      '3. GST-ready invoicing built in. The moment your sales grow, GST compliance becomes real work. A good platform splits CGST/SGST/IGST automatically based on the buyer state and generates a clean invoice on every order — so you are not paying an accountant for something software should do.',
      '4. WhatsApp-native selling. In India, the order conversation happens on WhatsApp. Order alerts, shipping updates, and a one-tap "share this product" link matter more here than anywhere else.',
      '5. Honest, predictable pricing. Watch for the gap between the headline "free" and what you actually pay to keep a working store. A genuinely free tier — even a capped one — lets you test before you commit a single rupee.',
      'The main options for Indian sellers in 2026:',
      'Shopify — the global heavyweight. Shopify is powerful and reliable, but it is priced in USD (effectively ₹2,000+/month before apps), and GST, COD, and UPI all require extra apps or configuration. It is a strong choice once you are doing serious volume and can absorb the app stack; it is overkill and overpriced for a seller taking their first orders.',
      'Instamojo / other payment-first tools — these started as payment links and bolted on stores. Fine for a quick link-in-bio sale, but the storefront experience is thin and they are not built around a full catalog, GST invoicing, or fulfilment workflow.',
      'LaunchGrid — built for exactly this seller. LaunchGrid gives you a full storefront at yourname.launchgrid.in in about 15 minutes, with UPI and COD checkout, automatic GST invoices, WhatsApp selling tools, and order alerts on your phone — on a genuinely free tier (up to 3 products, with a small "Made with LaunchGrid" badge) so you can launch and test before paying anything. You upgrade only when you want more products and advanced features. The honest trade-off: LaunchGrid is India-focused and newer than Shopify, so if you need a huge third-party app ecosystem or international-first features, Shopify still wins there.',
      'How to switch without losing momentum:',
      'Switching is simpler than most sellers expect, because the assets you care about — your product photos, your prices, and your customer list — are yours. Export your product list and images, set up your new store (LaunchGrid can have you live in 15 minutes), point your WhatsApp status and Instagram bio at the new link, and run a short "we moved — same products, faster checkout" message to your existing customers. Keep the old store live for a week so no in-flight orders are lost, then retire it.',
      'The bottom line: the best Dukaan alternative is the one that gives your customers a real, trustworthy storefront with UPI + COD checkout and GST invoicing, without pricing you out before you have made your first sale. For most Indian sellers taking early orders, that means starting free, proving the model, and only paying once the store is genuinely growing.'
    ],
    faqs: [
      {
        question: 'Is there a genuinely free Dukaan alternative in India?',
        answer: 'Yes. LaunchGrid offers a free-forever tier — a live store with up to 3 products, UPI and Cash on Delivery checkout, and GST-ready invoices, with a small "Made with LaunchGrid" badge. You only pay if you upgrade for more products or advanced features, so you can launch and take your first orders without spending anything.'
      },
      {
        question: 'Can I move my products from Dukaan to a new platform?',
        answer: 'Your product photos, descriptions, prices, and customer list belong to you. Export them, recreate your catalog on the new platform (LaunchGrid lets you add products from your phone or import from a link), and repoint your WhatsApp and Instagram links. Keep the old store live for a few days so no in-flight orders are lost.'
      },
      {
        question: 'Which platform is best for Cash on Delivery (COD) in India?',
        answer: 'COD is essential for converting first-time Indian buyers. Choose a platform where COD is on by default or trivial to enable. On LaunchGrid, COD is enabled by default for new stores, so a brand-new store can accept its first COD order immediately, with the merchant confirming by phone.'
      }
    ]
  },
  'how-to-sell-on-whatsapp-india': {
    title: 'How to Sell on WhatsApp in India (2026): From DMs to a Real Store',
    category: 'Guides',
    date: 'June 13, 2026',
    readTime: '8 min read',
    content: [
      'WhatsApp is where Indian commerce actually happens. Customers ask "price kya hai?", you send photos one by one, you confirm the order in chat, and you chase the payment over UPI. It works — until it does not scale. If you are spending hours every day copy-pasting prices, re-sending the same product photos, and losing track of which order is paid, this guide is for you. Here is how to go from selling in WhatsApp DMs to running a real store that still uses WhatsApp, but stops the chaos.',
      'Stage 1 — Why pure-DM selling hits a ceiling:',
      'Selling entirely through WhatsApp chats breaks down in predictable ways: you cannot show a full catalog cleanly, every customer needs the same questions answered manually, there is no proper order record, payments are unverified until you check your UPI app, and you have no idea which products people actually look at most. None of this means you should leave WhatsApp — it means WhatsApp should be the conversation layer, not your entire shop.',
      'Stage 2 — Give customers one link instead of twelve photos:',
      'The single biggest upgrade is replacing "let me send you photos" with one storefront link. When a customer asks for options, you send your store link — they browse the full catalog, see clear prices, and check out themselves. With LaunchGrid you can have this live at yourname.launchgrid.in in about 15 minutes, then drop the link in your WhatsApp status, your bio, and every chat. The order conversation still happens on WhatsApp; the browsing and payment just stop eating your day.',
      'Stage 3 — Make payment effortless (and trustworthy):',
      'Indian buyers want UPI and Cash on Delivery. UPI gives instant prepaid orders; COD converts first-time buyers who do not yet trust you. A good store offers both at checkout, so the customer picks what they are comfortable with. COD especially is what gets you that crucial first order from a stranger — they pay when the product arrives, so there is no risk on their side.',
      'Stage 4 — Stop manually tracking orders:',
      'Once orders come through a store instead of scattered chats, every order has a record: customer name, items, amount, payment status, and shipping address in one place. You get a notification the moment an order is placed, mark it fulfilled with one tap, and send the customer a clean order confirmation — instead of scrolling fourteen chats at midnight trying to remember who paid.',
      'Stage 5 — Use WhatsApp for what it is great at:',
      'With the store handling catalog and checkout, WhatsApp becomes your growth and retention channel: post your store link to your status whenever you add stock, send order-shipped updates, and message past buyers when something they liked is back. This is where WhatsApp genuinely outperforms email in India — open rates are far higher and the relationship is personal.',
      'The honest summary: you do not have to choose between WhatsApp and a "proper website." The winning setup for Indian sellers in 2026 is both — a real storefront that takes the catalog, payment, and order admin off your plate, with WhatsApp as the human layer for conversation, status updates, and repeat sales. Start with a free store, move your next "send me photos" customer to your link, and take it from there.'
    ],
    faqs: [
      {
        question: 'Can I keep using my personal WhatsApp to sell?',
        answer: 'Yes. The goal is not to leave WhatsApp — it is to stop using it as your entire shop. You keep chatting with customers on WhatsApp, but send them a store link for browsing and checkout instead of photos and manual price quotes. Order alerts and shipping updates can still flow through WhatsApp.'
      },
      {
        question: 'How do I take payments when selling on WhatsApp?',
        answer: 'The cleanest way is a storefront with UPI and Cash on Delivery at checkout, so payment is verified and recorded automatically instead of you checking your UPI app. On LaunchGrid, UPI and COD are built in, and COD is enabled by default so you can take your first order immediately.'
      },
      {
        question: 'Do I need to pay to start selling on WhatsApp with a store?',
        answer: 'No. You can start on a free tier — LaunchGrid gives you a live store with up to 3 products, UPI and COD checkout, and GST-ready invoices for free, so you can move your WhatsApp orders to a real store and take your first sale without spending anything.'
      }
    ]
  },
  'how-to-start-online-store-india-2026': {
    title: 'How to Start an Online Store in India (2026 Guide)',
    category: 'Guides',
    date: 'June 14, 2026',
    readTime: '7 min read',
    content: [
      'Starting an online store in India has never been more accessible, yet the D2C landscape in 2026 demands strategic execution. Sourcing products, setting up checkouts, and configuring logistics require clear planning.',
      '<strong>Step 1: Choose Your Niche and Brand Name</strong><br/>Select a brand name that resonates with Indian buyers. Use our <a href="/tools/store-name-generator" class="text-black font-bold underline">Store Name Generator</a> to generate catchy names and instantly check domain name availability.',
      '<strong>Step 2: Source Products and Calculate Margins</strong><br/>Ensure your pricing factors in hidden costs. Sourcing costs, packaging fees, and logistics will eat into your earnings. Use the <a href="/tools/profit-margin-calculator" class="text-black font-bold underline">Profit Margin Calculator</a> to set profitable listing prices.',
      '<strong>Step 3: Setup Automated Logistics</strong><br/>Partner with aggregators like Shiprocket or Delhivery. Enable automatic COD validation via OTPs to reduce return-to-origin (RTO) charges.',
      '<strong>Step 4: Launch and Scale Ad Spend</strong><br/>Deploy Meta pixel conversion events on your storefront to feed the attribution algorithm. Once campaigns go live, track margins to ensure ad budgets generate a positive multiplier.'
    ],
    faqs: [
      {
        question: 'What is the most popular payment method for Indian buyers?',
        answer: 'UPI (Unified Payments Interface) commands over 70% of online retail transaction volume in India, followed closely by Cash on Delivery (COD) for first-time brand buyers.'
      },
      {
        question: 'How much budget do I need to start marketing?',
        answer: 'We recommend starting with a daily budget of ₹500 to ₹1,000 on Meta conversion campaigns to gather initial performance data.'
      }
    ]
  },
  'shopify-vs-woocommerce-vs-launchgrid': {
    title: 'Shopify vs WooCommerce vs LaunchGrid: Which is Best in 2026?',
    category: 'Comparisons',
    date: 'June 14, 2026',
    readTime: '9 min read',
    content: [
      'Choosing the right ecommerce software determines your store speed, operational costs, and checkout conversion rates. Let\'s evaluate how the leading options compare for Indian D2C brands.',
      '<strong>1. Shopify (The Global Heavyweight)</strong><br/>Shopify is highly reliable, but costs are billed in USD (starting at $25/mo) which introduces foreign exchange fees. Additionally, standard Indian requirements like native UPI, local COD filters, and GST compliance require installing multiple paid third-party apps.',
      '<strong>2. WooCommerce (The Open Source Option)</strong><br/>WooCommerce offers maximum customization, but requires manual hosting setup, security updates, and plugin management. Slow loading speeds can hurt checkouts if servers are poorly configured.',
      '<strong>3. LaunchGrid (The India-First Solution)</strong><br/>LaunchGrid is built specifically for Indian merchants. It features built-in CGST/SGST/IGST tax splits, 0% transaction fees, and native UPI + COD checkouts. Calculate your exact channel costs with our <a href="/tools/ecommerce-pricing-calculator" class="text-black font-bold underline">Ecommerce Pricing Calculator</a> to compare platforms.'
    ],
    faqs: [
      {
        question: 'Which platform is best for dropshipping in India?',
        answer: 'LaunchGrid offers a direct 500+ Indian dropship catalog integration with local suppliers, making it faster to deploy without monthly integration plugins.'
      },
      {
        question: 'Are there hidden transaction fees on LaunchGrid?',
        answer: 'No. LaunchGrid charges 0% transaction commission fees. You only pay for your payment gateway fees (Razorpay/Paytm) directly.'
      }
    ]
  },
  'complete-gst-guide-small-businesses': {
    title: 'The Complete GST Guide for Small Online Businesses in India',
    category: 'Compliance',
    date: 'June 14, 2026',
    readTime: '10 min read',
    content: [
      'Tax compliance is vital for scaling online businesses. Under current Indian regulations, online portals require a GSTIN. However, direct selling via subdomains offers flexible threshold limits.',
      '<strong>Understanding GST Threshold Limits</strong><br/>For standard sales within your home state, registration is required once cumulative sales cross ₹40 Lakhs for goods (₹20 Lakhs for services). For interstate trade, standard CGST rules apply.',
      '<strong>How to Calculate CGST, SGST, and IGST</strong><br/>Sales within your state split tax equally between Central (CGST) and State (SGST) allocations. Sales to other states require Integrated GST (IGST). Use our <a href="/tools/gst-calculator" class="text-black font-bold underline">GST Calculator India</a> to get instant calculations.',
      '<strong>Failing to file GSTR Returns</strong><br/>Once registered, you must file monthly or quarterly returns (GSTR-1 and GSTR-3B) even if you had zero transactions. Failing to file nil returns triggers daily penalties.'
    ],
    faqs: [
      {
        question: 'Do I need a GSTIN to start selling on LaunchGrid?',
        answer: 'No. LaunchGrid allows you to test your market and take early orders without a GSTIN. You should register for GST once your sales approach threshold limits.'
      },
      {
        question: 'How does LaunchGrid help with GST invoicing?',
        answer: 'LaunchGrid automatically generates compliant invoices, splits CGST/SGST/IGST based on client shipping addresses, and sends PDF copies to buyers.'
      }
    ]
  },
  'case-study-local-clothing-store-launchgrid': {
    title: 'Case Study: How Aanya Ethnic Wear Increased Orders 3x Using LaunchGrid',
    category: 'Case Studies',
    date: 'June 14, 2026',
    readTime: '6 min read',
    content: [
      'Aanya Ethnic Wear is a growing fashion label that originally sold products entirely through Instagram DMs and manual WhatsApp chats. In this case study, we look at how they automated their operations and tripled order volumes.',
      '<strong>The Challenge: Manual DM Bottlenecks</strong><br/>Sharing individual photo files, quoting prices, sharing UPI QR codes, and confirming payments manually took hours. High cart abandonment occurred when customers had to wait for replies.',
      '<strong>The Solution: Streamlined Checkout</strong><br/>They built a storefront on LaunchGrid, letting customers tap bio links to view the entire catalog and checkout immediately. They used our <a href="/tools/whatsapp-message-generator" class="text-black font-bold underline">WhatsApp Message Generator</a> to customize quick chat CTAs for campaigns.',
      '<strong>The Result: 3x Order Growth</strong><br/>Conversion rates climbed from 1.2% to 3.8%. Automatic WhatsApp reminders recovered 28% of abandoned checkouts. Check your own ad potential with our <a href="/tools/roas-calculator" class="text-black font-bold underline">Meta Ads ROAS Calculator</a>.'
    ],
    faqs: [
      {
        question: 'How did Aanya Ethnic Wear manage logistics?',
        answer: 'They connected Delhivery shipping APIs natively to their storefront, printing shipping labels with a single tap.'
      },
      {
        question: 'What was their cart recovery rate?',
        answer: 'Using LaunchGrid\'s automated WhatsApp recovery loops, they recovered 28% of checkouts that had entered shipping details but left before paying.'
      }
    ]
  }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const post = blogPosts[params.slug]
  if (!post) return {}
  return {
    title: `${post.title} | LaunchGrid Blog`,
    description: post.content[0].replace(/<[^>]*>/g, ''),
  }
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = blogPosts[params.slug]

  if (!post) notFound()

  // Generate FAQ schema.org structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors mb-12"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
          </Link>

          <article className="space-y-8">
            <div className="space-y-4">
              <span className="bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit block">
                {post.category}
              </span>
              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[var(--color-mark-subtle-text)]">
                <span>Published on {post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
            </div>

            <div className="h-px bg-[var(--color-mark-default)]" />

            <div className="space-y-6 font-inter text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed">
              {post.content.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>

            {/* FAQs Accordion / Display (FAQ Schema verified) */}
            <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-8 mt-12 space-y-6">
              <h3 className="font-playfair text-xl md:text-2xl font-bold text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-6 divide-y divide-[var(--color-mark-default)]">
                {post.faqs.map((faq, i) => (
                  <div key={i} className={`${i > 0 ? 'pt-6' : ''} space-y-2`}>
                    <h4 className="font-inter font-bold text-sm md:text-base text-[var(--color-mark-ink)]">
                      {faq.question}
                    </h4>
                    <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
