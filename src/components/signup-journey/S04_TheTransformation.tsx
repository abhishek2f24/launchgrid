'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';

const milestones = [
  { day: 'Day 1', headline: 'I have an idea.', sub: 'Excited but overwhelmed. No idea where to start.', bg: 'bg-black/5', border: 'border-black/5' },
  { day: 'Day 2', headline: 'My store is live.', sub: 'Powered by LaunchGrid. You pick a niche. We build it.', bg: 'bg-black/5', border: 'border-black/10' },
  { day: 'Day 7', headline: 'My first visitor.', sub: 'Someone found you. Real traffic. Real people.', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { day: 'Day 14', headline: 'My first sale. ₹1,299.', sub: 'The notification hits. Your phone buzzes. Life changes.', bg: 'bg-green-500/10', border: 'border-green-500/30', highlight: true },
  { day: 'Day 30', headline: 'My first repeat customer.', sub: "They came back. That's a business.", bg: 'bg-[var(--color-mark-ink)] text-white', border: 'border-[var(--color-mark-ink)]', premium: true },
];

// Card width (md) + gap-8 = 380 + 32 = 412px per step
const CARD_PX = 412;
const N = milestones.length; // 5

export default function S04_TheTransformation() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  // Per-card snap: each card gets equal scroll real-estate with a brief hold at each position
  // 5 cards → 4 transitions. Each transition uses 20% of scroll, 5% hold zones.
  const inputRange  = [0, 0.05, 0.25, 0.3, 0.5, 0.55, 0.75, 0.8, 1.0];
  const outputRange = [
    '0px',
    '0px',
    `-${CARD_PX}px`,
    `-${CARD_PX}px`,
    `-${CARD_PX * 2}px`,
    `-${CARD_PX * 2}px`,
    `-${CARD_PX * 3}px`,
    `-${CARD_PX * 3}px`,
    `-${CARD_PX * 4}px`,
  ];

  const x = useTransform(scrollYProgress, inputRange, outputRange);

  return (
    <section ref={targetRef} className="h-[500vh] relative bg-[var(--color-mark-subtle)]">
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
        
        <div className="pt-24 px-6 md:px-12 shrink-0">
          <ChapterLabel chapter="Chapter 03" label="The Transformation" className="!items-start" />
          <EditorialHeadline text="Watch it happen." size="lg" />
        </div>

        <div className="flex-1 flex items-center relative overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex gap-8 px-6 md:px-12 absolute left-0"
          >
            {milestones.map((m, idx) => (
              <Card key={idx} {...m} index={idx} />
            ))}
          </motion.div>
        </div>

        {/* Dot progress indicator */}
        <div className="shrink-0 pb-8 flex justify-center gap-2">
          {milestones.map((_, idx) => (
            <ProgressDot key={idx} index={idx} scrollYProgress={scrollYProgress} total={N} />
          ))}
        </div>

      </div>
    </section>
  );
}

function ProgressDot({ index, scrollYProgress, total }: { index: number; scrollYProgress: any; total: number }) {
  const stepSize = 1 / (total - 1);
  const center = index * stepSize;
  const active = useTransform(scrollYProgress,
    [Math.max(0, center - stepSize * 0.6), center, Math.min(1, center + stepSize * 0.6)],
    [0, 1, 0]
  );
  const scale = useTransform(active, [0, 1], [1, 1.4]);
  const opacity = useTransform(active, [0, 1], [0.3, 1]);
  return (
    <motion.div
      style={{ scale, opacity }}
      className="w-2 h-2 rounded-full bg-[var(--color-mark-ink)]"
    />
  );
}

function Card({ day, headline, sub, bg, border, highlight, premium, index }: any) {
  const imgPath = `/images/transformation/${day.toLowerCase().replace(' ', '_')}.png`;

  return (
    <div className={`shrink-0 w-[380px] h-[480px] rounded-[2rem] flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_24px_64px_rgba(26,26,24,0.12)] bg-white ${border} border`}>
      {/* Top Visual Area */}
      <div className="h-[200px] w-full relative overflow-hidden bg-black/5 group">
        <Image
          src={imgPath}
          alt={headline}
          fill
          sizes="380px"
          className="object-cover transition-transform duration-700 hover:scale-105"
          loading="lazy"
        />
        {/* Subtle dark gradient overlay at the bottom of the image for better blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        
        {premium && <div className="absolute inset-0 shimmer-sweep" />}
        {highlight && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Confetti simulation using radial gradient background */}
            <div className="w-full h-full bg-[radial-gradient(circle,var(--color-mark-green)_1.5px,transparent_1.5px)] bg-[length:20px_20px] opacity-30" />
          </div>
        )}

        {/* Badge in top-right for Day indication */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest shadow-sm uppercase ${
          premium 
            ? 'bg-amber-500 text-black' 
            : highlight 
              ? 'bg-green-600 text-white' 
              : 'bg-white/95 text-[var(--color-mark-ink)] border border-black/5'
        }`}>
          {day}
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 p-8 flex flex-col justify-end ${premium ? 'bg-[var(--color-mark-ink)] text-white' : 'bg-white text-[var(--color-mark-ink)]'}`}>
        <span className={`text-[10px] font-bold tracking-widest uppercase mb-4 ${premium ? 'text-white/60' : 'text-[var(--color-mark-subtle-text)]'}`}>
          {day}
        </span>
        <h3 className="font-playfair text-2xl md:text-3xl font-bold mb-3 leading-tight">
          {headline}
        </h3>
        <p className={`font-inter text-sm leading-relaxed ${premium ? 'text-white/80' : 'text-[var(--color-mark-secondary)]'}`}>
          {sub}
        </p>
      </div>
    </div>
  );
}
