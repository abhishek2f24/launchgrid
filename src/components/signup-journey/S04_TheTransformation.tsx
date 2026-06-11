'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';

const milestones = [
  {
    day: 'Day 1',
    headline: 'I have an idea.',
    sub: 'Excited but overwhelmed. No idea where to start.',
    border: 'border-black/5',
  },
  {
    day: 'Day 2',
    headline: 'My store is live.',
    sub: 'Powered by LaunchGrid. You pick a niche. We build it.',
    border: 'border-black/10',
  },
  {
    day: 'Day 7',
    headline: 'My first visitor.',
    sub: 'Someone found you. Real traffic. Real people.',
    border: 'border-amber-500/20',
  },
  {
    day: 'Day 14',
    headline: 'My first sale. ₹1,299.',
    sub: 'The notification hits. Your phone buzzes. Life changes.',
    border: 'border-green-500/30',
    highlight: true,
  },
  {
    day: 'Day 30',
    headline: 'My first repeat customer.',
    sub: "They came back. That's a business.",
    border: 'border-[var(--color-mark-ink)]',
    premium: true,
  },
] as const;

type Milestone = (typeof milestones)[number];

const N          = milestones.length;  // 5
const ANGLE_STEP = 26;                 // degrees between adjacent cards on the wheel
const RADIUS     = 800;                // wheel radius in px
const HUB_BELOW  = RADIUS - 380;      // px the hub sits below the sticky-div bottom
const D2R        = Math.PI / 180;

export default function S04_TheTransformation() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  // Equal-step scroll positions for each card snap
  const stops  = milestones.map((_, i) => i / (N - 1));       // [0, .25, .5, .75, 1]
  const angles = milestones.map((_, i) => -i * ANGLE_STEP);   // [0, -26, -52, -78, -104]

  // Wheel angle: rotates counter-clockwise to bring next card to top
  const wheelAngle = useTransform(scrollYProgress, stops, angles);

  return (
    <section ref={targetRef} className="h-[200vh] relative bg-[var(--color-mark-subtle)]">
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">

        {/* Section header */}
        <div className="pt-24 px-6 md:px-12 shrink-0">
          <ChapterLabel chapter="Chapter 03" label="The Transformation" className="!items-start" />
          <EditorialHeadline text="Watch it happen." size="lg" />
        </div>

        {/*
          Wheel viewport — overflow:hidden clips off-screen cards.
          Hub anchor: w-0 h-0 centered horizontally, positioned HUB_BELOW px
          below the sticky div's bottom edge. Cards at 0° (active) sit RADIUS px
          above the hub → ≈ vertical center of the visible area.
        */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="absolute left-1/2 w-0 h-0"
            style={{ bottom: `-${HUB_BELOW}px` }}
          >
            {milestones.map((m, idx) => (
              <WheelCard
                key={idx}
                milestone={m}
                index={idx}
                wheelAngle={wheelAngle}
              />
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="shrink-0 pb-8 flex justify-center gap-2">
          {milestones.map((_, idx) => (
            <ProgressDot
              key={idx}
              index={idx}
              scrollYProgress={scrollYProgress}
              total={N}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

// ── WheelCard ─────────────────────────────────────────────────────────────────

function WheelCard({
  milestone,
  index,
  wheelAngle,
}: {
  milestone: Milestone;
  index: number;
  wheelAngle: MotionValue<number>;
}) {
  const cardFixedAngle = index * ANGLE_STEP;

  // Absolute angle of this card = wheel rotation + card's fixed slot
  const absAngle = useTransform(wheelAngle, (wa) => wa + cardFixedAngle);

  // XY position on the arc (relative to hub center)
  const x = useTransform(absAngle, (a) => RADIUS * Math.sin(a * D2R));
  const y = useTransform(absAngle, (a) => -RADIUS * Math.cos(a * D2R));

  // Counter-rotate so card faces always stay upright as the wheel turns
  const rotate = useTransform(absAngle, (a) => -a);

  // Visual prominence: active card (near 0°) is full-size; distant cards shrink & fade
  const scale = useTransform(absAngle, (a) => Math.max(0.4, 1 - Math.abs(a) * 0.012));
  const opacity = useTransform(absAngle, (a) => {
    const d = Math.abs(a);
    return d > 70 ? 0 : Math.max(0.2, 1 - d * 0.018);
  });
  const zIndex = useTransform(absAngle, (a) => Math.round(100 - Math.abs(a)));

  const { day, headline, sub } = milestone;
  const highlight = 'highlight' in milestone && milestone.highlight;
  const premium   = 'premium'   in milestone && milestone.premium;
  const imgPath   = `/images/transformation/${day.toLowerCase().replace(' ', '_')}.png`;

  const dayBadgeClass = premium
    ? 'bg-amber-500 text-black'
    : highlight
    ? 'bg-green-600 text-white'
    : 'bg-white/95 text-[var(--color-mark-ink)] border border-black/5';

  return (
    <motion.div
      className="absolute"
      style={{ x, y, rotate, scale, opacity, zIndex }}
    >
      {/*
        Separate inner element translates -50% to center the card on the orbit
        point rather than anchoring top-left. Keeps transforms on distinct elements.
      */}
      <div style={{ transform: 'translate(-50%, -50%)' }}>
        <div
          className={`w-[290px] h-[400px] rounded-[2rem] flex flex-col overflow-hidden border bg-white
            ${milestone.border} shadow-[0_8px_40px_rgba(26,26,24,0.10)]`}
        >
          {/* Image */}
          <div className="h-[180px] w-full relative overflow-hidden bg-black/5">
            <Image
              src={imgPath}
              alt={headline}
              fill
              sizes="290px"
              className="object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            {highlight && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle,var(--color-mark-green)_1.5px,transparent_1.5px)] bg-[length:20px_20px] opacity-30" />
              </div>
            )}
            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest shadow-sm uppercase ${dayBadgeClass}`}>
              {day}
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 p-7 flex flex-col justify-end ${premium ? 'bg-[var(--color-mark-ink)] text-white' : 'bg-white text-[var(--color-mark-ink)]'}`}>
            <span className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${premium ? 'text-white/60' : 'text-[var(--color-mark-subtle-text)]'}`}>
              {day}
            </span>
            <h3 className="font-playfair text-2xl font-bold mb-2 leading-tight">
              {headline}
            </h3>
            <p className={`font-inter text-sm leading-relaxed ${premium ? 'text-white/80' : 'text-[var(--color-mark-secondary)]'}`}>
              {sub}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── ProgressDot ───────────────────────────────────────────────────────────────

function ProgressDot({
  index,
  scrollYProgress,
  total,
}: {
  index: number;
  scrollYProgress: MotionValue<number>;
  total: number;
}) {
  const stepSize = 1 / (total - 1);
  const center   = index * stepSize;
  const active   = useTransform(
    scrollYProgress,
    [Math.max(0, center - stepSize * 0.6), center, Math.min(1, center + stepSize * 0.6)],
    [0, 1, 0],
  );
  const dotScale   = useTransform(active, [0, 1], [1, 1.5]);
  const dotOpacity = useTransform(active, [0, 1], [0.3, 1]);

  return (
    <motion.div
      style={{ scale: dotScale, opacity: dotOpacity }}
      className="w-2 h-2 rounded-full bg-[var(--color-mark-ink)]"
    />
  );
}
