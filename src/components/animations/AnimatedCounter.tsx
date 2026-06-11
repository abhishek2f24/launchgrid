'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}

export function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.5, decimals = 0 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isInView) return

    if (shouldReduceMotion) {
      setDisplayValue(value)
      return
    }

    let start = 0
    const end = value
    const totalMiliseconds = duration * 1000
    const steps = 60
    const stepDuration = totalMiliseconds / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      // Ease out quad
      const easeProgress = progress * (2 - progress)
      
      const currentVal = easeProgress * end
      
      if (currentStep >= steps) {
        clearInterval(timer)
        setDisplayValue(end)
      } else {
        setDisplayValue(currentVal)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [isInView, value, duration, shouldReduceMotion])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {displayValue.toLocaleString('en-IN', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}
      {suffix}
    </span>
  )
}
