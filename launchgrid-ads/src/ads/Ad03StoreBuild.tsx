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
 * Ad #3 — "Type it. Live it." (15s, 9:16, 30fps = 450 frames)
 * Apple × Linear × Arc energy: UI floating in 3D space, orbit camera,
 * depth fly-ins, mask reveals. Target emotion: "I need this for my business."
 *
 * ACT 1 · THE IDEA (0–71)
 *   8–50   hook "It starts with one idea." — kinetic
 *   14–59  typing "boutique sarees" into a floating glass input (key ticks)
 *   60     Enter — button flash, glow burst, riser underneath
 *   72     WHIP UP → build space
 *
 * ACT 2 · THE BUILD (72–251)
 *   80     storefront canvas lands (impact) — orbit camera starts
 *   84–224 timer chip counts 00:00 → 14:32 while the store assembles:
 *          header (88) → hero banner mask-reveal (100) → product cards
 *          fly in from depth (116/126) → UPI pill punches in (148) →
 *          trust badges orbit at three depths (160+)
 *   228    "14:32" SLAMS to center (scale 2.6→1, blur→sharp, impact+shake)
 *   252    WHIP → share scene
 *
 * ACT 3 · THE PROOF (252–333)
 *   266    link pill springs in, 278 "Link copied ✓"
 *   288    ORDER 1 ₹2,499 (ping, punch, burst) · 306 ORDER 2 ₹1,299
 *   334    → end card (logo assembly, CTA sweep)
 */

const TYPED = 'boutique sarees'
const TYPE_START = 14
const CHAR_F = 3
const ENTER = 60
const WHIP_1 = 72
const SLAM = 228
const WHIP_2 = 252
const ORDER_1 = 288
const ORDER_2 = 306
const END = 334

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

const ProductCard: React.FC<{ at: number; grad: string; name: string; price: string }> = ({ at, grad, name, price }) => {
  const frame = useCurrentFrame()
  const sweep = interpolate(frame - at, [4, 22], [-160, 420], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <DepthIn at={at}>
      <div style={{ width: 330, background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 14px 50px rgba(0,0,0,0.18)' }}>
        <div style={{ height: 210, background: grad, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, bottom: -40, width: 70, left: sweep, transform: 'rotate(14deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
        </div>
        <div style={{ padding: '16px 20px 18px', fontFamily: BRAND.font }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.ink }}>{name}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.mango, marginTop: 4 }}>{price}</div>
        </div>
      </div>
    </DepthIn>
  )
}

/** Trust badge orbiting the storefront at a given depth. */
const OrbitBadge: React.FC<{ at: number; angle0: number; depth: number; label: string }> = ({ at, angle0, depth, label }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 14, stiffness: 120 } })
  const a = angle0 + frame * 0.012
  const x = 540 + Math.cos(a) * (430 + depth * 90)
  const y = 930 + Math.sin(a) * (560 + depth * 60)
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${(0.6 + depth * 0.4) * sp})`,
        opacity: sp * (0.5 + depth * 0.5), filter: depth < 0.6 ? 'blur(1.5px)' : undefined,
        background: 'rgba(30,30,28,0.9)', border: '1.5px solid rgba(255,138,0,0.4)',
        borderRadius: 999, padding: '14px 26px', fontFamily: BRAND.font,
        fontSize: 26, fontWeight: 700, color: BRAND.paper, whiteSpace: 'nowrap',
        boxShadow: '0 14px 50px rgba(0,0,0,0.45)',
      }}
    >
      {label}
    </div>
  )
}

const MiniOrder: React.FC<{ at: number; amount: string; body: string; offsetY: number }> = ({ at, amount, body, offsetY }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: offsetY,
        width: 820, transform: `translateX(-50%) translateY(${(sp - 1) * 220}px) scale(${0.93 + 0.07 * sp}) rotate(${(1 - sp) * -4}deg)`,
        opacity: Math.min(1, sp * 1.7),
        background: 'rgba(252,251,249,0.97)', borderRadius: 26, padding: '22px 28px',
        display: 'flex', alignItems: 'center', gap: 20, fontFamily: BRAND.font,
        boxShadow: '0 22px 70px rgba(255,138,0,0.22), 0 10px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ width: 58, height: 58, borderRadius: 15, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <GridMark size={30} />
      </div>
      <div>
        <div style={{ fontSize: 29, fontWeight: 800, color: BRAND.ink }}>New order — {amount}</div>
        <div style={{ fontSize: 22, color: 'rgba(26,26,24,0.6)', fontWeight: 600 }}>{body}</div>
      </div>
    </div>
  )
}

export const Ad03StoreBuild: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const typedChars = Math.max(0, Math.min(TYPED.length, Math.floor((frame - TYPE_START) / CHAR_F)))
  const cursorOn = Math.floor(frame / 14) % 2 === 0 || typedChars < TYPED.length
  const enterFlash = interpolate(frame, [ENTER, ENTER + 2, ENTER + 10], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const a3in = whipIn(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.016) * 6

  // timer: counts 0 → 14:32 between build start and the slam
  const timerSec = Math.floor(interpolate(frame, [84, SLAM - 6], [0, 14 * 60 + 32], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  }))
  const timer = `${String(Math.floor(timerSec / 60)).padStart(2, '0')}:${String(timerSec % 60).padStart(2, '0')}`

  const slamT = frame - SLAM
  const slamSp = spring({ frame: Math.max(0, slamT), fps, config: { damping: 12, stiffness: 160, mass: 0.9 } })

  const keyFrames: number[] = []
  for (let i = 0; i < TYPED.length; i += 2) keyFrames.push(TYPE_START + i * CHAR_F)

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE IDEA ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.10)" />
          <DriftParticles count={22} seed="idea" />
          <CameraRig push={[0, WHIP_1, 1.0, 1.09]} hits={[{ f: ENTER, s: 0.6 }]} driftAmp={7}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 360 }}>
              <KineticWords from={6} to={WHIP_1} text="It starts with one idea." size={64} accentWords={[3]} />
            </AbsoluteFill>

            {/* floating glass input */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
              <div
                style={{
                  width: 860, borderRadius: 30, padding: '34px 38px',
                  transform: `rotateX(${3 + Math.sin(frame * 0.03) * 1.5}deg) rotateY(${Math.sin(frame * 0.022) * 3}deg) translateY(${Math.sin(frame * 0.04) * 8}px)`,
                  background: 'rgba(36,36,33,0.78)', border: '1.5px solid rgba(255,255,255,0.14)',
                  boxShadow: '0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 600, color: BRAND.textDim, marginBottom: 14 }}>What do you want to sell?</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                  <div style={{ fontSize: 52, fontWeight: 700, color: BRAND.paper, minHeight: 64 }}>
                    {TYPED.slice(0, typedChars)}
                    <span style={{ opacity: cursorOn ? 1 : 0, color: BRAND.mango }}>|</span>
                  </div>
                  <div
                    style={{
                      background: BRAND.mango, borderRadius: 18, padding: '18px 30px',
                      fontSize: 28, fontWeight: 800, color: BRAND.ink, whiteSpace: 'nowrap',
                      boxShadow: `0 0 ${30 + enterFlash * 70}px rgba(255,138,0,${0.3 + enterFlash * 0.6})`,
                      transform: `scale(${1 + enterFlash * 0.08})`,
                    }}
                  >
                    Create →
                  </div>
                </div>
              </div>
            </AbsoluteFill>
            <GlowBurst at={ENTER} x={540} y={960} color="rgba(255,138,0,0.4)" size={1200} />
            <Burst at={ENTER} x={760} y={1000} count={14} seed="enter" />
          </CameraRig>
          <LightSweep period={130} delay={10} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE BUILD ============ */}
      {frame >= WHIP_1 && frame < WHIP_2 + 10 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <GridFloor speed={2.8} opacity={0.13} />
          <DriftParticles count={16} seed="build" color="rgba(255,170,60,0.5)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.02, 1.12]} hits={[{ f: WHIP_1 + 8, s: 0.7 }, { f: 148, s: 0.6 }, { f: SLAM, s: 1.2 }]} driftAmp={6}>
            {/* timer chip — top, counting */}
            <DepthIn at={84}>
              <div style={{ position: 'absolute', top: 190, left: '50%', transform: 'translateX(-50%)', background: 'rgba(30,30,28,0.9)', border: '1.5px solid rgba(255,138,0,0.4)', borderRadius: 999, padding: '16px 36px', display: 'flex', gap: 14, alignItems: 'center', opacity: slamT >= 0 ? Math.max(0, 1 - slamT / 6) : 1 }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, background: BRAND.mango, opacity: 0.5 + Math.sin(frame * 0.4) * 0.5 }} />
                <span style={{ fontSize: 34, fontWeight: 800, color: BRAND.paper, fontVariantNumeric: 'tabular-nums' }}>{timer}</span>
              </div>
            </DepthIn>

            {/* storefront assembling in 3D */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div style={{ transform: `rotateY(${camY}deg) rotateX(2deg)`, width: 760 }}>
                <DepthIn at={88}>
                  <div style={{ background: BRAND.paper, borderRadius: '28px 28px 0 0', padding: '24px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 30px 100px rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GridMark size={24} />
                      </div>
                      <span style={{ fontSize: 32, fontWeight: 800, color: BRAND.ink }}>Saree Haven</span>
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 700, color: BRAND.mango }}>● Live</span>
                  </div>
                </DepthIn>
                <DepthIn at={100}>
                  <div style={{ height: 230, background: 'linear-gradient(120deg, #5C1E2E 0%, #8A2B3D 45%, #C4554D 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: 26 }}>
                    <div style={{ position: 'absolute', top: -60, bottom: -60, width: 120, left: interpolate(frame, [104, 130], [-200, 900], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), transform: 'rotate(12deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                    <span style={{ fontSize: 38, fontWeight: 800, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>New Drop — Banarasi</span>
                  </div>
                </DepthIn>
                <div style={{ background: '#F2F0EC', padding: 24, display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <ProductCard at={116} grad="linear-gradient(135deg, #7A1F3D, #C44569)" name="Banarasi Silk" price="₹2,499" />
                  <ProductCard at={126} grad="linear-gradient(135deg, #1F3D7A, #4569C4)" name="Chiffon Floral" price="₹1,299" />
                </div>
                <DepthIn at={148}>
                  <div style={{ background: '#F2F0EC', borderRadius: '0 0 28px 28px', padding: '0 24px 26px' }}>
                    <div style={{ background: BRAND.mango, borderRadius: 18, padding: '22px 0', textAlign: 'center', fontSize: 32, fontWeight: 800, color: BRAND.ink, boxShadow: `0 10px ${40 + Math.sin(frame * 0.18) * 14}px rgba(255,138,0,0.45)` }}>
                      Buy with UPI →
                    </div>
                  </div>
                </DepthIn>
              </div>
            </AbsoluteFill>

            {/* orbiting trust badges at three depths */}
            <OrbitBadge at={160} angle0={-1.9} depth={1} label="UPI ✓" />
            <OrbitBadge at={168} angle0={0.4} depth={0.65} label="COD ✓" />
            <OrbitBadge at={176} angle0={2.6} depth={0.85} label="WhatsApp ✓" />

            <GlowBurst at={148} x={540} y={1280} color="rgba(255,138,0,0.35)" size={900} />

            {/* THE SLAM — 14:32 */}
            {slamT >= 0 && (
              <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(11,11,10,0.82)', position: 'absolute', inset: 0, opacity: Math.min(1, slamT / 5) }} />
                <div
                  style={{
                    position: 'relative', textAlign: 'center',
                    transform: `scale(${2.6 - 1.6 * slamSp})`,
                    filter: `blur(${Math.max(0, (1 - slamSp) * 16)}px)`,
                    opacity: Math.min(1, slamT / 3),
                  }}
                >
                  <div style={{ fontSize: 230, fontWeight: 800, color: BRAND.mango, letterSpacing: '-0.04em', textShadow: '0 0 120px rgba(255,138,0,0.5)', fontVariantNumeric: 'tabular-nums' }}>14:32</div>
                  <div style={{ fontSize: 42, fontWeight: 700, color: BRAND.paper, marginTop: 6 }}>idea → live store</div>
                </div>
                <Burst at={SLAM + 3} x={540} y={900} count={20} seed="slam" spread={420} />
              </AbsoluteFill>
            )}
          </CameraRig>
          <LightSweep period={120} delay={WHIP_1 + 16} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · THE PROOF ============ */}
      {frame >= WHIP_2 && frame < END + 8 && (
        <AbsoluteFill style={{ transform: `translateY(${a3in.y}px)`, filter: a3in.blur > 0.5 ? `blur(${a3in.blur}px)` : undefined, opacity: a3in.opacity }}>
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <DriftParticles count={20} seed="proof" />
          <CameraRig push={[WHIP_2, END, 1.0, 1.08]} hits={[{ f: ORDER_1, s: 0.9 }, { f: ORDER_2, s: 1 }]} driftAmp={7}>
            {/* link pill */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 430 }}>
              <DepthIn at={WHIP_2 + 12} from={0.7}>
                <div style={{ background: 'rgba(36,36,33,0.85)', border: '1.5px solid rgba(255,138,0,0.45)', borderRadius: 999, padding: '24px 44px', fontSize: 36, fontWeight: 700, color: BRAND.paper, boxShadow: '0 20px 70px rgba(0,0,0,0.5)' }}>
                  launchgrid.in/<span style={{ color: BRAND.mango }}>saree-haven</span>
                </div>
              </DepthIn>
              <div style={{ marginTop: 24, opacity: interpolate(frame, [WHIP_2 + 24, WHIP_2 + 30, ORDER_1], [0, 1, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), fontSize: 28, fontWeight: 700, color: BRAND.green }}>
                Link shared ✓
              </div>
            </AbsoluteFill>

            <KineticWords from={WHIP_2 + 8} to={ORDER_1 - 2} text="Share it once." size={58} />

            {/* the first orders arrive */}
            <AbsoluteFill style={{ top: 760 }}>
              <MiniOrder at={ORDER_1} amount="₹2,499" body="Ananya ordered Banarasi Silk" offsetY={0} />
              <MiniOrder at={ORDER_2} amount="₹1,299" body="Kavya ordered Chiffon Floral" offsetY={190} />
            </AbsoluteFill>
            <GlowBurst at={ORDER_1} x={540} y={840} color="rgba(255,138,0,0.4)" size={1100} />
            <Burst at={ORDER_1} x={540} y={820} count={16} seed="ord1" />
            <Burst at={ORDER_2} x={540} y={1000} count={16} seed="ord2" />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 300 }}>
              <KineticWords from={ORDER_2 + 6} text="That feeling? Yours tonight." size={56} accentWords={[2]} />
            </AbsoluteFill>
          </CameraRig>
          <LightSweep period={110} delay={WHIP_2 + 10} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Type your idea. Sell by tonight." accentWords={[5]} />

      {/* ============ SOUND DESIGN ============ */}
      {keyFrames.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={ENTER - 2} durationInFrames={34}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {[88, 100, 116, 126].map((f, i) => (
        <Sequence key={`b${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.7} />
        </Sequence>
      ))}
      <Sequence from={148} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.35} />
      </Sequence>
      <Sequence from={SLAM - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={SLAM + 2} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.65} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
      {[ORDER_1, ORDER_2].map((f, i) => (
        <React.Fragment key={`o${i}`}>
          <Sequence from={f} durationInFrames={40}>
            <Audio src={staticFile('ping.wav')} volume={0.9 - i * 0.1} />
          </Sequence>
          <Sequence from={f} durationInFrames={16}>
            <Audio src={staticFile('impact.wav')} volume={0.3} />
          </Sequence>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  )
}
