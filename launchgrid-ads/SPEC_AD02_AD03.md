# LaunchGrid Performance Ads — Production Spec (Ad02 + Ad03)

Cut like a senior performance-marketing editor, not a motion designer. Hard rule enforced
in code: **no frame sits still longer than ~0.8s** — the camera rig alone (push-in + drift +
shake) guarantees motion even between beats. Every scene has all 5 layers:

| Layer | Implementation |
|---|---|
| 1 Animated background | `AnimatedBackdrop` (breathing radial gradients), `GridFloor` (scrolling perspective grid), rotating conic glow on end card |
| 2 Floating UI | Order cards, stat chips, storefront panels, orbiting badges — all spring-driven, depth-sorted |
| 3 Camera | `CameraRig`: continuous push-in, sin-drift, zoom punches + decaying shake on every hit |
| 4 Micro FX | `Grain` (crawling turbulence), `LightSweep`, `DriftParticles` (parallax dust), `Burst`, `GlowBurst` |
| 5 Sound | brand `ping.wav` + synthesized `impact / whoosh / riser / key` (scripts/sfx.mjs) |

Both ads: **1080×1920, 30fps, 450 frames (15s)**. Render: `npm run render:ad02` / `render:ad03`.

---

## AD02 — "Another Order" (`Ad02-OrderStack`)

Concept: the seller is asleep; the store isn't. Orders stack faster and faster, then the
graph explodes. Emotion: *"that ping could be mine."*

### Storyboard / shot list (frames @30fps)

| Frames | Shot | FG / MID / BG | Camera | Sound |
|---|---|---|---|---|
| 0–47 | Cold open. Clock **11:43**, "Tuesday night". Hook: *"You're asleep."* (kinetic, f14–46) | dust particles + grain / clock + type / drifting blue-grey radial | push 1.00→1.10 across act, lazy drift | room tone (silence) |
| 48 | **ORDER 1 — ₹1,299** whips in from above, −5° rotation settle. Clock dims to 28%. | burst + glow flash / card / warm glow ignites | zoom punch +0.075, shake 14f | ping 0.9 + impact 0.32 |
| 58–130 | Hook line 2: *"Your **store** isn't."* (accent mango) | — | still pushing | — |
| 78 | **ORDER 2 — ₹849.** Stack shoves card 1 down 168px (spring), dims, blurs. "TONIGHT ₹—" ticker appears, counting | counter FG / stack MID | punch +0.085 | ping 0.82 + impact |
| 104 / 126 / 144 | **ORDERS 3·4·5** — gaps shrink 30→26→22→18f (speed ramp). Ticker lands on ₹6,696. Glow breathes brighter per order | bursts grow (12→20 particles) | punches escalate +0.095→+0.115 | pings (vol tapering) + impacts |
| 134–163 | Riser swells under the stack | — | — | riser 0.5 |
| **164–172** | **WHIP UP** — whole act flies up 1900px, 26px motion blur | — | — | whoosh 0.7 |
| 172 | Dashboard slams in (opposite direction), grid floor scrolling | mango dust / graph card / grid floor + gradient | land impact punch +0.07; orbit begins: rotateY ±5° | impact 0.5 |
| 176–236 | Revenue line draws L→R, eased — glowing head dot, sparkles rising off it. "THIS WEEK" ticker 0→**₹38,400** (66f), "▲ 212%" | sparkles / graph card (3D tilt) / floor | push 1.0→1.12 | — |
| 200–228 | Stat chips parallax in at 3 depths: Orders 5 (near) · Visitors 214 (far, blurred) · Conversion 4.2% (mid) — all bobbing | chips at 3 z-depths | orbit continues | — |
| 244–296 | *"Your store doesn't **sleep**."* (kinetic, accent) | — | — | — |
| **292** | Line hits peak — mango burst (22 particles, 380px spread), giant glow | burst FG | hardest punch +0.115 | impact 0.45 |
| **298–306** | WHIP → end card | — | — | whoosh 0.65 |
| 304–450 | **END CARD**: 4 logo squares fly in from corners (mango lands last, f322, glow bloom) → wordmark mask-rises (f330) → tagline *"Your store. Live in **15** minutes."* staggers (f344) → CTA pill springs (f368) + light sweep across it (f384–408). Conic glow rotates the whole time | particles + grain + sweep / logo + type + CTA / rotating conic | settle 1.05→1.00, logo punch on mango land | ping 0.7 on mango land |

### Motion spec (key curves)
- **Zoom punch**: additive scale, 0→peak in 2.5f, decay to 0 by 16f, `Easing.out(cubic)`.
- **Shake**: per-hit, amplitude 13/9px x/y + 0.45° roll, decay `(1−t/14)²` — deterministic sin, no RNG jitter between renders.
- **Stack push**: each later order drives a spring (damping 14, stiffness 160) × 168px on every earlier card; depth adds dim (−18%/slot), scale (−3.5%/slot), blur (1px/slot).
- **Whips**: 8 frames, 1900px travel, 26px blur, `in(cubic)` out / `out(cubic)` in — opposite directions so it reads as one camera move.
- **Graph draw**: clip-rect reveal + head dot at interpolated path point, `inOut(cubic)` over 60f (slow-fast-slow = speed ramp).

---

## AD03 — "Type it. Live it." (`Ad03-StoreBuild`)

Concept: idea typed → store assembles in 3D → **14:32** slam → link shared → first orders.
Style: Apple × Linear × Arc — UI floating in space, orbit camera, depth fly-ins.
Emotion: *"I need this for my business."* Energy 8/10.

### Storyboard / shot list

| Frames | Shot | FG / MID / BG | Camera | Sound |
|---|---|---|---|---|
| 0–13 | Hook: *"It starts with one **idea**."* over floating glass input (3D-tilting, bobbing), cursor blinking mango | dust / glass card / breathing gradient | push 1.00→1.09 | — |
| 14–59 | Typing **"boutique sarees"** — 1 char / 3f | — | — | key tick every 2 chars (0.5) |
| 58–60 | Riser starts; **Create →** button flashes, glow blooms | glow burst + 14-particle burst | punch +0.06 | riser 0.45 |
| **72–80** | **WHIP UP** into build space | — | — | whoosh 0.7 → impact 0.5 |
| 84 | Timer chip drops in: **00:00**, pulsing mango dot — counts to 14:32 through the act (`inOut(quad)`) | chip FG | orbit starts rotateY ±6° | — |
| 88 / 100 | Store header ("Saree Haven · ● Live") then hero banner fly in **from depth** (blur 14→0, scale 0.55→1); banner gets a specular sweep | store panels MID / grid floor BG | push 1.02→1.12 | UI tick per land |
| 116 / 126 | Product cards fly in (Banarasi ₹2,499 · Chiffon ₹1,299), each with its own light sweep across the image | — | — | ticks |
| 148 | **"Buy with UPI →"** pill punches in, breathing glow | glow burst | punch +0.06 | impact 0.35 |
| 160–176 | Trust badges **orbit** the store at 3 depths (UPI ✓ near, COD ✓ far-blurred, WhatsApp ✓ mid) | badges FG | orbit continues | — |
| 200–227 | Riser builds | — | — | riser 0.5 |
| **228** | **14:32 SLAM** — scale 2.6→1, blur 16→0, backdrop dims 82%, *"idea → live store"*, particle burst | — | hardest punch +0.12 + shake | impact 0.65 |
| **252–260** | WHIP → proof scene | — | — | whoosh 0.65 |
| 264–286 | Link pill `launchgrid.in/saree-haven` depth-pops, *"Link shared ✓"*, kinetic *"Share it once."* | — | push 1.00→1.08 | — |
| **288 / 306** | First orders land: ₹2,499 then ₹1,299 — mini cards whip in, bursts, glows | bursts / cards / gradient | punches +0.09 / +0.10 | ping + impact each |
| 312–333 | *"That **feeling**? Yours tonight."* | — | — | — |
| 334–450 | END CARD (same system as Ad02), tagline *"Type your idea. Sell by **tonight**."* | — | — | ping on mango land |

### Motion spec
- **DepthIn** (the signature move): scale 0.55→1 spring (damping 13, stiffness 150) + blur 14→0 over 10f + 40px rise — reads as flying forward out of z-space.
- **Orbit camera**: `rotateY = sin((f−72)·0.016)·6°` on the store group; badges add `±depth·22px` parallax.
- **Slam**: spring (damping 12, stiffness 160, mass 0.9) drives both scale and de-blur; backdrop dim ramps in 5f.
- **Typing**: deterministic 3f/char; cursor blink 14f duty cycle, locked on while typing.

---

## Architecture

```
src/components/cinema.tsx        the 5-layer kit (CameraRig, punches/shake math,
                                 Grain, LightSweep, DriftParticles, Burst, GlowBurst,
                                 KineticWords, Ticker, AnimatedBackdrop, GridFloor,
                                 whipOut/whipIn)
src/components/EndCardCinematic.tsx  shared animated end card (logo assembly → CTA sweep)
src/ads/Ad02OrderStack.tsx       Video 1 (+ OrderCard, RevenueGraph, StatChip)
src/ads/Ad03StoreBuild.tsx       Video 2 (+ DepthIn, ProductCard, OrbitBadge, MiniOrder)
scripts/sfx.mjs                  synthesizes whoosh/impact/riser/key WAVs (npm run sfx)
```

Everything is deterministic (Remotion `random()` / sin-based noise) — renders are
bit-stable. New ads = new beat sheet + these primitives.

## Sound design cue sheet (shared kit)
- `ping.wav` — brand two-tone bell. Fires **only** when money/orders happen + mango logo land.
- `impact.wav` — 150→38Hz sub drop. Every zoom punch / slam / scene land.
- `whoosh.wav` — filtered-noise sweep. Every whip transition.
- `riser.wav` — 1s noise+tone ramp. Starts ~28f before every big moment (whip 1, the slam).
- `key.wav` — soft tick. Typing + UI elements snapping into place.
- Music bed (manual step): 90–100 BPM minimal tech/lo-fi from Meta Sound Collection, ducked −8dB under pings. Drop in `public/music.mp3` + one `<Audio>` layer.
