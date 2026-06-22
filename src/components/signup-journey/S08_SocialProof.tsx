'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { founderStories } from '@/data/landing/content';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';
import { SectionReveal } from '../ui-landing/SectionReveal';

const videoStories = [
  {
    id: 'priya',
    name: 'Priya S.',
    location: 'Pune, Maharashtra',
    metric: 'Went from 0 to ₹40,000 in 3 weeks',
    niche: 'Jewellery & Accessories',
    thumbnail: '/images/transformation/day_2.png',
    summary: 'Watch Priya walk through her LaunchGrid storefront and show how she captured Instagram DM traffic using automated checkouts.',
    timeline: [
      { action: 'Instagram DM traffic lands', detail: '+142 visitors' },
      { action: 'UPI QR checkout completed', detail: 'Order #1049 - ₹1,899' },
      { action: 'Automated notification sent', detail: 'WhatsApp confirmed' }
    ]
  },
  {
    id: 'rohit',
    name: 'Rohit M.',
    location: 'Mumbai, Maharashtra',
    metric: 'Generated ₹24,000 in 20 days',
    niche: 'Apparel & Clothing',
    thumbnail: '/images/transformation/day_14.png',
    summary: 'Rohit shows his live shipping flow, generating Delhivery logistics shipping labels with a single tap on his phone.',
    timeline: [
      { action: 'Order received via checkout', detail: '₹1,299 prepaid' },
      { action: 'Tap "Fulfill with Delhivery"', detail: 'Label generated' },
      { action: 'Logistics pickup scheduled', detail: 'Auto-tracking active' }
    ]
  },
  {
    id: 'arjun',
    name: 'Arjun K.',
    location: 'Bengaluru, Karnataka',
    metric: 'Scaled to ₹1,42,800 in month 1',
    niche: 'Minimalist Home Decor',
    thumbnail: '/images/transformation/day_30.png',
    summary: 'Arjun demonstrates his abandoned cart recovery setup, detailing how automated recovery hooks salvaged 22 lost sales.',
    timeline: [
      { action: 'Checkout abandoned at step 2', detail: 'Customer left site' },
      { action: 'LaunchGrid triggers Inngest hook', detail: 'Scheduled 15m delay' },
      { action: 'Recovery WhatsApp delivered', detail: 'Sale completed: ₹2,499' }
    ]
  }
];

export default function S08_SocialProof() {
  const [largeStory, small1, small2] = founderStories;
  const [activeVideo, setActiveVideo] = useState<any>(null);

  return (
    <section className="py-32 w-full bg-[var(--color-mark-subtle)] border-t border-[var(--color-mark-default)] relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        
        <SectionReveal className="text-center mb-24">
          <ChapterLabel chapter="Chapter 07" label="Their Story" />
          <EditorialHeadline text={"Real founders.\nReal first sales."} size="lg" />
        </SectionReveal>

        {/* Text Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
          
          {/* Large Card (2 columns wide) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 lg:col-span-2 bg-white rounded-[2rem] border border-[var(--color-mark-default)] p-8 md:p-12 shadow-[0_4px_16px_rgba(26,26,24,0.06)] animate-fade-in"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-full bg-[var(--color-mark-subtle)] flex items-center justify-center font-playfair italic text-xl text-[var(--color-mark-secondary)]">R</div>
              <div>
                <p className="font-inter font-bold text-lg text-[var(--color-mark-ink)]">{largeStory.name}</p>
                <p className="font-inter text-xs text-[var(--color-mark-secondary)]">{largeStory.location}</p>
                <p className="font-inter text-[10px] text-[var(--color-mark-subtle-text)] mt-1 tracking-widest uppercase">Started: {largeStory.started}</p>
              </div>
            </div>

            <div className="mb-10 pl-2">
              <div className="border-l border-[var(--color-mark-default)] relative pl-6 flex flex-col gap-6">
                {largeStory.timeline?.map((item, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[28.5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${item.highlight ? 'bg-[var(--color-mark-green)] scale-125 shadow-sm' : 'bg-[var(--color-mark-muted)]'}`} />
                    <span className="font-inter text-xs font-bold text-[var(--color-mark-subtle-text)] w-16 inline-block">{item.date}</span>
                    <span className={`font-inter text-sm ${item.highlight ? 'text-[var(--color-mark-green)] font-bold' : 'text-[var(--color-mark-secondary)]'}`}>{item.event}</span>
                  </div>
                ))}
              </div>
            </div>

            <blockquote className="font-playfair italic text-2xl md:text-3xl text-[var(--color-mark-ink)] leading-tight">
              "{largeStory.quote}"
            </blockquote>
          </motion.div>

          {/* Smaller Cards column */}
          <div className="col-span-1 flex flex-col gap-6">
            <SmallCard story={small1} delay={0.1} />
            <SmallCard story={small2} delay={0.2} />
          </div>

        </div>

      </div>
    </section>
  );
}

function SmallCard({ story, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white rounded-[2rem] border border-[var(--color-mark-default)] p-8 shadow-[0_4px_16px_rgba(26,26,24,0.06)] flex-1 flex flex-col hover:shadow-[0_12px_36px_rgba(26,26,24,0.08)] transition-all"
    >
      <div className="mb-6">
        <p className="font-inter font-bold text-[var(--color-mark-ink)]">{story.name}</p>
        <p className="font-inter text-xs text-[var(--color-mark-secondary)]">{story.location} · {story.niche}</p>
      </div>
      
      <div className="flex flex-col gap-2 mb-6 font-inter text-sm text-[var(--color-mark-secondary)] border-l-2 border-[var(--color-mark-default)] pl-4">
        <div>First sale: <strong className="text-[var(--color-mark-ink)]">{story.firstSale}</strong></div>
        <div>Month 1: <strong className="text-[var(--color-mark-green)]">{story.month1}</strong></div>
      </div>

      <blockquote className="mt-auto font-playfair italic text-lg text-[var(--color-mark-ink)]">
        "{story.quote}"
      </blockquote>
    </motion.div>
  );
}
