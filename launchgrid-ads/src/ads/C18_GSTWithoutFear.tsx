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
 * Ad #18 — "GST Without the Fear" (15s, 9:16, 30fps = 450 frames)
 * Horror-trailer open → spa-level calm. Villain: the manila envelope.
 *
 * ACT 1 · THE ENVELOPE (0–151)
 *   0–30   near-black, flickering harsh spotlight fades up on a manila envelope
 *   10–62  hook "You know this envelope." — kinetic
 *   36     LOOM 1 — envelope steps closer (impact + shake, drum-hit feel)
 *   66     LOOM 2 — red GST stamp slaps on   (gaps shrink: 30→26→22→18 ramp)
 *   92     LOOM 3 — red rim glow starts pulsing
 *   114    LOOM 4
 *   132    LOOM 5 — envelope fills the frame, riser already building
 *   96–148 "The fear is optional." — kinetic
 *   152    WHIP UP (motion blur) → the calm
 *
 * ACT 2 · THE CALM (152–301)
 *   160    GST Radar dashboard card lands (soft impact) — grid floor, slow orbit
 *   166–224 turnover ticker ₹0 → ₹12,40,000 + threshold bar fills gently (key ticks)
 *   232    green "You're fine ✓" chip springs in — green glow, exhale
 *   250    "Breathe. We're watching." — kinetic
 *   302    WHIP → end card
 *
 * ACT 3 · END CARD (310–450)
 *   logo assembly + tagline "We watch the thresholds. You sell." + CTA sweep
 */

const LOOMS = [36, 66, 92, 114, 132]
const WHIP_1 = 152
const BAR_START = 166
const CHIP = 232
const WHIP_2 = 302
const END = 310

/** The ominous manila envelope — steps closer on every loom hit. */
const Envelope: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  // each impact shoves it one step closer to camera
  let loom = 0
  for (const f of LOOMS) {
    loom += spring({ frame: Math.max(0, frame - f), fps, config: { damping: 13, stiffness: 110 } }) * 0.135
  }
  const scale = 0.52 + loom
  const wobble = Math.sin(frame * 0.05) * 1.2
  // red dread glow grows from LOOM 3
  const dread = interpolate(frame, [LOOMS[2], LOOMS[4] + 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const pulse = 0.6 + Math.sin(frame * 0.35) * 0.4
  // stamp slaps on at LOOM 2
  const stampT = frame - LOOMS[1]
  const stampSp = spring({ frame: Math.max(0, stampT), fps, config: { damping: 11, stiffness: 200, mass: 0.6 } })

  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 1000,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${wobble - 2}deg)`,
        width: 680, height: 440,
        background: 'linear-gradient(160deg, #D8B26A 0%, #C49A4F 60%, #B0863F 100%)',
        borderRadius: 14,
        boxShadow: `0 60px 160px rgba(0,0,0,0.8), 0 0 ${50 + dread * pulse * 110}px rgba(200,40,40,${dread * pulse * 0.45})`,
      }}
    >
      {/* flap */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 250,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          background: 'linear-gradient(180deg, #C9A155 0%, #A87E38 100%)',
          borderRadius: '14px 14px 0 0',
        }}
      />
      {/* wax-ish seal */}
      <div
        style={{
          position: 'absolute', left: '50%', top: 250, transform: 'translate(-50%, -50%)',
          width: 116, height: 116, borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 32%, #B33A35, #7E1F1C)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
          fontFamily: BRAND.font, fontSize: 34, fontWeight: 800, color: '#F3D9C9', letterSpacing: '0.06em',
        }}
      >
        GST
      </div>
      {/* address bars */}
      <div style={{ position: 'absolute', left: 54, bottom: 110, width: 300, height: 16, borderRadius: 8, background: 'rgba(40,30,12,0.35)' }} />
      <div style={{ position: 'absolute', left: 54, bottom: 76, width: 220, height: 16, borderRadius: 8, background: 'rgba(40,30,12,0.28)' }} />
      <div style={{ position: 'absolute', left: 54, bottom: 42, width: 260, height: 16, borderRadius: 8, background: 'rgba(40,30,12,0.22)' }} />
      {/* red URGENT stamp — slaps on at LOOM 2 */}
      {stampT >= 0 && (
        <div
          style={{
            position: 'absolute', right: 38, bottom: 60,
            transform: `rotate(-11deg) scale(${2.4 - 1.4 * stampSp})`,
            opacity: Math.min(1, stampT / 2) * 0.92,
            border: '5px solid #B62E28', borderRadius: 10, padding: '10px 22px',
            fontFamily: BRAND.font, fontSize: 36, fontWeight: 800, color: '#B62E28', letterSpacing: '0.14em',
          }}
        >
          NOTICE
        </div>
      )}
    </div>
  )
}

export const C18: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const hits1 = LOOMS.map((f, i) => ({ f, s: 0.7 + i * 0.12 }))
  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.015) * 5

  // harsh flickering spotlight in act 1
  const flicker = 0.7 + Math.sin(frame * 1.7) * 0.07 + Math.sin(frame * 0.41) * 0.08
  const spotUp = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' })

  // act 2: turnover bar fills gently to 31% of threshold
  const barP = interpolate(frame, [BAR_START, BAR_START + 58], [0, 0.31], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  })
  const chipSp = spring({ frame: Math.max(0, frame - CHIP), fps, config: { damping: 12, stiffness: 150, mass: 0.8 } })

  return (
    <AbsoluteFill style={{ background: '#070706', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE ENVELOPE ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop base="#070706" glowColor="rgba(150,35,30,0.10)" />
          {/* harsh flickering spotlight cone */}
          <AbsoluteFill
            style={{
              opacity: spotUp * flicker,
              background: 'radial-gradient(60% 42% at 50% 30%, rgba(245,235,210,0.16) 0%, transparent 70%)',
            }}
          />
          {/* heavy vignette */}
          <AbsoluteFill style={{ background: 'radial-gradient(95% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.7) 100%)' }} />
          <DriftParticles count={20} seed="dread" color="rgba(220,190,140,0.4)" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.18]} hits={hits1} driftAmp={6}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 330 }}>
              <KineticWords from={10} to={62} text="You know this envelope." size={64} accentWords={[3]} />
            </AbsoluteFill>

            <Envelope />

            {/* loom flashes */}
            {LOOMS.map((f, i) => (
              <GlowBurst key={i} at={f} x={540} y={1000} color={`rgba(180,45,40,${0.18 + i * 0.05})`} size={1300} hold={22} />
            ))}

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 320 }}>
              <KineticWords from={96} to={WHIP_1 - 2} text="The fear is optional." size={62} accentWords={[3]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={150} delay={20} strength={0.05} />
          <Grain opacity={0.1} />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE CALM ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <GridFloor speed={1.6} opacity={0.12} />
          <DriftParticles count={16} seed="calm" color="rgba(255,170,60,0.5)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.08]} hits={[{ f: WHIP_1 + 8, s: 0.6 }, { f: CHIP, s: 0.45 }]} driftAmp={5}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 270 }}>
              <KineticWords from={WHIP_1 + 10} to={CHIP + 8} text="Here's the same GST." size={56} accentWords={[3]} />
            </AbsoluteFill>

            {/* GST Radar dashboard card — floats with slight 3D orbit */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div
                style={{
                  transform: `rotateY(${camY}deg) rotateX(2deg) translateY(-40px) scale(${0.94 + 0.06 * spring({ frame: Math.max(0, frame - (WHIP_1 + 8)), fps, config: { damping: 13, stiffness: 140 } })})`,
                  width: 860, background: 'rgba(24,24,22,0.93)', borderRadius: 36,
                  border: '1.5px solid rgba(255,138,0,0.25)',
                  padding: '42px 50px 46px',
                  boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 90px rgba(255,138,0,0.10)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GridMark size={30} />
                    </div>
                    <span style={{ fontSize: 32, fontWeight: 800, color: BRAND.paper }}>GST Radar</span>
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 700, color: BRAND.textDim }}>auto-tracked</span>
                </div>

                <div style={{ fontSize: 24, fontWeight: 600, color: BRAND.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Turnover this year</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 4 }}>
                  <Ticker from={BAR_START} duration={58} value={1240000} size={78} />
                  <span style={{ fontSize: 30, fontWeight: 700, color: BRAND.textDim }}>of ₹40,00,000</span>
                </div>

                {/* threshold bar — fills gently, glowing head */}
                <div style={{ marginTop: 28, height: 26, borderRadius: 14, background: 'rgba(250,249,247,0.1)', position: 'relative', overflow: 'visible' }}>
                  <div
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${barP * 100}%`, borderRadius: 14,
                      background: `linear-gradient(90deg, rgba(255,138,0,0.55), ${BRAND.mango})`,
                      boxShadow: '0 0 30px rgba(255,138,0,0.45)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute', top: '50%', left: `${barP * 100}%`,
                      transform: 'translate(-50%,-50%)',
                      width: 18 + Math.sin(frame * 0.4) * 3, height: 18 + Math.sin(frame * 0.4) * 3,
                      borderRadius: '50%', background: BRAND.mango,
                      boxShadow: '0 0 26px rgba(255,138,0,0.9)',
                      opacity: barP > 0.005 ? 1 : 0,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: BRAND.mango }}>{Math.round(barP * 100)}% of threshold</span>
                  <span style={{ fontSize: 24, fontWeight: 600, color: BRAND.textDim }}>registration not needed yet</span>
                </div>

                {/* the exhale chip */}
                {frame >= CHIP && (
                  <div
                    style={{
                      marginTop: 34, display: 'inline-flex', alignItems: 'center', gap: 14,
                      transform: `translateY(${(1 - chipSp) * 60}px) scale(${0.8 + chipSp * 0.2})`,
                      opacity: chipSp,
                      background: 'rgba(34,197,94,0.14)', border: '2px solid rgba(34,197,94,0.6)',
                      borderRadius: 999, padding: '18px 36px',
                      fontSize: 36, fontWeight: 800, color: BRAND.green,
                      boxShadow: `0 0 ${30 + Math.sin(frame * 0.15) * 12}px rgba(34,197,94,0.35)`,
                    }}
                  >
                    You're fine ✓
                  </div>
                )}
              </div>
            </AbsoluteFill>

            <GlowBurst at={CHIP} x={540} y={1180} color="rgba(34,197,94,0.32)" size={1100} />
            <Burst at={CHIP} x={540} y={1160} count={14} seed="fine" color={BRAND.green} spread={300} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 260 }}>
              <KineticWords from={250} to={WHIP_2} text="Breathe. We're watching." size={60} accentWords={[2]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={130} delay={WHIP_1 + 18} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="We watch the thresholds. You sell." accentWords={[5]} />

      {/* ============ SOUND DESIGN ============ */}
      {LOOMS.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={18}>
          <Audio src={staticFile('impact.wav')} volume={0.32 + i * 0.07} />
        </Sequence>
      ))}
      <Sequence from={WHIP_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.45} />
      </Sequence>
      {[172, 184, 196, 208, 218].map((f, i) => (
        <Sequence key={`k${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={CHIP} durationInFrames={14}>
        <Audio src={staticFile('impact.wav')} volume={0.26} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
