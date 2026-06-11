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
  }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const post = blogPosts[params.slug]
  if (!post) return {}
  return {
    title: `${post.title} | LaunchGrid Blog`,
    description: post.content[0],
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
              <div className="flex items-center gap-3 text-xs text-[var(--color-mark-muted)]">
                <span>Published on {post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
            </div>

            <div className="h-px bg-[var(--color-mark-default)]" />

            <div className="space-y-6 font-inter text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed">
              {post.content.map((p, i) => (
                <p key={i}>{p}</p>
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
