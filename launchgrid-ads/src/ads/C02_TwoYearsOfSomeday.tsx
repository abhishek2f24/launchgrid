import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'
import { GridMark } from '../components/ui'
import {
  AnimatedBackdrop, Burst, CameraRig, DriftParticles, GlowBurst, Grain, GridFloor,
  KineticWords, LightSweep, whipIn, whipOut,
} from '../components/cinema'
import { EndCardCinematic } from '../components/EndCardCinematic'

/**
 * Ad C02 — "Two Years of Someday" (15s, 9:16, 30fps = 450 frames)
 * Villain = hesitation. A sticky note rots on a wall while time whips past,
 * then gets ripped off and replaced by a live store. Never a still frame.
 *
 * ACT 1 · THE WALL (0–163)
 *   4      sticky note "business idea" springs onto the wall (pin + impact)
 *   8–44   hook "This note is two years old." — kinetic
 *   38     JAN 2024 month chip whips in — light shifts cold (key tick)
 *   62/82/98/111/122/131/138  more months — gaps shrink 24→20→16→13→11→9→7
 *          (speed ramp); the note yellows, dulls, and its corner curls
 *   124    riser building under the last flips
 *   152    THE TEAR — note rips off the wall (impact + whoosh, paper burst)
 *   164    WHIP UP → Act 2
 *
 * ACT 2 · THE PHONE (164–303)
 *   172    phone lands in 3D space (impact) — grid floor, orbit camera
 *   186    "● Your store is live" badge pops on screen
 *   216    ORDER ₹799 notification drops onto the lockscreen (ping + punch)
 *   238    kinetic "15 minutes of doing." (accent on 15)
 *   268    riser → 296 WHIP → end card
 *
 * ACT 3 · END CARD (304–450)
 *   logo assembly, wordmark, tagline "Done thinking? 15 minutes.", CTA sweep
 */

const MONTHS = [
  { f: 38, label: 'JAN 2024', warm: 0.15 },
  { f: 62, label: 'APR 2024', warm: 0.7 },
  { f: 82, label: 'AUG 2024', warm: 0.9 },
  { f: 98, label: 'DEC 2024', warm: 0.1 },
  { f: 111, label: 'MAR 2025', warm: 0.6 },
  { f: 122, label: 'AUG 2025', warm: 0.9 },
  { f: 131, label: 'JAN 2026', warm: 0.15 },
  { f: 138, label: 'JUN 2026', warm: 0.8 },
]
const TEAR = 152
const WHIP_1 = 164
const LAND = 172
const LIVE = 186
const ORDER = 216
const WHIP_2 = 296
const END = 304

/** The sticky note — pinned, aging with every month, finally ripped away. */
const StickyNote: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pin = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 12, stiffness: 180, mass: 0.7 } })

  // aging: 0 fresh → 1 fully yellowed/curled, advances with each month flip
  const age = interpolate(frame, [MONTHS[0].f, MONTHS[MONTHS.length - 1].f], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const bg = `linear-gradient(160deg, ${age < 0.5 ? '#FFE978' : '#F0D96A'} 0%, #${age > 0.5 ? 'C9B45A' : 'E8CF66'} 100%)`
  const curl = age * 64 // folded-corner size
  const sag = Math.sin(frame * 0.05) * 1.2 - age * 5 // droops as it ages

  // the tear: yanked up-right with spin, gone in 9 frames
  const tearP = interpolate(frame, [TEAR, TEAR + 9], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic),
  })
  if (tearP >= 1) return null

  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 620,
        transform: `translateX(-50%) translate(${tearP * 900}px, ${(pin - 1) * -500 - tearP * 1100}px) rotate(${sag + (1 - pin) * 14 + tearP * 55}deg) scale(${0.9 + pin * 0.1})`,
        opacity: Math.min(1, pin * 1.6) * (1 - tearP * 0.5),
        filter: tearP > 0 ? `blur(${tearP * 10}px)` : `brightness(${1 - age * 0.18}) saturate(${1 - age * 0.35})`,
        width: 430, height: 430,
        background: bg,
        boxShadow: `0 ${24 + age * 10}px 70px rgba(0,0,0,0.45)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* pin */}
      <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 34, height: 34, borderRadius: 17, background: '#C0392B', boxShadow: '0 6px 16px rgba(0,0,0,0.5), inset -4px -5px 8px rgba(0,0,0,0.35)' }} />
      {/* handwriting */}
      <div style={{ fontFamily: BRAND.font, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: 'rgba(40,32,8,0.82)', textAlign: 'center', lineHeight: 1.25, transform: 'rotate(-3deg)' }}>
        business<br />idea
      </div>
      {/* curling corner — grows with age */}
      <div
        style={{
          position: 'absolute', right: 0, bottom: 0, width: curl, height: curl,
          background: 'linear-gradient(315deg, transparent 48%, rgba(120,100,30,0.55) 50%, #FFF3A6 52%)',
          filter: 'drop-shadow(-4px -4px 8px rgba(0,0,0,0.25))',
        }}
      />
    </div>
  )
}

/** Month chip whip-flipping at the top — every flip shifts the season light. */
const MonthChip: React.FC = () => {
  const frame = useCurrentFrame()
  let idx = -1
  for (let i = 0; i < MONTHS.length; i++) if (frame >= MONTHS[i].f) idx = i
  if (idx < 0 || frame >= TEAR) return null
  const m = MONTHS[idx]
  const t = frame - m.f
  const fly = interpolate(t, [0, 5], [1, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
  return (
    <div
      style={{
        position: 'absolute', top: 320, left: '50%',
        transform: `translateX(calc(-50% + ${fly * 420}px)) scale(${1.25 - 0.25 * (1 - fly)})`,
        filter: fly > 0.1 ? `blur(${fly * 12}px)` : undefined,
        opacity: 1 - fly * 0.4,
        background: 'rgba(30,30,28,0.9)', border: '1.5px solid rgba(255,138,0,0.4)',
        borderRadius: 999, padding: '16px 42px',
        fontFamily: BRAND.font, fontSize: 44, fontWeight: 800, color: BRAND.paper,
        letterSpacing: '0.14em', fontVariantNumeric: 'tabular-nums',
        boxShadow: '0 16px 60px rgba(0,0,0,0.5)',
      }}
    >
      {m.label}
    </div>
  )
}

/** Phone floating in 3D with the live store + incoming order. */
const LivePhone: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - LAND
  if (t < 0) return null
  const land = spring({ frame: t, fps, config: { damping: 13, stiffness: 140, mass: 0.9 } })
  const orbit = Math.sin((frame - LAND) * 0.018) * 7
  const liveSp = spring({ frame: Math.max(0, frame - LIVE), fps, config: { damping: 12, stiffness: 170 } })
  const ordSp = spring({ frame: Math.max(0, frame - ORDER), fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
      <div
        style={{
          width: 560, height: 1130, borderRadius: 64,
          transform: `rotateY(${orbit}deg) rotateX(2.5deg) translateY(${(1 - land) * 700 - 40}px) scale(${0.7 + land * 0.3})`,
          opacity: Math.min(1, land * 1.8),
          background: '#101010', padding: 16,
          boxShadow: '0 60px 160px rgba(0,0,0,0.65), 0 0 90px rgba(255,138,0,0.14)',
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: 50, overflow: 'hidden', background: '#171715', position: 'relative' }}>
          {/* store header */}
          <div style={{ background: BRAND.paper, padding: '70px 30px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GridMark size={26} />
            </div>
            <span style={{ fontFamily: BRAND.font, fontSize: 32, fontWeight: 800, color: BRAND.ink }}>Kavya Ceramics</span>
          </div>
          {/* hero */}
          <div style={{ height: 250, background: 'linear-gradient(125deg, #2E4A3F 0%, #4E7A62 55%, #88AE8F 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: 22 }}>
            <div style={{ position: 'absolute', top: -50, bottom: -50, width: 90, left: interpolate(frame, [LAND + 10, LAND + 40], [-150, 700], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), transform: 'rotate(13deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' }} />
            <span style={{ fontFamily: BRAND.font, fontSize: 34, fontWeight: 800, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>Hand-thrown mugs</span>
          </div>
          {/* product strip */}
          <div style={{ display: 'flex', gap: 16, padding: 20, background: '#F2F0EC' }}>
            {['#7A5C3D', '#3D5C7A', '#5C3D7A'].map((c, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 8px 26px rgba(0,0,0,0.14)' }}>
                <div style={{ height: 110, background: `linear-gradient(135deg, ${c}, ${c}99)` }} />
                <div style={{ fontFamily: BRAND.font, fontSize: 22, fontWeight: 800, color: BRAND.mango, padding: '8px 10px' }}>₹{(599 + i * 200).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
          {/* live badge */}
          <div
            style={{
              position: 'absolute', left: '50%', top: 480,
              transform: `translateX(-50%) translateY(${(1 - liveSp) * 60}px) scale(${0.8 + liveSp * 0.2})`,
              opacity: liveSp,
              background: 'rgba(20,20,18,0.92)', border: '1.5px solid rgba(34,197,94,0.6)',
              borderRadius: 999, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 8, background: BRAND.green, boxShadow: `0 0 ${14 + Math.sin(frame * 0.3) * 8}px ${BRAND.green}` }} />
            <span style={{ fontFamily: BRAND.font, fontSize: 28, fontWeight: 800, color: BRAND.paper, whiteSpace: 'nowrap' }}>Your store is live</span>
          </div>
          {/* order notification drops in */}
          {frame >= ORDER && (
            <div
              style={{
                position: 'absolute', left: 18, right: 18, top: 600,
                transform: `translateY(${(ordSp - 1) * 260}px) scale(${0.92 + 0.08 * ordSp}) rotate(${(1 - ordSp) * -4}deg)`,
                opacity: Math.min(1, ordSp * 1.7),
                background: 'rgba(252,251,249,0.97)', borderRadius: 22, padding: '18px 22px',
                display: 'flex', alignItems: 'center', gap: 16, fontFamily: BRAND.font,
                boxShadow: '0 20px 60px rgba(255,138,0,0.3), 0 8px 28px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ width: 50, height: 50, borderRadius: 13, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <GridMark size={26} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.ink }}>New order — ₹799</div>
                <div style={{ fontSize: 20, color: 'rgba(26,26,24,0.6)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ananya ordered Glaze Mug ×1 · UPI</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const C02: React.FC = () => {
  const frame = useCurrentFrame()

  // season light shifts on every month flip (cold↔warm)
  let warm = 0.5
  for (let i = 0; i < MONTHS.length; i++) {
    if (frame >= MONTHS[i].f) {
      const next = i + 1 < MONTHS.length ? MONTHS[i + 1].f : TEAR
      warm = interpolate(frame, [MONTHS[i].f, MONTHS[i].f + Math.min(8, next - MONTHS[i].f)], [warm, MONTHS[i].warm], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    }
  }

  const hits1 = [
    { f: 4, s: 0.5 },
    ...MONTHS.map((m, i) => ({ f: m.f, s: 0.3 + i * 0.06 })),
    { f: TEAR, s: 1.25 },
  ]
  const flash = interpolate(frame, [TEAR, TEAR + 2, TEAR + 10], [0, 0.7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE WALL ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop base="#121110" glowColor="rgba(120,110,90,0.16)" />
          {/* season light: warm sun vs cold winter window-light */}
          <AbsoluteFill style={{ opacity: warm * 0.5, background: 'radial-gradient(85% 55% at 28% 30%, rgba(255,150,40,0.30) 0%, transparent 70%)' }} />
          <AbsoluteFill style={{ opacity: (1 - warm) * 0.5, background: 'radial-gradient(85% 55% at 72% 26%, rgba(110,150,220,0.26) 0%, transparent 70%)' }} />
          <DriftParticles count={24} seed="wall" color="rgba(220,210,190,0.5)" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.12]} hits={hits1} driftAmp={7}>
            {/* hook */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 360 }}>
              <KineticWords from={8} to={44} text="This note is two years old." size={62} accentWords={[3, 4]} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 360 }}>
              <KineticWords from={52} to={120} text="Still just a note." size={62} accentWords={[1]} />
            </AbsoluteFill>

            <MonthChip />
            <StickyNote />

            {/* the tear moment */}
            <GlowBurst at={TEAR} x={540} y={830} color="rgba(255,138,0,0.45)" size={1200} />
            <Burst at={TEAR} x={540} y={800} count={18} seed="paper" color="#E8D86E" spread={420} />
            <Burst at={TEAR + 2} x={620} y={760} count={10} seed="paper2" color="#FFF3A6" spread={300} />
            {frame >= TEAR && frame < TEAR + 24 && (
              <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 360 }}>
                <KineticWords from={TEAR + 4} text="Enough." size={96} accentWords={[0]} stagger={2} />
              </AbsoluteFill>
            )}
          </CameraRig>

          <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
          <LightSweep period={150} delay={12} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE PHONE ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <GridFloor speed={2.6} opacity={0.14} />
          <DriftParticles count={18} seed="phone" color="rgba(255,170,60,0.55)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.12]} hits={[{ f: LAND, s: 0.7 }, { f: LIVE, s: 0.45 }, { f: ORDER, s: 1.0 }]} driftAmp={6}>
            <LivePhone />

            <GlowBurst at={LIVE} x={540} y={900} color="rgba(34,197,94,0.30)" size={1000} />
            <GlowBurst at={ORDER} x={540} y={1000} color="rgba(255,138,0,0.4)" size={1200} />
            <Burst at={ORDER} x={540} y={980} count={16} seed="c02ord" />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 220 }}>
              <KineticWords from={LAND + 6} to={236} text="Two years of thinking." size={56} color={BRAND.textDim} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 240 }}>
              <KineticWords from={238} to={WHIP_2} text="15 minutes of doing." size={66} accentWords={[0]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={120} delay={WHIP_1 + 18} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Done thinking? 15 minutes." accentWords={[2]} />

      {/* ============ SOUND DESIGN ============ */}
      <Sequence from={4} durationInFrames={14}>
        <Audio src={staticFile('impact.wav')} volume={0.3} />
      </Sequence>
      {MONTHS.map((m, i) => (
        <Sequence key={i} from={m.f} durationInFrames={5}>
          <Audio src={staticFile('key.wav')} volume={0.45 + i * 0.05} />
        </Sequence>
      ))}
      <Sequence from={TEAR - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={TEAR} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.65} />
      </Sequence>
      <Sequence from={TEAR + 1} durationInFrames={18}>
        <Audio src={staticFile('whoosh.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={LAND} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={LIVE} durationInFrames={5}>
        <Audio src={staticFile('key.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={ORDER} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.9} />
      </Sequence>
      <Sequence from={ORDER} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.32} />
      </Sequence>
      <Sequence from={WHIP_2 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
