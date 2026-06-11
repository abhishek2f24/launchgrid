import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
// H.264 mp4 — Meta/Instagram-ready
Config.setCodec('h264')
