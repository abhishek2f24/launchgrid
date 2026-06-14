'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Search, ExternalLink } from 'lucide-react';

export default function StoreNameGeneratorPage() {
  const [keyword, setKeyword] = useState<string>('Ethnic');
  const [niche, setNiche] = useState<string>('fashion');
  const [generatedNames, setGeneratedNames] = useState<string[]>([
    'Aanya Ethnic Wear',
    'Ethnic Loom',
    'Vedic Thread',
    'Sutra Style',
    'Ethnic Aura',
    'Loom & Weave',
    'IndiCrafts',
    'Zari Studio',
    'Chanderi Charm',
    'Heritage Hue'
  ]);

  const prefixes: Record<string, string[]> = {
    fashion: ['Zara', 'Urban', 'Pure', 'Vedic', 'Royal', 'Indi', 'Thread', 'Zari', 'Chic', 'Trend'],
    beauty: ['Glow', 'Blush', 'Aura', 'Nectar', 'Plum', 'Skin', 'Nature', 'Dew', 'Silk', 'Mirror'],
    food: ['Spice', 'Taste', 'Vedic', 'Desi', 'Organic', 'Kitchen', 'Bite', 'Sweet', 'Daily', 'Pure'],
    home: ['Nest', 'Casa', 'Loom', 'Aura', 'Craft', 'Heritage', 'Brick', 'Cozy', 'Clay', 'Deco'],
    general: ['Launch', 'Apex', 'Next', 'Prime', 'Nova', 'Swift', 'Direct', 'Veda', 'Blue', 'Smart']
  };

  const suffixes: Record<string, string[]> = {
    fashion: ['Wear', 'Studio', 'Weave', 'Loom', 'Thread', 'Fits', 'Label', 'Couture', 'Closet', 'Craft'],
    beauty: ['Skin', 'Beauty', 'Glow', 'Cosmetics', 'Essentials', 'Organics', 'Rituals', 'Care', 'Lab', 'Herb'],
    food: ['Bites', 'Spices', 'Kitchen', 'Foods', 'Farm', 'Fresh', 'Pantry', 'Cart', 'Daily', 'Treats'],
    home: ['Decor', 'Nest', 'Loom', 'Living', 'Crafts', 'Spaces', 'Home', 'Studios', 'Art', 'Clay'],
    general: ['Cart', 'Mart', 'Store', 'Hub', 'Brand', 'Indi', 'Direct', 'Zone', 'Shop', 'World']
  };

  const handleGenerate = () => {
    const raw = keyword.trim() || 'Store';
    const category = niche in prefixes ? niche : 'general';
    const list: string[] = [];

    // Prefix match
    prefixes[category].slice(0, 5).forEach((pre) => {
      list.push(`${pre} ${raw}`);
    });

    // Suffix match
    suffixes[category].slice(0, 5).forEach((suf) => {
      list.push(`${raw} ${suf}`);
    });

    // Custom blends
    list.push(`${raw} Loom`);
    list.push(`The ${raw} Studio`);
    list.push(`${raw} & Co`);
    list.push(`Indi ${raw}`);
    list.push(`${raw} Aura`);

    // Unique values only
    const uniqueList = Array.from(new Set(list));
    setGeneratedNames(uniqueList);
  };

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] bg-black/[0.04] px-3 py-1 rounded-full mb-3 inline-block font-semibold">
              Brand Utilities
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Store Name Generator
            </h1>
            <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto leading-relaxed">
              Generate catchy, professional, brandable names for your Indian D2C brand or online retail shop and check domain link availability.
            </p>
          </div>

          {/* Generator Tool UI */}
          <div className="bg-white rounded-[2.5rem] border border-[var(--color-mark-default)] p-6 md:p-10 shadow-[0_12px_40px_rgba(26,26,24,0.05)] mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Enter Keyword
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-[var(--color-mark-default)] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                    placeholder="e.g. Ethnic, Glow, Spice"
                  />
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Select Niche
                  </label>
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-[var(--color-mark-default)] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                  >
                    <option value="fashion">Fashion & Clothing</option>
                    <option value="beauty">Beauty & Cosmetics</option>
                    <option value="food">Food & Spices</option>
                    <option value="home">Home Decor & Loom</option>
                    <option value="general">General Commerce</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full flex justify-center items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-6 rounded-xl hover:bg-black transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4" /> Generate Store Names
                </button>
              </div>

              {/* Outputs */}
              <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-6">
                <p className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)] border-b border-[var(--color-mark-default)] pb-3 mb-4">
                  Generated Brand Names
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {generatedNames.map((name, index) => {
                    const cleanDomain = name.toLowerCase().replace(/\s+/g, '');
                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white border border-[var(--color-mark-default)] px-4 py-2.5 rounded-xl text-xs font-inter text-[var(--color-mark-ink)] hover:border-[var(--color-mark-ink)] transition-colors group"
                      >
                        <span className="font-semibold">{name}</span>
                        <a
                          href={`https://www.godaddy.com/domainsearch/find?domainName=${cleanDomain}.in`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-green)] flex items-center gap-1"
                        >
                          Check .in <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* SEO Content Section */}
          <article className="prose prose-neutral max-w-none text-[var(--color-mark-secondary)] font-inter text-xs leading-relaxed space-y-8">
            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">How to Choose the Perfect D2C Brand Name</h2>
              <p className="mb-4">
                Choosing a name for your online store is one of the most critical steps in establishing your brand. A great store name must be memorable, easy to spell, and match the expectations of your target audience. For Indian shoppers, blending traditional cultural words with modern ecommerce naming suffixes (e.g. *Thread*, *Loom*, *Glow*, *Craft*) creates immediate trust and positioning.
              </p>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Core Principles of Naming</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Keep it Simple</strong>: Try to target names with two syllables or less. Avoid complex spelling configurations that make search indexing difficult.</li>
                <li><strong>Verify Trademark Status</strong>: Before buying domains, check the IP India Trademark Registry online to ensure you aren't infringing on an established clothing, tech, or cosmetics trademark.</li>
                <li><strong>Secure Local Domains</strong>: For brands selling primarily in India, registering a `.in` or `.co.in` extension communicates local pricing and shipping trust.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Frequently Asked Questions (FAQ)</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: Can I change my store name after launching?</p>
                  <p>A: Yes. LaunchGrid allows you to update your storefront name and connect a new custom domain at any time without resetting product database details or order historical data.</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: What is a custom domain and why do I need it?</p>
                  <p>A: When you sign up, your store lives on a free subdomain like `yourname.launchgrid.in`. Connecting a custom domain like `yourname.com` builds professional brand authority and ranks higher in search engines.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-8 text-center mt-12">
              <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                Secure Your Store Name on LaunchGrid Today
              </h3>
              <p className="mb-6 max-w-xl mx-auto text-xs">
                Once you decide on a name, claim your free LaunchGrid subdomain immediately to start setting up products and designing your theme. Start your free trial with no credit card required.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black transition-all shadow-md"
              >
                Claim Your Subdomain Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
