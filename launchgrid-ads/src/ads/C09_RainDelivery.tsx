import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, random, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'
import { GridMark } from '../components/ui'
import {
  AnimatedBackdrop, Burst, CameraRig, DriftParticles, GlowBurst, Grain,
  KineticWords, LightSweep, whipIn, whipOut,
} from '../components/cinema'
import { EndCardCinematic } from '../components/EndCardCinematic'

/**
 * Ad #9 — "Rain Delivery" (15s, 9:16, 30fps = 450 frames)
 * Monsoon mood piece: the merchant sips chai while the parcel moves.
 *
 * ACT 1 · THE RAIN (0–157)
 *   0–     monsoon street: CSS rain streaks at three depths, neon
 *          reflection smears breathing at the bottom, wet-road glow band
 *   10–62  hook "Mumbai. Monsoon. 7:40 PM." — kinetic
 *   46–144 glowing delivery-bag silhouette glides through the rain L→R
 *          (bob + lean + motion-trail echoes), headlight sweep behind it
 *   84     "One parcel is already out there." — kinetic
 *   130    riser building under the bag's exit
 *   158    WHIP UP (8f, motion blur) → the chai stall
 *
 * ACT 2 · THE STALL (158–299)
 *   166    tracking card lands (impact) — chai cup silhouette steams
 *          bottom-left, rain keeps falling behind the glass
 *   176–   route progress animates: Packed ✓ → Shipped ✓ → Out for
 *          delivery (pulsing) — courier dot crawls the route line
 *   232    riser
 *   258    STATUS FLIP → "Delivered ✓" (punch, ping+impact, green glow,
 *          burst, card pops)
 *   272    "You stood still. It didn't." — kinetic
 *   300    WHIP → end card
 *
 * ACT 3 · END CARD (308–450)
 *   logo assembly + "Your business runs while you stand still." (accent: runs)
 */

const BAG_FROM = 46
const BAG_TO = 144
const WHIP_1 = 158
const CARD_IN = 166
const FLIP = 258
const WHIP_2 = 300
const END = 308

/** Rain streaks at a given depth — slanted, looping, parallaxed. */
const Rain: React.FC<{ depth: number; seed: string; count?: number }> = ({ depth, seed, count = 26 }) => {
  const frame = useCurrentFrame()
  const H = 2200
  const speed = 22 + depth * 34
  const len = 60 + depth * 90
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', transform: 'rotate(8deg) scale(1.2)' }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = random(`${seed}-x${i}`) * 1300 - 110
        const y0 = random(`${seed}-y${i}`) * H
        const y = ((y0 + frame * speed) % H) - 150
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x, top: y,
              width: 1.5 + depth * 1.5, height: len, borderRadius: 4,
              background: `linear-gradient(180deg, transparent, rgba(190,215,255,${0.1 + depth * 0.3}))`,
              filter: depth < 0.55 ? 'blur(2px)' : undefined,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/** Neon reflection smears on the wet street — breathing colour pools. */
const NeonStreet: React.FC = () => {
  const frame = useCurrentFrame()
  const smears: { x: number; y: number; w: number; h: number; c: string; rate: number }[] = [
    { x: 6, y: 74, w: 60, h: 16, c: 'rgba(255,90,140,0.22)', rate: 0.05 },
    { x: 58, y: 80, w: 54, h: 14, c: 'rgba(80,200,255,0.18)', rate: 0.04 },
    { x: 30, y: 88, w: 70, h: 18, c: 'rgba(255,138,0,0.2)', rate: 0.06 },
    { x: 76, y: 70, w: 44, h: 12, c: 'rgba(180,120,255,0.15)', rate: 0.035 },
  ]
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {smears.map((s, i) => {
        const breathe = 0.6 + (Math.sin(frame * s.rate + i * 2.1) + 1) * 0.25
        const sway = Math.sin(frame * 0.02 + i * 1.4) * 3
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x + sway}%`, top: `${s.y}%`,
              width: `${s.w}%`, height: `${s.h}%`,
              background: `radial-gradient(50% 50% at 50% 50%, ${s.c} 0%, transparent 70%)`,
              filter: 'blur(30px)', opacity: breathe,
              transform: `scaleY(${2 + Math.sin(frame * 0.03 + i) * 0.3})`,
            }}
          />
        )
      })}
      {/* wet-road shine band */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: '72%', height: 5,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.12 + Math.sin(frame * 0.07) * 0.05}), transparent)`,
        }}
      />
    </AbsoluteFill>
  )
}

/** Glowing delivery-bag silhouette gliding through the rain, with motion-trail echoes. */
const DeliveryBag: React.FC = () => {
  const frame = useCurrentFrame()
  if (frame < BAG_FROM || frame > BAG_TO + 14) return null
  const x = interpolate(frame, [BAG_FROM, BAG_TO], [-340, 1240], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  })
  const bob = Math.sin(frame * 0.22) * 14
  const lean = -7 + Math.sin(frame * 0.1) * 2
  const bag = (echo: number) => (
    <div
      key={echo}
      style={{
        position: 'absolute', left: x - echo * 60, top: 1210 + bob + echo * 4,
        transform: `rotate(${lean}deg) scale(${1 - echo * 0.02})`,
        opacity: echo === 0 ? 1 : 0.22 - echo * 0.08,
        filter: echo > 0 ? `blur(${echo * 4}px)` : undefined,
      }}
    >
      {/* bag body */}
      <div
        style={{
          width: 230, height: 230, borderRadius: 34,
          background: 'linear-gradient(160deg, #2E2118, #1C1410)',
          border: '2.5px solid rgba(255,138,0,0.75)',
          boxShadow: echo === 0 ? '0 0 70px rgba(255,138,0,0.45), 0 30px 60px rgba(0,0,0,0.6)' : undefined,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <GridMark size={84} />
      </div>
      {/* strap */}
      <div style={{ position: 'absolute', left: 96, top: -54, width: 38, height: 70, borderRadius: '18px 18px 0 0', border: '8px solid rgba(255,138,0,0.7)', borderBottom: 'none' }} />
    </div>
  )
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* headlight sweep trailing the bag */}
      <div
        style={{
          position: 'absolute', left: x - 420, top: 1130, width: 460, height: 380,
          background: 'radial-gradient(60% 50% at 80% 50%, rgba(255,210,140,0.16) 0%, transparent 70%)',
          filter: 'blur(16px)',
        }}
      />
      {[3, 2, 1, 0].map((e) => bag(e))}
    </AbsoluteFill>
  )
}

/** Chai cup silhouette with rising steam particles. */
const ChaiCup: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 14, stiffness: 110 } })
  return (
    <div style={{ position: 'absolute', left: 90, top: 1430, transform: `translateY(${(1 - sp) * 180}px)`, opacity: sp }}>
      {/* steam */}
      {Array.from({ length: 7 }).map((_, i) => {
        const ph = ((frame * (0.9 + i * 0.22) + i * 41) % 80) / 80
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 60 + Math.sin(frame * 0.06 + i * 1.9) * 26 + i * 9,
              top: -20 - ph * 230,
              width: 16 + ph * 26, height: 16 + ph * 26, borderRadius: '50%',
              background: 'rgba(250,249,247,0.5)', opacity: (1 - ph) * 0.4,
              filter: 'blur(8px)',
            }}
          />
        )
      })}
      {/* glass */}
      <div
        style={{
          width: 150, height: 190, borderRadius: '10px 10px 26px 26px',
          background: 'linear-gradient(180deg, rgba(60,40,24,0.95) 18%, #7A4A22 18%, #5C3517 90%)',
          border: '2px solid rgba(255,200,130,0.35)',
          boxShadow: '0 0 50px rgba(255,160,60,0.2), 0 24px 50px rgba(0,0,0,0.6)',
        }}
      />
      <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700, color: BRAND.textDim, fontFamily: BRAND.font }}>cutting chai ☑</div>
    </div>
  )
}

/** The tracking card — route dots, crawling courier, status that flips to Delivered. */
const TrackingCard: React.FC<{ camY: number }> = ({ camY }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - CARD_IN
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 140, mass: 0.9 } })
  const flipped = frame >= FLIP
  const flipPop = spring({ frame: Math.max(0, frame - FLIP), fps, config: { damping: 11, stiffness: 190 } })
  const steps: { label: string; done: boolean }[] = [
    { label: 'Packed', done: true },
    { label: 'Shipped', done: true },
    { label: 'Out for delivery', done: flipped },
    { label: 'Delivered', done: flipped },
  ]
  const routeP = interpolate(frame, [CARD_IN + 12, FLIP], [0.55, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  })
  const W = 700
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 480, width: 840,
        transform: `translateX(-50%) translateY(${(1 - sp) * 240}px) rotateY(${camY}deg) rotateX(2.5deg) scale(${(0.92 + sp * 0.08) * (1 + flipPop * 0.04)})`,
        opacity: Math.min(1, sp * 1.6),
        background: 'rgba(24,24,22,0.93)', borderRadius: 36,
        border: `1.5px solid ${flipped ? 'rgba(34,197,94,0.6)' : 'rgba(255,138,0,0.28)'}`,
        padding: '40px 46px', fontFamily: BRAND.font,
        boxShadow: flipped
          ? '0 50px 140px rgba(0,0,0,0.6), 0 0 110px rgba(34,197,94,0.25)'
          : '0 50px 140px rgba(0,0,0,0.6), 0 0 80px rgba(255,138,0,0.12)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 600, color: BRAND.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Order #1042 · Meera</div>
          <div style={{ fontSize: 38, fontWeight: 800, color: BRAND.paper, marginTop: 4 }}>Block Print Dupatta — ₹1,150</div>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <GridMark size={30} />
        </div>
      </div>

      {/* route line + crawling courier dot */}
      <div style={{ position: 'relative', height: 60, marginTop: 36 }}>
        <div style={{ position: 'absolute', top: 26, left: 0, width: W, height: 8, borderRadius: 4, background: 'rgba(250,249,247,0.12)' }} />
        <div style={{ position: 'absolute', top: 26, left: 0, width: W * routeP, height: 8, borderRadius: 4, background: flipped ? BRAND.green : BRAND.mango, boxShadow: `0 0 24px ${flipped ? 'rgba(34,197,94,0.6)' : 'rgba(255,138,0,0.5)'}` }} />
        <div
          style={{
            position: 'absolute', top: 12, left: W * routeP - 18,
            width: 36, height: 36, borderRadius: 18,
            background: flipped ? BRAND.green : BRAND.mango,
            boxShadow: `0 0 ${26 + Math.sin(frame * 0.4) * 8}px ${flipped ? 'rgba(34,197,94,0.8)' : 'rgba(255,138,0,0.8)'}`,
            transform: `scale(${1 + Math.sin(frame * 0.3) * 0.08})`,
          }}
        />
      </div>

      {/* step chips */}
      <div style={{ display: 'flex', gap: 14, marginTop: 22 }}>
        {steps.map((s, i) => {
          const active = i === 2 && !flipped
          const justFlipped = i >= 2 && flipped
          return (
            <div
              key={i}
              style={{
                flex: i === 2 ? 1.4 : 1, textAlign: 'center', borderRadius: 16, padding: '14px 6px',
                fontSize: 21, fontWeight: 700, whiteSpace: 'nowrap',
                background: s.done ? (justFlipped ? 'rgba(34,197,94,0.18)' : 'rgba(255,138,0,0.14)') : 'rgba(250,249,247,0.06)',
                border: active
                  ? `1.5px solid rgba(255,138,0,${0.4 + Math.sin(frame * 0.35) * 0.35})`
                  : `1.5px solid ${s.done ? (justFlipped ? 'rgba(34,197,94,0.5)' : 'rgba(255,138,0,0.3)') : 'rgba(250,249,247,0.1)'}`,
                color: s.done ? BRAND.paper : BRAND.textDim,
                transform: justFlipped ? `scale(${0.9 + flipPop * 0.1})` : undefined,
              }}
            >
              {s.label}{s.done ? ' ✓' : active ? '…' : ''}
            </div>
          )
        })}
      </div>

      {/* big status line */}
      <div style={{ marginTop: 30, textAlign: 'center' }}>
        {!flipped ? (
          <div style={{ fontSize: 34, fontWeight: 800, color: BRAND.mango, opacity: 0.7 + Math.sin(frame * 0.25) * 0.3 }}>
            Out for delivery — 2.1 km away
          </div>
        ) : (
          <div style={{ fontSize: 44, fontWeight: 800, color: BRAND.green, transform: `scale(${0.7 + flipPop * 0.3})`, textShadow: '0 0 50px rgba(34,197,94,0.5)' }}>
            Delivered ✓
          </div>
        )}
      </div>
    </div>
  )
}

export const C09: React.FC = () => {
  const frame = useCurrentFrame()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.016) * 5

  return (
    <AbsoluteFill style={{ background: '#08090C', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE RAIN ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop base="#08090C" glowColor="rgba(90,140,220,0.12)" />
          <NeonStreet />
          <Rain depth={0.4} seed="rfar" count={22} />

          <CameraRig push={[0, WHIP_1, 1.0, 1.1]} hits={[{ f: BAG_FROM, s: 0.5 }, { f: 84, s: 0.4 }]} driftAmp={8}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 340 }}>
              <KineticWords from={10} to={80} text="Mumbai. Monsoon. 7:40 PM." size={64} accentWords={[1]} />
            </AbsoluteFill>

            <DeliveryBag />
            <Rain depth={0.75} seed="rmid" count={26} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 380 }}>
              <KineticWords from={84} to={WHIP_1} text="One parcel is already out there." size={58} accentWords={[1]} maxWidth={840} />
            </AbsoluteFill>

            <GlowBurst at={BAG_FROM} x={-60} y={1300} color="rgba(255,138,0,0.35)" size={900} />
          </CameraRig>

          <Rain depth={1} seed="rnear" count={20} />
          <LightSweep period={140} delay={20} strength={0.05} />
          <Grain opacity={0.09} />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE STALL ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop base="#0A0A0C" glowColor="rgba(255,160,60,0.12)" />
          <NeonStreet />
          <Rain depth={0.45} seed="sfar" count={20} />
          <DriftParticles count={14} seed="stall" color="rgba(255,200,140,0.5)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.12]} hits={[{ f: CARD_IN, s: 0.7 }, { f: FLIP, s: 1.2 }]} driftAmp={6}>
            <AbsoluteFill style={{ perspective: 1300 }}>
              <TrackingCard camY={camY} />
            </AbsoluteFill>
            <ChaiCup at={CARD_IN + 10} />

            <GlowBurst at={FLIP} x={540} y={820} color="rgba(34,197,94,0.45)" size={1300} />
            <Burst at={FLIP} x={540} y={800} count={20} seed="deliv" spread={380} color={BRAND.green} />
            <Burst at={FLIP + 3} x={540} y={840} count={12} seed="deliv2" spread={260} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 250 }}>
              <KineticWords from={272} to={WHIP_2} text="You stood still. It didn't." size={60} accentWords={[2]} />
            </AbsoluteFill>
          </CameraRig>

          <Rain depth={0.9} seed="snear" count={16} />
          <LightSweep period={120} delay={WHIP_1 + 16} strength={0.05} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Your business runs while you stand still." accentWords={[2]} />

      {/* ============ SOUND DESIGN ============ */}
      <Sequence from={BAG_FROM - 4} durationInFrames={22}>
        <Audio src={staticFile('whoosh.wav')} volume={0.35} />
      </Sequence>
      <Sequence from={WHIP_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={CARD_IN} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {[CARD_IN + 18, CARD_IN + 30].map((f, i) => (
        <Sequence key={`u${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={FLIP - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={FLIP} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.95} />
      </Sequence>
      <Sequence from={FLIP} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
