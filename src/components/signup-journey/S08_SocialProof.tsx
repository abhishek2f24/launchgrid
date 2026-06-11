'use client';

import { useState } from 'react';
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
                <h4 className="font-inter font-bold text-lg text-[var(--color-mark-ink)]">{largeStory.name}</h4>
                <p className="font-inter text-xs text-[var(--color-mark-secondary)]">{largeStory.location}</p>
                <p className="font-inter text-[10px] text-[var(--color-mark-muted)] mt-1 tracking-widest uppercase">Started: {largeStory.started}</p>
              </div>
            </div>

            <div className="mb-10 pl-2">
              <div className="border-l border-[var(--color-mark-default)] relative pl-6 flex flex-col gap-6">
                {largeStory.timeline?.map((item, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[28.5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${item.highlight ? 'bg-[var(--color-mark-green)] scale-125 shadow-sm' : 'bg-[var(--color-mark-muted)]'}`} />
                    <span className="font-inter text-xs font-bold text-[var(--color-mark-muted)] w-16 inline-block">{item.date}</span>
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

        {/* Video Stories Section */}
        <div className="border-t border-[var(--color-mark-default)] pt-24">
          <div className="text-center mb-16">
            <h3 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)] mb-4">
              Watch their stores in action.
            </h3>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto">
              Click to watch real 60-second screen walk-throughs of active stores and actual backend analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {videoStories.map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] border border-[var(--color-mark-default)] overflow-hidden shadow-[0_8px_32px_rgba(26,26,24,0.03)] flex flex-col cursor-pointer group"
                onClick={() => setActiveVideo(video)}
              >
                {/* Visual Thumbnail */}
                <div className="h-48 relative overflow-hidden bg-black/5">
                  <img
                    src={video.thumbnail}
                    alt={video.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center transition-opacity duration-300 group-hover:bg-black/45">
                    {/* Play Button Icon */}
                    <div className="w-12 h-12 rounded-full bg-white/90 text-[var(--color-mark-ink)] flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <svg className="w-5 h-5 fill-current ml-1" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Metric Badge */}
                  <span className="absolute bottom-4 left-4 bg-[var(--color-mark-green)] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {video.metric.split(' ')[0] === 'Went' ? '0 to ₹40K' : video.metric.split(' ')[0] === 'Generated' ? '₹24,000' : '₹1.4L+ Scale'}
                  </span>
                </div>

                {/* Text Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-inter font-bold text-sm text-[var(--color-mark-ink)] mb-1">
                      {video.name} · <span className="font-normal text-[var(--color-mark-secondary)]">{video.niche}</span>
                    </h4>
                    <p className="font-inter text-[10px] text-[var(--color-mark-muted)] tracking-wider uppercase mb-3">
                      {video.location}
                    </p>
                    <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-4">
                      {video.summary}
                    </p>
                  </div>
                  <span className="font-inter text-xs font-bold text-[var(--color-mark-ink)] group-hover:underline flex items-center gap-1">
                    Play Story (60s) →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Fullscreen Video Story Modal Player */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1A1A18] text-white w-full max-w-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white text-xl font-mono focus:outline-none"
              >
                ✕
              </button>

              {/* Title Bar */}
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <span className="font-mono text-[10px] tracking-wider text-green-400 uppercase font-bold">
                  Live Merchant Recording
                </span>
                <h4 className="font-playfair text-xl font-bold mt-1">
                  {activeVideo.name} — {activeVideo.metric}
                </h4>
              </div>

              {/* Live Simulated Walkthrough Dashboard */}
              <div className="p-8 bg-[#131312]">
                <div className="bg-black/35 rounded-2xl border border-white/5 p-6 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="font-mono text-xs text-white/40">Status: Playing Feed</span>
                    <span className="bg-green-500/10 text-green-400 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Live Flow
                    </span>
                  </div>

                  <div className="space-y-4">
                    {activeVideo.timeline.map((step: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.4 }}
                        className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-white/20">0{idx + 1}</span>
                          <span className="font-inter text-xs md:text-sm text-white/80">{step.action}</span>
                        </div>
                        <span className="font-mono text-xs text-green-400 font-bold">{step.detail}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Simulated Line graph container */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span>Demo Duration: 60 seconds</span>
                    <span className="underline cursor-pointer hover:text-white" onClick={() => setActiveVideo(null)}>
                      Close Story
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center text-xs text-white/50 leading-relaxed font-inter">
                  {activeVideo.summary}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
        <h4 className="font-inter font-bold text-[var(--color-mark-ink)]">{story.name}</h4>
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
