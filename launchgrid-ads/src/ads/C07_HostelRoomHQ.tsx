import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, random, Sequence, spring, staticFile,
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
 * Ad #7 — "Hostel Room HQ" (15s, 9:16, 30fps = 450 frames)
 * A business run from a hostel bed. Fairy lights, textbooks, one ping.
 *
 * ACT 1 · ROOM 214 (0–167)
 *   0–40   hostel night: fairy-light bokeh strings twinkle, textbook stack
 *          silhouettes parallax at the bottom, clock chip "11:20 PM"
 *   10–58  hook "Sem 5. Room 214." — kinetic
 *   34     study-notes card floats in (key tick), note lines write themselves
 *   96     ORDER PING — notification slams over the notes (punch, shake,
 *          glow, burst, ping+impact), fairy lights flare warm
 *   122    parcel label PRINTS — slides out of a slot below the order
 *          (key ticks at 122/128/134), barcode + COD chip
 *   140    riser building underneath
 *   168    WHIP UP (8f, motion blur) → the timetable
 *
 * ACT 2 · THE TIMETABLE (168–299)
 *   176    timeline lands (impact) — grid floor, orbit camera
 *   184    chip 9:00 AM · Lecture ✓   (gaps shrink 22→18 — speed ramp)
 *   206    chip 1:00 PM · Pack orders ✓ (+ping)
 *   224    chip 6:00 PM · Dispatch ✓ (+ping)
 *   246    "No dropout required." — kinetic
 *   268    day ticker ₹3,448 pops with glow + burst
 *   300    WHIP → end card
 *
 * ACT 3 · END CARD (308–450)
 *   logo assembly + "College + business. Both possible." (accent: Both)
 */

const HOOK_FROM = 10
const NOTES_IN = 34
const PING = 96
const LABEL = 122
const WHIP_1 = 168
const CHIP_1 = 184
const CHIP_2 = 206
const CHIP_3 = 224
const TOTAL_POP = 268
const WHIP_2 = 300
const END = 308

/** Two sagging strings of fairy lights — twinkling bokeh dots, warm flare after the ping. */
const FairyLights: React.FC<{ flareAt: number }> = ({ flareAt }) => {
  const frame = useCurrentFrame()
  const flare = interpolate(frame, [flareAt, flareAt + 6, flareAt + 40], [0, 1, 0.45], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const strings: { y0: number; sag: number; n: number; seed: string; blur: number }[] = [
    { y0: 130, sag: 120, n: 12, seed: 'fl-a', blur: 0 },
    { y0: 300, sag: 170, n: 10, seed: 'fl-b', blur: 4 },
  ]
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {strings.map((s, si) =>
        Array.from({ length: s.n }).map((_, i) => {
          const p = i / (s.n - 1)
          const x = 40 + p * 1000
          const y = s.y0 + Math.sin(p * Math.PI) * s.sag + Math.sin(frame * 0.03 + i * 1.3) * 6
          const tw = 0.35 + (Math.sin(frame * (0.07 + random(`${s.seed}-t${i}`) * 0.09) + i * 2.4) + 1) * 0.3
          const size = 10 + random(`${s.seed}-s${i}`) * 14 + s.blur * 2
          return (
            <div
              key={`${si}-${i}`}
              style={{
                position: 'absolute', left: x - size / 2, top: y - size / 2,
                width: size, height: size, borderRadius: '50%',
                background: `rgba(255,${180 + Math.round(flare * 40)},90,${tw + flare * 0.3})`,
                boxShadow: `0 0 ${18 + flare * 30}px rgba(255,160,60,${0.5 * tw + flare * 0.4})`,
                filter: s.blur ? `blur(${s.blur}px)` : undefined,
              }}
            />
          )
        }),
      )}
    </AbsoluteFill>
  )
}

/** Textbook stack silhouettes at the bottom — two depths, slow parallax bob. */
const BookStacks: React.FC = () => {
  const frame = useCurrentFrame()
  const books: { x: number; w: number; h: number; tilt: number; depth: number; tone: string }[] = [
    { x: 40, w: 300, h: 56, tilt: -1.5, depth: 1, tone: '#23231F' },
    { x: 70, w: 260, h: 50, tilt: 1, depth: 1, tone: '#2B2B26' },
    { x: 55, w: 280, h: 52, tilt: -0.5, depth: 1, tone: '#21211D' },
    { x: 740, w: 290, h: 54, tilt: 2, depth: 0.6, tone: '#1E1E1B' },
    { x: 770, w: 250, h: 48, tilt: -1, depth: 0.6, tone: '#26261F' },
  ]
  const left = books.slice(0, 3)
  const right = books.slice(3)
  const col = (set: typeof books, baseY: number, depth: number, key: string) => (
    <div
      key={key}
      style={{
        position: 'absolute', left: 0, top: baseY + Math.sin(frame * 0.012 + depth * 3) * 5 * depth,
        width: '100%', filter: depth < 0.8 ? 'blur(3px)' : undefined, opacity: 0.4 + depth * 0.55,
      }}
    >
      {set.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', left: b.x, top: -i * (b.h + 4),
            width: b.w, height: b.h, borderRadius: 8,
            background: b.tone, transform: `rotate(${b.tilt}deg)`,
            borderTop: '2px solid rgba(255,160,60,0.12)',
          }}
        />
      ))}
    </div>
  )
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {col(left, 1800, 1, 'l')}
      {col(right, 1830, 0.6, 'r')}
    </AbsoluteFill>
  )
}

/** Floating study-notes glass card; lines write themselves, dims when the ping lands. */
const StudyNotes: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - NOTES_IN
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 13, stiffness: 140, mass: 0.8 } })
  const dim = interpolate(frame, [PING, PING + 10], [1, 0.42], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pushUp = interpolate(frame, [PING, PING + 12], [0, -110], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  })
  const lines = [620, 540, 660, 480, 580]
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 560, width: 800,
        transform: `translateX(-50%) translateY(${(1 - sp) * 120 + pushUp}px) rotateX(${3 + Math.sin(frame * 0.03) * 1.5}deg) rotateY(${Math.sin(frame * 0.02) * 2.5}deg) scale(${0.9 + sp * 0.1})`,
        opacity: Math.min(1, sp * 1.6) * dim,
        filter: `brightness(${dim})`,
        background: 'rgba(36,36,33,0.8)', border: '1.5px solid rgba(255,255,255,0.13)',
        borderRadius: 28, padding: '30px 36px', fontFamily: BRAND.font,
        boxShadow: '0 36px 110px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: BRAND.paper }}>Thermo — Unit 4</span>
        <span style={{ fontSize: 22, fontWeight: 600, color: BRAND.textDim }}>internals · Friday</span>
      </div>
      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {lines.map((w, i) => {
          const reveal = interpolate(frame, [NOTES_IN + 10 + i * 7, NOTES_IN + 26 + i * 7], [0, w], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
          })
          return (
            <div key={i} style={{ width: reveal, height: 13, borderRadius: 7, background: i === 1 ? 'rgba(255,138,0,0.45)' : 'rgba(250,249,247,0.22)' }} />
          )
        })}
      </div>
    </div>
  )
}

/** The interrupting order notification — slams in over the notes. */
const OrderPing: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - PING
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 12, stiffness: 175, mass: 0.7 } })
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: 900, width: 840,
        transform: `translateX(-50%) translateY(${(sp - 1) * 300}px) scale(${0.92 + 0.08 * sp}) rotate(${(1 - sp) * -4}deg)`,
        opacity: Math.min(1, sp * 1.7),
        background: 'rgba(252,251,249,0.97)', borderRadius: 28, padding: '24px 28px',
        display: 'flex', alignItems: 'center', gap: 22, fontFamily: BRAND.font,
        boxShadow: '0 24px 80px rgba(255,138,0,0.28), 0 10px 36px rgba(0,0,0,0.55)',
        zIndex: 10,
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
        <div style={{ fontSize: 30, fontWeight: 800, color: BRAND.ink, marginTop: 2 }}>New order — ₹849</div>
        <div style={{ fontSize: 23, color: 'rgba(26,26,24,0.6)', fontWeight: 600 }}>Kavya ordered Sticker Pack ×3</div>
      </div>
    </div>
  )
}

/** Parcel label sliding out of a print slot under the order card. */
const ParcelLabel: React.FC = () => {
  const frame = useCurrentFrame()
  const t = frame - LABEL
  if (t < 0) return null
  const out = interpolate(t, [0, 22], [0, 1], {
    extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  })
  const wobble = Math.sin(frame * 0.06) * 1.2
  return (
    <div style={{ position: 'absolute', left: '50%', top: 1078, transform: 'translateX(-50%)', width: 720, zIndex: 9 }}>
      {/* the slot */}
      <div style={{ width: '100%', height: 16, borderRadius: 8, background: '#0E0E0D', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9), 0 0 30px rgba(255,138,0,0.15)' }} />
      {/* the label, revealed downward */}
      <div style={{ overflow: 'hidden', height: out * 320, margin: '0 22px' }}>
        <div
          style={{
            background: '#FFFDF8', borderRadius: '0 0 18px 18px', padding: '24px 30px',
            transform: `translateY(${(out - 1) * 320}px) rotate(${wobble * out}deg)`,
            fontFamily: BRAND.font, boxShadow: '0 26px 70px rgba(0,0,0,0.55)',
          }}
        >
          <div style={{ fontSize: 19, fontWeight: 700, color: 'rgba(26,26,24,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Shipping label</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: BRAND.ink, marginTop: 8 }}>Kavya M.</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'rgba(26,26,24,0.65)', marginTop: 2 }}>Kothrud, Pune — 411038</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
            {/* barcode */}
            <div
              style={{
                width: 300, height: 58, borderRadius: 4,
                background: 'repeating-linear-gradient(90deg, #1A1A18 0 4px, transparent 4px 8px, #1A1A18 8px 10px, transparent 10px 16px)',
              }}
            />
            <div style={{ background: BRAND.ink, color: BRAND.paper, borderRadius: 12, padding: '10px 22px', fontSize: 24, fontWeight: 800 }}>COD ₹849</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Act-2 timeline chip — springs in, checkmark stamps a beat later. */
const DayChip: React.FC<{ at: number; time: string; label: string; y: number; camY: number; accent?: boolean }> = ({ at, time, label, y, camY, accent }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - at
  if (t < 0) return null
  const sp = spring({ frame: t, fps, config: { damping: 12, stiffness: 160, mass: 0.8 } })
  const check = spring({ frame: Math.max(0, t - 8), fps, config: { damping: 11, stiffness: 200 } })
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: y,
        width: 800,
        transform: `translateX(-50%) translateX(${camY * 14}px) translateY(${(1 - sp) * 160}px) scale(${0.9 + sp * 0.1}) rotate(${(1 - sp) * 3}deg)`,
        opacity: Math.min(1, sp * 1.7),
        background: accent ? 'rgba(48,34,18,0.92)' : 'rgba(30,30,28,0.9)',
        border: `1.5px solid rgba(255,138,0,${accent ? 0.55 : 0.3})`,
        borderRadius: 26, padding: '26px 32px', display: 'flex', alignItems: 'center', gap: 24,
        fontFamily: BRAND.font, boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.mango, fontVariantNumeric: 'tabular-nums', width: 160, flexShrink: 0 }}>{time}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: BRAND.paper, flex: 1 }}>{label}</div>
      <div
        style={{
          width: 54, height: 54, borderRadius: 27, background: BRAND.green,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${check}) rotate(${(1 - check) * -60}deg)`, opacity: check,
          boxShadow: `0 0 ${26 * check}px rgba(34,197,94,0.6)`,
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>✓</span>
      </div>
    </div>
  )
}

export const C07: React.FC = () => {
  const frame = useCurrentFrame()

  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)
  const camY = Math.sin((frame - WHIP_1) * 0.018) * 5

  const clockDim = interpolate(frame, [PING, PING + 14], [1, 0.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · ROOM 214 ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop base="#0A0908" glowColor="rgba(255,140,40,0.09)" />
          <FairyLights flareAt={PING} />
          <BookStacks />
          <DriftParticles count={20} seed="hostel" color="rgba(255,190,110,0.5)" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.1]} hits={[{ f: PING, s: 1.05 }, { f: LABEL, s: 0.45 }]} driftAmp={7}>
            {/* clock chip */}
            <div style={{ position: 'absolute', top: 200, width: '100%', textAlign: 'center', opacity: clockDim }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(30,30,28,0.8)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '14px 32px' }}>
                <div style={{ width: 12, height: 12, borderRadius: 6, background: BRAND.mango, opacity: 0.5 + Math.sin(frame * 0.3) * 0.5 }} />
                <span style={{ fontSize: 30, fontWeight: 700, color: BRAND.paper, fontVariantNumeric: 'tabular-nums' }}>11:20 PM · Hostel B</span>
              </div>
            </div>

            {/* hook */}
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 330 }}>
              <KineticWords from={HOOK_FROM} to={PING - 6} text="Sem 5. Room 214." size={66} accentWords={[2, 3]} />
            </AbsoluteFill>

            <AbsoluteFill style={{ perspective: 1200 }}>
              <StudyNotes />
            </AbsoluteFill>
            <OrderPing />
            <ParcelLabel />

            <GlowBurst at={PING} x={540} y={960} color="rgba(255,138,0,0.4)" size={1200} />
            <Burst at={PING} x={540} y={940} count={16} seed="hping" />
            <Burst at={LABEL} x={540} y={1100} count={10} seed="hlabel" spread={200} color={BRAND.paper} />
          </CameraRig>

          <LightSweep period={150} delay={12} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE TIMETABLE ============ */}
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
          <DriftParticles count={18} seed="day" color="rgba(255,170,60,0.55)" />

          <CameraRig
            push={[WHIP_1, WHIP_2, 1.0, 1.12]}
            hits={[{ f: WHIP_1 + 8, s: 0.7 }, { f: CHIP_1, s: 0.5 }, { f: CHIP_2, s: 0.6 }, { f: CHIP_3, s: 0.7 }, { f: TOTAL_POP, s: 1 }]}
            driftAmp={6}
          >
            <div style={{ position: 'absolute', top: 240, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: BRAND.textDim, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: interpolate(frame, [WHIP_1 + 10, WHIP_1 + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
                Wednesday — actual schedule
              </div>
            </div>

            <DayChip at={CHIP_1} time="9:00 AM" label="Lecture hall, last bench" y={420} camY={camY} />
            <DayChip at={CHIP_2} time="1:00 PM" label="Pack 3 orders" y={610} camY={-camY} accent />
            <DayChip at={CHIP_3} time="6:00 PM" label="Dispatch at the gate" y={800} camY={camY} accent />

            {/* day total */}
            {frame >= TOTAL_POP && (
              <div style={{ position: 'absolute', top: 1010, width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: BRAND.textDim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Today</div>
                <Ticker from={TOTAL_POP} duration={24} value={3448} size={92} color={BRAND.mango} />
              </div>
            )}
            <GlowBurst at={TOTAL_POP} x={540} y={1070} color="rgba(255,138,0,0.45)" size={1100} />
            <Burst at={TOTAL_POP} x={540} y={1060} count={18} seed="total" spread={340} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 330 }}>
              <KineticWords from={246} to={WHIP_2} text="No dropout required." size={62} accentWords={[1]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={120} delay={WHIP_1 + 18} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="College + business. Both possible." accentWords={[3]} />

      {/* ============ SOUND DESIGN ============ */}
      <Sequence from={NOTES_IN} durationInFrames={4}>
        <Audio src={staticFile('key.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={PING} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.95} />
      </Sequence>
      <Sequence from={PING} durationInFrames={18}>
        <Audio src={staticFile('impact.wav')} volume={0.4} />
      </Sequence>
      {[LABEL, LABEL + 6, LABEL + 12].map((f, i) => (
        <Sequence key={`pr${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.55} />
        </Sequence>
      ))}
      <Sequence from={WHIP_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 + 8} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      {[CHIP_1, CHIP_2, CHIP_3].map((f, i) => (
        <Sequence key={`c${i}`} from={f} durationInFrames={14}>
          <Audio src={staticFile('impact.wav')} volume={0.3 + i * 0.06} />
        </Sequence>
      ))}
      {[CHIP_2, CHIP_3].map((f, i) => (
        <Sequence key={`cp${i}`} from={f + 8} durationInFrames={34}>
          <Audio src={staticFile('ping.wav')} volume={0.55 - i * 0.1} />
        </Sequence>
      ))}
      <Sequence from={TOTAL_POP - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={TOTAL_POP} durationInFrames={36}>
        <Audio src={staticFile('ping.wav')} volume={0.8} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
