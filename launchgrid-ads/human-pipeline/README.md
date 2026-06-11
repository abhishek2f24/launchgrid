# Human b-roll pipeline — free AI video with realistic humans

Goal: unlimited/near-free human clips composited into the Remotion ad system.

## Hardware verdict (checked 2026-06-12)

This machine = **Intel UHD integrated graphics, no NVIDIA GPU, 16GB RAM**. Therefore:

| Option | Locally | Verdict |
|---|---|---|
| 1. Hunyuan / Wan 2.1 14B local | ✗ no CUDA, needs 24GB VRAM | **Use free cloud GPU instead** (this folder) |
| 2. Flux/SDXL + AnimateDiff local | ✗ needs 8–12GB VRAM | Same — works on Colab T4 |
| 3. AI influencer (face LoRA) | ✗ LoRA training needs GPU | Possible on Kaggle, phase 2 |
| 4. Hallo / MuseTalk talking heads | ✗ CUDA-only | **Works on free T4** — phase 2 |
| 5. ComfyUI + Ollama local API | ✗ no GPU to serve | Skip |

The pipeline still works — the GPU stage just moves to **Google Colab (free T4 16GB)**
or **Kaggle (30 GPU-hrs/week, P100/T4×2)**. Wan 2.1 **1.3B** fits in ~8GB VRAM.
Cost: ₹0. Trade-off: ~10–20 min per 5s clip on a T4 (queue 8 clips, walk away).
LTX-Video 2B distilled is the fast alternative (~1–2 min/clip, slightly less realistic).

## The pipeline

```
Claude Code                      (this repo)
  └─ writes shot list            → prompts.json  (★ concepts from VIDEO_ADS_50.md)
Colab / Kaggle free GPU
  └─ generate_wan_colab.ipynb    → launchgrid-clips.zip (480×832 MP4s)
You
  └─ unzip into                  → launchgrid-ads/public/clips/
Remotion
  └─ <HumanClip src="clips/x.mp4" caption="..."/>   (src/components/HumanClip.tsx)
     Ken Burns + brand grade + grain + kinetic captions + crisp UI overlays
  └─ npm run render:…            → Meta/IG-ready MP4
```

Rules that make AI clips usable:
- **Never generate text/UI in the video model** — it garbles. All UI, numbers and
  captions are Remotion layers on top (that's the whole point of this repo).
- Atmosphere-driven single scenes only (the ★ concepts) — no lip-sync, no dialogue.
- The constant Ken Burns move + grain in `HumanClip` hides the 480p upscale.

## Run it

1. Open [colab.research.google.com](https://colab.research.google.com) → upload
   `generate_wan_colab.ipynb` → Runtime → T4 GPU.
2. Upload `prompts.json` into the session (Files sidebar). Run all.
3. Download `launchgrid-clips.zip`, extract to `launchgrid-ads/public/clips/`.
4. Build an ad with `HumanClip` scenes + the cinema kit, register it in `src/Root.tsx`.

## Phase 2 — talking founder (when needed)

Same notebook approach: Flux-schnell (image) → pick a founder face → **MuseTalk**
(T4-friendly) lip-syncs it to ElevenLabs TTS audio (free tier, `scripts/tts.mjs`
already exists). Output drops into `public/clips/` the same way. Keep disclosure
in mind: label AI spokespeople as AI in ad copy — Meta requires AI-generated
content disclosure for ads with photorealistic people.

## Paid escape hatch

Higgsfield + ImagineArt MCPs are already connected to Claude Code on this machine —
credit-based, not unlimited, but zero setup for one-off hero shots when a deadline
beats the T4 queue.
