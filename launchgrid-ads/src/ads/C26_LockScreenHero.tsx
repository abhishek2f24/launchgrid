import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile,
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
 * Ad #26 — "Lock Screen Hero" (15s, 9:16, 30fps = 450 frames)
 * Family dinner. Phone face-down. It buzzes — and you know.
 *
 * ACT 1 · THE DINNER TABLE (0–157)
 *   0–60   warm lamp glow, plate silhouettes bobbing, phone FACE-DOWN on table
 *   10–56  hook "Family dinner. Phone down." — kinetic
 *   62     BUZZ 1 — phone jitters + halo ring (riser from 34, double vibration thud)
 *   70–134 "You feel it buzz." — kinetic
 *   100    BUZZ 2 — bigger jitter + halo (riser from 72)
 *   148    WHIP UP (8f motion blur) → the flip
 *
 * ACT 2 · THE FLIP (148–309)
 *   156    phone card lands close-up, still face-down (impact)
 *   176–196 hand-flip — 180° 3D rotateY, back → lock screen
 *   188    REVEAL: "New order — ₹1,299" (punch, ping, glow burst, screen flash)
 *   216    detail line "Priya · UPI paid · Jaipur" ticks in
 *   240    quiet fist-pump — mango burst UNDER the table line (impact)
 *   246–298 "The quiet fist-pump." — kinetic
 *   302    WHIP → end card
 *
 * ACT 3 · END CARD (310–450)
 *   EndCardCinematic — "Know the second someone buys." (accent: second)
 */

const BUZZ_1 = 62
const BUZZ_2 = 100
const WHIP_1 = 148
const FLIP = 176
const REVEAL = 188
const PUMP = 240
const WHIP_2 = 302
const END = 310

/** Decaying high-frequency jitter for the buzzing phone. */
const buzzJitter = (frame: number, at: number, amp: number) => {
  const t = frame - at
  if (t < 0 || t >= 14) return { x: 0, r: 0 }
  const decay = (1 - t / 14) ** 1.5
  return { x: Math.sin(t * 5.2) * 7 * amp * decay, r: Math.sin(t * 7.1) * 1.8 * amp * decay }
}

/** Expanding vibration ring fired at each buzz. */
const BuzzRing: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < 0 || t > 22) return null
  const p = interpolate(t, [0, 22], [0, 1], { easing: Easing.out(Easing.cubic) })
  const r = 90 + p * 240
  return (
    <div
      style={{
        position: 'absolute', left: x - r, top: y - r * 0.42,
        width: r * 2, height: r * 0.84, borderRadius: '50%',
        border: `3px solid rgba(255,138,0,${(1 - p) * 0.7})`,
        pointerEvents: 'none',
      }}
    />
  )
}

/** One place setting — dim plate ellipse + glass, bobbing so the table breathes. */
const Plate: React.FC<{ x: number; y: number; scale: number; phase: number }> = ({ x, y, scale, phase }) => {
  const frame = useCurrentFrame()
  const bob = Math.sin(frame * 0.04 + phase) * 5
  return (
    <div style={{ position: 'absolute', left: x, top: y + bob, transform: `scale(${scale})` }}>
      <div
        style={{
          width: 250, height: 86, borderRadius: '50%',
          background: 'rgba(250,249,247,0.10)',
          border: '2px solid rgba(255,255,255,0.14)',
          boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.4)',
        }}
      />
      <div
        style={{
          position: 'absolute', left: 200, top: -64,
          width: 52, height: 72, borderRadius: '10px 10px 16px 16px',
          background: 'rgba(255,220,170,0.12)',
          border: '2px solid rgba(255,255,255,0.12)',
          transform: `rotate(${Math.sin(frame * 0.03 + phase * 2) * 1.5}deg)`,
        }}
      />
    </div>
  )
}

export const C26: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)

  const j1 = buzzJitter(frame, BUZZ_1, 0.8)
  const j2 = buzzJitter(frame, BUZZ_2, 1.2)
  const jx = j1.x + j2.x
  const jr = j1.r + j2.r

  // Act 2 — phone lands, then flips 176→196
  const land = spring({ frame: Math.max(0, frame - (WHIP_1 + 8)), fps, config: { damping: 13, stiffness: 140, mass: 0.9 } })
  const rot = interpolate(frame, [FLIP, FLIP + 20], [0, 180], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  })
  const notif = spring({ frame: Math.max(0, frame - REVEAL), fps, config: { damping: 12, stiffness: 160, mass: 0.7 } })
  const flash = interpolate(frame, [REVEAL, REVEAL + 3, REVEAL + 16], [0, 0.85, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const detailIn = interpolate(frame, [216, 226], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE DINNER TABLE ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop base="#13100B" glowColor="rgba(255,160,60,0.16)" />
          {/* warm lamp pool over the table */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(60% 34% at 50% ${64 + Math.sin(frame * 0.05) * 1.5}%, rgba(255,180,90,0.18) 0%, transparent 70%)`,
            }}
          />
          <DriftParticles count={20} seed="dinner" color="rgba(255,200,140,0.5)" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.1]} hits={[{ f: BUZZ_1, s: 0.4 }, { f: BUZZ_2, s: 0.6 }]} driftAmp={7}>
            {/* hook lines */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 320 }}>
              <KineticWords from={10} to={56} text="Family dinner. Phone down." size={62} accentWords={[3]} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 320 }}>
              <KineticWords from={70} to={134} text="You feel it buzz." size={62} accentWords={[3]} />
            </AbsoluteFill>

            {/* the table surface */}
            <div
              style={{
                position: 'absolute', left: -120, right: -120, top: 1150, bottom: -60,
                background: 'linear-gradient(180deg, #2B2218 0%, #1B150E 55%, #120E09 100%)',
                borderTop: '3px solid rgba(255,200,140,0.18)',
                boxShadow: 'inset 0 30px 80px rgba(0,0,0,0.5)',
              }}
            />
            {/* plate silhouettes — the family */}
            <Plate x={120} y={1210} scale={1} phase={0} />
            <Plate x={690} y={1190} scale={0.92} phase={2.1} />
            <Plate x={400} y={1620} scale={1.15} phase={4.3} />

            {/* phone FACE-DOWN between the plates */}
            <div
              style={{
                position: 'absolute', left: 540 - 170 + jx, top: 1395,
                transform: `rotate(${-7 + jr}deg)`,
              }}
            >
              <div
                style={{
                  width: 340, height: 168, borderRadius: 48,
                  background: 'linear-gradient(165deg, #26241F 0%, #15140F 70%)',
                  border: '2px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 22px 50px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.08)',
                  position: 'relative',
                }}
              >
                {/* camera module */}
                <div style={{ position: 'absolute', left: 24, top: 24, width: 74, height: 50, borderRadius: 18, background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: '#0A0A09', border: '1.5px solid rgba(255,255,255,0.2)' }} />
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: '#0A0A09', border: '1.5px solid rgba(255,255,255,0.2)' }} />
                </div>
              </div>
              {/* table shadow */}
              <div style={{ width: 360, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', filter: 'blur(10px)', marginTop: 6, marginLeft: -10 }} />
            </div>

            {/* halo + ring on each buzz */}
            <GlowBurst at={BUZZ_1} x={540} y={1480} color="rgba(255,138,0,0.4)" size={760} />
            <GlowBurst at={BUZZ_2} x={540} y={1480} color="rgba(255,138,0,0.55)" size={980} />
            <BuzzRing at={BUZZ_1} x={540} y={1480} />
            <BuzzRing at={BUZZ_2} x={540} y={1480} />
            <BuzzRing at={BUZZ_2 + 6} x={540} y={1480} />
          </CameraRig>

          <LightSweep period={150} delay={12} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE FLIP ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop base="#100D09" glowColor="rgba(255,150,50,0.13)" />
          <DriftParticles count={18} seed="flip" color="rgba(255,190,120,0.5)" />

          <CameraRig
            push={[WHIP_1, WHIP_2, 1.0, 1.12]}
            hits={[{ f: WHIP_1 + 8, s: 0.7 }, { f: REVEAL, s: 1.1 }, { f: PUMP, s: 0.6 }]}
            driftAmp={6}
          >
            {/* phone close-up — lands, then flips */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1500 }}>
              <div
                style={{
                  width: 620, height: 1230, position: 'relative',
                  transformStyle: 'preserve-3d',
                  transform: `translateY(${(1 - land) * -380}px) scale(${0.9 + land * 0.1}) rotateY(${rot}deg) rotateX(${Math.sin(frame * 0.025) * 2}deg)`,
                  opacity: Math.min(1, land * 1.8),
                }}
              >
                {/* BACK — what you see face-down */}
                <div
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 64,
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(160deg, #28261F 0%, #14130E 75%)',
                    border: '2.5px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 50px 130px rgba(0,0,0,0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <div style={{ position: 'absolute', left: 44, top: 44, width: 150, height: 96, borderRadius: 30, background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: '#0A0A09', border: '2px solid rgba(255,255,255,0.22)' }} />
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: '#0A0A09', border: '2px solid rgba(255,255,255,0.22)' }} />
                  </div>
                  <div style={{ opacity: 0.3 }}><GridMark size={70} /></div>
                </div>

                {/* FRONT — the lock screen */}
                <div
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 64,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: 'linear-gradient(180deg, #1B1A24 0%, #0E0D14 100%)',
                    border: '2.5px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 50px 130px rgba(0,0,0,0.65), 0 0 90px rgba(255,138,0,0.18)',
                    overflow: 'hidden', padding: '90px 40px 0',
                  }}
                >
                  {/* lock screen clock */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 110, fontWeight: 200, color: BRAND.paper, letterSpacing: '0.02em' }}>9:12</div>
                    <div style={{ fontSize: 26, fontWeight: 600, color: BRAND.textDim, marginTop: 2 }}>Sunday evening</div>
                  </div>

                  {/* the notification */}
                  <div
                    style={{
                      marginTop: 70,
                      transform: `translateY(${(1 - notif) * -60}px) scale(${0.92 + notif * 0.08})`,
                      opacity: notif,
                      background: 'rgba(252,251,249,0.96)', borderRadius: 26, padding: '22px 26px',
                      display: 'flex', alignItems: 'center', gap: 18,
                      boxShadow: '0 20px 70px rgba(255,138,0,0.3), 0 8px 28px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ width: 58, height: 58, borderRadius: 15, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GridMark size={30} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: BRAND.ink }}>LaunchGrid</span>
                        <span style={{ fontSize: 18, color: 'rgba(26,26,24,0.45)', fontWeight: 600 }}>now</span>
                      </div>
                      <div style={{ fontSize: 31, fontWeight: 800, color: BRAND.ink, marginTop: 2 }}>New order — ₹1,299</div>
                      <div style={{ fontSize: 22, color: 'rgba(26,26,24,0.6)', fontWeight: 600, opacity: detailIn, whiteSpace: 'nowrap' }}>
                        Priya · UPI paid · Jaipur
                      </div>
                    </div>
                  </div>

                  {/* reveal flash */}
                  <div style={{ position: 'absolute', inset: 0, background: '#FFF6E8', opacity: flash, pointerEvents: 'none' }} />
                </div>
              </div>
            </AbsoluteFill>

            <GlowBurst at={REVEAL} x={540} y={820} color="rgba(255,138,0,0.45)" size={1300} />
            <Burst at={REVEAL} x={540} y={760} count={16} seed="reveal" spread={340} />

            {/* the table edge + the quiet fist-pump UNDER it */}
            <div style={{ position: 'absolute', left: 140, right: 140, top: 1600, height: 3, background: 'rgba(255,255,255,0.14)', borderRadius: 2 }} />
            <GlowBurst at={PUMP} x={540} y={1740} color="rgba(255,138,0,0.4)" size={800} />
            <Burst at={PUMP} x={540} y={1730} count={18} seed="pump" spread={300} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 380 }}>
              <KineticWords from={PUMP + 6} to={WHIP_2} text="The quiet fist-pump." size={58} accentWords={[2]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={120} delay={WHIP_1 + 18} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Know the second someone buys." accentWords={[2]} />

      {/* ============ SOUND DESIGN ============ */}
      {/* buzz 1 — riser builds underneath, then double vibration thud */}
      <Sequence from={BUZZ_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.35} />
      </Sequence>
      <Sequence from={BUZZ_1} durationInFrames={10}>
        <Audio src={staticFile('impact.wav')} volume={0.22} />
      </Sequence>
      <Sequence from={BUZZ_1 + 5} durationInFrames={10}>
        <Audio src={staticFile('impact.wav')} volume={0.18} />
      </Sequence>
      {/* buzz 2 */}
      <Sequence from={BUZZ_2 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={BUZZ_2} durationInFrames={10}>
        <Audio src={staticFile('impact.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={BUZZ_2 + 5} durationInFrames={10}>
        <Audio src={staticFile('impact.wav')} volume={0.24} />
      </Sequence>
      {/* whip to the flip */}
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {/* the flip itself */}
      <Sequence from={FLIP} durationInFrames={18}>
        <Audio src={staticFile('whoosh.wav')} volume={0.45} />
      </Sequence>
      {/* reveal — riser into the brand ping */}
      <Sequence from={REVEAL - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={REVEAL} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.95} />
      </Sequence>
      <Sequence from={REVEAL} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.4} />
      </Sequence>
      {/* fist-pump */}
      <Sequence from={PUMP} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.32} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
