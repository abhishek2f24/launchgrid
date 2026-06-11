'use client';

import { motion, useScroll } from 'framer-motion';

export function ProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[var(--color-mark-ink)] z-[60] origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
