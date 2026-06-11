'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface RevealTextProps {
  text: string
  className?: string
}

export function RevealText({ text, className }: RevealTextProps) {
  const shouldReduceMotion = useReducedMotion()
  const words = text.split(' ')

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  }

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 350,
        damping: 25,
      },
    },
  }

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`inline-block ${className}`}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          variants={wordVariants}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}
