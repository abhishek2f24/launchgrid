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
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
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
        <RealStoresGallery />
        {/* Movement 5 — The Door */}
        <S_FAQ />
        <S10_FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
