import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'
import { DriftParticles, Grain, KineticWords, LightSweep } from './cinema'

/**
 * End card with life in it: the 4 grid squares fly in from off-screen
 * (mango lands last, with a ping), wordmark rises out of a mask, tagline
 * staggers word-by-word, CTA pill springs in and gets a light sweep.
 * Background = slow-rotating conic glow + drifting particles + grain.
 * Timing is relative to `startFrame`.
 */
export const EndCardCinematic: React.FC<{
  startFrame: number
  tagline: string
  accentWords?: number[]
}> = ({ startFrame, tagline, accentWords = [] }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - startFrame
  if (t < 0) return null

  const conic = t * 0.5
  const push = interpolate(t, [0, 135], [1.05, 1.0], {
    extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  })

  // 4 squares: paper×3 then the mango one slams in at t=18
  const cell = 76, gap = 18, r = 18
  const squares = [
    { x: 0, y: 0, mango: false, at: 2, fromX: -700, fromY: -500 },
    { x: 1, y: 0, mango: false, at: 7, fromX: 700, fromY: -400 },
    { x: 0, y: 1, mango: false, at: 12, fromX: -700, fromY: 500 },
    { x: 1, y: 1, mango: true, at: 18, fromX: 800, fromY: 700 },
  ]

  const mangoLand = spring({ frame: Math.max(0, t - 18), fps, config: { damping: 12, stiffness: 170 } })
  const logoPunch = interpolate(t, [18, 21, 32], [0, 0.05, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  const cta = spring({ frame: Math.max(0, t - 64), fps, config: { damping: 13, stiffness: 140 } })
  const ctaGlow = 0.35 + Math.sin(t * 0.16) * 0.18

  return (
    <AbsoluteFill style={{ fontFamily: BRAND.font, opacity: interpolate(t, [0, 6], [0, 1], { extrapolateRight: 'clamp' }) }}>
      {/* BG layer — rotating conic glow, never flat */}
      <AbsoluteFill style={{ background: BRAND.ink }}>
        <AbsoluteFill
          style={{
            background: `conic-gradient(from ${conic}deg at 50% 42%, rgba(255,138,0,0.13), transparent 30%, rgba(70,70,110,0.12) 55%, transparent 75%, rgba(255,138,0,0.13))`,
            filter: 'blur(40px)',
          }}
        />
      </AbsoluteFill>
      <DriftParticles count={18} seed="end" color="rgba(255,170,60,0.6)" />

      {/* MID layer — assembling mark + type */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${push + logoPunch})` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 }}>
          <div style={{ position: 'relative', width: cell * 2 + gap, height: cell * 2 + gap }}>
            {squares.map((s, i) => {
              const sp = spring({ frame: Math.max(0, t - s.at), fps, config: { damping: 13, stiffness: 150, mass: 0.8 } })
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: s.x * (cell + gap), top: s.y * (cell + gap),
                    width: cell, height: cell, borderRadius: r,
                    background: s.mango ? BRAND.mango : BRAND.paper,
                    transform: `translate(${(1 - sp) * s.fromX}px, ${(1 - sp) * s.fromY}px) rotate(${(1 - sp) * 120}deg)`,
                    opacity: Math.min(1, sp * 2),
                    boxShadow: s.mango ? `0 0 ${60 * mangoLand}px rgba(255,138,0,0.55)` : undefined,
                  }}
                />
              )
            })}
          </div>

          {/* Wordmark rises out of a mask */}
          <div style={{ overflow: 'hidden', padding: '0 20px' }}>
            <div
              style={{
                fontSize: 96, fontWeight: 800, color: BRAND.paper, letterSpacing: '-0.02em',
                transform: `translateY(${(1 - spring({ frame: Math.max(0, t - 26), fps, config: { damping: 15, stiffness: 110 } })) * 120}px)`,
              }}
            >
              LaunchGrid
            </div>
          </div>

          <KineticWords from={startFrame + 40} text={tagline} size={44} weight={600} color={BRAND.textDim} accentWords={accentWords} maxWidth={860} stagger={3} />

          {/* CTA pill with breathing glow + sweep */}
          <div
            style={{
              marginTop: 10, position: 'relative', overflow: 'hidden',
              background: BRAND.mango, color: BRAND.ink,
              fontSize: 42, fontWeight: 800, padding: '28px 66px', borderRadius: 999,
              transform: `translateY(${(1 - cta) * 70}px) scale(${0.9 + cta * 0.1})`,
              opacity: cta,
              boxShadow: `0 12px 70px rgba(255,138,0,${ctaGlow})`,
            }}
          >
            launchgrid.in — free for 7 days
            <div
              style={{
                position: 'absolute', top: -20, bottom: -20, width: 90,
                left: interpolate(t, [80, 104], [-140, 700], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                transform: 'rotate(16deg)',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
              }}
            />
          </div>
        </div>
      </AbsoluteFill>

      <LightSweep period={130} delay={startFrame + 30} strength={0.06} />
      <Grain opacity={0.06} />

      {/* mango square lands → brand ping */}
      <Sequence from={startFrame + 18} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.7} />
      </Sequence>
    </AbsoluteFill>
  )
}
