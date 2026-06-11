import React from 'react'
import {
  AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate,
} from 'remotion'
import { BRAND } from '../brand'
import { NotificationCard, EndCard, Statement } from '../components/ui'

/**
 * Ad #1 — "The Ping at 11:43 PM" (10s, 9:16)
 * Beat sheet (30fps):
 *   0–45    dark room mood, clock "11:43 PM", faint text
 *   45      PING — order notification springs in, room "lights up"
 *   75–150  statement: "Know the second someone buys."
 *   150     second ping — another order stacks (delight)
 *   165–225 statement: "From your own store. Not a marketplace."
 *   225–300 end card
 *
 * VO (optional, ElevenLabs — see scripts/tts.mjs):
 *   "That sound? Someone just bought from YOUR store. LaunchGrid —
 *    your business, live in 15 minutes."
 * Set VO_ENABLED = true after running `npm run tts`.
 */
const VO_ENABLED = false

const PING_1 = 45
const PING_2 = 150
const END_CARD = 225

export const Ad01OrderPing: React.FC = () => {
  const frame = useCurrentFrame()

  // The room "lights up" when the notification arrives
  const glow = interpolate(
    frame,
    [PING_1 - 1, PING_1 + 8, PING_1 + 70, PING_2, PING_2 + 8],
    [0, 1, 0.55, 0.55, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const clockOpacity = interpolate(frame, [8, 24, PING_1 + 30, PING_1 + 55], [0, 0.8, 0.8, 0.25])

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', fontFamily: BRAND.font }}>
      {/* Ambient gradient — streetlight through blinds */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(120% 70% at 80% 10%, rgba(60,60,80,0.35) 0%, transparent 60%)',
        }}
      />

      {/* Warm glow that breathes with each ping */}
      <AbsoluteFill
        style={{
          opacity: glow,
          background:
            'radial-gradient(80% 50% at 50% 46%, rgba(255,138,0,0.22) 0%, transparent 70%)',
        }}
      />

      {/* Clock */}
      <div
        style={{
          position: 'absolute', top: 220, width: '100%', textAlign: 'center',
          opacity: clockOpacity,
        }}
      >
        <div style={{ fontSize: 140, fontWeight: 200, color: BRAND.paper, letterSpacing: '0.02em' }}>
          11:43
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: BRAND.textDim, marginTop: 8 }}>
          Tuesday night
        </div>
      </div>

      {/* Notifications stack */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 880 }}>
          <NotificationCard
            appearFrame={PING_1}
            amount="₹1,299"
            body="Priya ordered Kurta Set (Blue)"
            width={880}
          />
          <NotificationCard
            appearFrame={PING_2}
            amount="₹849"
            body="Rahul ordered Jhumka Earrings"
            width={880}
          />
        </div>
      </AbsoluteFill>

      {/* Statements — lower third, clear of the notification stack */}
      <Statement from={75} to={148} offsetY={560}>
        Know the second{'\n'}someone buys.
      </Statement>
      <Statement from={168} to={222} size={64} offsetY={560}>
        From your own store.{'\n'}Not a marketplace.
      </Statement>

      {/* End card */}
      <EndCard startFrame={END_CARD} tagline="Your store. Live in 15 minutes." />

      {/* Audio: the brand ping fires exactly when each notification lands */}
      <Sequence from={PING_1} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.9} />
      </Sequence>
      <Sequence from={PING_2} durationInFrames={40}>
        <Audio src={staticFile('ping.wav')} volume={0.75} />
      </Sequence>
      {VO_ENABLED ? (
        <Sequence from={PING_1 + 20}>
          <Audio src={staticFile('vo-ad01.mp3')} volume={1} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  )
}
