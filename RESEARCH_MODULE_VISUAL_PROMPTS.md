# Research Module — Image & Animation Prompts

Matches the existing dark aurora/glassmorphism marketing system (`DESIGN_SYSTEM.md`) for
any hero/marketing imagery, and the light "mark" theme (`--color-mark-*` tokens,
`#FAFAF8` base, `#8b5cf6` violet accent) for in-dashboard screens. Use these with
whatever image model you have access to (Midjourney, DALL·E, Ideogram, etc).

## 1. Marketing hero — "Research" feature section (dark theme)

> A dark near-black dashboard UI mockup floating at a slight 3D perspective tilt,
> showing a product-research report with a large verdict badge reading "Launch",
> a horizontal score gauge from 0–100 glowing indigo, three small supplier cards
> below with checkmark icons, all rendered in a clean SaaS dashboard style —
> Linear/Vercel/Stripe aesthetic, indigo (#6366f1) and violet (#a78bfa) accent glow,
> glassmorphism cards with subtle noise grain, floating on a near-black background
> (#06060f) with soft aurora blob lighting in the corners, no text legible beyond
> large headline numbers, ultra-clean, product-as-hero, 16:9, high detail, no people.

**Use for:** landing page "Research" feature bento tile, or `/features` page.

## 2. Empty state — no research yet (light dashboard theme)

> A minimal flat illustration of a magnifying glass hovering over a single stylized
> cardboard shipping box with a small upward arrow/sparkle above it, line-art style
> with soft violet (#8b5cf6) accent fills on a warm off-white background (#FAFAF8),
> rounded friendly shapes, no gradients, no shadows, single accent color only,
> centered composition, plenty of negative space, flat vector illustration style
> matching a premium SaaS onboarding empty state (think Linear/Notion empty states).

**Use for:** the "No research yet" empty state on `/dashboard/research`.

## 3. "Build my store" bridge moment (light dashboard theme)

> A simple flat vector illustration showing two rounded rectangle panels connected
> by a single curved arrow: the left panel has a small magnifying glass icon and
> a checkmark, the right panel has a small storefront/shop icon, both panels in
> off-white (#FFFFFF) with a thin border, the connecting arrow in violet (#8b5cf6),
> flat minimal line-art style, no text, no shadows, no gradients, centered on a
> warm off-white background (#FAFAF8), plenty of breathing room, friendly and
> simple, matching a premium onboarding illustration style.

**Use for:** the moment right after a "Launch" verdict, right above the
"Build my store" button — visually confirms *why* the button exists.

## 4. Supplier confidence badge icon set (in-app, small)

> A set of five small flat icons at 32x32px, single-color line-art in violet
> (#8b5cf6), no fill, 2px stroke weight, rounded caps: (1) a shield with a
> checkmark for "verified manufacturer", (2) a factory building outline for
> "audit available", (3) a document/certificate outline for "business licence",
> (4) a video-camera outline for "factory video", (5) a globe with an arrow for
> "export history" — all icons share the same visual weight and corner radius,
> designed to sit inline next to text labels in a dashboard table row.

**Use for:** supplier cards in the Research report (currently plain checkmarks —
these icons upgrade that row without adding visual noise).

## 5. Animation specs (build with Framer Motion — already a dependency)

These match the physics-aware easing principle in `DESIGN_SYSTEM.md` §7 — no
`all 0.3s ease`, every animation gets its own curve:

- **Verdict reveal**: when `runOpportunityScore` returns, the verdict banner
  should scale-and-fade in (`opacity 0→1`, `scale 0.96→1`, `duration 0.4s`,
  `ease: [0.16, 1, 0.3, 1]` — a Vercel-style "soft overshoot" curve), not just
  appear. The recommendation emoji can have a small delayed bounce (spring,
  stiffness 400, damping 15) 150ms after the banner lands.
- **Score gauge fill**: animate the 0–100 score bar/number counting up over
  600ms with `ease-out`, not an instant jump — reinforces "this was computed,"
  not hardcoded.
- **Build-my-store button**: on click, the button should morph into a small
  inline spinner (not a full-page loader) then, on success, a checkmark that
  holds for 600ms before the notice banner appears — keeps the "one click"
  feeling fast even though a real DB write happened.
- **Supplier score reveal**: when "Score supplier" resolves, the new confidence
  label should slide in from the right (`x: 12→0`, `opacity 0→1`, 250ms) rather
  than popping the whole row into a re-render — avoids the jarring re-layout
  the current MVP has today (a good next iteration once you're happy with the
  functional flow).

None of these are wired yet — the current Research UI is intentionally plain
functional shadcn/Tailwind (no Framer Motion) so the underlying data flow could
be verified first. Once you're happy with the flow, motion is a follow-up pass,
not a rebuild.
