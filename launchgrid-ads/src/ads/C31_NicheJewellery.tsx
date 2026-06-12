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
 * Ad #31 — Niche Series: Handmade Jewellery (12s, 9:16, 30fps = 360 frames)
 * Shared niche skeleton (#31–#40): hook → mood → build → first ping → end card.
 *
 * ACT 1 · HOOK (0–60)
 *   6–58   "Selling <niche> from home?" — kinetic, accent on the niche word
 *   38     "Watch this." slams under it — punch + glow + impact
 *   60     WHIP UP → mood space (riser from 32)
 *
 * ACT 2 · THE MOOD (60–150)
 *   68     niche-palette backdrop lands (impact), palette glow breathes
 *   78/96  product cards fly in from depth — 3D orbit + bob, price pops, sweeps
 *   112    "People already love your <niche>." — kinetic
 *   150    WHIP → build (riser from 122)
 *
 * ACT 3 · THE BUILD (150–280)
 *   158    status chip "Generating your store…" appears
 *   166–212 store assembles in niche colors: header → hero → 2 products → UPI
 *          pill (key tick on every element landing)
 *   216    chip flips to "Your store is live" — punch + glow
 *   240    FIRST ORDER slams over the store — ping + burst + punch (riser 212)
 *   248    "First order. Day one." — kinetic
 *   272    WHIP → end card
 *
 * ACT 4 · END CARD (280–360)
 *   logo squares assemble + brand ping, tagline "Your <niche> store. 15 minutes."
 */

// ===== NICHE CONFIG (the only block that changes across #31–#40) =====
const ID = 'c31'
const NICHE = {
  hook1: 'Selling jewellery from home?',
  hook1Accent: [1],
  moodLine: 'People already love your jewellery.',
  moodAccent: [4],
  bgA: '#220A12',
  glow: 'rgba(183,110,121,0.22)',
  glow2: 'rgba(232,180,184,0.14)',
  glowStrong: 'rgba(183,110,121,0.5)',
  particle: 'rgba(232,180,184,0.6)',
  storeName: 'Aarna Jewels',
  heroGrad: 'linear-gradient(120deg, #4A1224 0%, #7A2640 55%, #B76E79 100%)',
  heroLine: 'New Drop — Kundan',
  products: [
    { name: 'Kundan Earrings', price: '₹799', grad: 'linear-gradient(135deg, #7A2640, #B76E79)' },
    { name: 'Oxidised Choker', price: '₹1,249', grad: 'linear-gradient(135deg, #3D0F1F, #8A4B57)' },
  ],
  orderAmount: '₹799',
  orderBody: 'Priya ordered Kundan Earrings',
  tagline: 'Your jewellery store. 15 minutes.',
  taglineAccent: [1],
}
// ===== END NICHE CONFIG =====

const HOOK_SLAM = 38
const WHIP_1 = 60
const CARD_1 = 78
const CARD_2 = 96
const MOOD_LINE = 112
const WHIP_2 = 150
const BUILD = 158
const LIVE = 216
const ORDER = 240
const WHIP_3 = 272
const END = 280

type Product = { name: string; price: string; grad: string }

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

/** Big floating product card for the mood act — 3D orbit + bob + price pop. */
const FloatCard: React.FC<{ at: number; left: number; top: number; tilt: number; p: Product }> = ({ at, left, top, tilt, p }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 140, mass: 0.8 } })
  const blur = interpolate(t, [0, 10], [16, 0], { extrapolateRight: 'clamp' })
  const orbit = tilt + Math.sin(frame * 0.02 + at) * 7
  const bob = Math.sin(frame * 0.04 + at) * 10
  const pricePop = spring({ frame: Math.max(0, t - 10), fps, config: { damping: 11, stiffness: 180 } })
  const sweep = interpolate(t, [6, 30], [-200, 560], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  })
  return (
    <div style={{ position: 'absolute', left, top, perspective: 1100 }}>
      <div
        style={{
          width: 460,
          transform: `rotateY(${orbit}deg) rotateX(3deg) translateY(${(1 - sp) * 120 + bob}px) scale(${0.55 + 0.45 * sp})`,
          opacity: Math.min(1, sp * 1.7), filter: `blur(${blur}px)`,
          background: 'rgba(252,251,249,0.97)', borderRadius: 30, overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.55)', fontFamily: BRAND.font,
        }}
      >
        <div style={{ height: 280, background: p.grad, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, bottom: -60, width: 90, left: sweep, transform: 'rotate(14deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
        </div>
        <div style={{ padding: '22px 28px 26px' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: BRAND.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: BRAND.mango, marginTop: 6, transform: `scale(${0.8 + 0.2 * pricePop})`, transformOrigin: 'left center' }}>{p.price}</div>
        </div>
      </div>
    </div>
  )
}

/** Compact shelf product card inside the assembling store. */
const ShelfCard: React.FC<{ at: number; p: Product }> = ({ at, p }) => {
  const frame = useCurrentFrame()
  const sweep = interpolate(frame - at, [4, 22], [-160, 420], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <DepthIn at={at}>
      <div style={{ width: 320, background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 14px 50px rgba(0,0,0,0.18)' }}>
        <div style={{ height: 190, background: p.grad, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, bottom: -40, width: 70, left: sweep, transform: 'rotate(14deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
        </div>
        <div style={{ padding: '14px 18px 18px', fontFamily: BRAND.font }}>
          <div style={{ fontSize: 23, fontWeight: 700, color: BRAND.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.mango, marginTop: 4 }}>{p.price}</div>
        </div>
      </div>
    </DepthIn>
  )
}

/** First-order notification card — slams in over the freshly built store. */
const OrderPing: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 480, width: 840, zIndex: 50,
        transform: `translateX(-50%) translateY(${(sp - 1) * 260}px) scale(${0.92 + 0.08 * sp}) rotate(${(1 - sp) * -4}deg)`,
        opacity: Math.min(1, sp * 1.7),
        background: 'rgba(252,251,249,0.97)', borderRadius: 28, padding: '24px 28px',
        display: 'flex', alignItems: 'center', gap: 22, fontFamily: BRAND.font,
        boxShadow: '0 24px 80px rgba(255,138,0,0.25), 0 10px 36px rgba(0,0,0,0.55)',
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
        <div style={{ fontSize: 30, fontWeight: 800, color: BRAND.ink, marginTop: 2 }}>New order — {NICHE.orderAmount}</div>
        <div style={{ fontSize: 23, color: 'rgba(26,26,24,0.6)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{NICHE.orderBody}</div>
      </div>
    </div>
  )
}

export const C31: React.FC = () => {
  const frame = useCurrentFrame()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const a3in = whipIn(frame, WHIP_2)
  const a3out = whipOut(frame, WHIP_3)
  const camY = Math.sin((frame - WHIP_2) * 0.018) * 6
  const livePop = interpolate(frame, [LIVE, LIVE + 3, LIVE + 14], [0, 0.14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const moodGlowX = 50 + Math.sin(frame * 0.015) * 18

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · HOOK ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor={NICHE.glow} />
          <DriftParticles count={22} seed={`hook-${ID}`} color={NICHE.particle} />
          <CameraRig push={[0, WHIP_1, 1.0, 1.1]} hits={[{ f: HOOK_SLAM, s: 0.9 }]} driftAmp={8}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 320 }}>
              <KineticWords from={6} to={WHIP_1} text={NICHE.hook1} size={84} accentWords={NICHE.hook1Accent} maxWidth={900} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 300 }}>
              <KineticWords from={HOOK_SLAM} to={WHIP_1} text="Watch this." size={104} accentWords={[0]} stagger={3} />
            </AbsoluteFill>
            <GlowBurst at={HOOK_SLAM} x={540} y={1080} color={NICHE.glowStrong} size={1100} />
            <Burst at={HOOK_SLAM} x={540} y={1060} count={14} seed={`hookburst-${ID}`} color={BRAND.mango} />
          </CameraRig>
          <LightSweep period={130} delay={8} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE MOOD ============ */}
      {frame >= WHIP_1 && frame < WHIP_2 + 10 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop base={NICHE.bgA} glowColor={NICHE.glow} />
          <AbsoluteFill style={{ background: `radial-gradient(80% 55% at ${moodGlowX}% 28%, ${NICHE.glow2} 0%, transparent 70%)` }} />
          <DriftParticles count={20} seed={`mood-${ID}`} color={NICHE.particle} />
          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.12]} hits={[{ f: WHIP_1 + 8, s: 0.7 }, { f: CARD_1, s: 0.6 }, { f: CARD_2, s: 0.6 }]} driftAmp={6}>
            <FloatCard at={CARD_1} left={70} top={400} tilt={8} p={NICHE.products[0]} />
            <FloatCard at={CARD_2} left={550} top={860} tilt={-9} p={NICHE.products[1]} />
            <GlowBurst at={CARD_1} x={300} y={680} color={NICHE.glowStrong} size={900} />
            <GlowBurst at={CARD_2} x={780} y={1140} color={NICHE.glowStrong} size={900} />
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 220 }}>
              <KineticWords from={MOOD_LINE} to={WHIP_2} text={NICHE.moodLine} size={58} accentWords={NICHE.moodAccent} maxWidth={880} />
            </AbsoluteFill>
          </CameraRig>
          <LightSweep period={120} delay={WHIP_1 + 14} strength={0.07} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · THE BUILD ============ */}
      {frame >= WHIP_2 && frame < WHIP_3 + 10 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a3in.y + a3out.y}px)`,
            filter: a3in.blur + a3out.blur > 0.5 ? `blur(${a3in.blur + a3out.blur}px)` : undefined,
            opacity: Math.min(a3in.opacity, a3out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor={NICHE.glow} />
          <GridFloor speed={2.6} opacity={0.12} />
          <DriftParticles count={16} seed={`build-${ID}`} color={NICHE.particle} />
          <CameraRig push={[WHIP_2, WHIP_3, 1.0, 1.12]} hits={[{ f: WHIP_2 + 8, s: 0.7 }, { f: LIVE, s: 0.8 }, { f: ORDER, s: 1.05 }]} driftAmp={6}>
            {/* status chip — generating → live */}
            <DepthIn at={BUILD}>
              <div
                style={{
                  position: 'absolute', top: 210, left: '50%',
                  transform: `translateX(-50%) scale(${1 + livePop})`,
                  background: 'rgba(30,30,28,0.9)',
                  border: `1.5px solid ${frame >= LIVE ? 'rgba(34,197,94,0.6)' : 'rgba(255,138,0,0.4)'}`,
                  borderRadius: 999, padding: '16px 36px', display: 'flex', gap: 14, alignItems: 'center',
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 7, background: frame >= LIVE ? BRAND.green : BRAND.mango, opacity: 0.5 + Math.sin(frame * 0.4) * 0.5 }} />
                <span style={{ fontSize: 30, fontWeight: 800, color: BRAND.paper, whiteSpace: 'nowrap' }}>
                  {frame >= LIVE ? 'Your store is live' : 'Generating your store…'}
                </span>
              </div>
            </DepthIn>

            {/* the store assembling in 3D, in niche colors */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div style={{ transform: `rotateY(${camY}deg) rotateX(2deg) translateY(30px)`, width: 740 }}>
                <DepthIn at={BUILD + 8}>
                  <div style={{ background: BRAND.paper, borderRadius: '28px 28px 0 0', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 30px 100px rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GridMark size={23} />
                      </div>
                      <span style={{ fontSize: 30, fontWeight: 800, color: BRAND.ink }}>{NICHE.storeName}</span>
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 700, color: frame >= LIVE ? BRAND.green : 'rgba(26,26,24,0.35)' }}>● Live</span>
                  </div>
                </DepthIn>
                <DepthIn at={BUILD + 20}>
                  <div style={{ height: 200, background: NICHE.heroGrad, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
                    <div style={{ position: 'absolute', top: -60, bottom: -60, width: 120, left: interpolate(frame, [BUILD + 24, BUILD + 50], [-200, 880], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), transform: 'rotate(12deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>{NICHE.heroLine}</span>
                  </div>
                </DepthIn>
                <div style={{ background: '#F2F0EC', padding: 22, display: 'flex', gap: 22, justifyContent: 'center' }}>
                  <ShelfCard at={BUILD + 32} p={NICHE.products[0]} />
                  <ShelfCard at={BUILD + 42} p={NICHE.products[1]} />
                </div>
                <DepthIn at={BUILD + 54}>
                  <div style={{ background: '#F2F0EC', borderRadius: '0 0 28px 28px', padding: '0 22px 24px' }}>
                    <div style={{ background: BRAND.mango, borderRadius: 18, padding: '20px 0', textAlign: 'center', fontSize: 30, fontWeight: 800, color: BRAND.ink, boxShadow: `0 10px ${40 + Math.sin(frame * 0.18) * 14}px rgba(255,138,0,0.45)` }}>
                      Buy with UPI →
                    </div>
                  </div>
                </DepthIn>
              </div>
            </AbsoluteFill>

            <GlowBurst at={LIVE} x={540} y={280} color="rgba(34,197,94,0.4)" size={800} />
            <Burst at={LIVE} x={540} y={270} count={12} seed={`live-${ID}`} color={BRAND.green} />

            {/* the first order lands on top of everything */}
            {frame >= ORDER && (
              <AbsoluteFill style={{ background: 'rgba(11,11,10,0.45)', opacity: interpolate(frame, [ORDER, ORDER + 6], [0, 1], { extrapolateRight: 'clamp' }), zIndex: 40 }} />
            )}
            <OrderPing at={ORDER} />
            <GlowBurst at={ORDER} x={540} y={620} color="rgba(255,138,0,0.45)" size={1200} />
            <Burst at={ORDER} x={540} y={580} count={18} seed={`order-${ID}`} spread={360} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 230, zIndex: 60 }}>
              <KineticWords from={ORDER + 8} to={WHIP_3} text="First order. Day one." size={62} accentWords={[0]} />
            </AbsoluteFill>
          </CameraRig>
          <LightSweep period={120} delay={WHIP_2 + 14} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 4 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline={NICHE.tagline} accentWords={NICHE.taglineAccent} />

      {/* ============ SOUND DESIGN ============ */}
      <Sequence from={HOOK_SLAM} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {[CARD_1, CARD_2].map((f, i) => (
        <Sequence key={`c${i}`} from={f} durationInFrames={16}>
          <Audio src={staticFile('impact.wav')} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={WHIP_2 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
      <Sequence from={WHIP_2 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {[BUILD + 8, BUILD + 20, BUILD + 32, BUILD + 42, BUILD + 54].map((f, i) => (
        <Sequence key={`k${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.7} />
        </Sequence>
      ))}
      <Sequence from={LIVE} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={ORDER - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={ORDER} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.9} />
      </Sequence>
      <Sequence from={ORDER} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={WHIP_3} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
