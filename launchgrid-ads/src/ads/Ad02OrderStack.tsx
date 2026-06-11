import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile,
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
 * Ad #2 — "Another Order" (15s, 9:16, 30fps = 450 frames)
 * Performance-marketing cut: the frame never rests longer than ~25 frames.
 *
 * ACT 1 · THE NIGHT (0–163)
 *   0–47   dark room mood, clock 11:43 PM, dust, light sweep, camera push
 *   48     ORDER 1 ₹1,299 — punch, shake, glow, burst, ping+impact
 *   78     ORDER 2 ₹849 — stack pushes down · counter appears
 *   104    ORDER 3 ₹2,150   (gaps shrink: 30→26→22→18 — speed ramp)
 *   126    ORDER 4 ₹599
 *   144    ORDER 5 ₹1,799 — riser already building underneath
 *   164    WHIP UP (8f, motion blur) → Act 2
 *
 * ACT 2 · THE GRAPH (164–305)
 *   172    dashboard lands (impact) — grid floor, orbiting camera
 *   176–236 revenue line draws with glowing head, sparkles rise
 *   200+   floating stat chips parallax in at three depths
 *   292    line hits peak — punch, mango burst
 *   298    WHIP → end card
 *
 * ACT 3 · END CARD (304–450)
 *   logo squares fly in (mango lands last + ping), wordmark mask-rise,
 *   tagline staggers, CTA pill + light sweep. Conic glow rotates throughout.
 */

const ORDERS = [
  { f: 48, amount: 1299, name: 'Priya', item: 'Kurta Set (Blue)' },
  { f: 78, amount: 849, name: 'Rahul', item: 'Jhumka Earrings' },
  { f: 104, amount: 2150, name: 'Sneha', item: 'Silk Dupatta ×2' },
  { f: 126, amount: 599, name: 'Arjun', item: 'Phone Grip — Marble' },
  { f: 144, amount: 1799, name: 'Meera', item: 'Tote Bag (Canvas)' },
]
const WHIP_1 = 164
const PEAK = 292
const WHIP_2 = 298
const END = 304

/** One order card in the stack. Springs in from above; pushed down + dimmed by later arrivals. */
const OrderCard: React.FC<{ idx: number }> = ({ idx }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const o = ORDERS[idx]
  const t = frame - o.f
  if (t < 0) return null

  const enter = spring({ frame: t, fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })
  // every later order shoves this card down a slot
  let pushY = 0, depth = 0
  for (let j = idx + 1; j < ORDERS.length; j++) {
    const tj = frame - ORDERS[j].f
    if (tj >= 0) {
      pushY += spring({ frame: tj, fps, config: { damping: 14, stiffness: 160 } }) * 168
      depth += 1
    }
  }
  const dim = Math.max(0.45, 1 - depth * 0.18)
  const scale = (0.94 + 0.06 * enter) * Math.max(0.86, 1 - depth * 0.035)

  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 0,
        width: 860,
        transform: `translateX(-50%) translateY(${(enter - 1) * 340 + pushY}px) scale(${scale}) rotate(${(1 - enter) * -5}deg)`,
        opacity: Math.min(1, enter * 1.6) * Math.max(0.3, 1 - depth * 0.16),
        filter: `brightness(${dim}) ${depth > 1 ? `blur(${depth}px)` : ''}`,
        zIndex: 100 - depth,
        background: 'rgba(252,251,249,0.97)',
        borderRadius: 28, padding: '24px 28px',
        display: 'flex', alignItems: 'center', gap: 22,
        boxShadow: '0 24px 80px rgba(255,138,0,0.22), 0 10px 36px rgba(0,0,0,0.55)',
        fontFamily: BRAND.font,
      }}
    >
      <div style={{ width: 62, height: 62, borderRadius: 16, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <GridMark size={32} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: BRAND.ink }}>LaunchGrid</span>
          <span style={{ fontSize: 19, color: 'rgba(26,26,24,0.45)', fontWeight: 600 }}>now</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: BRAND.ink, marginTop: 2 }}>
          New order — ₹{o.amount.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 23, color: 'rgba(26,26,24,0.6)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {o.name} ordered {o.item}
        </div>
      </div>
    </div>
  )
}

/** Act 2 revenue graph — line draws with a glowing head, sparkles rise off it. */
const RevenueGraph: React.FC<{ landed: number }> = ({ landed }) => {
  const frame = useCurrentFrame()
  const W = 800, H = 400
  const ys = [368, 344, 352, 318, 326, 286, 296, 238, 252, 168, 56]
  const dx = W / (ys.length - 1)
  const headX = interpolate(frame, [landed + 4, landed + 64], [0, W], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  })
  const i = Math.min(ys.length - 2, Math.floor(headX / dx))
  const headY = ys[i] + (ys[i + 1] - ys[i]) * ((headX - i * dx) / dx)
  const line = ys.map((y, j) => `${j === 0 ? 'M' : 'L'} ${j * dx} ${y}`).join(' ')

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,138,0,0.35)" />
            <stop offset="100%" stopColor="rgba(255,138,0,0)" />
          </linearGradient>
          <clipPath id="reveal"><rect x="0" y="-40" width={headX} height={H + 80} /></clipPath>
        </defs>
        <g clipPath="url(#reveal)">
          <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#area)" />
          <path d={line} fill="none" stroke={BRAND.mango} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {headX > 2 && (
          <circle cx={headX} cy={headY} r={13 + Math.sin(frame * 0.5) * 2.5} fill={BRAND.mango}
            style={{ filter: 'drop-shadow(0 0 24px rgba(255,138,0,0.9))' }} />
        )}
      </svg>
      {/* sparkles rising off the head while it draws */}
      {headX > 10 && headX < W && Array.from({ length: 5 }).map((_, k) => {
        const ph = ((frame * (1.4 + k * 0.35) + k * 37) % 60) / 60
        return (
          <div key={k} style={{
            position: 'absolute', left: headX - 6 + Math.sin(frame * 0.3 + k * 2) * 18,
            top: headY - ph * 110, width: 5, height: 5, borderRadius: 5,
            background: BRAND.mango, opacity: (1 - ph) * 0.8,
          }} />
        )
      })}
    </div>
  )
}

/** Floating stat chip at a parallax depth. */
const StatChip: React.FC<{
  at: number; x: number; y: number; depth: number; camY: number
  label: string; value: string
}> = ({ at, x, y, depth, camY, label, value }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 130 } })
  const bob = Math.sin(frame * 0.045 + at) * 9 * depth
  return (
    <div
      style={{
        position: 'absolute', left: x + camY * depth * 22, top: y + bob,
        transform: `translateY(${(1 - sp) * 90}px) scale(${0.55 + depth * 0.45})`,
        opacity: sp * (0.55 + depth * 0.45),
        filter: depth < 0.7 ? 'blur(1.5px)' : undefined,
        background: 'rgba(30,30,28,0.85)', border: '1.5px solid rgba(255,138,0,0.35)',
        borderRadius: 22, padding: '20px 30px', fontFamily: BRAND.font,
        boxShadow: '0 18px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 600, color: BRAND.textDim }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: BRAND.paper, marginTop: 2 }}>{value}</div>
    </div>
  )
}

export const Ad02OrderStack: React.FC = () => {
  const frame = useCurrentFrame()
  const hits1 = ORDERS.map((o, i) => ({ f: o.f, s: 0.75 + i * 0.1 }))
  const arrived = ORDERS.filter((o) => o.f <= frame)
  const total = ORDERS.reduce((s, o) => {
    const t = frame - o.f
    return t < 0 ? s : s + o.amount * Math.min(1, t / 8)
  }, 0)

  const clockDim = interpolate(frame, [48, 70], [1, 0.28], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const clockScale = interpolate(frame, [48, 70], [1, 0.82], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.02) * 5 // act-2 orbit, degrees

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE NIGHT ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor="rgba(60,60,95,0.22)" />
          {/* warm glow breathing brighter with each order */}
          <AbsoluteFill
            style={{
              opacity: interpolate(frame, [ORDERS[0].f, ORDERS[0].f + 6, ORDERS[4].f], [0, 0.55, 0.95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              background: 'radial-gradient(80% 46% at 50% 42%, rgba(255,138,0,0.20) 0%, transparent 70%)',
            }}
          />
          <DriftParticles count={24} seed="night" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.1]} hits={hits1} driftAmp={7}>
            {/* clock — dims and shrinks once orders start */}
            <div style={{ position: 'absolute', top: 200, width: '100%', textAlign: 'center', opacity: clockDim, transform: `scale(${clockScale})` }}>
              <div style={{ fontSize: 132, fontWeight: 200, color: BRAND.paper, letterSpacing: '0.02em' }}>11:43</div>
              <div style={{ fontSize: 34, fontWeight: 600, color: BRAND.textDim, marginTop: 6 }}>Tuesday night</div>
            </div>

            {/* hook lines */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 430 }}>
              <KineticWords from={14} to={46} text="You're asleep." size={64} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 430 }}>
              <KineticWords from={58} to={130} text="Your store isn't." size={64} accentWords={[1]} />
            </AbsoluteFill>

            {/* running total — appears once the 2nd order lands */}
            {frame >= ORDERS[1].f && (
              <div style={{ position: 'absolute', top: 470, width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: BRAND.textDim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tonight</div>
                <Ticker from={ORDERS[1].f} duration={ORDERS[4].f - ORDERS[1].f + 14} value={6696} size={86} color={BRAND.mango} />
              </div>
            )}

            {/* the stack */}
            <AbsoluteFill style={{ top: 700 }}>
              {ORDERS.map((_, i) => <OrderCard key={i} idx={i} />)}
            </AbsoluteFill>

            {/* per-order glow + particle bursts */}
            {ORDERS.map((o, i) => (
              <React.Fragment key={i}>
                <GlowBurst at={o.f} x={540} y={800} color="rgba(255,138,0,0.35)" size={1100} />
                <Burst at={o.f} x={540} y={760} count={12 + i * 2} seed={`o${i}`} />
              </React.Fragment>
            ))}
          </CameraRig>

          <LightSweep period={160} delay={16} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE GRAPH ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <GridFloor />
          <DriftParticles count={18} seed="dash" color="rgba(255,170,60,0.55)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.12]} hits={[{ f: WHIP_1 + 8, s: 0.7 }, { f: PEAK, s: 1.15 }]} driftAmp={6}>
            {/* graph card — floats with a slight 3D orbit */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div
                style={{
                  transform: `rotateY(${camY}deg) rotateX(2.5deg) translateY(-60px)`,
                  background: 'rgba(24,24,22,0.92)', borderRadius: 36,
                  border: '1.5px solid rgba(255,138,0,0.25)',
                  padding: '44px 50px 36px',
                  boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 90px rgba(255,138,0,0.12)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 26, width: 800 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: BRAND.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>This week</div>
                    <Ticker from={WHIP_1 + 14} duration={66} value={38400} size={76} />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: BRAND.green }}>▲ 212%</div>
                </div>
                <RevenueGraph landed={WHIP_1 + 8} />
              </div>
            </AbsoluteFill>

            {/* floating stat chips at three depths */}
            <StatChip at={WHIP_1 + 36} x={70} y={330} depth={1} camY={camY} label="Orders tonight" value="5" />
            <StatChip at={WHIP_1 + 50} x={660} y={420} depth={0.6} camY={camY} label="Visitors" value="214" />
            <StatChip at={WHIP_1 + 64} x={120} y={1310} depth={0.8} camY={camY} label="Conversion" value="4.2%" />

            {/* peak moment */}
            <GlowBurst at={PEAK} x={540} y={760} color="rgba(255,138,0,0.5)" size={1300} />
            <Burst at={PEAK} x={760} y={680} count={22} seed="peak" spread={380} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 250 }}>
              <KineticWords from={WHIP_1 + 80} to={WHIP_2} text="Your store doesn't sleep." size={66} accentWords={[3]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={120} delay={WHIP_1 + 20} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Your store. Live in 15 minutes." accentWords={[4]} />

      {/* ============ SOUND DESIGN ============ */}
      {ORDERS.map((o, i) => (
        <React.Fragment key={i}>
          <Sequence from={o.f} durationInFrames={40}>
            <Audio src={staticFile('ping.wav')} volume={0.9 - i * 0.08} />
          </Sequence>
          <Sequence from={o.f} durationInFrames={20}>
            <Audio src={staticFile('impact.wav')} volume={0.32} />
          </Sequence>
        </React.Fragment>
      ))}
      <Sequence from={WHIP_1 - 30} durationInFrames={34}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={PEAK} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
