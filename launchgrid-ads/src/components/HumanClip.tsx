import React from 'react'
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion'
import { Grain, KineticWords, LightSweep } from './cinema'

/**
 * Composites an AI-generated human clip (Wan/LTX output, see ../human-pipeline/)
 * into the house style: Ken Burns move + brand grade + vignette + grain +
 * kinetic caption. AI clips are 480×832@16fps — the constant scale move and
 * grain hide the upscale; UI/text always stays a crisp Remotion layer on top.
 *
 * Place clips in public/clips/<id>.mp4 and wrap in a <Sequence>:
 *   <Sequence from={0} durationInFrames={75}>
 *     <HumanClip src="clips/ping-1143.mp4" caption="11:43 PM. Someone just bought." accentWords={[4]} />
 *   </Sequence>
 */
export const HumanClip: React.FC<{
  src: string
  caption?: string
  accentWords?: number[]
  /** 'in' = slow push-in (default), 'out' = pull-back reveal */
  move?: 'in' | 'out'
  durationHint?: number
}> = ({ src, caption, accentWords = [], move = 'in', durationHint = 75 }) => {
  const frame = useCurrentFrame()
  const scale = move === 'in'
    ? interpolate(frame, [0, durationHint], [1.18, 1.32], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) })
    : interpolate(frame, [0, durationHint], [1.34, 1.18], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) })
  const panX = Math.sin(frame * 0.012) * 14

  return (
    <AbsoluteFill style={{ background: '#0B0B0A', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${scale}) translateX(${panX}px)` }}>
        <OffthreadVideo src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
      </AbsoluteFill>

      {/* brand grade: warm lift + heavy vignette so clips match the UI scenes */}
      <AbsoluteFill style={{ background: 'rgba(255,138,0,0.05)', mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(95% 75% at 50% 42%, transparent 55%, rgba(11,11,10,0.82) 100%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(11,11,10,0.85), transparent 38%)' }} />

      {caption && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 300 }}>
          <KineticWords from={6} text={caption} size={58} accentWords={accentWords} maxWidth={880} />
        </AbsoluteFill>
      )}

      <LightSweep period={110} strength={0.05} />
      <Grain opacity={0.09} />
    </AbsoluteFill>
  )
}
