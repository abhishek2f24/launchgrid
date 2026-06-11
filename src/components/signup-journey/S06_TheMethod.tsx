'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { methodSteps } from '@/data/landing/content';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';
import { SectionReveal } from '../ui-landing/SectionReveal';

export default function S06_TheMethod() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 30%"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={containerRef} className="py-32 w-full bg-[var(--color-mark-base)] overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        
        <SectionReveal className="text-center mb-24">
          <ChapterLabel chapter="Chapter 05" label="The Method" />
          <EditorialHeadline text={"Your 12-step journey\nfrom idea to income."} size="lg" />
          <p className="font-inter text-[var(--color-mark-secondary)] mt-6 text-lg">
            Every mission has a path.<br/>
            Here's exactly what happens after you click Launch.
          </p>
        </SectionReveal>

        <div className="relative">
          {/* Center SVG Line (Desktop) */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[var(--color-mark-default)] -translate-x-1/2" />
          <motion.div 
            style={{ scaleY }}
            className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-[var(--color-mark-ink)] -translate-x-1/2 origin-top"
          />

          <div className="flex flex-col gap-6 md:gap-12 relative z-10">
            {methodSteps.map((step, idx) => {
              const isLeft = idx % 2 === 0;
              return <StepCard key={step.id} step={step} isLeft={isLeft} index={idx} />;
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

function StepCard({ step, isLeft, index }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: isLeft ? 30 : -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`w-full md:w-1/2 pl-12 md:pl-0 flex ${isLeft ? 'md:pr-12 md:justify-end' : 'md:ml-auto md:pl-12 md:justify-start'} relative group`}
    >
      {/* Node indicator */}
      <div className={`absolute top-6 w-3 h-3 rounded-full border-2 border-[var(--color-mark-ink)] bg-white left-[10px] md:left-auto ${isLeft ? 'md:-right-[6px]' : 'md:-left-[6px]'} transition-colors duration-300 ${expanded ? 'bg-[var(--color-mark-ink)]' : 'bg-white'}`} />
      
      {/* Horizontal Connector Line (Desktop) */}
      <div className={`hidden md:block absolute top-[29px] h-px bg-[var(--color-mark-default)] w-8 ${isLeft ? 'right-0' : 'left-0'}`} />

      <div 
        onClick={() => setExpanded(!expanded)}
        className="bg-white border border-[var(--color-mark-default)] shadow-[0_1px_3px_rgba(26,26,24,0.06)] rounded-2xl w-full md:max-w-[320px] overflow-hidden cursor-pointer hover:border-[var(--color-mark-strong)] transition-colors"
      >
        <div className="p-5 flex items-center gap-4">
          <span className="font-inter text-xs font-bold text-[var(--color-mark-muted)] tracking-widest">{step.id}</span>
          <span className="font-inter font-bold text-[var(--color-mark-ink)] flex-1">{step.mission}</span>
          <svg className={`w-4 h-4 text-[var(--color-mark-muted)] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 pb-5 font-inter text-sm"
            >
              <div className="pt-4 border-t border-[var(--color-mark-default)] flex flex-col gap-4">
                <div className="border-l-2 border-[var(--color-mark-red)] pl-3">
                  <span className="text-[10px] font-bold text-[var(--color-mark-muted)] tracking-widest uppercase block mb-1">Pain</span>
                  <span className="text-[var(--color-mark-secondary)]">{step.pain}</span>
                </div>
                <div className="border-l-2 border-[var(--color-mark-ink)] pl-3">
                  <span className="text-[10px] font-bold text-[var(--color-mark-muted)] tracking-widest uppercase block mb-1">Solution</span>
                  <span className="text-[var(--color-mark-ink)] font-medium">{step.solution}</span>
                </div>
                <div className="border-l-2 border-[var(--color-mark-green)] pl-3">
                  <span className="text-[10px] font-bold text-[var(--color-mark-muted)] tracking-widest uppercase block mb-1">Outcome</span>
                  <span className="text-[var(--color-mark-green)] font-medium">{step.outcome}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
