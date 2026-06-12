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
 * Ad #19 — "The Bio Link Upgrade" (15s, 9:16, 30fps = 450 frames)
 * Chaos → silence. Villain: 47 price-DMs a day.
 *
 * ACT 1 · THE FLOOD (0–163)
 *   0–40   Insta-style bio card floats in, "DM to order 🙏" highlighted
 *   8–48   hook "Your bio says DM to order." — kinetic
 *   54     first "price?" DM chip lands (impact)
 *   66→139 DM chips flood in — gaps shrink 12→10→8→…→3 (speed ramp, shakes)
 *   90     ×47 counter starts spinning, bio line starts trembling
 *   126–158 "Every. Single. Day." — kinetic, riser building
 *   164    WHIP UP → the upgrade
 *
 * ACT 2 · THE UPGRADE (164–301)
 *   172    bio card lands clean (impact) — grid floor, slow orbit
 *   180    bio line SNAPS to a mango store-link pill (glow burst, key click)
 *   196    "Link in bio. Actually a store." — kinetic
 *   228    silent ORDER 1 ₹1,499 (ping) · 248 ORDER 2 ₹899 (ping) — neat stack
 *   268    "No price-DMs. Just orders." — kinetic
 *   302    WHIP → end card
 *
 * ACT 3 · END CARD (310–450)
 *   logo assembly + tagline "One link. Zero price-DMs." + CTA sweep
 */

const DMS: { f: number; x: number; y: number; r: number; t: string }[] = [
  { f: 54, x: 90, y: 420, r: -6, t: 'price?' },
  { f: 66, x: 600, y: 330, r: 5, t: 'price??' },
  { f: 78, x: 200, y: 1300, r: -4, t: 'kitna?' },
  { f: 88, x: 620, y: 1200, r: 7, t: 'rate batao' },
  { f: 96, x: 110, y: 800, r: 4, t: 'price?' },
  { f: 104, x: 640, y: 580, r: -7, t: 'cod hai?' },
  { f: 110, x: 300, y: 1480, r: 3, t: 'kitna ka hai?' },
  { f: 116, x: 560, y: 900, r: -5, t: 'price please' },
  { f: 121, x: 70, y: 1060, r: 6, t: 'price??' },
  { f: 125, x: 600, y: 1400, r: -3, t: 'last price?' },
  { f: 129, x: 260, y: 250, r: 4, t: 'kitna?' },
  { f: 132, x: 520, y: 700, r: -6, t: 'price?' },
  { f: 135, x: 140, y: 1340, r: 5, t: 'rate?' },
  { f: 137, x: 590, y: 1010, r: -4, t: 'price???' },
  { f: 139, x: 330, y: 540, r: 6, t: 'kitna?' },
]
const COUNTER = 90
const WHIP_1 = 164
const SNAP = 180
const ORDER_1 = 228
const ORDER_2 = 248
const WHIP_2 = 302
const END = 310

/** One incoming DM bubble — springs in, then floats angrily. */
const DmChip: React.FC<{ idx: number }> = ({ idx }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const d = DMS[idx]
  const t = frame - d.f
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } })
  const bob = Math.sin(frame * 0.09 + idx * 1.9) * 7
  const late = idx / DMS.length // later chips = hotter
  return (
    <div
      style={{
        position: 'absolute', left: d.x, top: d.y + bob,
        transform: `scale(${0.5 + 0.5 * sp}) rotate(${d.r + (1 - sp) * 14}deg)`,
        opacity: Math.min(1, sp * 1.8),
        background: 'rgba(250,249,247,0.94)',
        border: late > 0.5 ? '2px solid rgba(229,72,77,0.55)' : '2px solid transparent',
        borderRadius: '26px 26px 26px 6px', padding: '16px 28px',
        fontFamily: BRAND.font, fontSize: 32, fontWeight: 700, color: BRAND.ink,
        boxShadow: '0 16px 50px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {d.t}
    </div>
  )
}

/** Quiet order card for act 2 — stacks neatly. */
const QuietOrder: React.FC<{ at: number; amount: string; body: string; offsetY: number }> = ({ at, amount, body, offsetY }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 160, mass: 0.7 } })
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: offsetY,
        width: 800, transform: `translateX(-50%) translateY(${(sp - 1) * 180}px) scale(${0.94 + 0.06 * sp})`,
        opacity: Math.min(1, sp * 1.7),
        background: 'rgba(252,251,249,0.97)', borderRadius: 26, padding: '22px 28px',
        display: 'flex', alignItems: 'center', gap: 20, fontFamily: BRAND.font,
        boxShadow: '0 22px 70px rgba(255,138,0,0.2), 0 10px 32px rgba(0,0,0,0.5)',
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

/** The Insta-style bio card. mode 'dm' = old bio, 'link' = upgraded. */
const BioCard: React.FC<{ mode: 'dm' | 'link'; tremble: number; camY: number }> = ({ mode, tremble, camY }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const snapSp = spring({ frame: Math.max(0, frame - SNAP), fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })
  const shakeX = Math.sin(frame * 1.3) * tremble
  return (
    <div
      style={{
        width: 740, transform: `rotateY(${camY}deg) rotateX(2deg)`,
        background: 'rgba(252,251,249,0.97)', borderRadius: 34, padding: '40px 44px',
        fontFamily: BRAND.font,
        boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 70px rgba(255,138,0,0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* gradient-ring avatar */}
        <div style={{ width: 120, height: 120, borderRadius: '50%', padding: 5, background: 'linear-gradient(45deg, #F9CE34, #EE2A7B, #6228D7)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff' }}>
            <span style={{ fontSize: 46, fontWeight: 800, color: BRAND.mango }}>K</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: BRAND.ink }}>kavya.crafts</div>
          <div style={{ display: 'flex', gap: 26, marginTop: 8, fontSize: 23, fontWeight: 600, color: 'rgba(26,26,24,0.55)' }}>
            <span><b style={{ color: BRAND.ink }}>312</b> posts</span>
            <span><b style={{ color: BRAND.ink }}>8,402</b> followers</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 27, fontWeight: 600, color: 'rgba(26,26,24,0.75)', marginTop: 26 }}>Handmade jewellery ✨ Jaipur</div>

      {mode === 'dm' ? (
        <div
          style={{
            marginTop: 16, display: 'inline-block', transform: `translateX(${shakeX}px)`,
            background: tremble > 0.5 ? 'rgba(229,72,77,0.12)' : 'rgba(26,26,24,0.06)',
            border: tremble > 0.5 ? '2px solid rgba(229,72,77,0.5)' : '2px solid transparent',
            borderRadius: 14, padding: '12px 22px',
            fontSize: 30, fontWeight: 700, color: BRAND.ink,
          }}
        >
          DM to order 🙏
        </div>
      ) : (
        <div
          style={{
            marginTop: 18, display: 'inline-block',
            transform: `scale(${0.6 + 0.4 * snapSp})`,
            opacity: Math.min(1, snapSp * 1.6),
            filter: `blur(${Math.max(0, (1 - snapSp) * 8)}px)`,
            background: BRAND.mango, borderRadius: 999, padding: '18px 36px',
            fontSize: 31, fontWeight: 800, color: BRAND.ink,
            boxShadow: `0 0 ${28 + Math.sin(frame * 0.18) * 12}px rgba(255,138,0,0.55)`,
          }}
        >
          🛍 launchgrid.in/kavya-crafts
        </div>
      )}
    </div>
  )
}

export const C19: React.FC = () => {
  const frame = useCurrentFrame()

  // hits escalate with the flood — every other DM punches the camera
  const hits1 = DMS.filter((_, i) => i % 2 === 0).map((d, i) => ({ f: d.f, s: 0.35 + i * 0.12 }))
  const tremble = interpolate(frame, [COUNTER, WHIP_1], [0, 7], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.016) * 5

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · THE FLOOD ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop glowColor="rgba(229,72,77,0.10)" />
          {/* stress glow builds with the flood */}
          <AbsoluteFill
            style={{
              opacity: interpolate(frame, [COUNTER, WHIP_1], [0, 0.7], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              background: 'radial-gradient(80% 50% at 50% 50%, rgba(229,72,77,0.14) 0%, transparent 70%)',
            }}
          />
          <DriftParticles count={20} seed="flood" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.12]} hits={hits1} driftAmp={7}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 250 }}>
              <KineticWords from={8} to={52} text="Your bio says DM to order." size={58} accentWords={[3, 4, 5]} />
            </AbsoluteFill>

            {/* bio card center, perspective float */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
              <div style={{ transform: `translateY(${Math.sin(frame * 0.04) * 9 - 40}px)` }}>
                <BioCard mode="dm" tremble={tremble} camY={Math.sin(frame * 0.02) * 4} />
              </div>
            </AbsoluteFill>

            {/* the flood */}
            {DMS.map((_, i) => <DmChip key={i} idx={i} />)}

            {/* spinning counter */}
            {frame >= COUNTER && (
              <div style={{ position: 'absolute', top: 380, width: '100%', textAlign: 'center' }}>
                <Ticker from={COUNTER} duration={WHIP_1 - COUNTER - 6} value={47} prefix="×" size={110} color="#E5484D" />
                <div style={{ fontSize: 27, fontWeight: 700, color: BRAND.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>price-DMs today</div>
              </div>
            )}

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 300 }}>
              <KineticWords from={126} to={WHIP_1 - 2} text="Every. Single. Day." size={70} accentWords={[2]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={140} delay={12} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE UPGRADE ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <AnimatedBackdrop glowColor="rgba(255,138,0,0.12)" />
          <GridFloor speed={2} opacity={0.13} />
          <DriftParticles count={16} seed="clean" color="rgba(255,170,60,0.55)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.1]} hits={[{ f: WHIP_1 + 8, s: 0.7 }, { f: SNAP, s: 0.8 }, { f: ORDER_1, s: 0.7 }, { f: ORDER_2, s: 0.8 }]} driftAmp={6}>
            {/* upgraded bio card */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 290, perspective: 1300 }}>
              <BioCard mode="link" tremble={0} camY={camY} />
            </AbsoluteFill>

            <GlowBurst at={SNAP} x={540} y={760} color="rgba(255,138,0,0.4)" size={1100} />
            <Burst at={SNAP} x={540} y={780} count={16} seed="snap" />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 160 }}>
              <KineticWords from={196} to={ORDER_1 - 4} text="Link in bio. Actually a store." size={54} accentWords={[5]} />
            </AbsoluteFill>

            {/* silent, neat order stack */}
            <AbsoluteFill style={{ top: 1180 }}>
              <QuietOrder at={ORDER_1} amount="₹1,499" body="Ananya ordered Terracotta Jhumkas" offsetY={0} />
              <QuietOrder at={ORDER_2} amount="₹899" body="Rahul ordered Beaded Bracelet" offsetY={170} />
            </AbsoluteFill>
            <GlowBurst at={ORDER_1} x={540} y={1260} color="rgba(255,138,0,0.32)" size={900} />
            <Burst at={ORDER_2} x={540} y={1420} count={12} seed="qo2" />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 220 }}>
              <KineticWords from={268} to={WHIP_2} text="No price-DMs. Just orders." size={56} accentWords={[3]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={120} delay={WHIP_1 + 16} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="One link. Zero price-DMs." accentWords={[2]} />

      {/* ============ SOUND DESIGN ============ */}
      {DMS.map((d, i) => (
        <Sequence key={i} from={d.f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.3 + (i / DMS.length) * 0.35} />
        </Sequence>
      ))}
      {[DMS[0].f, DMS[5].f, DMS[10].f].map((f, i) => (
        <Sequence key={`im${i}`} from={f} durationInFrames={14}>
          <Audio src={staticFile('impact.wav')} volume={0.25 + i * 0.1} />
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
      <Sequence from={SNAP} durationInFrames={14}>
        <Audio src={staticFile('impact.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={SNAP} durationInFrames={4}>
        <Audio src={staticFile('key.wav')} volume={0.6} />
      </Sequence>
      {[ORDER_1, ORDER_2].map((f, i) => (
        <Sequence key={`p${i}`} from={f} durationInFrames={40}>
          <Audio src={staticFile('ping.wav')} volume={0.85 - i * 0.1} />
        </Sequence>
      ))}
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
