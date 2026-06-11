import React from 'react'
import { Composition } from 'remotion'
import { Ad01OrderPing } from './ads/Ad01OrderPing'
import { Ad02OrderStack } from './ads/Ad02OrderStack'
import { Ad03StoreBuild } from './ads/Ad03StoreBuild'
import { FPS } from './brand'

/**
 * Ad compositions — 1080×1920 (9:16), 30fps.
 * Render: npx remotion render <id> out/<name>.mp4
 * Preview: npm run studio
 *
 * Ads 02–10 from VIDEO_ADS_50.md will register here after Ad01 feedback.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ad01-OrderPing"
        component={Ad01OrderPing}
        durationInFrames={10 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Ad02-OrderStack"
        component={Ad02OrderStack}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Ad03-StoreBuild"
        component={Ad03StoreBuild}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  )
}
