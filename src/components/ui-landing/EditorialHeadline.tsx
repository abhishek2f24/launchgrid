'use client';

import { motion } from 'framer-motion';

export function EditorialHeadline({
  text,
  size = 'md',
  as: Component = 'h2',
  animate = true,
  /**
   * priority=true → CSS-animated static render (LCP-safe, no JS dependency).
   * Use for the above-the-fold hero headline. Implies animate=false.
   */
  priority = false,
  className = '',
}: {
  text: string;
  size?: 'md' | 'lg' | 'xl';
  as?: any;
  animate?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const sizeClass =
    size === 'xl' ? 'display-xl' :
    size === 'lg' ? 'display-lg' : 'display-md';

  // For multi-line text passed with \n
  const lines = text.split('\n');

  // LCP-safe path: static HTML + CSS keyframe animation (no Framer Motion).
  // Text is visible on first paint; animation plays via CSS without waiting for JS.
  if (priority || !animate) {
    return (
      <Component
        className={`${sizeClass} text-[var(--color-mark-primary)] ${priority ? 'hero-headline' : ''} ${className}`}
      >
        {lines.map((line, i) => (
          <span key={i} className="block">
            {priority
              ? line.split(' ').map((word, wi) => (
                  <span key={wi} className="inline-block mr-[0.25em]">{word}</span>
                ))
              : line}
          </span>
        ))}
      </Component>
    );
  }

  // Word-by-word staggered reveal
  return (
    <Component className={`${sizeClass} text-[var(--color-mark-primary)] ${className}`}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '200px 0px -40px 0px' }}
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            {line.split(' ').map((word, wordIndex) => (
              <motion.span
                key={`${lineIndex}-${wordIndex}`}
                className="inline-block mr-[0.25em]"
                variants={{
                  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', damping: 24, stiffness: 200 } }
                }}
              >
                {word}{' '}
              </motion.span>
            ))}
          </span>
        ))}
      </motion.span>
    </Component>
  );
}
