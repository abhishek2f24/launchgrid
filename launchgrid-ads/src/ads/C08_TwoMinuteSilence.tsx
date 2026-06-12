import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, random, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'
import { GridMark } from '../components/ui'
import {
  AnimatedBackdrop, Burst, CameraRig, DriftParticles, GlowBurst, Grain, GridFloor,
  KineticWords, LightSweep, Ticker, whipIn, whipOut,
} from '../components/cinema'
import { EndCardCinematic } from '../components/EndCardCinematic'

/**
 * Ad #8 — "The 2-Minute Silence" (15s, 9:16, 30fps = 450 frames)
 * Negative-space hook: near-black, a whisper of text, a dying countdown —
 * then ONE ping detonates the frame and the dashboard floods in at speed.
 *
 * ACT 1 · THE SILENCE (0–151)
 *   0–138  near-black, but never still: grain crawls, a faint mango pulse
 *          breathes, slow camera drift, dust motes
 *   10–96  tiny dim text "This is how long your excuse lasts." (whisper-size)
 *   24–134 dim countdown 2:00 → 0:00 ticking down (soft tick every beat,
 *          digits flicker slightly — a dying clock)
 *   108    riser building under the last seconds
 *   138    THE PING — white flash, shockwave ring, massive glow + burst,
 *          shake 1.6, the countdown shatters
 *   152    WHIP UP (8f, motion blur) → the noise
 *
 * ACT 2 · THE NOISE (152–299)
 *   160    dashboard lands (impact) — grid floor rushing, cards whip past
 *          vertically at three depths the whole act
 *   166–222 revenue graph explodes upward with a glowing head
 *   188 / 206 / 220 / 230 / 238  pings, gaps shrinking — speed ramp
 *   246    "While you went quiet, they went live." — kinetic
 *   300    WHIP → end card
 *
 * ACT 3 · END CARD (308–450)
 *   logo assembly + "Start louder." (accent: louder)
 */

const TEXT_FROM = 10
const COUNT_FROM = 24
const COUNT_TO = 134
const PING = 138
const WHIP_1 = 152
const GRAPH_IN = 166
const PINGS = [188, 206, 220, 230, 238]
const WHIP_2 = 300
const END = 308

/** The dying countdown — dim, flickering, ticking 2:00 → 0:00. */
const DyingCountdown: React.FC = () => {
  const frame = useCurrentFrame()
  if (frame < COUNT_FROM || frame > PING) return null
  const secs = Math.ceil(interpolate(frame, [COUNT_FROM, COUNT_TO], [120, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }))
  const mm = Math.floor(secs / 60)
  const ss = String(secs % 60).padStart(2, '0')
  const flicker = 0.55 + Math.sin(frame * 0.7) * 0.08 + (random(`fl-${Math.floor(frame / 3)}`) - 0.5) * 0.12
  const lastTen = secs <= 10
  const shatter = interpolate(frame, [PING, PING + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute', top: 980, width: '100%', textAlign: 'center',
        opacity: flicker * (1 - shatter),
        transform: `scale(${1 + shatter * 1.6}) translateY(${Math.sin(frame * 0.04) * 4}px)`,
        filter: shatter > 0 ? `blur(${shatter * 18}px)` : undefined,
        fontFamily: BRAND.font,
      }}
    >
      <div
        style={{
          fontSize: 150, fontWeight: 200, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
          color: lastTen ? 'rgba(255,138,0,0.8)' : 'rgba(250,249,247,0.5)',
          textShadow: lastTen ? '0 0 60px rgba(255,138,0,0.35)' : '0 0 40px rgba(250,249,247,0.1)',
        }}
      >
        {mm}:{ss}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'rgba(250,249,247,0.3)', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 6 }}>
        still thinking about it
      </div>
    </div>
  )
}

/** Expanding shockwave ring fired by the ping. */
const Shockwave: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < 0 || t > 30) return null
  const p = interpolate(t, [0, 30], [0, 1], { easing: Easing.out(Easing.cubic) })
  const size = 80 + p * 1700
  return (
    <div
      style={{
        position: 'absolute', left: 540 - size / 2, top: 960 - size / 2,
        width: size, height: size, borderRadius: '50%',
        border: `${Math.max(2, 14 * (1 - p))}px solid rgba(255,138,0,${(1 - p) * 0.9})`,
        boxShadow: `0 0 ${90 * (1 - p)}px rgba(255,138,0,${(1 - p) * 0.6})`,
        pointerEvents: 'none',
      }}
    />
  )
}

/** Act-2 dashboard cards whipping past vertically at a given depth — endless montage. */
const WhipCards: React.FC<{ depth: number; seed: string; x: number; landed: number }> = ({ depth, seed, x, landed }) => {
  const frame = useCurrentFrame()
  const t = frame - landed
  if (t < 0) return null
  const labels: [string, string][] = [
    ['New order', '₹1,299'], ['Visitors', '+86'], ['New order', '₹549'], ['Stock synced', '✓'],
    ['New order', '₹2,150'], ['UPI received', '✓'], ['New order', '₹799'], ['5★ review', 'Ananya'],
  ]
  const speed = 14 + depth * 22
  const H = 2300
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {labels.map(([label, value], i) => {
        const y0 = random(`${seed}-y${i}`) * H
        const y = ((y0 - t * speed) % H + H) % H - 180
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x + Math.sin(frame * 0.03 + i * 2) * 14 * depth, top: y,
              transform: `scale(${0.5 + depth * 0.5})`,
              opacity: 0.3 + depth * 0.6,
              filter: depth < 0.65 ? 'blur(3px)' : 'blur(0.5px)',
              background: 'rgba(30,30,28,0.88)', border: '1.5px solid rgba(255,138,0,0.3)',
              borderRadius: 20, padding: '16px 26px', fontFamily: BRAND.font,
              boxShadow: '0 16px 50px rgba(0,0,0,0.5)', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 600, color: BRAND.textDim }}>{label} </span>
            <span style={{ fontSize: 26, fontWeight: 800, color: BRAND.paper }}>{value}</span>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/** The exploding graph — steeper than Ad02's, draws in half the time. */
const ExplodingGraph: React.FC<{ landed: number }> = ({ landed }) => {
  const frame = useCurrentFrame()
  const W = 780, H = 380
  const ys = [356, 348, 330, 336, 296, 268, 232, 176, 120, 36]
  const dx = W / (ys.length - 1)
  const headX = interpolate(frame, [landed, landed + 46], [0, W], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  })
  const i = Math.min(ys.length - 2, Math.floor(headX / dx))
  const headY = ys[i] + (ys[i + 1] - ys[i]) * ((headX - i * dx) / dx)
  const line = ys.map((y, j) => `${j === 0 ? 'M' : 'L'} ${j * dx} ${y}`).join(' ')
  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="c08area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,138,0,0.38)" />
            <stop offset="100%" stopColor="rgba(255,138,0,0)" />
          </linearGradient>
          <clipPath id="c08reveal"><rect x="0" y="-40" width={headX} height={H + 80} /></clipPath>
        </defs>
        <g clipPath="url(#c08reveal)">
          <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#c08area)" />
          <path d={line} fill="none" stroke={BRAND.mango} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {headX > 2 && (
          <circle cx={headX} cy={headY} r={14 + Math.sin(frame * 0.6) * 3} fill={BRAND.mango}
            style={{ filter: 'drop-shadow(0 0 26px rgba(255,138,0,0.95))' }} />
        )}
      </svg>
      {headX > 10 && headX < W && Array.from({ length: 6 }).map((_, k) => {
        const ph = ((frame * (1.6 + k * 0.4) + k * 31) % 54) / 54
        return (
          <div key={k} style={{
            position: 'absolute', left: headX - 6 + Math.sin(frame * 0.35 + k * 2) * 20,
            top: headY - ph * 130, width: 5, height: 5, borderRadius: 5,
            background: BRAND.mango, opacity: (1 - ph) * 0.85,
          }} />
        )
      })}
    </div>
  )
}

export const C08: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.018) * 5

  // act-1 faint pulse, breathing faster as the countdown dies
  const pulseRate = interpolate(frame, [0, COUNT_TO], [0.05, 0.16], { extrapolateRight: 'clamp' })
  const pulse = 0.05 + (Math.sin(frame * pulseRate) + 1) * 0.045
  const flash = interpolate(frame, [PING, PING + 2, PING + 14], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // tick frames — countdown beat shrinks as it runs out
  const ticks: number[] = []
  for (let f = COUNT_FROM; f < COUNT_TO; f += f < 100 ? 14 : 8) ticks.push(f)

  const pingCard = spring({ frame: Math.max(0, frame - PING), fps, config: { damping: 11, stiffness: 190, mass: 0.7 } })

  return (
    <AbsoluteFill style={{ background: '#070706', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE SILENCE ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          {/* near-black, but alive: breathing pulse */}
          <AbsoluteFill style={{ background: '#070706' }}>
            <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 52%, rgba(255,138,0,${pulse}) 0%, transparent 70%)` }} />
          </AbsoluteFill>
          <DriftParticles count={14} seed="silence" color="rgba(255,255,255,0.3)" />

          <CameraRig push={[0, WHIP_1, 1.04, 1.16]} hits={[{ f: PING, s: 1.6 }]} driftAmp={10}>
            {/* the whisper */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 700 }}>
              <KineticWords
                from={TEXT_FROM} to={PING - 2}
                text="This is how long your excuse lasts."
                size={40} weight={600} color="rgba(250,249,247,0.55)" accentWords={[5]} stagger={5} maxWidth={760}
              />
            </AbsoluteFill>

            <DyingCountdown />

            {/* THE PING — one notification detonates the dark */}
            {frame >= PING && (
              <div
                style={{
                  position: 'absolute', left: '50%', top: 860, width: 840,
                  transform: `translateX(-50%) scale(${0.7 + pingCard * 0.3})`,
                  opacity: Math.min(1, pingCard * 2),
                  background: 'rgba(252,251,249,0.97)', borderRadius: 28, padding: '26px 30px',
                  display: 'flex', alignItems: 'center', gap: 22,
                  boxShadow: '0 0 140px rgba(255,138,0,0.6), 0 24px 80px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 16, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GridMark size={34} />
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: BRAND.ink }}>New order — ₹1,499</div>
                  <div style={{ fontSize: 24, color: 'rgba(26,26,24,0.6)', fontWeight: 600 }}>Someone else's store. Right now.</div>
                </div>
              </div>
            )}

            <Shockwave at={PING} />
            <GlowBurst at={PING} x={540} y={940} color="rgba(255,138,0,0.6)" size={1700} hold={34} />
            <Burst at={PING} x={540} y={920} count={26} seed="det" spread={520} />
          </CameraRig>

          {/* white detonation flash above everything */}
          <AbsoluteFill style={{ background: '#FFF6EA', opacity: flash * 0.85, pointerEvents: 'none' }} />
          <Grain opacity={0.12} />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE NOISE ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.14)" />
          <GridFloor speed={5} opacity={0.16} />

          {/* cards whipping past at three depths — far behind, mid, near front */}
          <WhipCards depth={0.5} seed="far" x={90} landed={WHIP_1 + 6} />
          <WhipCards depth={0.8} seed="mid" x={620} landed={WHIP_1 + 10} />

          <CameraRig
            push={[WHIP_1, WHIP_2, 1.0, 1.14]}
            hits={[{ f: WHIP_1 + 8, s: 0.8 }, ...PINGS.map((f, i) => ({ f, s: 0.5 + i * 0.12 }))]}
            driftAmp={6}
          >
            {/* graph card with 3D orbit */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div
                style={{
                  transform: `rotateY(${camY}deg) rotateX(2.5deg) translateY(-80px)`,
                  background: 'rgba(24,24,22,0.92)', borderRadius: 36,
                  border: '1.5px solid rgba(255,138,0,0.25)',
                  padding: '40px 46px 32px',
                  boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 90px rgba(255,138,0,0.12)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, width: 780 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: BRAND.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>While you waited</div>
                    <Ticker from={GRAPH_IN + 6} duration={56} value={12940} size={72} />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: BRAND.green }}>▲ live</div>
                </div>
                <ExplodingGraph landed={GRAPH_IN} />
              </div>
            </AbsoluteFill>

            {/* speed-ramp ping bursts */}
            {PINGS.map((f, i) => (
              <React.Fragment key={i}>
                <GlowBurst at={f} x={300 + i * 130} y={520 + (i % 2) * 980} color="rgba(255,138,0,0.35)" size={800} />
                <Burst at={f} x={300 + i * 130} y={520 + (i % 2) * 980} count={10 + i * 2} seed={`np${i}`} spread={240} />
              </React.Fragment>
            ))}

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 260 }}>
              <KineticWords from={246} to={WHIP_2} text="While you went quiet, they went live." size={58} accentWords={[6]} maxWidth={880} />
            </AbsoluteFill>
          </CameraRig>

          <WhipCards depth={1} seed="near" x={330} landed={WHIP_1 + 14} />
          <LightSweep period={110} delay={WHIP_1 + 14} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Start louder." accentWords={[1]} />

      {/* ============ SOUND DESIGN ============ */}
      {ticks.map((f, i) => (
        <Sequence key={`t${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.22 + (f / COUNT_TO) * 0.2} />
        </Sequence>
      ))}
      <Sequence from={PING - 30} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={PING} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={1} />
      </Sequence>
      <Sequence from={PING} durationInFrames={18}>
        <Audio src={staticFile('impact.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.75} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {PINGS.map((f, i) => (
        <Sequence key={`p${i}`} from={f} durationInFrames={32}>
          <Audio src={staticFile('ping.wav')} volume={0.75 - i * 0.08} />
        </Sequence>
      ))}
      <Sequence from={WHIP_2 - 28} durationInFrames={30}>
        <Audio src={staticFile('riser.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
