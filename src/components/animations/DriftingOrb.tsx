'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface DriftingOrbProps {
  className?: string
  color?: string
}

export function DriftingOrb({ className, color = 'bg-primary/10' }: DriftingOrbProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      style={{ willChange: 'transform' }}
      animate={
        shouldReduceMotion
          ? {}
          : {
              x: [0, 40, -30, 0],
              y: [0, -30, 40, 0],
              scale: [1, 1.12, 0.95, 1],
            }
      }
      transition={
        shouldReduceMotion
          ? {}
          : {
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
      className={`absolute rounded-full blur-[130px] pointer-events-none ${color} ${className}`}
    />
  )
}
