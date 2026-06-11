import type { Metadata } from 'next';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { ProgressBar } from '@/components/signup-journey/ProgressBar';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';

import S01_TheThought from '@/components/signup-journey/S01_TheThought';
import S02_ThePain from '@/components/signup-journey/S02_ThePain';
import S_ToolComparison from '@/components/signup-journey/S_ToolComparison';
import S03_TheReality from '@/components/signup-journey/S03_TheReality';
import S04_TheTransformation from '@/components/signup-journey/S04_TheTransformation';
import S05_TheMoney from '@/components/signup-journey/S05_TheMoney';
import S06_TheMethod from '@/components/signup-journey/S06_TheMethod';
import S07_LiveDemo from '@/components/signup-journey/S07_LiveDemo';
import S08_SocialProof from '@/components/signup-journey/S08_SocialProof';
import S_FAQ from '@/components/signup-journey/S_FAQ';
import S10_FinalCTA from '@/components/signup-journey/S10_FinalCTA';

export const metadata: Metadata = {
  title: 'LaunchGrid — Launch Your Online Store in 15 Minutes',
  description: 'Build a real Indian D2C brand. AI-generated storefront, direct UPI payments (0% fees), dropship catalog, and abandoned cart recovery. Start your free 24-hour trial.',
  keywords: ['online store India', 'sell online India', 'ecommerce India', 'D2C India', 'UPI payments store', 'Shopify alternative India', 'Dukaan alternative'],
  openGraph: {
    title: 'LaunchGrid — Your Store. Live in 15 Minutes.',
    description: 'Indian D2C platform with AI storefront, UPI payments, and zero transaction fees.',
    url: 'https://launchgrid.in',
    siteName: 'LaunchGrid',
    type: 'website',
    images: [{ url: 'https://launchgrid.in/og-image.png', width: 1200, height: 630, alt: 'LaunchGrid — Online Store Builder for India' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaunchGrid — Launch Your Online Store in 15 Minutes',
    description: 'Indian D2C platform with AI storefront, UPI payments, and zero transaction fees.',
    images: ['https://launchgrid.in/og-image.png'],
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
        <S01_TheThought />
        <S02_ThePain />
        <S_ToolComparison />
        <S03_TheReality />
        <S04_TheTransformation />
        <S05_TheMoney />
        <S06_TheMethod />
        <S07_LiveDemo />
        <S08_SocialProof />
        <S_FAQ />
        <S10_FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
