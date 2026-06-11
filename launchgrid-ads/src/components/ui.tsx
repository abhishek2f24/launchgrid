import React from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion'
import { BRAND } from '../brand'

/** The brand grid mark — same 2×2 mark as the app icon, one mango square. */
export const GridMark: React.FC<{ size?: number }> = ({ size = 120 }) => {
  const cell = size * 0.44
  const gap = size * 0.12
  const r = cell * 0.22
  const sq = (x: number, y: number, mango: boolean) => (
    <div
      key={`${x}${y}`}
      style={{
        position: 'absolute',
        left: x * (cell + gap),
        top: y * (cell + gap),
        width: cell,
        height: cell,
        borderRadius: r,
        background: mango ? BRAND.mango : BRAND.paper,
      }}
    />
  )
  return (
    <div style={{ position: 'relative', width: cell * 2 + gap, height: cell * 2 + gap }}>
      {sq(0, 0, false)}
      {sq(1, 0, false)}
      {sq(0, 1, false)}
      {sq(1, 1, true)}
    </div>
  )
}

/** Lock-screen notification card — the hero element. Springs in, glows. */
export const NotificationCard: React.FC<{
  appearFrame: number
  amount: string
  body: string
  width: number
}> = ({ appearFrame, amount, body, width }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - appearFrame
  if (t < 0) return null

  const pop = spring({ frame: t, fps, config: { damping: 13, stiffness: 160, mass: 0.7 } })
  const y = interpolate(pop, [0, 1], [-40, 0])

  return (
    <div
      style={{
        width,
        transform: `translateY(${y}px) scale(${0.92 + 0.08 * pop})`,
        opacity: pop,
        background: 'rgba(252,251,249,0.96)',
        borderRadius: 28,
        padding: '26px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        boxShadow: '0 24px 80px rgba(255,138,0,0.25), 0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: BRAND.font,
      }}
    >
      <div
        style={{
          width: 64, height: 64, borderRadius: 16, background: BRAND.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <GridMark size={34} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: BRAND.ink }}>LaunchGrid</span>
          <span style={{ fontSize: 20, color: 'rgba(26,26,24,0.45)', fontWeight: 600 }}>now</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: BRAND.ink, marginTop: 4 }}>
          New order — {amount}
        </div>
        <div style={{ fontSize: 24, color: 'rgba(26,26,24,0.6)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {body}
        </div>
      </div>
    </div>
  )
}

/** Standard end card: ink, mark, name, tagline, CTA pill. */
export const EndCard: React.FC<{ startFrame: number; tagline: string }> = ({ startFrame, tagline }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - startFrame
  if (t < 0) return null

  const fade = interpolate(t, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
  const rise = spring({ frame: t, fps, config: { damping: 16, stiffness: 120 } })

  return (
    <AbsoluteFill
      style={{
        background: BRAND.ink,
        opacity: fade,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: BRAND.font,
      }}
    >
      <div style={{ transform: `translateY(${(1 - rise) * 30}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>
        <GridMark size={150} />
        <div style={{ fontSize: 88, fontWeight: 800, color: BRAND.paper, letterSpacing: '-0.02em' }}>LaunchGrid</div>
        <div style={{ fontSize: 40, fontWeight: 600, color: BRAND.textDim, textAlign: 'center', maxWidth: 800, lineHeight: 1.35 }}>
          {tagline}
        </div>
        <div
          style={{
            marginTop: 16, background: BRAND.mango, color: BRAND.ink,
            fontSize: 40, fontWeight: 800, padding: '26px 64px', borderRadius: 999,
          }}
        >
          launchgrid.in — free for 7 days
        </div>
      </div>
    </AbsoluteFill>
  )
}

/** Big centered statement text that fades in and out. */
export const Statement: React.FC<{
  from: number
  to: number
  children: React.ReactNode
  size?: number
  offsetY?: number
}> = ({ from, to, children, size = 76, offsetY = 0 }) => {
  const frame = useCurrentFrame()
  if (frame < from || frame > to) return null
  const opacity = interpolate(frame, [from, from + 10, to - 8, to], [0, 1, 1, 0])
  const y = interpolate(frame, [from, from + 12], [16, 0], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y + offsetY}px)`,
          fontFamily: BRAND.font,
          fontSize: size,
          fontWeight: 800,
          color: BRAND.paper,
          textAlign: 'center',
          maxWidth: 880,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          textShadow: '0 4px 40px rgba(0,0,0,0.6)',
          whiteSpace: 'pre-line',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  )
}
