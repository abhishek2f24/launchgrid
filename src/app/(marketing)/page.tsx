import type { Metadata } from 'next';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { ProgressBar } from '@/components/signup-journey/ProgressBar';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';

// Homepage = 5 movements (see WEBSITE_REDESIGN_PLAN.md §2.2):
// 1. The Proof (hero + idea input) · 2. The Pain→Turn · 3. The Method + Demo
// 4. The Money + real stores · 5. The Door (FAQ + final CTA)
// Removed from flow: S03_TheReality (redundant with S02), S_ToolComparison
// (comparison intent lives on /vs-shopify and /vs-dukaan), S08_SocialProof
// (fictional testimonials — replaced by RealStoresGallery, strictly real data).
import S01_TheThought from '@/components/signup-journey/S01_TheThought';
import S02_ThePain from '@/components/signup-journey/S02_ThePain';
import S04_TheTransformation from '@/components/signup-journey/S04_TheTransformation';
import S05_TheMoney from '@/components/signup-journey/S05_TheMoney';
import S06_TheMethod from '@/components/signup-journey/S06_TheMethod';
import S07_LiveDemo from '@/components/signup-journey/S07_LiveDemo';
import { RealStoresGallery } from '@/components/signup-journey/RealStoresGallery';
import S08_SocialProof from '@/components/signup-journey/S08_SocialProof';
import S_FAQ from '@/components/signup-journey/S_FAQ';
import S10_FinalCTA from '@/components/signup-journey/S10_FinalCTA';

// ISR: gallery data refreshes hourly without making the page request-dynamic
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'LaunchGrid — Launch Your Online Store in 15 Minutes',
  description: 'Build a real Indian D2C brand. AI-generated storefront, direct UPI payments (0% fees), dropship catalog, and abandoned cart recovery. Start your free 7-day trial.',
  keywords: ['online store India', 'sell online India', 'ecommerce India', 'D2C India', 'UPI payments store', 'Shopify alternative India', 'Dukaan alternative'],
  openGraph: {
    title: 'LaunchGrid — Your Store. Live in 15 Minutes.',
    description: 'Indian D2C platform with AI storefront, UPI payments, and zero transaction fees.',
    url: 'https://launchgrid.in',
    siteName: 'LaunchGrid',
    type: 'website',
    // OG image served by file convention: src/app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaunchGrid — Launch Your Online Store in 15 Minutes',
    description: 'Indian D2C platform with AI storefront, UPI payments, and zero transaction fees.',
  },
  alternates: {
    canonical: 'https://launchgrid.in',
  },
};

export default function MarketingPage() {
  const schemaBlocks = [
    // BLOCK 1: Organization
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://launchgrid.in/#organization",
      "name": "LaunchGrid",
      "legalName": "Launchgrid LLP",
      "url": "https://launchgrid.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://launchgrid.in/images/launchgrid-logo.png",
        "width": 512,
        "height": 512
      },
      "image": "https://launchgrid.in/images/launchgrid-og.png",
      "description": "LaunchGrid is India's fastest ecommerce platform — launch your online store in 15 minutes with native UPI payments, COD support, automatic GST invoicing, WhatsApp abandoned cart recovery, and 0% transaction fees.",
      "foundingDate": "2023",
      "foundingLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN"
        }
      },
      "areaServed": {
        "@type": "Country",
        "name": "India"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "availableLanguage": ["English", "Hindi"],
          "contactOption": "TollFree",
          "url": "https://launchgrid.in/support"
        },
        {
          "@type": "ContactPoint",
          "contactType": "sales",
          "availableLanguage": ["English", "Hindi"],
          "url": "https://launchgrid.in/contact"
        }
      ],
      "sameAs": [
        "https://www.instagram.com/launchgrid",
        "https://www.facebook.com/launchgrid",
        "https://twitter.com/launchgrid",
        "https://www.linkedin.com/company/launchgrid",
        "https://www.youtube.com/@launchgrid"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "LaunchGrid Subscription Plans",
        "itemListElement": [
          {
            "@type": "Offer",
            "name": "Free Plan",
            "price": "0",
            "priceCurrency": "INR",
            "description": "Start with 3 products, branded storefront, UPI payments",
            "url": "https://launchgrid.in/pricing"
          },
          {
            "@type": "Offer",
            "name": "Pro Plan",
            "price": "1399",
            "priceCurrency": "INR",
            "description": "Full store, custom domain, unlimited products, WhatsApp recovery",
            "url": "https://launchgrid.in/pricing"
          },
          {
            "@type": "Offer",
            "name": "Max Plan",
            "price": "6999",
            "priceCurrency": "INR",
            "description": "Priority support, advanced analytics, dropship catalog, Meta Ads tools",
            "url": "https://launchgrid.in/pricing"
          },
          {
            "@type": "Offer",
            "name": "Ultra Plan",
            "price": "17999",
            "priceCurrency": "INR",
            "description": "Enterprise-grade, dedicated manager, custom integrations",
            "url": "https://launchgrid.in/pricing"
          }
        ]
      }
    },
    // BLOCK 2: WebSite
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://launchgrid.in/#website",
      "name": "LaunchGrid",
      "url": "https://launchgrid.in",
      "description": "India's fastest online store builder. Launch in 15 minutes. UPI, GST, WhatsApp, COD — all built in.",
      "inLanguage": ["en-IN", "hi"],
      "publisher": {
        "@id": "https://launchgrid.in/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://launchgrid.in/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    // BLOCK 3: SoftwareApplication
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": "https://launchgrid.in/#software",
      "name": "LaunchGrid",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "EcommerceApplication",
      "operatingSystem": "Web, iOS, Android",
      "url": "https://launchgrid.in",
      "description": "LaunchGrid is an Indian ecommerce SaaS platform that enables small businesses, Instagram sellers, WhatsApp sellers, and first-time entrepreneurs to launch a fully functional online store in 15 minutes. Features include AI-generated storefronts, native UPI and COD payments, automatic GST invoicing, WhatsApp abandoned cart recovery, SEO-optimized product pages, inventory management, and a 500+ product dropship catalog.",
      "featureList": [
        "AI-generated storefronts",
        "Native UPI payment integration",
        "Cash on Delivery (COD) support",
        "Automatic GST invoicing and threshold tracking",
        "WhatsApp abandoned cart recovery",
        "0% transaction fees",
        "500+ dropship product catalog",
        "Custom domain support",
        "SEO-optimized product pages",
        "INR billing — no foreign exchange loss",
        "CGST, SGST, IGST automatic splitting",
        "Order and inventory management",
        "Analytics dashboard",
        "WhatsApp Business integration",
        "Meta Ads templates (Max and Ultra plans)"
      ],
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "0",
        "highPrice": "17999",
        "priceCurrency": "INR",
        "offerCount": "4",
        "offers": [
          {
            "@type": "Offer",
            "name": "Free",
            "price": "0",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "url": "https://launchgrid.in/pricing"
          },
          {
            "@type": "Offer",
            "name": "Pro",
            "price": "1399",
            "priceCurrency": "INR",
            "billingIncrement": "P1M",
            "availability": "https://schema.org/InStock",
            "url": "https://launchgrid.in/pricing",
            "priceValidUntil": "2026-12-31"
          },
          {
            "@type": "Offer",
            "name": "Max",
            "price": "6999",
            "priceCurrency": "INR",
            "billingIncrement": "P1M",
            "availability": "https://schema.org/InStock",
            "url": "https://launchgrid.in/pricing",
            "priceValidUntil": "2026-12-31"
          },
          {
            "@type": "Offer",
            "name": "Ultra",
            "price": "17999",
            "priceCurrency": "INR",
            "billingIncrement": "P1M",
            "availability": "https://schema.org/InStock",
            "url": "https://launchgrid.in/pricing",
            "priceValidUntil": "2026-12-31"
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "142",
        "bestRating": "5",
        "worstRating": "1"
      },
      "screenshot": "https://launchgrid.in/images/dashboard-screenshot.png",
      "softwareVersion": "1.2.0",
      "countriesSupported": "IN",
      "inLanguage": "en-IN"
    },
    // BLOCK 4: FAQ Page
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How long does it take to launch an online store with LaunchGrid?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most LaunchGrid stores go live in 15 minutes or less. Our AI-powered setup wizard handles storefront design, payment configuration, and product catalog import automatically. You only need to add your products and publish."
          }
        },
        {
          "@type": "Question",
          "name": "Does LaunchGrid support UPI payments?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. LaunchGrid has native UPI payment integration built in — no additional apps or third-party gateways required. Customers can pay via UPI, COD (Cash on Delivery), debit/credit cards, and net banking directly from your store."
          }
        },
        {
          "@type": "Question",
          "name": "Does LaunchGrid handle GST automatically?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. LaunchGrid automatically generates GST-compliant invoices for every order, tracks your cumulative revenue against the ₹40 lakh threshold, and correctly splits CGST, SGST, and IGST based on the buyer's state. No CA or additional GST software needed."
          }
        },
        {
          "@type": "Question",
          "name": "What are LaunchGrid's transaction fees?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "LaunchGrid charges 0% transaction fees on all paid plans. Every rupee your customer pays goes directly to you, with no platform commission deducted per order. This is unlike platforms like Dukaan which charge up to 2.99% per transaction."
          }
        },
        {
          "@type": "Question",
          "name": "Can I start selling on LaunchGrid without a GSTIN?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. You can start and launch your store on LaunchGrid without a GSTIN. GST registration is only required in India once your annual turnover crosses ₹20 lakh (₹10 lakh for special category states). LaunchGrid's dashboard tracks your revenue and alerts you when you approach the threshold."
          }
        },
        {
          "@type": "Question",
          "name": "Does LaunchGrid have WhatsApp abandoned cart recovery?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. LaunchGrid includes WhatsApp abandoned cart recovery at no extra cost on Pro, Max, and Ultra plans. When a customer adds products to their cart but doesn't complete checkout, LaunchGrid automatically sends a WhatsApp message to recover the sale."
          }
        },
        {
          "@type": "Question",
          "name": "Is there a free plan or free trial available?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. LaunchGrid offers a permanent free plan that lets you list up to 3 products and accept orders. All paid plans include a 7-day free trial with full features — no credit card required to start."
          }
        },
        {
          "@type": "Question",
          "name": "How is LaunchGrid different from Shopify for Indian businesses?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "LaunchGrid is built specifically for India. Unlike Shopify, LaunchGrid bills in INR (no foreign exchange loss), includes native UPI and COD without third-party apps, provides automatic GST invoicing, supports WhatsApp Business integration natively, and charges 0% transaction fees. Shopify's equivalent features require multiple paid apps totalling ₹2,000–₹4,000 per month in additional costs."
          }
        },
        {
          "@type": "Question",
          "name": "Can I dropship products on LaunchGrid?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. LaunchGrid provides access to a catalog of 500+ Indian dropship products across categories including electronics, home decor, fashion, and beauty. You can import products to your store in one click and start selling without holding any inventory."
          }
        },
        {
          "@type": "Question",
          "name": "What happens to my store data if I cancel my subscription?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Your store data, product listings, customer information, and order history belong to you. LaunchGrid does not lock in your data. If you cancel your subscription, you retain access to export all your data. You can cancel anytime without penalty."
          }
        }
      ]
    },
    // BLOCK 5: Speakable (WebPage)
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": "https://launchgrid.in/#webpage",
      "url": "https://launchgrid.in",
      "name": "LaunchGrid — Your Store. Live in 15 Minutes.",
      "description": "LaunchGrid is India's fastest online store builder. Launch with UPI, COD, GST, and WhatsApp recovery — all built in. 0% transaction fees. Start free.",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [
          ".hero-headline",
          ".hero-subheadline",
          ".value-proposition-summary"
        ]
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://launchgrid.in"
          }
        ]
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://launchgrid.in/images/launchgrid-og.png",
        "width": 1200,
        "height": 630
      },
      "inLanguage": "en-IN",
      "publisher": {
        "@id": "https://launchgrid.in/#organization"
      }
    }
  ];

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      {schemaBlocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <GrainOverlay />
      {/* Launch offer bar — first-10 concierge setup (drives /free-setup WhatsApp funnel) */}
      <a
        href="/free-setup?utm_source=homepage&utm_medium=announcement_bar"
        className="relative z-20 block w-full bg-[var(--color-mark-ink)] text-center py-2 px-4 text-[11px] sm:text-xs font-bold tracking-wide text-white hover:bg-neutral-800 transition-colors"
      >
        🆓 First 10 businesses: we set up your entire store for you — free.{' '}
        <span className="underline underline-offset-2 decoration-white/40">Claim your spot →</span>
      </a>
      <ProgressBar />
      <JourneyNav />

      <main className="flex-1 w-full overflow-x-clip">
        {/* Movement 1 — The Proof */}
        <S01_TheThought />
        {/* Movement 2 — The Pain → The Turn */}
        <S02_ThePain />
        <S04_TheTransformation />
        {/* Movement 3 — The Method, then try it */}
        <S06_TheMethod />
        <S07_LiveDemo />
        {/* Movement 4 — The Money, proven by real stores */}
        <S05_TheMoney />
        <S08_SocialProof />
        {/* <RealStoresGallery /> */}
        {/* Movement 5 — The Door */}
        <S_FAQ />
        <S10_FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
