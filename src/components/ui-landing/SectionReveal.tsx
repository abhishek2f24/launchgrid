'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

export function SectionReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '200px 0px -40px 0px' }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
