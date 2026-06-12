import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'
import { GridMark } from '../components/ui'
import {
  AnimatedBackdrop, Burst, CameraRig, DriftParticles, GlowBurst, Grain,
  GridFloor, KineticWords, LightSweep, whipIn, whipOut,
} from '../components/cinema'
import { EndCardCinematic } from '../components/EndCardCinematic'

/**
 * Ad #47 — "The Empty Chair Interview" (15s, 9:16, 30fps = 450 frames)
 * Villain = hesitation. We interview the business that never existed.
 * One continuous creeping push on an empty chair; questions get no answers.
 *
 * ACT 1 · THE INTERVIEW (0–275)
 *   0–14   spotlight cone fades up on an empty chair, dust drifting
 *   8–62   hook "We interviewed the business you didn't start."
 *   76–126 Q1 types: "What would you have sold?" (key ticks) → "…" chip 134
 *   152–204 Q2 types: "How many customers by now?" → "…" chip 210
 *   the whole time: light flickers, dust drifts, camera creeps closer
 *   224    riser builds under the silence
 *   252    "Why not?" SLAMS over a blackout (impact + hard shake)
 *   276    WHIP UP → the answer
 *
 * ACT 2 · THE ANSWER (276–311)
 *   286    glowing phone lands where the chair was (impact + burst)
 *   298    first order pings on the screen — ₹499
 *   300    "It's waiting." kinetic line
 *   312    → end card
 *
 * ACT 3 · END CARD (312–450)
 *   logo assembly + "It's waiting. Start it." + CTA sweep
 */

const Q1 = 'What would you have sold?'
const Q2 = 'How many customers by now?'
const Q1_AT = 76
const Q2_AT = 152
const CHAR_F = 2
const CHIP1 = 134
const CHIP2 = 210
const SLAM = 252
const WHIP_1 = 276
const LAND = 286
const ORDER = 298
const END = 312

/** Flicker noise — deterministic sin stack, occasionally dips hard. */
const flicker = (frame: number) => {
  const n =
    Math.sin(frame * 0.31) * 0.4 + Math.sin(frame * 1.13) * 0.35 + Math.sin(frame * 2.71) * 0.25
  const dip = n < -0.72 ? 0.45 : 0 // hard flicker moments
  return 0.86 + n * 0.1 - dip
}

/** Interviewer question, typed character by character. */
const TypedQuestion: React.FC<{ at: number; text: string; y: number }> = ({ at, text, y }) => {
  const frame = useCurrentFrame()
  if (frame < at) return null
  const chars = Math.min(text.length, Math.floor((frame - at) / CHAR_F))
  const cursorOn = Math.floor(frame / 12) % 2 === 0 || chars < text.length
  return (
    <div
      style={{
        position: 'absolute', top: y, width: '100%', textAlign: 'center',
        fontFamily: BRAND.font, fontSize: 52, fontWeight: 700, color: BRAND.paper,
        textShadow: '0 4px 32px rgba(0,0,0,0.7)', letterSpacing: '-0.01em',
        padding: '0 70px', boxSizing: 'border-box',
      }}
    >
      <span style={{ color: BRAND.textDim, fontSize: 30, fontWeight: 600, display: 'block', marginBottom: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        Question
      </span>
      {text.slice(0, chars)}
      <span style={{ opacity: cursorOn ? 1 : 0, color: BRAND.mango }}>|</span>
    </div>
  )
}

/** The silence chip — "…" with dots pulsing, from the empty side of the table. */
const SilenceChip: React.FC<{ at: number; to: number; y: number }> = ({ at, to, y }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0 || frame > to) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 160 } })
  const fade = interpolate(frame, [to - 8, to], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: y,
        transform: `translateX(-50%) translateY(${(1 - sp) * 36}px) scale(${0.85 + sp * 0.15})`,
        opacity: sp * fade,
        background: 'rgba(34,34,31,0.9)', border: '1.5px solid rgba(250,249,247,0.14)',
        borderRadius: 999, padding: '16px 40px', display: 'flex', gap: 12,
        boxShadow: '0 16px 50px rgba(0,0,0,0.55)',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 13, height: 13, borderRadius: 7, background: BRAND.textDim,
            opacity: 0.3 + Math.max(0, Math.sin(frame * 0.22 - i * 0.9)) * 0.7,
          }}
        />
      ))}
    </div>
  )
}

/** The empty chair — simple wooden silhouette catching the spotlight. */
const Chair: React.FC<{ lightAmt: number }> = ({ lightAmt }) => {
  const wood = '#332E27'
  const lit = `rgba(255,210,150,${0.16 * lightAmt})`
  const leg = (l: number, h: number, w = 16) => (
    <div style={{ position: 'absolute', left: l, bottom: 0, width: w, height: h, background: wood, borderRadius: 6, boxShadow: `inset 2px 4px 8px ${lit}` }} />
  )
  return (
    <div style={{ position: 'relative', width: 300, height: 470 }}>
      {/* back rest */}
      <div style={{ position: 'absolute', left: 36, top: 0, width: 228, height: 240, borderRadius: 18, border: `16px solid ${wood}`, borderBottom: 'none', boxSizing: 'border-box', boxShadow: `inset 0 6px 14px ${lit}` }} />
      <div style={{ position: 'absolute', left: 36, top: 96, width: 228, height: 16, background: wood, borderRadius: 8 }} />
      {/* seat */}
      <div style={{ position: 'absolute', left: 18, top: 236, width: 264, height: 30, background: wood, borderRadius: 12, boxShadow: `inset 0 5px 10px ${lit}, 0 14px 40px rgba(0,0,0,0.6)` }} />
      {/* legs */}
      {leg(30, 206)}
      {leg(254, 206)}
      {leg(74, 178, 13)}
      {leg(216, 178, 13)}
    </div>
  )
}

export const C47: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)

  const light = flicker(frame) * interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' })

  const slamT = frame - SLAM
  const slamSp = spring({ frame: Math.max(0, slamT), fps, config: { damping: 12, stiffness: 160, mass: 0.9 } })

  const landSp = spring({ frame: Math.max(0, frame - LAND), fps, config: { damping: 12, stiffness: 150, mass: 0.8 } })
  const orderSp = spring({ frame: Math.max(0, frame - ORDER), fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })

  // key tick frames for both typed questions (every 2nd char)
  const keyFrames: number[] = []
  for (let i = 0; i < Q1.length; i += 2) keyFrames.push(Q1_AT + i * CHAR_F)
  for (let i = 0; i < Q2.length; i += 2) keyFrames.push(Q2_AT + i * CHAR_F)

  return (
    <AbsoluteFill style={{ background: '#070706', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE INTERVIEW ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop base="#070706" glowColor="rgba(120,90,50,0.08)" />
          <DriftParticles count={30} seed="c47dust" color="rgba(255,214,160,0.55)" />

          <CameraRig
            push={[0, SLAM, 1.0, 1.26]}
            hits={[{ f: Q1_AT, s: 0.25 }, { f: Q2_AT, s: 0.3 }, { f: SLAM, s: 1.3 }]}
            driftAmp={5}
          >
            {/* volumetric spotlight cone, flickering */}
            <div
              style={{
                position: 'absolute', left: 240, top: -60, width: 600, height: 1500,
                clipPath: 'polygon(44% 0, 56% 0, 96% 100%, 4% 100%)',
                background: 'linear-gradient(to bottom, rgba(255,222,170,0.34), rgba(255,200,140,0.10) 60%, transparent 96%)',
                filter: 'blur(14px)', opacity: light,
              }}
            />
            {/* light pool on the floor */}
            <div
              style={{
                position: 'absolute', left: 540, top: 1395, width: 720, height: 170,
                transform: 'translate(-50%,-50%)', borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(255,215,160,0.22), transparent 75%)',
                opacity: light,
              }}
            />
            {/* the chair — empty the whole time */}
            <div style={{ position: 'absolute', left: '50%', top: 940, transform: `translateX(-50%) translateY(${Math.sin(frame * 0.02) * 3}px)`, filter: `brightness(${0.75 + light * 0.35})` }}>
              <Chair lightAmt={light} />
            </div>

            {/* hook */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 280 }}>
              <KineticWords from={8} to={Q1_AT - 6} text="We interviewed the business you didn't start." size={62} accentWords={[6]} maxWidth={880} />
            </AbsoluteFill>

            {/* the questions — no one answers */}
            <TypedQuestion at={Q1_AT} text={frame < Q2_AT - 8 ? Q1 : ''} y={330} />
            <SilenceChip at={CHIP1} to={Q2_AT - 8} y={760} />
            <TypedQuestion at={Q2_AT} text={frame >= Q2_AT ? Q2 : ''} y={330} />
            <SilenceChip at={CHIP2} to={SLAM - 4} y={760} />

            {/* THE SLAM — Why not? */}
            {slamT >= 0 && (
              <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,6,0.85)', opacity: Math.min(1, slamT / 5) }} />
                <div
                  style={{
                    position: 'relative', textAlign: 'center',
                    transform: `scale(${2.8 - 1.8 * slamSp})`,
                    filter: `blur(${Math.max(0, (1 - slamSp) * 18)}px)`,
                    opacity: Math.min(1, slamT / 3),
                  }}
                >
                  <div style={{ fontSize: 190, fontWeight: 800, color: BRAND.mango, letterSpacing: '-0.04em', textShadow: '0 0 120px rgba(255,138,0,0.55)' }}>
                    Why not?
                  </div>
                </div>
                <Burst at={SLAM + 3} x={540} y={930} count={18} seed="c47slam" spread={400} />
              </AbsoluteFill>
            )}
            <GlowBurst at={SLAM} x={540} y={930} color="rgba(255,138,0,0.4)" size={1300} />
          </CameraRig>

          <LightSweep period={170} delay={26} strength={0.04} />
          <Grain opacity={0.09} />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE ANSWER ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill style={{ transform: `translateY(${a2in.y}px)`, filter: a2in.blur > 0.5 ? `blur(${a2in.blur}px)` : undefined, opacity: a2in.opacity }}>
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.13)" />
          <GridFloor speed={2.4} opacity={0.13} />
          <DriftParticles count={20} seed="c47glow" color="rgba(255,170,60,0.55)" />

          <CameraRig push={[WHIP_1, END, 1.0, 1.1]} hits={[{ f: LAND, s: 0.9 }, { f: ORDER, s: 0.6 }]} driftAmp={6}>
            {/* the glowing phone where the chair was */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div
                style={{
                  width: 520, borderRadius: 56, padding: 16,
                  background: '#141412', border: '2px solid rgba(255,255,255,0.12)',
                  transform: `rotateY(${Math.sin(frame * 0.03) * 4}deg) translateY(${(1 - landSp) * 700}px) scale(${0.7 + landSp * 0.3})`,
                  opacity: Math.min(1, landSp * 1.6),
                  boxShadow: `0 60px 160px rgba(0,0,0,0.7), 0 0 ${80 + Math.sin(frame * 0.16) * 26}px rgba(255,138,0,0.4)`,
                }}
              >
                <div style={{ borderRadius: 42, overflow: 'hidden', background: BRAND.paper }}>
                  {/* store header */}
                  <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BRAND.paper }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GridMark size={22} />
                      </div>
                      <span style={{ fontSize: 28, fontWeight: 800, color: BRAND.ink }}>Kavya Ceramics</span>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: BRAND.mango }}>● Live</span>
                  </div>
                  {/* hero */}
                  <div style={{ height: 150, background: 'linear-gradient(120deg, #2E4A3F 0%, #4F7A5E 55%, #8FB996 100%)', display: 'flex', alignItems: 'flex-end', padding: 18 }}>
                    <span style={{ fontSize: 27, fontWeight: 800, color: '#fff', textShadow: '0 3px 16px rgba(0,0,0,0.4)' }}>Handmade. Fired daily.</span>
                  </div>
                  {/* products */}
                  <div style={{ display: 'flex', gap: 14, padding: 16, background: '#F2F0EC' }}>
                    {[
                      { g: 'linear-gradient(135deg, #7A5230, #C4884B)', n: 'Chai Kulhad ×4', p: '₹499' },
                      { g: 'linear-gradient(135deg, #30527A, #4B88C4)', n: 'Glazed Vase', p: '₹899' },
                    ].map((c, i) => (
                      <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 26px rgba(0,0,0,0.12)' }}>
                        <div style={{ height: 96, background: c.g }} />
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.ink }}>{c.n}</div>
                          <div style={{ fontSize: 19, fontWeight: 800, color: BRAND.mango }}>{c.p}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* order banner pings in */}
                  <div style={{ padding: '0 16px 16px', background: '#F2F0EC' }}>
                    <div
                      style={{
                        background: BRAND.ink, borderRadius: 14, padding: '14px 18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transform: `translateY(${(1 - orderSp) * 50}px) scale(${0.92 + orderSp * 0.08})`,
                        opacity: Math.min(1, orderSp * 1.7),
                      }}
                    >
                      <span style={{ fontSize: 21, fontWeight: 800, color: BRAND.paper }}>New order — ₹499</span>
                      <span style={{ fontSize: 17, fontWeight: 600, color: BRAND.textDim }}>Ananya · UPI</span>
                    </div>
                  </div>
                </div>
              </div>
            </AbsoluteFill>

            <GlowBurst at={LAND} x={540} y={960} color="rgba(255,138,0,0.45)" size={1300} />
            <Burst at={LAND} x={540} y={1100} count={20} seed="c47land" spread={420} />
            <Burst at={ORDER} x={540} y={1180} count={12} seed="c47ord" spread={260} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 260 }}>
              <KineticWords from={LAND + 8} text="It's waiting." size={76} accentWords={[1]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={110} delay={WHIP_1 + 12} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="It's waiting. Start it." accentWords={[2]} />

      {/* ============ SOUND DESIGN ============ */}
      {keyFrames.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.4} />
        </Sequence>
      ))}
      <Sequence from={Q1_AT} durationInFrames={14}>
        <Audio src={staticFile('impact.wav')} volume={0.18} />
      </Sequence>
      <Sequence from={Q2_AT} durationInFrames={14}>
        <Audio src={staticFile('impact.wav')} volume={0.22} />
      </Sequence>
      <Sequence from={SLAM - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={SLAM + 2} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={LAND} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={ORDER} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  )
}
