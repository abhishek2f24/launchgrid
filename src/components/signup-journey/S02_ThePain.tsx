'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { painCards } from '@/data/landing/content';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';
import { SectionReveal } from '../ui-landing/SectionReveal';

export default function S02_ThePain() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 25%"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="py-32 w-full bg-[var(--color-mark-subtle)] relative z-20">
      <div className="max-w-5xl mx-auto px-6">
        <SectionReveal className="text-center mb-24">
          <ChapterLabel chapter="Chapter 02" label="The Reality" />
          <EditorialHeadline text="Every founder hits the same walls." size="lg" />
        </SectionReveal>

        <div ref={containerRef} className="flex flex-col items-center gap-8 md:gap-16 relative">
          {/* Vertical dashed line connecting cards */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] pointer-events-none hidden md:block">
            {/* Gray background dashed line */}
            <div className="absolute inset-0 border-l-2 border-dashed border-neutral-300/40" />
            {/* Animated foreground dark dashed line */}
            <motion.div 
              style={{ scaleY }}
              className="absolute inset-0 border-l-2 border-dashed border-[var(--color-mark-ink)] origin-top overflow-hidden"
            />
          </div>

          {painCards.map((card, idx) => {
            const isOdd = idx % 2 !== 0;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: isOdd ? 48 : -48, y: 24 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
                className={`w-full max-w-lg relative ${isOdd ? 'md:ml-auto md:pl-16' : 'md:mr-auto md:pr-16'}`}
              >
                <div className="bg-white/70 backdrop-blur-md border border-[var(--color-mark-default)] rounded-2xl p-8 shadow-[0_4px_16px_rgba(26,26,24,0.08)] hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(26,26,24,0.1)] transition-all cursor-pointer">
                  <span className="font-playfair text-[var(--color-mark-secondary)] opacity-50 text-xl block mb-4">
                    {card.id}
                  </span>
                  <h3 className="font-inter font-bold text-lg text-[var(--color-mark-ink)] mb-2">
                    {card.title}
                  </h3>
                  <p className="font-inter text-[var(--color-mark-secondary)] text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
