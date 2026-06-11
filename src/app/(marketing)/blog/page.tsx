'use client';

import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';

interface BlogPost {
  title: string;
  slug: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
}

const posts: BlogPost[] = [
  {
    title: 'How to start dropshipping in India with zero inventory investment',
    slug: 'start-dropshipping-india',
    description: 'Learn the exact roadmap of setting up a dropshipping store in India, sourcing products locally, and marketing via Instagram.',
    date: 'June 5, 2026',
    readTime: '6 min read',
    category: 'Guides',
  },
  {
    title: 'How does GST compliance work for online ecommerce stores in India?',
    slug: 'gst-compliance-ecommerce',
    description: 'Understanding the ₹20 Lakh and ₹40 Lakh registration thresholds, CGST/SGST/IGST splits, and invoice compliance.',
    date: 'May 28, 2026',
    readTime: '8 min read',
    category: 'Compliance',
  },
  {
    title: 'What is abandoned cart recovery: Recovering lost sales on auto-pilot',
    slug: 'what-is-abandoned-cart-recovery',
    description: 'How simple automated WhatsApp and email reminders can recover up to 25% of abandoned checkouts without rising ad costs.',
    date: 'May 14, 2026',
    readTime: '5 min read',
    category: 'Optimization',
  },
];

export default function BlogPage() {
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          
          {/* Header */}
          <div className="text-center mb-16 border-b border-[var(--color-mark-default)] pb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-3 block">
              The LaunchGrid Blog
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Ecommerce growth playbooks.
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto">
              Practical strategies, marketing guides, and compliance walkthroughs to scale your store to ₹1 Lakh+ in monthly revenue.
            </p>
          </div>

          {/* Post Directory */}
          <div className="space-y-10">
            {posts.map((post, index) => (
              <article
                key={index}
                className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-8 md:p-10 shadow-[0_8px_32px_rgba(26,26,24,0.02)] hover:shadow-[0_16px_48px_rgba(26,26,24,0.06)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {post.category}
                    </span>
                    <span className="font-inter text-xs text-[var(--color-mark-subtle-text)]">{post.date}</span>
                    <span className="text-[var(--color-mark-default)]">•</span>
                    <span className="font-inter text-xs text-[var(--color-mark-subtle-text)]">{post.readTime}</span>
                  </div>

                  <h2 className="font-playfair text-xl md:text-2xl font-bold text-[var(--color-mark-ink)] mb-3 leading-snug hover:text-black transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] leading-relaxed mb-6">
                    {post.description}
                  </p>
                </div>

                <div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-inter text-xs font-bold text-[var(--color-mark-ink)] hover:underline flex items-center gap-1"
                  >
                    Read Article →
                  </Link>
                </div>
              </article>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
