'use client';

import { useState, useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface MetricTickerProps {
  initialValue: number;
  interval?: number;
  minIncrement?: number;
  maxIncrement?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function MetricTicker({
  initialValue,
  interval = 3000,
  minIncrement = 1,
  maxIncrement = 5,
  prefix = '',
  suffix = '',
  className = ''
}: MetricTickerProps) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Start ticking only when in view
    if (!isInView || shouldReduceMotion) return;

    const timer = setInterval(() => {
      setValue(prev => {
        const increment = Math.floor(Math.random() * (maxIncrement - minIncrement + 1)) + minIncrement;
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isInView, interval, maxIncrement, minIncrement, shouldReduceMotion]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{value.toLocaleString('en-IN')}{suffix}
    </span>
  );
}
