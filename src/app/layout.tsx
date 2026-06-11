import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/ui-landing/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://launchgrid.in'),
  title: {
    default: 'LaunchGrid — Launch Your Online Store in 15 Minutes',
    template: '%s | LaunchGrid',
  },
  description: 'Build a real Indian D2C brand. AI-generated storefront, native UPI + COD payments, Indian dropship catalog, abandoned cart recovery. 7-day free trial.',
  keywords: ['online store builder India', 'D2C ecommerce India', 'UPI payments store', 'sell online India', 'Shopify alternative India'],
  authors: [{ name: 'LaunchGrid', url: 'https://launchgrid.in' }],
  creator: 'LaunchGrid',
  publisher: 'LaunchGrid',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://launchgrid.in',
    siteName: 'LaunchGrid',
    title: 'LaunchGrid — Launch Your Online Store in 15 Minutes',
    description: 'Build a real Indian D2C brand. AI storefront, UPI payments, 0% fees.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'LaunchGrid — Online Store Builder for India',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@launchgrid_in',
    creator: '@launchgrid_in',
    title: 'LaunchGrid — Launch Your Online Store in 15 Minutes',
    description: 'Build a real Indian D2C brand. AI storefront, UPI payments, 0% fees.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://launchgrid.in/#organization",
        "name": "LaunchGrid",
        "url": "https://launchgrid.in",
        "logo": "https://launchgrid.in/logo.png",
        "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "email": "support@launchgrid.in" },
        "sameAs": ["https://twitter.com/launchgrid_in", "https://instagram.com/launchgrid.in"]
      },
      {
        "@type": "WebSite",
        "@id": "https://launchgrid.in/#website",
        "url": "https://launchgrid.in",
        "name": "LaunchGrid",
        "description": "Build a real Indian D2C brand. AI storefront, native UPI + COD, Indian dropship catalog.",
        "publisher": { "@id": "https://launchgrid.in/#organization" }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://launchgrid.in/#app",
        "name": "LaunchGrid",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "description": "India-first ecommerce platform with native UPI payments, GST compliance, and an Indian dropship catalog. Launch your online store in 15 minutes.",
        "offers": [
          { "@type": "Offer", "name": "Starter", "price": "999", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" } },
          { "@type": "Offer", "name": "Growth",  "price": "2499", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" } },
          { "@type": "Offer", "name": "Scale",   "price": "4999", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" } }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How long does it take to launch a store?",
            "acceptedAnswer": { "@type": "Answer", "text": "About 15 minutes. You describe your business, LaunchGrid generates your store with AI, you add products by pasting any product URL, and connect your UPI ID to accept payments." }
          },
          {
            "@type": "Question",
            "name": "Does LaunchGrid handle GST compliance?",
            "acceptedAnswer": { "@type": "Answer", "text": "Yes. LaunchGrid monitors your revenue against GST thresholds (₹20 Lakh for services, ₹40 Lakh for goods), alerts you when you're approaching registration requirements, and generates GST-compliant tax invoices automatically." }
          },
          {
            "@type": "Question",
            "name": "What payment methods can my customers use?",
            "acceptedAnswer": { "@type": "Answer", "text": "Customers can pay via UPI (GPay, PhonePe, Paytm, BHIM), credit/debit cards, netbanking, wallets through Razorpay integration, or Cash on Delivery (COD) with OTP verification." }
          },
          {
            "@type": "Question",
            "name": "Can I sell dropship products without holding inventory?",
            "acceptedAnswer": { "@type": "Answer", "text": "Yes. LaunchGrid has a built-in Indian dropship catalog. You can also import any product by pasting a Meesho, Amazon, Ajio, or Nykaa URL — the AI fills in the title, description, and images automatically." }
          },
          {
            "@type": "Question",
            "name": "What happens when my trial ends?",
            "acceptedAnswer": { "@type": "Answer", "text": "After 7 days, your store enters read-only mode. Your store data is preserved and you can upgrade to a paid plan at any time to resume selling. No data is deleted." }
          },
          {
            "@type": "Question",
            "name": "How is LaunchGrid different from Shopify or Dukaan?",
            "acceptedAnswer": { "@type": "Answer", "text": "LaunchGrid is built specifically for Indian merchants. It includes native UPI checkout (no app installs), GST compliance built-in, an Indian dropship catalog, COD with fraud prevention, and INR billing with no FX losses. Shopify charges in USD and lacks Indian payment and compliance features natively." }
          }
        ]
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
        />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
