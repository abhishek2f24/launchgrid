'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface MouseSpotlightCardProps {
  children: React.ReactNode
  className?: string
}

export function MouseSpotlightCard({ children, className }: MouseSpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    // Detect if the device has a mouse (pointer: fine)
    const mediaQuery = window.matchMedia('(pointer: fine)')
    setIsTouchDevice(!mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsTouchDevice(!e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTouchDevice || shouldReduceMotion || !cardRef.current) return

    const { clientX, clientY } = e
    const { left, top } = cardRef.current.getBoundingClientRect()
    setPosition({ x: clientX - left, y: clientY - top })
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glass-card relative overflow-hidden group ${
        isTouchDevice && !shouldReduceMotion ? 'shadow-[0_0_20px_rgba(139,92,246,0.05)] border-violet-500/10' : ''
      } ${className}`}
    >
      {/* Spotlight for Mouse Pointers */}
      {!isTouchDevice && !shouldReduceMotion && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.12), transparent 80%)`,
          }}
        />
      )}

      {/* Pulse fallback glow for Touch/Mobile Devices */}
      {isTouchDevice && !shouldReduceMotion && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] animate-pulse bg-gradient-to-br from-violet-500 to-cyan-500" />
      )}

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
