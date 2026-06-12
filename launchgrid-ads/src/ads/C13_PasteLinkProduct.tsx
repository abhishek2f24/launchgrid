import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'
import {
  AnimatedBackdrop, Burst, CameraRig, DriftParticles, GlowBurst, Grain, GridFloor,
  KineticWords, LightSweep, Ticker, whipIn, whipOut,
} from '../components/cinema'
import { EndCardCinematic } from '../components/EndCardCinematic'

/**
 * Ad #13 — "Paste Link → Product" (15s, 9:16, 30fps = 450 frames)
 * Hook: "Watch me steal my own product from Meesho."
 *
 * ACT 1 · THE STEAL (0–95)
 *   6–54   hook "Watch me steal my own product." — kinetic, accent "steal"
 *   26     Meesho URL pill flies in from depth (floating glass)
 *   58     COPY pressed — clipboard white flash, punch, "Copied ✓" chip
 *   70–94  "Now watch." — riser building under it
 *   96     WHIP UP → the import desk
 *
 * ACT 2 · THE IMPORT (96–297)
 *   104    LaunchGrid import card lands (impact) — orbit camera, grid floor
 *   118    PASTE — URL pops into the input (punch, burst, key)
 *   134    Import button flash → autofill begins
 *   146    photo placeholder gradient sweeps in (key)
 *   156–204 title types itself, char by char (key ticks)
 *   208–224 source price counts up to ₹289 (key)
 *   228–258 margin slider drags ₹289 → ₹449, profit chip updates live (ping on lock)
 *   272    PUBLISH slams in (riser from 244, impact, burst, big punch)
 *   298    WHIP → end card
 *
 * ACT 3 · END CARD (306–450)
 *   logo assembly + "Stop uploading. Start importing." + CTA pill sweep
 */

const COPY = 58
const WHIP_1 = 96
const PASTE = 118
const IMPORT = 134
const PHOTO = 146
const TITLE_START = 156
const CHAR_F = 2
const TITLE = 'Floral Kurta Set — Rayon'
const PRICE = 208
const SLIDER = 228
const SLIDER_END = 258
const PUBLISH = 272
const WHIP_2 = 298
const END = 306

/** Element flying in from depth: blurred + scaled out → snaps into place. */
const DepthIn: React.FC<{ at: number; children: React.ReactNode; from?: number }> = ({ at, children, from = 0.55 }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 150, mass: 0.8 } })
  const blur = interpolate(t, [0, 10], [14, 0], { extrapolateRight: 'clamp' })
  return (
    <div style={{ transform: `scale(${from + (1 - from) * sp}) translateY(${(1 - sp) * 40}px)`, opacity: Math.min(1, sp * 1.8), filter: `blur(${blur}px)` }}>
      {children}
    </div>
  )
}

/** Label + content row inside the import card — slides in when its beat hits. */
const FieldRow: React.FC<{ at: number; label: string; children: React.ReactNode }> = ({ at, label, children }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 14, stiffness: 140 } })
  return (
    <div style={{ opacity: sp, transform: `translateX(${(1 - sp) * 60}px)`, marginTop: 20 }}>
      <div style={{ fontSize: 21, fontWeight: 700, color: 'rgba(26,26,24,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

export const C13: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.016) * 5

  // Act 1: copy press
  const copyFlash = interpolate(frame, [COPY, COPY + 2, COPY + 9], [0, 0.45, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const copyBtn = interpolate(frame, [COPY, COPY + 2, COPY + 10], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const copiedSp = spring({ frame: Math.max(0, frame - COPY - 2), fps, config: { damping: 12, stiffness: 170 } })

  // Act 2: paste pop
  const pasteSp = spring({ frame: Math.max(0, frame - PASTE), fps, config: { damping: 11, stiffness: 190, mass: 0.7 } })
  const importFlash = interpolate(frame, [IMPORT, IMPORT + 2, IMPORT + 12], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // title types itself
  const typedChars = Math.max(0, Math.min(TITLE.length, Math.floor((frame - TITLE_START) / CHAR_F)))
  const cursorOn = Math.floor(frame / 12) % 2 === 0 || (frame >= TITLE_START && typedChars < TITLE.length)

  // margin slider ₹289 → ₹449
  const sliderP = interpolate(frame, [SLIDER, SLIDER_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  })
  const yourPrice = Math.round(289 + 160 * sliderP)
  const profit = yourPrice - 289

  // publish slam
  const pubSp = spring({ frame: Math.max(0, frame - PUBLISH), fps, config: { damping: 12, stiffness: 160, mass: 0.9 } })

  const keyFrames: number[] = []
  for (let i = 0; i < TITLE.length; i += 3) keyFrames.push(TITLE_START + i * CHAR_F)

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE STEAL ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.10)" />
          <DriftParticles count={22} seed="steal" />
          <CameraRig push={[0, WHIP_1, 1.0, 1.09]} hits={[{ f: COPY, s: 0.55 }]} driftAmp={7}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 330 }}>
              <KineticWords from={6} to={WHIP_1} text="Watch me steal my own product." size={64} accentWords={[2]} maxWidth={840} />
            </AbsoluteFill>

            {/* the Meesho URL pill — floating glass */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
              <DepthIn at={26}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 24,
                    transform: `rotateX(${3 + Math.sin(frame * 0.03) * 1.5}deg) translateY(${Math.sin(frame * 0.04) * 8}px)`,
                    background: 'rgba(36,36,33,0.8)', border: '1.5px solid rgba(255,255,255,0.14)',
                    borderRadius: 999, padding: '26px 36px',
                    boxShadow: '0 36px 110px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #6E2B8A, #C44569)', flexShrink: 0 }} />
                  <span style={{ fontSize: 33, fontWeight: 700, color: BRAND.paper, whiteSpace: 'nowrap' }}>
                    meesho.com/p/<span style={{ color: BRAND.mango }}>kurta-set-9281</span>
                  </span>
                  <div
                    style={{
                      background: BRAND.mango, borderRadius: 14, padding: '14px 26px',
                      fontSize: 26, fontWeight: 800, color: BRAND.ink,
                      transform: `scale(${1 + copyBtn * 0.12})`,
                      boxShadow: `0 0 ${20 + copyBtn * 60}px rgba(255,138,0,${0.3 + copyBtn * 0.6})`,
                    }}
                  >
                    COPY
                  </div>
                </div>
              </DepthIn>

              {/* Copied ✓ chip */}
              {frame >= COPY + 2 && (
                <div
                  style={{
                    position: 'absolute', top: 740, left: '50%',
                    transform: `translateX(-50%) translateY(${(1 - copiedSp) * 40}px) scale(${0.7 + copiedSp * 0.3})`,
                    opacity: copiedSp,
                    background: 'rgba(34,197,94,0.16)', border: '1.5px solid rgba(34,197,94,0.6)',
                    borderRadius: 999, padding: '14px 32px', fontSize: 30, fontWeight: 800, color: BRAND.green,
                  }}
                >
                  Copied ✓
                </div>
              )}
            </AbsoluteFill>

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 380 }}>
              <KineticWords from={70} to={WHIP_1} text="Now watch." size={56} accentWords={[1]} />
            </AbsoluteFill>

            <GlowBurst at={COPY} x={540} y={960} color="rgba(255,138,0,0.35)" size={1100} />
            <Burst at={COPY} x={750} y={980} count={12} seed="copy" />
          </CameraRig>

          {/* clipboard flash */}
          <AbsoluteFill style={{ background: '#fff', opacity: copyFlash, pointerEvents: 'none' }} />
          <LightSweep period={130} delay={10} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE IMPORT ============ */}
      {frame >= WHIP_1 && frame < WHIP_2 + 10 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <GridFloor speed={2.6} opacity={0.13} />
          <DriftParticles count={16} seed="import" color="rgba(255,170,60,0.5)" />

          <CameraRig
            push={[WHIP_1, WHIP_2, 1.02, 1.13]}
            hits={[
              { f: WHIP_1 + 8, s: 0.7 }, { f: PASTE, s: 0.6 }, { f: PHOTO, s: 0.35 },
              { f: SLIDER_END, s: 0.5 }, { f: PUBLISH, s: 1.15 },
            ]}
            driftAmp={6}
          >
            {/* the import card, floating in 3D */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <DepthIn at={WHIP_1 + 8}>
                <div
                  style={{
                    width: 780, transform: `rotateY(${camY}deg) rotateX(2deg) translateY(-30px)`,
                    background: BRAND.paper, borderRadius: 32, padding: '30px 34px 34px',
                    boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 90px rgba(255,138,0,0.12)',
                  }}
                >
                  {/* paste input */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
                      border: `2.5px solid ${frame >= PASTE && frame < PASTE + 14 ? BRAND.mango : 'rgba(26,26,24,0.14)'}`,
                      borderRadius: 18, padding: '18px 22px', background: '#fff',
                      boxShadow: frame >= PASTE && frame < PASTE + 20 ? '0 0 40px rgba(255,138,0,0.35)' : undefined,
                    }}
                  >
                    {frame < PASTE ? (
                      <span style={{ fontSize: 27, fontWeight: 600, color: 'rgba(26,26,24,0.35)' }}>Paste any product link…</span>
                    ) : (
                      <span style={{ fontSize: 27, fontWeight: 700, color: BRAND.ink, display: 'inline-block', transform: `scale(${1.25 - 0.25 * pasteSp})`, transformOrigin: 'left center' }}>
                        meesho.com/p/<span style={{ color: BRAND.mango }}>kurta-set-9281</span>
                      </span>
                    )}
                    <div
                      style={{
                        background: BRAND.ink, color: BRAND.paper, borderRadius: 12, padding: '12px 24px',
                        fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap',
                        transform: `scale(${1 + importFlash * 0.1})`,
                        boxShadow: `0 0 ${importFlash * 50}px rgba(255,138,0,${importFlash * 0.7})`,
                      }}
                    >
                      Import →
                    </div>
                  </div>

                  {/* photo placeholder gradient */}
                  <FieldRow at={PHOTO} label="Photos">
                    <div style={{ display: 'flex', gap: 14 }}>
                      {['linear-gradient(135deg, #7A1F3D, #C44569)', 'linear-gradient(135deg, #1F3D7A, #4569C4)', 'linear-gradient(135deg, #3D7A1F, #69C445)'].map((g, i) => (
                        <div key={i} style={{ width: 150, height: 150, borderRadius: 16, background: g, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: -30, bottom: -30, width: 50, left: interpolate(frame, [PHOTO + 4 + i * 4, PHOTO + 22 + i * 4], [-90, 200], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), transform: 'rotate(14deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} />
                        </div>
                      ))}
                    </div>
                  </FieldRow>

                  {/* title types itself */}
                  <FieldRow at={TITLE_START - 4} label="Title">
                    <div style={{ fontSize: 36, fontWeight: 800, color: BRAND.ink, minHeight: 46 }}>
                      {TITLE.slice(0, typedChars)}
                      <span style={{ opacity: cursorOn && frame < TITLE_START + TITLE.length * CHAR_F + 16 ? 1 : 0, color: BRAND.mango }}>|</span>
                    </div>
                  </FieldRow>

                  {/* source price counts up */}
                  <FieldRow at={PRICE} label="Source price">
                    <Ticker from={PRICE} duration={16} value={289} size={42} color={BRAND.ink} />
                  </FieldRow>

                  {/* margin slider */}
                  <FieldRow at={SLIDER - 6} label="Your price">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
                      <div style={{ position: 'relative', width: 420, height: 14, borderRadius: 7, background: 'rgba(26,26,24,0.12)' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 420 * sliderP, borderRadius: 7, background: BRAND.mango }} />
                        <div
                          style={{
                            position: 'absolute', left: 420 * sliderP - 21, top: -14,
                            width: 42, height: 42, borderRadius: 21, background: BRAND.mango,
                            border: '4px solid #fff',
                            boxShadow: `0 4px 20px rgba(255,138,0,${0.4 + sliderP * 0.4})`,
                            transform: `scale(${sliderP > 0 && sliderP < 1 ? 1.15 : 1})`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 46, fontWeight: 800, color: BRAND.ink, fontVariantNumeric: 'tabular-nums' }}>₹{yourPrice}</span>
                    </div>
                  </FieldRow>

                  {/* publish slams in */}
                  {frame >= PUBLISH && (
                    <div
                      style={{
                        marginTop: 26, background: BRAND.mango, borderRadius: 18, padding: '22px 0',
                        textAlign: 'center', fontSize: 34, fontWeight: 800, color: BRAND.ink,
                        transform: `scale(${2.1 - 1.1 * pubSp})`,
                        filter: `blur(${Math.max(0, (1 - pubSp) * 10)}px)`,
                        opacity: Math.min(1, (frame - PUBLISH) / 3),
                        boxShadow: `0 10px ${40 + Math.sin(frame * 0.2) * 14}px rgba(255,138,0,0.5)`,
                      }}
                    >
                      Publish →
                    </div>
                  )}
                </div>
              </DepthIn>
            </AbsoluteFill>

            {/* live profit chip — floats beside the card */}
            {frame >= SLIDER && (
              <div
                style={{
                  position: 'absolute', left: 600, top: 1430,
                  transform: `scale(${1 + (sliderP > 0 && sliderP < 1 ? Math.sin(frame * 0.9) * 0.02 : 0) + interpolate(frame, [SLIDER_END, SLIDER_END + 3, SLIDER_END + 14], [0, 0.14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}) rotate(-3deg)`,
                  background: 'rgba(34,197,94,0.14)', border: '2px solid rgba(34,197,94,0.65)',
                  borderRadius: 22, padding: '16px 30px',
                  boxShadow: '0 18px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.textDim }}>Margin / sale</div>
                <div style={{ fontSize: 46, fontWeight: 800, color: BRAND.green, fontVariantNumeric: 'tabular-nums' }}>+₹{profit}</div>
              </div>
            )}

            <KineticWords from={WHIP_1 + 14} to={PASTE + 26} text="No photoshoot. No typing." size={50} accentWords={[1, 3]} />

            <GlowBurst at={PASTE} x={540} y={760} color="rgba(255,138,0,0.4)" size={1000} />
            <Burst at={PASTE} x={540} y={700} count={14} seed="paste" />
            <GlowBurst at={SLIDER_END} x={620} y={1440} color="rgba(34,197,94,0.35)" size={800} />
            <GlowBurst at={PUBLISH} x={540} y={1300} color="rgba(255,138,0,0.5)" size={1300} />
            <Burst at={PUBLISH} x={540} y={1280} count={22} seed="pub" spread={400} />
          </CameraRig>

          <LightSweep period={120} delay={WHIP_1 + 16} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Stop uploading. Start importing." accentWords={[3]} />

      {/* ============ SOUND DESIGN ============ */}
      <Sequence from={COPY} durationInFrames={4}>
        <Audio src={staticFile('key.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={COPY} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={WHIP_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={PASTE} durationInFrames={4}>
        <Audio src={staticFile('key.wav')} volume={0.8} />
      </Sequence>
      <Sequence from={PASTE} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.35} />
      </Sequence>
      {[IMPORT, PHOTO, PRICE].map((f, i) => (
        <Sequence key={`b${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.65} />
        </Sequence>
      ))}
      {keyFrames.map((f, i) => (
        <Sequence key={`t${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.45} />
        </Sequence>
      ))}
      <Sequence from={SLIDER_END} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={PUBLISH - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={PUBLISH} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.65} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
