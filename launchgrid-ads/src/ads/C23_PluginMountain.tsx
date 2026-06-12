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
 * Ad #23 — "The Plugin Mountain" (15s, 9:16, 30fps = 450 frames)
 * The villain is the app-store tax: a teetering tower of paid plugins.
 *
 * ACT 1 · THE TOWER (0–217)
 *   6–84   hook "To accept UPI on Shopify you need..." — kinetic
 *   46     plugin 1 ₹1,499/mo THUDS in — wobble spring kicks the tower
 *   74/98/118/134/148 plugins 2–6 land (gaps 28→24→20→16→14 — speed ramp),
 *          each thud bigger, tower sway amplitude grows with every card,
 *          ₹/mo Ticker climbing at the top (₹5,094/mo)
 *   160    riser building under the teetering tower
 *   188    COLLAPSE — cards scatter with gravity + spin, big shake,
 *          triple burst, glow flash
 *   218    WHIP UP → Act 2
 *
 * ACT 2 · BUILT IN (218–309)
 *   228    one clean LaunchGrid card rises from below (impact),
 *          breathing mango glow behind it
 *   244    "UPI. Built in." kinetic slams above the card
 *   252/260/268 "UPI ✓ / COD ✓ / WhatsApp ✓" rows tick in (key.wav)
 *   292    glow punch on the card, ₹0/mo chip pops
 *   302    WHIP → end card
 *
 * ACT 3 · END CARD (310–450) — tagline "No plugins. Just selling."
 */

const PLUGINS = [
  { f: 46, name: 'UPI Payments Pro', price: 1499 },
  { f: 74, name: 'COD Manager', price: 799 },
  { f: 98, name: 'GST Invoice Maker', price: 999 },
  { f: 118, name: 'Shiprate Calculator', price: 599 },
  { f: 134, name: 'WhatsApp Notifier', price: 699 },
  { f: 148, name: 'Hindi Storefront', price: 499 },
]
const TOTAL_RS = 5094
const COLLAPSE = 188
const WHIP_1 = 218
const RISE = 228
const ZERO_POP = 292
const WHIP_2 = 302
const END = 310

const ICON_BG = ['#5B21B6', '#155E75', '#9D174D', '#3F6212', '#92400E', '#1E3A8A']

/** One plugin card in the tower. Thuds in from above; scatters with gravity on collapse. */
const TowerCard: React.FC<{ idx: number }> = ({ idx }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = PLUGINS[idx]
  const t = frame - p.f
  if (t < 0) return null

  const enter = spring({ frame: t, fps, config: { damping: 11, stiffness: 190, mass: 0.75 } })
  // collapse scatter physics — deterministic per card
  const tc = frame - COLLAPSE
  let sx = 0, sy = 0, sr = 0, fade = 1
  if (tc >= 0) {
    const vx = (random(`c23-vx${idx}`) - 0.5) * 64
    const vy = -(9 + random(`c23-vy${idx}`) * 18)
    const vr = (random(`c23-vr${idx}`) - 0.5) * 11
    sx = vx * tc
    sy = vy * tc + 1.1 * tc * tc
    sr = vr * tc
    fade = interpolate(tc, [16, 30], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  }
  const teeter = (idx % 2 === 0 ? -1 : 1) * (4 + idx * 9)

  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 1560 - (idx + 1) * 136,
        width: 680,
        transform: `translateX(-50%) translate(${teeter + sx}px, ${(1 - enter) * -640 + sy}px) rotate(${(1 - enter) * 7 + sr}deg)`,
        opacity: Math.min(1, enter * 1.8) * fade,
        background: 'rgba(247,246,243,0.97)', borderRadius: 22, padding: '18px 26px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
        fontFamily: BRAND.font, zIndex: 10 + idx,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: ICON_BG[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 800, flexShrink: 0 }}>
          {p.name.slice(0, 1)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 27, fontWeight: 800, color: BRAND.ink, whiteSpace: 'nowrap' }}>{p.name}</div>
          <div style={{ fontSize: 19, fontWeight: 600, color: 'rgba(26,26,24,0.5)' }}>app install · required</div>
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#C2410C', whiteSpace: 'nowrap' }}>₹{p.price.toLocaleString('en-IN')}/mo</div>
    </div>
  )
}

/** Check row inside the LaunchGrid card — ticks in with a key sound. */
const CheckRow: React.FC<{ at: number; label: string }> = ({ at, label }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 160 } })
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        transform: `translateX(${(1 - sp) * -60}px)`, opacity: sp,
        fontFamily: BRAND.font,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 20, background: BRAND.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>✓</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: BRAND.ink }}>{label}</div>
      <div style={{ marginLeft: 'auto', fontSize: 24, fontWeight: 800, color: BRAND.green }}>built in</div>
    </div>
  )
}

export const C23: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // tower wobble: every landing kicks a damped sin, amplitude grows per card
  let wobble = 0
  PLUGINS.forEach((p, i) => {
    const t = frame - p.f
    if (t >= 0 && t < 46) {
      const decay = Math.max(0, 1 - t / 46) ** 2
      wobble += Math.sin(t * 0.55) * decay * (1.1 + i * 0.55)
    }
  })
  const landed = PLUGINS.filter((p) => p.f <= frame).length
  const sway = Math.sin(frame * 0.075) * landed * 0.45
  const tcAll = frame - COLLAPSE
  const towerRot = (wobble + sway) * (tcAll >= 0 ? Math.max(0, 1 - tcAll / 6) : 1)

  const hits1 = [
    ...PLUGINS.map((p, i) => ({ f: p.f, s: 0.35 + i * 0.09 })),
    { f: COLLAPSE, s: 1.7 },
  ]

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)

  const riseSp = spring({ frame: Math.max(0, frame - RISE), fps, config: { damping: 13, stiffness: 120, mass: 0.9 } })
  const zeroSp = spring({ frame: Math.max(0, frame - ZERO_POP), fps, config: { damping: 11, stiffness: 180 } })
  const cardGlow = 0.3 + Math.sin(frame * 0.14) * 0.16

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE TOWER ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor="rgba(120,60,180,0.14)" />
          <DriftParticles count={22} seed="plugins" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.1]} hits={hits1} driftAmp={7}>
            {/* hook */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 230 }}>
              <KineticWords from={6} to={84} text="To accept UPI on Shopify you need..." size={58} accentWords={[2]} maxWidth={880} />
            </AbsoluteFill>

            {/* running app-store bill */}
            {frame >= PLUGINS[1].f && (
              <div style={{ position: 'absolute', top: 480, width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 25, fontWeight: 700, color: BRAND.textDim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Your new monthly bill</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                  <Ticker from={PLUGINS[1].f} duration={PLUGINS[5].f - PLUGINS[1].f + 14} value={TOTAL_RS} size={82} color="#FF6B4A" />
                  <span style={{ fontSize: 38, fontWeight: 800, color: '#FF6B4A' }}>/mo</span>
                </div>
              </div>
            )}

            {/* the teetering tower — rotates around its base */}
            <AbsoluteFill style={{ transform: `rotate(${towerRot}deg)`, transformOrigin: '50% 81%' }}>
              {PLUGINS.map((_, i) => <TowerCard key={i} idx={i} />)}
              {/* ground shadow under the tower */}
              <div
                style={{
                  position: 'absolute', left: '50%', top: 1572, width: 740, height: 50,
                  transform: 'translateX(-50%)', borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)',
                  opacity: tcAll >= 0 ? Math.max(0, 1 - tcAll / 10) : 1,
                }}
              />
            </AbsoluteFill>

            {/* landing dust per card */}
            {PLUGINS.map((p, i) => (
              <Burst key={i} at={p.f + 2} x={540} y={1560 - (i + 1) * 136 + 100} count={8 + i} seed={`thud${i}`} spread={170} color="rgba(200,200,195,0.8)" />
            ))}

            {/* THE COLLAPSE */}
            <GlowBurst at={COLLAPSE} x={540} y={1100} color="rgba(255,90,40,0.4)" size={1400} />
            <Burst at={COLLAPSE} x={540} y={1000} count={22} seed="fall1" spread={420} />
            <Burst at={COLLAPSE + 3} x={340} y={1300} count={16} seed="fall2" spread={340} color="rgba(220,220,215,0.9)" />
            <Burst at={COLLAPSE + 6} x={760} y={1380} count={16} seed="fall3" spread={340} color="rgba(220,220,215,0.9)" />

            {frame >= COLLAPSE + 8 && (
              <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
                <KineticWords from={COLLAPSE + 8} to={WHIP_1} text="There's a simpler way." size={64} accentWords={[2]} />
              </AbsoluteFill>
            )}
          </CameraRig>

          <LightSweep period={150} delay={12} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · BUILT IN ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.13)" />
          <GridFloor speed={2.4} opacity={0.14} />
          <DriftParticles count={18} seed="builtin" color="rgba(255,170,60,0.55)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.1]} hits={[{ f: RISE + 8, s: 0.85 }, { f: ZERO_POP, s: 0.9 }]} driftAmp={6}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 300 }}>
              <KineticWords from={244} to={WHIP_2} text="UPI. Built in." size={92} accentWords={[0]} />
            </AbsoluteFill>

            {/* the one clean card, rising with a breathing glow */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div
                style={{
                  transform: `translateY(${(1 - riseSp) * 900 + 60}px) rotateY(${Math.sin((frame - WHIP_1) * 0.018) * 5}deg) rotateX(2deg)`,
                  opacity: Math.min(1, riseSp * 1.6),
                  width: 760, background: 'rgba(252,251,249,0.97)', borderRadius: 32,
                  padding: '36px 40px',
                  boxShadow: `0 50px 140px rgba(0,0,0,0.6), 0 0 ${90 + cardGlow * 120}px rgba(255,138,0,${cardGlow})`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 15, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GridMark size={30} />
                  </div>
                  <span style={{ fontSize: 36, fontWeight: 800, color: BRAND.ink }}>LaunchGrid</span>
                  {/* ₹0/mo pop */}
                  {frame >= ZERO_POP && (
                    <div style={{ marginLeft: 'auto', transform: `scale(${zeroSp})`, background: BRAND.green, color: '#fff', borderRadius: 999, padding: '10px 24px', fontSize: 26, fontWeight: 800 }}>
                      ₹0/mo apps
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <CheckRow at={252} label="UPI payments" />
                  <CheckRow at={260} label="Cash on delivery" />
                  <CheckRow at={268} label="WhatsApp updates" />
                </div>
                <div style={{ marginTop: 30, background: BRAND.mango, borderRadius: 18, padding: '22px 0', textAlign: 'center', fontSize: 32, fontWeight: 800, color: BRAND.ink, boxShadow: `0 10px ${40 + Math.sin(frame * 0.18) * 14}px rgba(255,138,0,0.45)` }}>
                  Buy with UPI →
                </div>
              </div>
            </AbsoluteFill>

            <GlowBurst at={RISE + 8} x={540} y={1000} color="rgba(255,138,0,0.4)" size={1200} />
            <Burst at={RISE + 8} x={540} y={1240} count={16} seed="rise" spread={320} />
            <Burst at={ZERO_POP} x={760} y={780} count={12} seed="zero" spread={240} color={BRAND.green} />
          </CameraRig>

          <LightSweep period={120} delay={WHIP_1 + 16} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="No plugins. Just selling." accentWords={[3]} />

      {/* ============ SOUND DESIGN ============ */}
      {PLUGINS.map((p, i) => (
        <Sequence key={i} from={p.f} durationInFrames={18}>
          <Audio src={staticFile('impact.wav')} volume={0.28 + i * 0.05} />
        </Sequence>
      ))}
      <Sequence from={COLLAPSE - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={COLLAPSE} durationInFrames={20}>
        <Audio src={staticFile('impact.wav')} volume={0.75} />
      </Sequence>
      <Sequence from={COLLAPSE + 2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={RISE + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {[252, 260, 268].map((f, i) => (
        <Sequence key={`k${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.65} />
        </Sequence>
      ))}
      <Sequence from={ZERO_POP} durationInFrames={14}>
        <Audio src={staticFile('impact.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
