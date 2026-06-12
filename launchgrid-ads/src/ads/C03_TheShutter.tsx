import React from 'react'
import {
  AbsoluteFill, Audio, Easing, interpolate, random, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { BRAND } from '../brand'
import { GridMark } from '../components/ui'
import {
  AnimatedBackdrop, Burst, CameraRig, DriftParticles, GlowBurst, Grain,
  KineticWords, LightSweep, Ticker, whipIn, whipOut,
} from '../components/cinema'
import { EndCardCinematic } from '../components/EndCardCinematic'

/**
 * Ad C03 — "The Shutter" (15s, 9:16, 30fps = 450 frames)
 * A street shop dies at dusk; the same shop never sleeps on a phone.
 *
 * ACT 1 · DUSK (0–117)
 *   0      CSS storefront under a flickering sodium lamp, dusk gradient
 *   8–56   hook "7 PM. Shutter down." — kinetic
 *   24–66  the shutter rolls down slat by slat (metal ticks at 30/38/46/54/62)
 *   66     SLAM — shutter hits the ground: impact, shake, dust burst
 *   80–112 "Sales clock out with you." — kinetic
 *   90     riser building underneath
 *   118    WHIP UP → Act 2
 *
 * ACT 2 · THE RIDE HOME (118–295)
 *   126    bus-window scene lands (impact): 3-layer parallax city + light streaks
 *   140    phone floats up into frame (3D orbit)
 *   168    PING ₹449 (punch) · 192 PING ₹899 · 210 PING ₹1,249 — gaps shrink
 *          24→18 (speed ramp), running total ticker
 *   226    the shop REOPENS on screen — glowing storefront UI "OPEN 24×7"
 *   238–290 "The shop rode home with you." — kinetic
 *   268    riser → 296 WHIP → end card
 *
 * ACT 3 · END CARD (304–450)
 *   logo assembly + "Your shutter never closes." (accent: never) + CTA sweep
 */

const SLAM = 66
const WHIP_1 = 118
const BUS = 126
const PHONE = 140
const ORDERS = [
  { f: 168, amount: 449, name: 'Kavya', item: 'Agarbatti Pack ×3' },
  { f: 192, amount: 899, name: 'Rahul', item: 'Steel Tiffin Set' },
  { f: 210, amount: 1249, name: 'Meera', item: 'Copper Bottle ×2' },
]
const REOPEN = 226
const WHIP_2 = 296
const END = 304

/** The street shop: signboard, awning, rolling shutter with slats. */
const Storefront: React.FC = () => {
  const frame = useCurrentFrame()
  const shutterH = interpolate(frame, [24, SLAM], [110, 600], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad),
  })
  const settle = frame >= SLAM ? Math.sin((frame - SLAM) * 1.4) * Math.max(0, 6 - (frame - SLAM)) : 0
  const lampFlicker = 0.7 + Math.sin(frame * 0.9) * 0.12 + Math.sin(frame * 2.3) * 0.08
  return (
    <div style={{ position: 'absolute', left: '50%', top: 560, transform: 'translateX(-50%)', width: 820 }}>
      {/* sodium lamp glow */}
      <div style={{ position: 'absolute', left: -80, top: -260, width: 980, height: 700, background: `radial-gradient(60% 50% at 50% 18%, rgba(255,160,40,${0.22 * lampFlicker}) 0%, transparent 70%)`, pointerEvents: 'none' }} />
      {/* signboard */}
      <div style={{ background: '#26211B', border: '2px solid rgba(255,170,60,0.35)', borderRadius: '18px 18px 0 0', padding: '26px 0', textAlign: 'center', boxShadow: '0 18px 60px rgba(0,0,0,0.55)' }}>
        <span style={{ fontFamily: BRAND.font, fontSize: 52, fontWeight: 800, color: '#E8C87A', letterSpacing: '0.08em', textShadow: `0 0 ${24 * lampFlicker}px rgba(255,180,60,0.5)` }}>
          SHARMA GENERAL STORE
        </span>
      </div>
      {/* awning */}
      <div style={{ height: 54, background: 'repeating-linear-gradient(90deg, #8A3B2E 0 68px, #D8CFC0 68px 136px)', borderRadius: '0 0 14px 14px', boxShadow: '0 14px 36px rgba(0,0,0,0.45)' }} />
      {/* doorway + shutter */}
      <div style={{ position: 'relative', height: 600, margin: '0 44px', background: 'linear-gradient(180deg, #141210 0%, #0C0B09 100%)', overflow: 'hidden', borderLeft: '10px solid #221E18', borderRight: '10px solid #221E18' }}>
        {/* warm interior dying as the shutter drops */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 60% at 50% 60%, rgba(255,170,60,0.30) 0%, transparent 75%)', opacity: interpolate(shutterH, [110, 600], [1, 0]) }} />
        {/* shutter — slats via repeating gradient, descending */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: 0, height: shutterH,
            transform: `translateY(${settle}px)`,
            background: 'repeating-linear-gradient(180deg, #5A554C 0 10px, #443F38 10px 26px, #36322C 26px 30px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)', borderBottom: '8px solid #2A2620',
          }}
        />
        {/* padlock appears after the slam */}
        {frame >= SLAM + 10 && (
          <div style={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', width: 46, height: 56, borderRadius: 10, background: '#8C8478', boxShadow: '0 6px 16px rgba(0,0,0,0.6)', opacity: interpolate(frame, [SLAM + 10, SLAM + 16], [0, 1], { extrapolateRight: 'clamp' }) }} />
        )}
      </div>
      {/* footpath */}
      <div style={{ height: 30, margin: '0 20px', background: '#1C1A16', borderRadius: 6 }} />
    </div>
  )
}

/** Bus-window: 3 parallax layers of night city sliding past + light streaks. */
const BusWindow: React.FC = () => {
  const frame = useCurrentFrame()
  const t = frame - BUS
  const layers = [
    { speed: 1.4, top: 430, h: 320, color: '#1A1E2C', op: 0.9, seed: 'far', blur: 2 },
    { speed: 3.2, top: 520, h: 380, color: '#232838', op: 1, seed: 'mid', blur: 0 },
  ]
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* night sky gradient */}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0A0C16 0%, #141A2E 55%, #0C0E18 100%)' }} />
      {/* building rows */}
      {layers.map((L, li) => (
        <div key={li} style={{ position: 'absolute', left: 0, right: 0, top: L.top, height: L.h, filter: L.blur ? `blur(${L.blur}px)` : undefined }}>
          {Array.from({ length: 9 }).map((_, i) => {
            const w = 140 + random(`${L.seed}-w${i}`) * 180
            const h = 120 + random(`${L.seed}-h${i}`) * (L.h - 130)
            const gap = 60 + random(`${L.seed}-g${i}`) * 90
            const x0 = i * (260 + gap)
            const x = ((x0 - t * L.speed * 14) % 2600 + 2600) % 2600 - 400
            return (
              <div key={i} style={{ position: 'absolute', left: x, bottom: 0, width: w, height: h, background: L.color, opacity: L.op, borderRadius: '6px 6px 0 0' }}>
                {/* lit windows */}
                {Array.from({ length: 5 }).map((_, k) => (
                  <div key={k} style={{ position: 'absolute', left: 14 + (k % 2) * 44, top: 16 + Math.floor(k / 2) * 40, width: 18, height: 22, background: random(`${L.seed}-l${i}-${k}`) > 0.45 ? 'rgba(255,190,90,0.85)' : 'rgba(120,140,190,0.3)', borderRadius: 3 }} />
                ))}
              </div>
            )
          })}
        </div>
      ))}
      {/* streetlight streaks — fast motion lines */}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 320 + random(`streak-${i}`) * 420
        const x = ((random(`sx-${i}`) * 2400 - t * 46) % 2400 + 2400) % 2400 - 600
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: 240, height: 5, borderRadius: 4, background: 'linear-gradient(90deg, transparent, rgba(255,200,110,0.8), transparent)', filter: 'blur(1px)' }} />
        )
      })}
      {/* window frame vignette */}
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 0 26px #14110D, inset 0 0 220px rgba(0,0,0,0.85)', borderRadius: 8 }} />
    </AbsoluteFill>
  )
}

/** The phone in the commuter's hand — pings stack, then the shop reopens. */
const CommutePhone: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame - PHONE
  if (t < 0) return null
  const rise = spring({ frame: t, fps, config: { damping: 13, stiffness: 120, mass: 1 } })
  const orbit = Math.sin((frame - PHONE) * 0.02) * 6
  const reopenSp = spring({ frame: Math.max(0, frame - REOPEN), fps, config: { damping: 12, stiffness: 150 } })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1300 }}>
      <div
        style={{
          width: 580, height: 1160, borderRadius: 66,
          transform: `rotateY(${orbit}deg) rotateX(3deg) translateY(${(1 - rise) * 1300 + 60}px)`,
          background: '#101010', padding: 16,
          boxShadow: '0 70px 180px rgba(0,0,0,0.75), 0 0 100px rgba(255,138,0,0.16)',
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: 52, overflow: 'hidden', background: '#13130F', position: 'relative' }}>
          {/* lockscreen clock */}
          <div style={{ textAlign: 'center', paddingTop: 80, opacity: interpolate(frame, [REOPEN - 4, REOPEN + 4], [1, 0.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            <div style={{ fontFamily: BRAND.font, fontSize: 96, fontWeight: 200, color: BRAND.paper }}>8:12</div>
            <div style={{ fontFamily: BRAND.font, fontSize: 26, fontWeight: 600, color: BRAND.textDim }}>on the bus home</div>
          </div>
          {/* ping stack */}
          <div style={{ position: 'absolute', left: 20, right: 20, top: 320 }}>
            {ORDERS.map((o, i) => {
              const to = frame - o.f
              if (to < 0) return null
              const sp = spring({ frame: to, fps, config: { damping: 12, stiffness: 170, mass: 0.7 } })
              let push = 0
              for (let j = i + 1; j < ORDERS.length; j++) {
                const tj = frame - ORDERS[j].f
                if (tj >= 0) push += spring({ frame: tj, fps, config: { damping: 14, stiffness: 160 } }) * 150
              }
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute', left: 0, right: 0, top: 0,
                    transform: `translateY(${(sp - 1) * 240 + push}px) scale(${0.93 + 0.07 * sp})`,
                    opacity: Math.min(1, sp * 1.7) * (frame >= REOPEN ? Math.max(0, 1 - (frame - REOPEN) / 8) : 1),
                    background: 'rgba(252,251,249,0.97)', borderRadius: 22, padding: '18px 22px',
                    display: 'flex', alignItems: 'center', gap: 16, fontFamily: BRAND.font,
                    boxShadow: '0 18px 56px rgba(255,138,0,0.26), 0 8px 26px rgba(0,0,0,0.5)',
                    zIndex: 10 - i,
                  }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: 13, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GridMark size={26} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.ink }}>New order — ₹{o.amount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 19, color: 'rgba(26,26,24,0.6)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name} ordered {o.item} · UPI</div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* running total */}
          {frame >= ORDERS[1].f && frame < REOPEN + 6 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 870, textAlign: 'center', opacity: frame >= REOPEN ? Math.max(0, 1 - (frame - REOPEN) / 6) : 1 }}>
              <div style={{ fontFamily: BRAND.font, fontSize: 22, fontWeight: 700, color: BRAND.textDim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Since the shutter</div>
              <Ticker from={ORDERS[1].f} duration={ORDERS[2].f - ORDERS[1].f + 12} value={2597} size={64} color={BRAND.mango} />
            </div>
          )}
          {/* the shop reborn — glowing storefront UI */}
          {frame >= REOPEN && (
            <div
              style={{
                position: 'absolute', left: 22, right: 22, top: 200,
                transform: `translateY(${(1 - reopenSp) * 160}px) scale(${0.86 + reopenSp * 0.14})`,
                opacity: reopenSp,
                borderRadius: 26, overflow: 'hidden',
                boxShadow: `0 0 ${50 + Math.sin(frame * 0.2) * 18}px rgba(255,138,0,0.55), 0 24px 70px rgba(0,0,0,0.6)`,
              }}
            >
              <div style={{ background: BRAND.paper, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GridMark size={24} />
                  </div>
                  <span style={{ fontFamily: BRAND.font, fontSize: 28, fontWeight: 800, color: BRAND.ink }}>Sharma Store</span>
                </div>
                <span style={{ fontFamily: BRAND.font, fontSize: 22, fontWeight: 800, color: BRAND.green }}>● OPEN 24×7</span>
              </div>
              <div style={{ height: 150, background: 'linear-gradient(120deg, #6B3A12 0%, #B5722A 50%, #E8A84C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: BRAND.font, fontSize: 30, fontWeight: 800, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.45)' }}>Same shop. No shutter.</span>
              </div>
              <div style={{ background: '#F2F0EC', padding: 16 }}>
                <div style={{ background: BRAND.mango, borderRadius: 14, padding: '16px 0', textAlign: 'center', fontFamily: BRAND.font, fontSize: 26, fontWeight: 800, color: BRAND.ink }}>
                  Buy with UPI →
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const C03: React.FC = () => {
  const frame = useCurrentFrame()
  const hits1 = [{ f: SLAM, s: 1.1 }]
  const hits2 = [
    { f: BUS, s: 0.7 },
    ...ORDERS.map((o, i) => ({ f: o.f, s: 0.7 + i * 0.12 })),
    { f: REOPEN, s: 0.95 },
  ]
  const a1out = whipOut(frame, WHIP_1)
  const a2in = whipIn(frame, WHIP_1)
  const a2out = whipOut(frame, WHIP_2)

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font, overflow: 'hidden' }}>
      {/* ============ ACT 1 · DUSK ============ */}
      {frame < WHIP_1 + 10 && (
        <AbsoluteFill style={{ transform: `translateY(${a1out.y}px)`, filter: a1out.blur > 0.5 ? `blur(${a1out.blur}px)` : undefined, opacity: a1out.opacity }}>
          <AnimatedBackdrop base="#16111C" glowColor="rgba(255,120,30,0.14)" />
          {/* dusk band on the horizon */}
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(180,80,30,0.18) 58%, transparent 80%)' }} />
          <DriftParticles count={22} seed="dusk" color="rgba(230,190,140,0.5)" />

          <CameraRig push={[0, WHIP_1, 1.0, 1.11]} hits={hits1} driftAmp={7}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 250 }}>
              <KineticWords from={8} to={56} text="7 PM. Shutter down." size={64} accentWords={[2, 3]} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 250 }}>
              <KineticWords from={78} to={114} text="Sales clock out with you." size={60} accentWords={[1]} />
            </AbsoluteFill>

            <Storefront />

            {/* dust kicked up by the slam */}
            <Burst at={SLAM} x={540} y={1740} count={16} seed="dust1" color="rgba(190,170,130,0.85)" spread={340} />
            <Burst at={SLAM + 2} x={400} y={1760} count={10} seed="dust2" color="rgba(150,135,105,0.7)" spread={240} />
            <GlowBurst at={SLAM} x={540} y={1700} color="rgba(200,140,60,0.30)" size={1000} />
          </CameraRig>

          <LightSweep period={140} delay={14} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 2 · THE RIDE HOME ============ */}
      {frame >= WHIP_1 && frame < END + 8 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${a2in.y + a2out.y}px)`,
            filter: a2in.blur + a2out.blur > 0.5 ? `blur(${a2in.blur + a2out.blur}px)` : undefined,
            opacity: Math.min(a2in.opacity, a2out.opacity),
          }}
        >
          <BusWindow />
          <DriftParticles count={14} seed="bus" color="rgba(255,170,60,0.45)" />

          <CameraRig push={[WHIP_1, WHIP_2, 1.0, 1.1]} hits={hits2} driftAmp={6}>
            <CommutePhone />

            {ORDERS.map((o, i) => (
              <React.Fragment key={i}>
                <GlowBurst at={o.f} x={540} y={880} color="rgba(255,138,0,0.35)" size={1000} />
                <Burst at={o.f} x={540} y={860} count={12 + i * 3} seed={`c03o${i}`} />
              </React.Fragment>
            ))}
            <GlowBurst at={REOPEN} x={540} y={760} color="rgba(255,138,0,0.5)" size={1300} />
            <Burst at={REOPEN} x={540} y={720} count={20} seed="reopen" spread={400} />

            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 180 }}>
              <KineticWords from={WHIP_1 + 10} to={ORDERS[0].f - 2} text="You went home." size={56} color={BRAND.textDim} />
            </AbsoluteFill>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 200 }}>
              <KineticWords from={238} to={WHIP_2} text="The shop rode home with you." size={58} accentWords={[1]} />
            </AbsoluteFill>
          </CameraRig>

          <LightSweep period={110} delay={WHIP_1 + 16} strength={0.06} />
          <Grain />
        </AbsoluteFill>
      )}

      {/* ============ ACT 3 · END CARD ============ */}
      <EndCardCinematic startFrame={END} tagline="Your shutter never closes." accentWords={[2]} />

      {/* ============ SOUND DESIGN ============ */}
      {[30, 38, 46, 54, 62].map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={4}>
          <Audio src={staticFile('key.wav')} volume={0.35 + i * 0.05} />
        </Sequence>
      ))}
      <Sequence from={SLAM} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={WHIP_1 - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={WHIP_1} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={BUS} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.45} />
      </Sequence>
      {ORDERS.map((o, i) => (
        <React.Fragment key={`s${i}`}>
          <Sequence from={o.f} durationInFrames={40}>
            <Audio src={staticFile('ping.wav')} volume={0.9 - i * 0.08} />
          </Sequence>
          <Sequence from={o.f} durationInFrames={16}>
            <Audio src={staticFile('impact.wav')} volume={0.28} />
          </Sequence>
        </React.Fragment>
      ))}
      <Sequence from={REOPEN - 28} durationInFrames={32}>
        <Audio src={staticFile('riser.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={REOPEN} durationInFrames={16}>
        <Audio src={staticFile('impact.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={WHIP_2} durationInFrames={20}>
        <Audio src={staticFile('whoosh.wav')} volume={0.65} />
      </Sequence>
    </AbsoluteFill>
  )
}
