'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedCounter } from '../ui-landing/AnimatedCounter';
import { SectionReveal } from '../ui-landing/SectionReveal';

export default function S03_TheReality() {
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 65%", "end 35%"]
  });

  return (
    <section className="py-32 w-full bg-[var(--color-mark-base)] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Phase 1: The Stat */}
        <SectionReveal className="text-center mb-40 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="font-playfair text-[clamp(6rem,12vw,12rem)] tracking-tighter leading-none text-[var(--color-mark-ink)] mb-4"
          >
            <AnimatedCounter value={80} suffix="%" duration={1.8} />
          </motion.div>
          
          <h2 className="font-playfair italic text-2xl md:text-4xl text-[var(--color-mark-ink)] mb-6">
            of people with business ideas<br/>never launch.
          </h2>
          
          <p className="font-inter text-[var(--color-mark-secondary)] max-w-md mx-auto text-sm md:text-base leading-relaxed">
            Not because the market wasn't right.
            Not because the timing was off.
            Because the path was invisible.
          </p>
        </SectionReveal>

        {/* Phase 2: Timeline Collapse */}
        <div ref={timelineRef} className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          
          {/* Left: Old Way */}
          <div className="flex flex-col items-center">
            <h3 className="font-inter font-bold tracking-widest uppercase text-xs text-[var(--color-mark-secondary)] opacity-60 mb-12">The Old Way</h3>
            
            <div className="relative flex flex-col gap-10 pl-4 w-60">
              {/* Animated Dashed Line */}
              <div className="absolute left-[5px] top-3 bottom-4 w-[2px] pointer-events-none">
                <div className="absolute inset-0 border-l-2 border-dashed border-neutral-300/40" />
                <motion.div 
                  style={{ height: useTransform(scrollYProgress, [0, 0.95], ['0%', '100%']) }}
                  className="absolute inset-0 border-l-2 border-dashed border-red-500 overflow-hidden"
                />
              </div>

              <NodeRow text="Idea" index={0} scrollYProgress={scrollYProgress} isOldWay />
              <NodeRow text="Research" index={1} scrollYProgress={scrollYProgress} isOldWay />
              <NodeRow text="More Research" index={2} scrollYProgress={scrollYProgress} isOldWay />
              <NodeRow text="More YouTube Videos" index={3} scrollYProgress={scrollYProgress} isOldWay />
              <NodeRow text="Give Up" index={4} scrollYProgress={scrollYProgress} isOldWay isSpecial />
            </div>
          </div>

          {/* Right: LaunchGrid Way */}
          <div className="flex flex-col items-center">
            <h3 className="font-inter font-bold tracking-widest uppercase text-xs text-[var(--color-mark-green)] mb-12">The LaunchGrid Way</h3>
            
            <div className="relative flex flex-col gap-10 pl-4 w-60">
              {/* Animated Solid Line */}
              <div className="absolute left-[5px] top-3 bottom-4 w-[2px] pointer-events-none">
                <div className="absolute inset-0 bg-neutral-200/50 rounded-full" />
                <motion.div 
                  style={{ height: useTransform(scrollYProgress, [0, 0.95], ['0%', '100%']) }}
                  className="absolute inset-0 bg-[var(--color-mark-green)] rounded-full"
                />
              </div>

              <NodeRow text="Idea" index={0} scrollYProgress={scrollYProgress} />
              <NodeRow text="LaunchGrid" index={1} scrollYProgress={scrollYProgress} />
              <NodeRow text="Store Live" index={2} scrollYProgress={scrollYProgress} />
              <NodeRow text="First Visitor" index={3} scrollYProgress={scrollYProgress} />
              <NodeRow text="First Sale" index={4} scrollYProgress={scrollYProgress} isSpecial />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

function NodeRow({ 
  text, 
  index, 
  scrollYProgress, 
  isOldWay = false, 
  isSpecial = false 
}: { 
  text: string; 
  index: number; 
  scrollYProgress: any; 
  isOldWay?: boolean; 
  isSpecial?: boolean; 
}) {
  const threshold = index * 0.25;
  
  // Opacity transitions around the threshold
  const opacity = useTransform(scrollYProgress, 
    [Math.max(0, threshold - 0.08), Math.min(1, threshold + 0.08)], 
    [isOldWay ? 0.35 : 0.2, 1]
  );
  
  const scale = useTransform(scrollYProgress, 
    [Math.max(0, threshold - 0.08), Math.min(1, threshold + 0.08)], 
    [0.95, 1.05]
  );

  if (isSpecial) {
    return (
      <motion.div style={{ opacity, scale }} className="relative pl-10 flex items-center min-h-[32px]">
        <div className={`absolute left-0 w-8 h-8 rounded-full -translate-x-[15px] flex items-center justify-center z-10 shadow-sm ${
          isOldWay ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-[var(--color-mark-green)] text-white'
        }`}>
          <span className="font-bold text-sm leading-none">{isOldWay ? '✕' : '✓'}</span>
        </div>
        <span className={`font-playfair italic text-lg font-bold ${
          isOldWay ? 'text-[var(--color-mark-secondary)]' : 'text-[var(--color-mark-ink)]'
        }`}>
          {text}
        </span>
      </motion.div>
    );
  }

  const isBrand = !isOldWay && index === 1; // LaunchGrid node
  
  return (
    <motion.div style={{ opacity, scale }} className="relative pl-10 flex items-center min-h-[24px]">
      <div className={`absolute left-0 w-3.5 h-3.5 rounded-full -translate-x-[6px] border bg-white flex items-center justify-center z-10 ${
        isOldWay 
          ? 'border-neutral-300 bg-neutral-100' 
          : isBrand 
            ? 'border-[var(--color-mark-ink)] bg-[var(--color-mark-ink)] scale-125' 
            : 'border-[var(--color-mark-green)] bg-[var(--color-mark-green)]'
      }`} />
      <span className={`font-inter text-sm font-bold ${
        isOldWay ? 'text-[var(--color-mark-secondary)] opacity-85' : 'text-[var(--color-mark-ink)]'
      }`}>
        {text}
      </span>
    </motion.div>
  );
}
