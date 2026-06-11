import React from 'react'
import {
  AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'

/**
 * The 5-layer cinema kit. Every ad scene = Background (AnimatedBackdrop/GridFloor)
 * + Midground (cards) + Foreground (DriftParticles/Grain/LightSweep) + CameraRig
 * + sound cues placed in the ad file. Nothing here is ever static.
 */

export type Hit = { f: number; s?: number }

/** Additive scale spike — the "zoom punch". Peaks 2–3 frames after the hit. */
export const punchAmt = (frame: number, punches: Hit[]) => {
  let v = 0
  for (const p of punches) {
    const t = frame - p.f
    if (t >= 0 && t < 16) {
      v += interpolate(t, [0, 2.5, 16], [0, p.s ?? 0.07, 0], {
        easing: Easing.out(Easing.cubic),
      })
    }
  }
  return v
}

/** Decaying screen shake after each hit. Deterministic (sin-based). */
export const shakeAmt = (frame: number, hits: Hit[]) => {
  let x = 0, y = 0, r = 0
  for (const h of hits) {
    const t = frame - h.f
    if (t >= 0 && t < 14) {
      const decay = ((1 - t / 14) ** 2) * (h.s ?? 1)
      x += Math.sin(t * 3.1 + h.f) * 13 * decay
      y += Math.cos(t * 2.7 + h.f * 0.73) * 9 * decay
      r += Math.sin(t * 2.2 + h.f * 0.31) * 0.45 * decay
    }
  }
  return { x, y, r }
}

/**
 * Camera layer: continuous push-in + lazy drift, plus zoom punches and shake
 * on every hit. Wrap a whole act in this so the frame is never still.
 */
export const CameraRig: React.FC<{
  push?: [from: number, to: number, scaleFrom: number, scaleTo: number]
  hits?: Hit[]
  driftAmp?: number
  children: React.ReactNode
}> = ({ push = [0, 450, 1, 1.06], hits = [], driftAmp = 8, children }) => {
  const frame = useCurrentFrame()
  const base = interpolate(frame, [push[0], push[1]], [push[2], push[3]], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  })
  const punch = punchAmt(frame, hits)
  const { x, y, r } = shakeAmt(frame, hits)
  const driftX = Math.sin(frame * 0.013) * driftAmp
  const driftY = Math.cos(frame * 0.009) * driftAmp * 0.7
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x + driftX}px, ${y + driftY}px) rotate(${r}deg) scale(${base + punch})`,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

/** Film grain — re-seeded turbulence every 2 frames so it crawls like stock. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame()
  const seed = Math.floor(frame / 2)
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none', mixBlendMode: 'overlay' }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  )
}

/** Diagonal light band sweeping across the frame on a loop. */
export const LightSweep: React.FC<{
  period?: number
  delay?: number
  strength?: number
}> = ({ period = 150, delay = 0, strength = 0.1 }) => {
  const frame = useCurrentFrame()
  const t = ((frame - delay) % period + period) % period
  const x = interpolate(t, [0, period * 0.45], [-1400, 2400], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  })
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', top: -400, left: x, width: 360, height: 2800,
          transform: 'rotate(18deg)',
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${strength}), transparent)`,
        }}
      />
    </AbsoluteFill>
  )
}

/** Floating dust motes with per-particle depth → parallax against camera drift. */
export const DriftParticles: React.FC<{
  count?: number
  seed?: string
  color?: string
}> = ({ count = 26, seed = 'dust', color = 'rgba(255,255,255,0.5)' }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const depth = 0.3 + random(`${seed}-d${i}`) * 0.7 // 1 = near
        const x0 = random(`${seed}-x${i}`) * 1080
        const speed = 0.35 + depth * 0.9
        const y = ((random(`${seed}-y${i}`) * 2100 - frame * speed) % 2100 + 2100) % 2100 - 90
        const sway = Math.sin(frame * 0.02 + i * 1.7) * 22 * depth
        const size = 2 + depth * 5
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x0 + sway, top: y,
              width: size, height: size, borderRadius: '50%',
              background: color, opacity: 0.12 + depth * 0.3,
              filter: depth < 0.55 ? 'blur(2px)' : undefined,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/** Radial particle burst from a point — fires once at `at`. */
export const Burst: React.FC<{
  at: number
  x: number
  y: number
  count?: number
  color?: string
  seed?: string
  spread?: number
}> = ({ at, x, y, count = 14, color = BRAND.mango, seed = 'burst', spread = 280 }) => {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < 0 || t > 28) return null
  const p = interpolate(t, [0, 28], [0, 1], { easing: Easing.out(Easing.cubic) })
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const ang = random(`${seed}-a${i}-${at}`) * Math.PI * 2
        const dist = (0.4 + random(`${seed}-r${i}-${at}`) * 0.6) * spread * p
        const size = 4 + random(`${seed}-s${i}-${at}`) * 9
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(ang) * dist,
              top: y + Math.sin(ang) * dist - p * 40,
              width: size, height: size * (0.6 + p),
              borderRadius: size, background: color,
              opacity: (1 - p) * 0.9,
              transform: `rotate(${ang}rad)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/** Radial glow that flashes at `at` then breathes out. */
export const GlowBurst: React.FC<{
  at: number
  x: number
  y: number
  color?: string
  size?: number
  hold?: number
}> = ({ at, x, y, color = 'rgba(255,138,0,0.4)', size = 900, hold = 40 }) => {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < 0 || t > hold) return null
  const o = interpolate(t, [0, 3, hold], [0, 1, 0], { easing: Easing.out(Easing.quad) })
  const s = interpolate(t, [0, hold], [0.7, 1.35])
  return (
    <div
      style={{
        position: 'absolute', left: x - size / 2, top: y - size / 2,
        width: size, height: size, pointerEvents: 'none',
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
        opacity: o, transform: `scale(${s})`,
      }}
    />
  )
}

/** Words slide up out of a blur, staggered — kinetic typography entrance. */
export const KineticWords: React.FC<{
  from: number
  to?: number
  text: string
  size?: number
  color?: string
  weight?: number
  stagger?: number
  maxWidth?: number
  accentWords?: number[]
}> = ({ from, to, text, size = 72, color = BRAND.paper, weight = 800, stagger = 4, maxWidth = 900, accentWords = [] }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = text.split(' ')
  const exit = to !== undefined
    ? interpolate(frame, [to - 8, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0
  if (frame < from || (to !== undefined && frame > to)) return null
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        columnGap: size * 0.28, rowGap: size * 0.1, maxWidth,
        fontFamily: BRAND.font, fontSize: size, fontWeight: weight,
        lineHeight: 1.18, letterSpacing: '-0.02em', textAlign: 'center',
        opacity: 1 - exit,
        transform: `translateY(${exit * -26}px)`,
        filter: exit > 0 ? `blur(${exit * 6}px)` : undefined,
      }}
    >
      {words.map((w, i) => {
        const t = frame - from - i * stagger
        const sp = spring({ frame: Math.max(0, t), fps, config: { damping: 14, stiffness: 130 } })
        const blur = interpolate(t, [0, 9], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              color: accentWords.includes(i) ? BRAND.mango : color,
              opacity: sp,
              transform: `translateY(${(1 - sp) * 46}px)`,
              filter: `blur(${blur}px)`,
              textShadow: '0 6px 44px rgba(0,0,0,0.55)',
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}

/** Count-up number with eased ramp; pops slightly while moving. */
export const Ticker: React.FC<{
  from: number
  duration: number
  value: number
  prefix?: string
  size?: number
  color?: string
}> = ({ from, duration, value, prefix = '₹', size = 64, color = BRAND.paper }) => {
  const frame = useCurrentFrame()
  const t = Math.max(0, frame - from)
  const p = interpolate(t, [0, duration], [0, 1], {
    extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  })
  const moving = p > 0 && p < 1
  const pop = moving ? 1 + Math.sin(frame * 0.9) * 0.012 : 1
  const n = Math.round(value * p)
  return (
    <span
      style={{
        fontFamily: BRAND.font, fontVariantNumeric: 'tabular-nums',
        fontSize: size, fontWeight: 800, color,
        display: 'inline-block', transform: `scale(${pop})`,
        letterSpacing: '-0.02em',
      }}
    >
      {prefix}{n.toLocaleString('en-IN')}
    </span>
  )
}

/** Slow-breathing animated gradient backdrop — never a flat color. */
export const AnimatedBackdrop: React.FC<{
  base?: string
  glowColor?: string
}> = ({ base = '#0B0B0A', glowColor = 'rgba(255,138,0,0.10)' }) => {
  const frame = useCurrentFrame()
  const gx = 50 + Math.sin(frame * 0.011) * 22
  const gy = 36 + Math.cos(frame * 0.008) * 14
  const g2x = 50 - Math.sin(frame * 0.007) * 30
  return (
    <AbsoluteFill style={{ background: base }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(90% 60% at ${gx}% ${gy}%, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 50% at ${g2x}% 92%, rgba(70,70,110,0.16) 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  )
}

/** Perspective grid floor scrolling toward camera — depth for dashboard scenes. */
export const GridFloor: React.FC<{ speed?: number; opacity?: number }> = ({ speed = 2.2, opacity = 0.16 }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ perspective: 900, pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', left: -800, right: -800, top: '58%', height: 1600,
          transform: 'rotateX(62deg)', transformOrigin: 'top center',
          backgroundImage:
            `linear-gradient(rgba(255,138,0,${opacity}) 1.5px, transparent 1.5px),` +
            `linear-gradient(90deg, rgba(255,138,0,${opacity}) 1.5px, transparent 1.5px)`,
          backgroundSize: '110px 110px',
          backgroundPosition: `0px ${frame * speed}px`,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 75%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 75%)',
        }}
      />
    </AbsoluteFill>
  )
}

/**
 * Whip transition wrapper. Acts A→B: during the window, A flies off (dir) with
 * motion blur and B flies in from the opposite side. Use two of these.
 */
export const whipOut = (frame: number, start: number, dur = 8) => {
  const p = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic),
  })
  return { y: -p * 1900, blur: p * 26, opacity: 1 - p * 0.4 }
}
export const whipIn = (frame: number, start: number, dur = 8) => {
  const p = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  })
  return { y: (1 - p) * 1900, blur: (1 - p) * 26, opacity: 0.6 + p * 0.4 }
}
