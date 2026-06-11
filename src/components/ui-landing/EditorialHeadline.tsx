'use client';

import { motion } from 'framer-motion';

export function EditorialHeadline({
  text,
  size = 'md',
  as: Component = 'h2',
  animate = true,
  className = '',
}: {
  text: string;
  size?: 'md' | 'lg' | 'xl';
  as?: any;
  animate?: boolean;
  className?: string;
}) {
  const sizeClass = 
    size === 'xl' ? 'display-xl' :
    size === 'lg' ? 'display-lg' : 'display-md';

  // For multi-line text passed with \n
  const lines = text.split('\n');

  if (!animate) {
    return (
      <Component className={`${sizeClass} text-[var(--color-mark-primary)] ${className}`}>
        {lines.map((line, i) => (
          <span key={i} className="block">{line}</span>
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
