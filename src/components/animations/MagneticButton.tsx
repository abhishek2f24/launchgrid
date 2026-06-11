'use client'

import React, { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  target?: string
}

export function MagneticButton({ children, className, onClick, href, target }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const shouldReduceMotion = useReducedMotion()

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion || !buttonRef.current) return

    const { clientX, clientY } = e
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)

    // Pull factor (0.35)
    setPosition({ x: x * 0.35, y: y * 0.35 })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const springConfig = { type: 'spring' as const, stiffness: 150, damping: 15 }

  const Element = href ? motion.a : motion.button

  return (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      <Element
        href={href}
        target={target}
        onClick={onClick}
        animate={{ x: position.x, y: position.y }}
        transition={springConfig}
        className={`relative inline-flex items-center justify-center cursor-pointer transition-shadow ${className}`}
      >
        {children}
      </Element>
    </div>
  )
}
