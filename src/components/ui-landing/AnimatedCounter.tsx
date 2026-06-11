'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // margin '100px' = trigger 100px BEFORE entering viewport → no stale-hidden risk
  const isInView = useInView(ref, { once: true, margin: '100px' });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    mass: 1,
  });

  // Animate to value whenever it enters view (once)
  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  // Update the DOM text on every spring frame
  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        const formatted = Intl.NumberFormat('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest);
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, decimals]);

  // SSR renders the real value so the page shows correct numbers before JS.
  // suppressHydrationWarning because the client immediately overwrites to 0
  // then springs up — a minor visual difference React doesn't need to warn about.
  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}
      {Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)}
      {suffix}
    </span>
  );
}
