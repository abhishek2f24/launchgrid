# LaunchGrid 30-sec Reel — production package

## ✅ PRODUCTION STATUS (updated)

**Done & in this folder:**
- `clip1.mp4` (3.2 MB) — Gemini/Veo Clip 1 (Hook + Problem), 9:16 portrait, woman "Priya".
- `voiceover-anika.mp3` (666 KB) — full Hindi VO, ElevenLabs **Anika** (Indian female,
  Multilingual v2). One continuous read of the whole script. **Note: it runs ~43s**, so in
  Canva either speed it up ~1.4x or trim pauses to fit 30s (it's intentionally the full read).

**Blocked (external limit, needs your action — no code/money fix):**
- **Clips 2 & 3 not generated yet.** Gemini's free **video** quota (Veo) is exhausted after
  ONE clip today — "Create video" greyed out. It resets in ~24h (or needs a paid Gemini AI
  Pro/Ultra plan for more daily videos). When it resets: open Gemini → "+" → **Create video**
  → set **Portrait (9:16)** → paste the Clip 2 prompt below, download; repeat for Clip 3.
- **Final assembly is in Canva** (ffmpeg isn't installed locally, and you planned Canva anyway).

**So to finish:** (1) tomorrow, generate Clip 2 + Clip 3 in Gemini using the prompts below;
(2) in Canva, lay clip1+2+3 on the timeline, drop voiceover-anika.mp3 as audio (speed to fit),
add the text overlays from the editing plan, export. Full steps in the "CANVA EDITING PLAN".

---


Format: **9:16 vertical, 30 sec, 3 × 10-sec Gemini/Veo clips + 1 ElevenLabs Hindi female VO, combined in Canva.**

## CONSISTENCY LOCK (paste this block into EVERY Gemini prompt)

> Recurring character — keep identical in every clip: **Priya, an Indian woman in her
> early 30s, warm friendly face, wearing a deep-teal cotton kurta with small gold jhumka
> earrings, hair in a low bun.** Setting: her small clothing/saree boutique with wooden
> shelves, folded colourful fabrics, warm string lights. Look: cinematic vertical 9:16,
> warm golden-hour tones, shallow depth of field, photorealistic (NOT animated/cartoon),
> gentle handheld motion. Phone shown is a modern smartphone with a clean store app, white
> background, vibrant ORANGE (#FF8A00) accent buttons. **No text or captions on screen**
> (text is added later). Same woman, same shop, same warm colour grade in every shot.

Why this matters: your earlier videos flipped male→female and changed style between cuts.
The voiceover is a confident Indian **woman**, so the on-screen owner is a woman (Priya) in
all three clips — voice and visuals finally match.

---

## GEMINI VIDEO PROMPTS (generate 3 clips, 10 sec each, no on-screen text)

### CLIP 1 (0–10s) — Hook + Problem
```
[PASTE CONSISTENCY LOCK BLOCK HERE]
Scene: Evening, exterior of Priya's small boutique. Priya reaches up and pulls down the
metal roller shutter to close her shop for the night, looking a little tired. As the shutter
closes, her smartphone in her hand lights up with an order notification. Cut to a close-up
over her shoulder of the phone screen: a WhatsApp chat list rapidly filling with new
message bubbles from different customers. Her expression shifts to mild overwhelm. Warm
streetlight glow, cinematic, photorealistic, 9:16 vertical. No text on screen.
```

### CLIP 2 (10–20s) — Solution montage
```
[PASTE CONSISTENCY LOCK BLOCK HERE]
Scene: Brighter, energetic. Inside the boutique, Priya now smiles confidently, holding her
phone toward camera showing a beautiful online store — a clean product grid of clothing with
prices and a vibrant orange "Order" button. Then a series of fast, satisfying close-up cuts
on the phone screen: (1) a UPI payment success tick, (2) a neat GST invoice PDF, (3) a
WhatsApp Business chat, (4) a Google search result showing her store name, (5) an order
notification popping up. Smooth quick transitions, modern app UI with orange accents,
photorealistic, 9:16 vertical. Same woman, same shop. No text on screen.
```

### CLIP 3 (20–30s) — Outcome + CTA
```
[PASTE CONSISTENCY LOCK BLOCK HERE]
Scene: Night, at home. Priya is relaxing peacefully on a sofa, calm and content. On the
side table her phone screen lights up softly with a new order notification. She glances at
it and smiles warmly without getting up — completely relaxed. Final shot pulls back to her
cosy room glowing with warm light. Gentle, heartwarming mood, photorealistic, 9:16 vertical.
Same woman (Priya, teal kurta). No text on screen — leave clean space in the lower third for
captions to be added later.
```

**Tips for Gemini/Veo:** generate each clip, regenerate if the face/style drifts from the
lock block, download all three as MP4. If it adds garbled text, regenerate with "no text,
no captions, no words on screen" emphasised.

---

## ELEVENLABS VOICEOVER (Indian female, confident, fast-paced)

**Voice:** pick an Indian female multilingual voice (e.g. "Monika Sogam", "Anika", or any
Indian-accent female on ElevenLabs). **Model:** Eleven Multilingual v2 (handles Hinglish).
**Settings:** Stability ~40, Similarity ~75, Style ~55 (energy), Speed slightly fast.

**Paste this full script (one take, ~28–30s):**

```
Aapki dukaan band ho jaati hai... lekin customer shopping karna nahi band karta.
Roz WhatsApp pe wahi sawaal — price kya hai? COD hai? Delivery kitne din mein?
LaunchGrid ke saath aapki dukaan sirf online nahi jaati.
UPI aur Cash on Delivery ready. GST invoices automatic.
WhatsApp aur Google pe visible. Inventory aur orders — ek hi jagah.
Customer ko bas ek link bhejo, poora store khul jaata hai.
Matlab aap so rahe ho... aur orders phir bhi aa rahe hain.
Pehle dus businesses ka setup, personally, bilkul free.
DM karo "STORE" aur apne paanch product photos bhejo. Baaki sab hum karenge.
```

If it overruns 30s, generate in 3 chunks matching the clips (split at "LaunchGrid ke saath"
and "Matlab aap so rahe ho") and trim in Canva.

---

## CANVA EDITING PLAN (combine everything)

1. New project → 1080×1920 (9:16), 30s.
2. Drop Clip 1, Clip 2, Clip 3 on the timeline back to back (10s each).
3. Add the ElevenLabs VO as the audio track, aligned to start at 0:00.
4. Add a subtle upbeat royalty-free background track at ~15% volume under the VO.
5. **Text overlays** (LaunchGrid font: bold sans, charcoal #1A1A18 on cream, orange #FF8A00
   highlights), timed to the VO:
   - 0–3s: "POV: 11 PM. Shutter down. Order still aa gaya."
   - 3–8s: quick stacked bubbles — "Price kya hai?" "COD hai?" "Delivery kitne din?"
   - 10–20s: small labels as each cut hits — "UPI + COD" · "GST invoice" · "WhatsApp" ·
     "Google visibility" · "All orders, one place"
   - 23–27s: "Aap so rahe ho. Orders aa rahe hain."
   - 27–30s (big, centered): **FREE SETUP · FIRST 10 STORES · DM "STORE"**
6. End card (last 1s): orange LaunchGrid grid mark + "launchgrid.in".
7. Export 1080p MP4. Post as a Reel/Short with trending audio ducked under the VO.

Caption + hashtags: see marketing/social/PLATFORM-POSTS.md (Instagram block) and the 3–5
hashtag guidance in REACH-PLAYBOOK.md.
```
