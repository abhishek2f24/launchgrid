/**
 * ElevenLabs text-to-speech → public/vo-ad01.mp3
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/tts.mjs
 * Optional env:
 *   ELEVENLABS_VOICE_ID  (default: "21m00Tcm4TlvDq8ikWAM" — Rachel; pick an
 *   Indian-English voice from your VoiceLab and set the id for best fit)
 *
 * Free tier: ~10k chars/month — plenty for ad VO lines.
 * After generating, set VO_ENABLED = true in src/ads/Ad01OrderPing.tsx.
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const API_KEY = process.env.ELEVENLABS_API_KEY
if (!API_KEY) {
  console.error('Set ELEVENLABS_API_KEY (get one free at elevenlabs.io → Profile → API Keys)')
  process.exit(1)
}

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

const LINES = [
  {
    file: 'public/vo-ad01.mp3',
    text: 'That sound? Someone just bought from YOUR store. LaunchGrid. Your business, live in fifteen minutes.',
  },
  // Add VO lines for ads 02–10 here as they're approved.
]

for (const line of LINES) {
  console.log(`Generating: ${line.file}`)
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: line.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 },
    }),
  })
  if (!res.ok) {
    console.error(`Failed (${res.status}):`, await res.text())
    process.exit(1)
  }
  mkdirSync('public', { recursive: true })
  writeFileSync(line.file, Buffer.from(await res.arrayBuffer()))
  console.log(`✓ ${line.file}`)
}
console.log('Done. Set VO_ENABLED = true in the ad component(s).')
