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
 * Ad #27 — "One-Tap Fulfil" (15s, 9:16, 30fps = 450 frames)
 * One relentless flow: order in → packed → tracking out → SHIPPED. 11 seconds.
 *
 * ACT 1 · THE CLAIM (0–57)
 *   6–54  hook "Order to shipped in 11 seconds." (accent: 11)
 *   30    stopwatch chip springs in at 00:00.0 (key tick)
 *   58    WHIP UP → the flow
 *
 * ACT 2 · THE FLOW (58–309) — stopwatch runs 00:00.0 → 00:11.0 over frames 70–236
 *   66    phone panel lands (impact), timer starts
 *   84    notification lands "New order — ₹1,499" (ping, punch)
 *   130   thumb-tap ripple (key) → 134 "Mark as packed" depresses → flips green ✓ (impact)
 *   168   WhatsApp tracking card pops then FLIES out top-right (whoosh)
 *   208   riser building under the final beat        ← gaps shrink 46→38→34: speed ramp
 *   236   "SHIPPED ✓" stamp SLAMS — timer FREEZES at 00:11.0 (impact, punch, burst)
 *   254–298 "11 seconds. Flat." — kinetic
 *   302   WHIP → end card
 *
 * ACT 3 · END CARD (310–450)
 *   EndCardCinematic — "Run it from your pocket." (accent: pocket)
 */

const WHIP_1 = 58
const LAND = 66
const TIMER_START = 70
const NOTIF = 84
const TAP = 130
const PACK = 134
const FLY = 168
const STAMP = 236
const WHIP_2 = 302
const END = 310

/** Expanding thumb-tap ripple. */
const TapRipple: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < 0 || t > 18) return null
  const p = interpolate(t, [0, 18], [0, 1], { easing: Easing.out(Easing.cubic) })
  const r = 26 + p * 130
  return (
    <>
      <div
        style={{
          position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2,
          borderRadius: '50%', border: `4px solid rgba(255,138,0,${(1 - p) * 0.8})`, pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44,
          borderRadius: '50%', background: `rgba(255,255,255,${(1 - p) * 0.5})`, pointerEvents: 'none',
        }}
      />
    </>
  )
}

/** Stopwatch chip — counts to 11.0s, freezes mango on the stamp. */
const Stopwatch: React.FC<{ appearAt: number }> = ({ appearAt }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - appearAt
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 150 } })
  const sec = interpolate(frame, [TIMER_START, STAMP], [0, 11], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const frozen = frame >= STAMP
  const label = `00:${String(Math.floor(sec)).padStart(2, '0')}.${Math.floor((sec % 1) * 10)}`
  const freezePop = interpolate(frame, [STAMP, STAMP + 3, STAMP + 14], [0, 0.16, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  return (
    <div
      style={{
        position: 'absolute', top: 200, left: '50%',
        transform: `translateX(-50%) translateY(${(1 - sp) * -90}px) scale(${0.9 + sp * 0.1 + freezePop})`,
        opacity: sp,
        background: 'rgba(30,30,28,0.92)', border: `2px solid ${frozen ? BRAND.mango : 'rgba(255,138,0,0.4)'}`,
        borderRadius: 999, padding: '16px 38px', display: 'flex', gap: 16, alignItems: 'center',
        boxShadow: frozen ? '0 0 70px rgba(255,138,0,0.5)' : '0 16px 50px rgba(0,0,0,0.5)',
        fontFamily: BRAND.font,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 7, background: frozen ? BRAND.green : BRAND.mango, opacity: frozen ? 1 : 0.5 + Math.sin(frame * 0.5) * 0.5 }} />
      <span style={{ fontSize: 40, fontWeight: 800, color: frozen ? BRAND.mango : BRAND.paper, fontVariantNumeric: 'tabular-nums' }}>{label}</span>
    </div>
  )
}

export const C27: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.018) * 5

  const land = spring({ frame: Math.max(0, frame - LAND), fps, config: { damping: 13, stiffness: 140, mass: 0.9 } })
  const notifIn = spring({ frame: Math.max(0, frame - NOTIF), fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })

  // button depress 130→138, then green from PACK
  const press = interpolate(frame, [TAP, TAP + 4, TAP + 9], [0, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const packed = frame >= PACK
  const packPop = spring({ frame: Math.max(0, frame - PACK), fps, config: { damping: 12, stiffness: 180 } })

  // WhatsApp card: pop in 168–180, fly out 180–204
  const waT = frame - FLY
  const waPop = spring({ frame: Math.max(0, waT), fps, config: { damping: 12, stiffness: 160, mass: 0.8 } })
  const waFly = interpolate(waT, [12, 36], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic),
  })

  // the stamp
  const stampT = frame - STAMP
  const stampSp = spring({ frame: Math.max(0, stampT), fps, config: { damping: 12, stiffness: 160, mass: 0.9 } })

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE CLAIM ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <DriftParticles count={22} seed="claim" />
          <CameraRig push={[0, WHIP_1, 1.0, 1.09]} hits={[{ f: 30, s: 0.4 }]} driftAmp={7}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
              <KineticWords from={6} to={WHIP_1} text="Order to shipped in 11 seconds." size={84} accentWords={[4]} maxWidth={880} />
            </AbsoluteFill>
            <Stopwatch appearAt={30} />
          </CameraRig>
          <LightSweep period={130} delay={8} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE FLOW ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <GridFloor speed={2.6} opacity={0.13} />
          <DriftParticles count={18} seed="flow" color="rgba(255,170,60,0.55)" />

          <CameraRig
            push={[WHIP_1, WHIP_2, 1.0, 1.13]}
            hits={[
              { f: LAND, s: 0.7 }, { f: NOTIF, s: 0.85 }, { f: TAP + 3, s: 0.5 },
              { f: FLY + 14, s: 0.6 }, { f: STAMP, s: 1.25 },
            ]}
            driftAmp={6}
          >
            <Stopwatch appearAt={LAND + 4} />

            {/* the phone panel — floating 3D card */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div
                style={{
                  width: 800,
                  transform: `rotateY(${camY}deg) rotateX(2deg) translateY(${(1 - land) * 700 + 40}px) scale(${0.94 + land * 0.06})`,
                  opacity: Math.min(1, land * 1.8),
                  background: 'rgba(24,24,22,0.94)', borderRadius: 36,
                  border: '1.5px solid rgba(255,138,0,0.25)',
                  padding: '36px 40px 40px', position: 'relative',
                  boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 90px rgba(255,138,0,0.1)',
                }}
              >
                {/* header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 13, background: BRAND.ink, border: '1.5px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GridMark size={26} />
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: BRAND.paper }}>Orders</span>
                  <span style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 700, color: BRAND.green }}>● Live</span>
                </div>

                {/* the order notification */}
                <div
                  style={{
                    transform: `translateY(${(1 - notifIn) * -160}px) scale(${0.93 + notifIn * 0.07}) rotate(${(1 - notifIn) * -3}deg)`,
                    opacity: Math.min(1, notifIn * 1.7),
                    background: 'rgba(252,251,249,0.97)', borderRadius: 24, padding: '22px 26px',
                    boxShadow: '0 20px 60px rgba(255,138,0,0.2), 0 8px 28px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: BRAND.ink }}>New order — ₹1,499</span>
                    <span style={{ fontSize: 19, color: 'rgba(26,26,24,0.45)', fontWeight: 600 }}>now</span>
                  </div>
                  <div style={{ fontSize: 23, color: 'rgba(26,26,24,0.6)', fontWeight: 600, marginTop: 4 }}>
                    Kavya · Jaipur · Block Print Suit
                  </div>
                </div>

                {/* the one tap */}
                <div
                  style={{
                    marginTop: 26, borderRadius: 20, padding: '26px 0', textAlign: 'center',
                    fontSize: 34, fontWeight: 800, color: BRAND.ink,
                    background: packed ? BRAND.green : BRAND.mango,
                    transform: `scale(${1 - press * 0.07 + (packed ? (1 - packPop) * 0.05 : 0)})`,
                    boxShadow: packed
                      ? `0 0 ${40 + packPop * 30}px rgba(34,197,94,0.5)`
                      : `0 10px ${40 + Math.sin(frame * 0.2) * 14}px rgba(255,138,0,0.45)`,
                    opacity: notifIn,
                  }}
                >
                  {packed ? 'Packed ✓' : 'Mark as packed'}
                </div>

                {/* thumb-tap ripple on the button */}
                <TapRipple at={TAP} x={400} y={330} />

                {/* WhatsApp tracking card — pops above the button, then flies out */}
                {waT >= 0 && waFly < 1 && (
                  <div
                    style={{
                      position: 'absolute', left: 60, right: 60, top: 120,
                      transform: `translate(${waFly * 760}px, ${(1 - waPop) * 180 - waFly * 980}px) rotate(${waFly * 22}deg) scale(${0.9 + waPop * 0.1})`,
                      opacity: Math.min(1, waPop * 1.6) * (1 - waFly * 0.85),
                      filter: waFly > 0.05 ? `blur(${waFly * 8}px)` : undefined,
                      background: 'rgba(18,40,28,0.97)', border: '2px solid rgba(34,197,94,0.55)',
                      borderRadius: 24, padding: '22px 26px',
                      boxShadow: '0 24px 80px rgba(34,197,94,0.25), 0 10px 36px rgba(0,0,0,0.6)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: BRAND.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>W</div>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#D9F7E4' }}>WhatsApp → Kavya</span>
                    </div>
                    <div style={{ fontSize: 23, fontWeight: 600, color: 'rgba(217,247,228,0.75)', marginTop: 10 }}>
                      Your order is packed! Tracking: lgrid.in/t/214
                    </div>
                  </div>
                )}
              </div>
            </AbsoluteFill>

            <GlowBurst at={NOTIF} x={540} y={800} color="rgba(255,138,0,0.35)" size={1000} />
            <GlowBurst at={FLY + 14} x={760} y={620} color="rgba(34,197,94,0.3)" size={800} />

            {/* THE STAMP — 00:11, frozen */}
            {stampT >= 0 && (
              <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,10,0.7)', opacity: Math.min(1, stampT / 5) }} />
                <div
                  style={{
                    position: 'relative',
                    transform: `rotate(-9deg) scale(${2.9 - 1.9 * stampSp})`,
                    filter: `blur(${Math.max(0, (1 - stampSp) * 14)}px)`,
                    opacity: Math.min(1, stampT / 3),
                    border: `14px solid ${BRAND.mango}`, borderRadius: 36,
                    padding: '30px 60px', textAlign: 'center',
                    boxShadow: '0 0 120px rgba(255,138,0,0.45), inset 0 0 60px rgba(255,138,0,0.15)',
                  }}
                >
                  <div style={{ fontSize: 150, fontWeight: 800, color: BRAND.mango, letterSpacing: '-0.02em', lineHeight: 1 }}>SHIPPED ✓</div>
                </div>
                <Burst at={STAMP + 2} x={540} y={930} count={22} seed="stamp" spread={420} />
              </AbsoluteFill>
            )}

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 300 }}>
              <KineticWords from={STAMP + 18} to={WHIP_2} text="11 seconds. Flat." size={64} accentWords={[0]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={115} delay={WHIP_1 + 14} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Run it from your pocket." accentWords={[4]} />

      {/* ============ SOUND DESIGN ============ */}
      <Sequence from={30} durationInFrames={4}>
        <Audio src={staticFile('key.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={LAND} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {/* order arrives */}
      <Sequence from={NOTIF} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.95} />
      </Sequence>
      <Sequence from={NOTIF} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.3} />
      </Sequence>
      {/* tap + pack */}
      <Sequence from={TAP} durationInFrames={4}>
        <Audio src={staticFile('key.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={PACK} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.35} />
      </Sequence>
      {/* tracking flies out */}
      <Sequence from={FLY} durationInFrames={4}>
        <Audio src={staticFile('key.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={FLY + 12} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.6} />
      </Sequence>
      {/* riser into the stamp */}
      <Sequence from={STAMP - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={STAMP + 2} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
