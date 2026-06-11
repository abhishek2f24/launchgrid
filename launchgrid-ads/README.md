# LaunchGrid Ads — Remotion video factory

React components → MP4. No generation credits, infinitely revisable, pixel-perfect UI (which AI video can't do). Concepts from `../VIDEO_ADS_50.md`.

## The performance cuts (Ad02 + Ad03)

Built on the 5-layer cinema kit (`src/components/cinema.tsx`) — animated backgrounds,
floating UI, camera punches/shake, micro FX, synthesized SFX. Full storyboard, shot list,
motion spec and sound cues: `SPEC_AD02_AD03.md`.

```bash
cd launchgrid-ads
npm install
npm run sfx             # one-time: synthesize whoosh/impact/riser/key WAVs
npm run studio          # live preview — scrub the timeline
npm run render:ad02     # "Another Order" — order stack → graph explosion (15s)
npm run render:ad03     # "Type it. Live it." — idea → store in 3D → 14:32 slam (15s)
```

## Render Ad #1 ("The Ping at 11:43 PM" — legacy, pre-cinema-kit)

```bash
npm run render:ad01     # → out/ad01-order-ping.mp4 (1080×1920, 10s, with ping sound)
```

First render downloads a headless Chrome (~150MB, one-time). Output is H.264 MP4, Meta/Instagram-ready.

## Voiceover (optional, ElevenLabs free tier)

```bash
ELEVENLABS_API_KEY=sk_... npm run tts    # writes public/vo-ad01.mp3
# then set VO_ENABLED = true in src/ads/Ad01OrderPing.tsx and re-render
```

Pick an Indian-English voice in ElevenLabs VoiceLab and pass `ELEVENLABS_VOICE_ID=...` for a better fit than the default. Voice *cloning* (your own voice) needs a paid tier — TTS works free.

## Structure

```
src/brand.ts            design tokens (ink/mango/paper — same as web + app)
src/components/ui.tsx   GridMark logo · NotificationCard · EndCard · Statement
src/ads/Ad01OrderPing.tsx   the first ad (beat sheet in comments)
public/ping.wav         synthesized brand ping (two-tone bell, E6→A6)
scripts/tts.mjs         ElevenLabs VO generator
```

## The system

Every ad reuses the same primitives, so ads 02–10 are mostly new beat sheets, not new code. After your feedback on Ad01, the remaining nine register in `src/Root.tsx` and render with one command each. Music beds: use free tracks from the Meta Sound Collection or YouTube Audio Library (royalty-free for ads) — drop into `public/` and add an `<Audio>` layer.

## Why Remotion over AI video here

The selected concepts are UI-centric (lock screens, notifications, dashboards, funnels). Remotion renders those *actually crisp* — text, numbers, brand colors exact. AI video remains an option later for the live-action concepts (#5 kitchen, #30 night market) when there's budget for credits or stock footage.
