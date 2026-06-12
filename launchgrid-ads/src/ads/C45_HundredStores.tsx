import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, random, Sequence, staticFile,
  useCurrentFrame, useVideoConfig, spring,
} from 'remotion'
import { BRAND } from '../brand'
import {
  AnimatedBackdrop, Burst, CameraRig, DriftParticles, GlowBurst, Grain,
  KineticWords, LightSweep, Ticker, whipIn, whipOut,
} from '../components/cinema'
import { EndCardCinematic } from '../components/EndCardCinematic'

/**
 * Ad #45 — "100 Stores Time-lapse" (15s, 9:16, 30fps = 450 frames)
 * A dark satellite-night view of India lighting up city by city. Each dot
 * = a store that went live this month. Honest counter: exactly 100.
 *
 * ACT 1 · THE WHISPER (0–77)
 *   6–70   hook "Last month, across India…" — one lone dot pulses in the dark
 *   50     riser builds under the hook
 *   78     WHIP UP → the map
 *
 * ACT 2 · THE CONSTELLATION (78–299)
 *   86     India outline draws on (impact when it lands), camera push starts
 *   108–239 city dots pop, gaps shrinking 14→3 frames (speed ramp):
 *          first 8 cities get a soft ping each (descending volume),
 *          the rest tick by on key.wav as the cascade accelerates
 *   118+   constellation lines connect lit cities, drawing between dots
 *   112–242 Ticker counts 0 → 100 ("stores launched this month")
 *   210–256 anonymous filler dots shimmer on between the named cities
 *   242    counter hits 100 — punch, glow burst, mango burst
 *   256–298 PULL-BACK: map scales away, bloom up — it glows like a night sky
 *   262    "India is launching." kinetic line
 *   300    WHIP → end card
 *
 * ACT 3 · END CARD (308–450)
 *   logo assembly + "India is launching. Join it." + CTA sweep
 */

const WHIP_1 = 78
const MAP_LAND = 86
const COUNT_FROM = 112
const COUNT_DONE = 242
const PULL = 256
const WHIP_2 = 300
const END = 308

// Simplified India outline (stylized constellation map), 600×700 space
const OUTLINE: [number, number][] = [
  [200, 30], [250, 60], [230, 110], [290, 150], [370, 190], [430, 200],
  [470, 180], [560, 170], [545, 215], [555, 270], [495, 250], [470, 290],
  [430, 330], [390, 400], [350, 470], [330, 540], [310, 600], [300, 640],
  [285, 600], [270, 520], [255, 450], [240, 390], [220, 350], [175, 320],
  [120, 300], [90, 270], [130, 250], [110, 220], [150, 190], [160, 120],
  [180, 70],
]
const OUTLINE_PATH = OUTLINE.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z'

// Named cities — pop in with gaps shrinking 14→3 frames (musical accelerando)
const CITY_GAPS = [14, 12, 11, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3]
const CITY_POS: [number, number][] = [
  [230, 160], // Delhi
  [215, 350], // Mumbai
  [290, 500], // Bengaluru
  [300, 400], // Hyderabad
  [340, 490], // Chennai
  [455, 280], // Kolkata
  [235, 380], // Pune
  [160, 280], // Ahmedabad
  [200, 200], // Jaipur
  [300, 210], // Lucknow
  [180, 310], // Surat
  [240, 270], // Indore
  [300, 310], // Nagpur
  [370, 230], // Patna
  [280, 570], // Kochi
  [500, 220], // Guwahati
  [260, 250], // Bhopal
  [290, 540], // Coimbatore
  [380, 370], // Visakhapatnam
  [210, 110], // Ludhiana
]
const CITIES = CITY_POS.map((p, i) => ({
  x: p[0], y: p[1],
  f: 108 + CITY_GAPS.slice(0, i).reduce((a, b) => a + b, 0),
}))

// Constellation edges between nearby lit cities
const EDGES: [number, number][] = [
  [0, 8], [0, 9], [8, 7], [7, 1], [1, 6], [6, 3], [3, 2], [2, 4], [2, 17],
  [17, 14], [3, 18], [18, 5], [5, 13], [13, 9], [0, 19], [11, 16], [12, 3],
]

/** A city dot: pops with overshoot, breathes a glow halo forever after. */
const CityDot: React.FC<{ x: number; y: number; at: number; big?: boolean }> = ({ x, y, at, big }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } })
  const r = (big ? 7.5 : 5.5) * sp
  const halo = (big ? 26 : 18) * (0.8 + Math.sin(frame * 0.11 + at) * 0.2)
  return (
    <g>
      <circle cx={x} cy={y} r={halo * sp} fill="rgba(255,160,40,0.12)" />
      <circle cx={x} cy={y} r={r} fill={BRAND.mango} style={{ filter: 'drop-shadow(0 0 10px rgba(255,138,0,0.9))' }} />
      <circle cx={x} cy={y} r={r * 0.45} fill="#FFE9C2" />
    </g>
  )
}

export const C45: React.FC = () => {
  const frame = useCurrentFrame()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)

  // map outline draw-on (normalized via pathLength)
  const draw = interpolate(frame, [MAP_LAND, MAP_LAND + 30], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  })

  // the final pull-back — map recedes into a night sky
  const pull = interpolate(frame, [PULL, PULL + 42], [1, 0.8], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  })
  const bloom = interpolate(frame, [PULL, PULL + 36], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // camera hits: first dots punch hard, later ones soft; counter-done slams
  const hits2 = [
    { f: MAP_LAND, s: 0.8 },
    ...CITIES.slice(0, 6).map((c, i) => ({ f: c.f, s: 0.5 - i * 0.06 })),
    { f: COUNT_DONE, s: 1.1 },
  ]

  // anonymous filler dots — jittered around named cities, shimmer in late
  const fillers = Array.from({ length: 42 }).map((_, i) => {
    const base = CITY_POS[Math.floor(random(`f-c${i}`) * CITY_POS.length)]
    return {
      x: base[0] + (random(`f-x${i}`) - 0.5) * 56,
      y: base[1] + (random(`f-y${i}`) - 0.5) * 56,
      f: 200 + Math.floor(random(`f-t${i}`) * 56),
    }
  })

  const litCount = CITIES.filter((c) => c.f <= frame).length

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE WHISPER ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor="rgba(60,60,95,0.20)" />
          <DriftParticles count={22} seed="c45night" color="rgba(255,200,120,0.45)" />
          <CameraRig push={[0, WHIP_1, 1.0, 1.1]} hits={[{ f: 10, s: 0.45 }]} driftAmp={7}>
            {/* one lone dot pulsing in the dark */}
            <div
              style={{
                position: 'absolute', left: 540, top: 1100, width: 18, height: 18, borderRadius: 9,
                transform: 'translate(-50%,-50%)', background: BRAND.mango,
                boxShadow: `0 0 ${50 + Math.sin(frame * 0.22) * 24}px rgba(255,138,0,0.9)`,
                opacity: interpolate(frame, [8, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}
            />
            <div
              style={{
                position: 'absolute', left: 540, top: 1100, width: 240, height: 240, borderRadius: '50%',
                transform: `translate(-50%,-50%) scale(${0.4 + ((frame % 50) / 50) * 1.1})`,
                border: '2px solid rgba(255,138,0,0.5)', opacity: Math.max(0, 0.6 - ((frame % 50) / 50) * 0.6),
              }}
            />
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 430 }}>
              <KineticWords from={6} to={WHIP_1} text="Last month, across India…" size={68} accentWords={[3]} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 460 }}>
              <KineticWords from={34} to={WHIP_1} text="something switched on." size={46} weight={600} color={BRAND.textDim} stagger={3} />
            </AbsoluteFill>
          </CameraRig>
          <LightSweep period={140} delay={12} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE CONSTELLATION ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop base="#07070B" glowColor="rgba(255,138,0,0.08)" />
          <DriftParticles count={26} seed="c45stars" color="rgba(255,220,160,0.5)" />

          {/* night-sky bloom behind the map, blooms hard on the pull-back */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(60% 42% at 50% 46%, rgba(255,138,0,${0.06 + litCount * 0.004 + bloom * 0.14}) 0%, transparent 70%)`,
            }}
          />

          <CameraRig push={[WHIP_1, PULL, 1.02, 1.16]} hits={hits2} driftAmp={6}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${pull})` }}>
              <div style={{ position: 'relative', transform: `translateY(-40px) rotate(${Math.sin(frame * 0.012) * 0.8}deg)` }}>
                <svg width={880} height={1027} viewBox="0 0 600 700" style={{ overflow: 'visible' }}>
                  {/* outline draws on, then glows */}
                  <path
                    d={OUTLINE_PATH} fill="rgba(255,138,0,0.04)"
                    stroke="rgba(255,170,60,0.85)" strokeWidth={2.4} strokeLinejoin="round"
                    pathLength={1} strokeDasharray={1} strokeDashoffset={draw}
                    style={{ filter: `drop-shadow(0 0 ${10 + bloom * 26}px rgba(255,138,0,0.55))` }}
                  />
                  {/* constellation lines — appear once both endpoints are lit */}
                  {EDGES.map(([a, b], i) => {
                    const ca = CITIES[a], cb = CITIES[b]
                    const start = Math.max(ca.f, cb.f) + 5
                    const p = interpolate(frame, [start, start + 14], [0, 1], {
                      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
                    })
                    if (p <= 0) return null
                    return (
                      <line
                        key={i} x1={ca.x} y1={ca.y}
                        x2={ca.x + (cb.x - ca.x) * p} y2={ca.y + (cb.y - ca.y) * p}
                        stroke="rgba(255,170,60,0.4)" strokeWidth={1.6}
                      />
                    )
                  })}
                  {/* anonymous filler dots */}
                  {fillers.map((d, i) =>
                    frame >= d.f ? (
                      <circle
                        key={`fl${i}`} cx={d.x} cy={d.y} r={2.6}
                        fill="rgba(255,200,120,0.85)"
                        opacity={0.5 + Math.sin(frame * 0.17 + i * 2.3) * 0.4}
                      />
                    ) : null
                  )}
                  {/* the 20 named city dots */}
                  {CITIES.map((c, i) => (
                    <CityDot key={i} x={c.x} y={c.y} at={c.f} big={i < 6} />
                  ))}
                </svg>
              </div>
            </AbsoluteFill>

            {/* honest counter card */}
            {frame >= COUNT_FROM - 6 && (
              <div
                style={{
                  position: 'absolute', left: '50%', top: 222, transform: 'translateX(-50%)',
                  textAlign: 'center',
                  background: 'rgba(24,24,22,0.88)', border: '1.5px solid rgba(255,138,0,0.35)',
                  borderRadius: 26, padding: '22px 52px',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 60px rgba(255,138,0,0.10)',
                  opacity: interpolate(frame, [COUNT_FROM - 6, COUNT_FROM], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.textDim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Stores launched this month
                </div>
                <Ticker from={COUNT_FROM} duration={COUNT_DONE - COUNT_FROM} value={100} prefix="" size={92} color={BRAND.mango} />
              </div>
            )}

            {/* counter hits 100 */}
            <GlowBurst at={COUNT_DONE} x={540} y={330} color="rgba(255,138,0,0.45)" size={1100} />
            <Burst at={COUNT_DONE} x={540} y={320} count={18} seed="c45hundred" spread={340} />

            {/* the closing line over the glowing map */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 250 }}>
              <KineticWords from={PULL + 6} to={WHIP_2} text="India is launching." size={70} accentWords={[2]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={130} delay={WHIP_1 + 18} strength={0.05} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="India is launching. Join it." accentWords={[3]} />

      {/* ============ SOUND DESIGN ============ */}
      <Sequence from={WHIP_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={MAP_LAND} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {/* first 8 cities: tiny pings, descending volume — musical accelerando */}
      {CITIES.slice(0, 8).map((c, i) => (
        <Sequence key={`p${i}`} from={c.f} durationInFrames={30}>
          <Audio src={staticFile('ping.wav')} volume={0.34 - i * 0.025} />
        </Sequence>
      ))}
      {/* remaining cities tick by on key.wav as the cascade accelerates */}
      {CITIES.slice(8).map((c, i) => (
        <Sequence key={`k${i}`} from={c.f} durationInFrames={5}>
          <Audio src={staticFile('key.wav')} volume={0.42} />
        </Sequence>
      ))}
      <Sequence from={COUNT_DONE - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={COUNT_DONE} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
