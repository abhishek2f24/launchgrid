# LaunchGrid Website Redesign — Design Audit & Direction
**Panel:** Product Design / UX Research / CRO / Design Direction (Stripe · Linear · Apple · Airbnb · Notion standards)
**Scope:** Marketing site (landing, pricing, nav, footer), with notes on dashboard previews and mobile.
**Basis:** Direct review of the implemented code — S01–S10 journey sections, JourneyNav, pricing page, design tokens.

---

## 0. The honest opening

Here's the surprise: **the bones of this site are NOT generic.** The chaptered editorial narrative ("Chapter 01: The Thought" → "The Pain" → "The Transformation" → "The Money"), Playfair Display headlines, grain texture, and restrained ink-on-paper palette is a genuinely distinctive concept. Most AI-generated SaaS sites are purple-gradient hero + 3-column feature grid + logo wall. This is not that. **Do not throw away the editorial concept — it's the most defensible design asset you have.**

What makes it *feel* AI-generated anyway is not the layout. It's four things:

1. **Fabricated proof.** The hero runs a `MetricTicker` that fake-increments "Stores Created" and "Revenue Processed" every 3–5 seconds from hardcoded fallbacks (1,200 stores / ₹2.3Cr). The testimonials are fictional people (Priya S., Rohit M., Arjun K.) with invented revenue. A designer at Linear wouldn't just reject this — they'd consider it disqualifying. Users in 2026 *recognize* fake tickers instantly; India's guru-economy audience recognizes them faster than anyone. This single pattern undoes every premium signal the typography earns. **It's also a legal exposure (fabricated earnings claims).**
2. **No product, anywhere above the fold.** The hero is pure text + fake numbers. Stripe shows the API. Linear shows the app. Framer shows the canvas. LaunchGrid — a product whose entire promise is "watch a real store appear in 15 minutes" — shows… a feeling. The strongest demo in the category (type an idea → store materializes) is buried in S07, nine sections deep.
3. **No CTA until the basement.** There is no signup action in the hero section. A visitor must scroll through ten chapters to act. The narrative is a tunnel with the exit at the end — high-intent visitors (from ads, comparisons, referrals) are forced through 4,000px of story they didn't ask for.
4. **Trope buildup.** Drifting aurora orbs, noise overlays on everything, animated scroll-pulse chevron, fake-live counters, emoji in campaign copy. Individually small; together they pattern-match to "template."

The redesign job is therefore: **keep the editorial soul, delete the fakery, put the product on stage, and give every visitor an exit ramp to signup at all times.**

---

## 1. UI/UX Audit

### Visual problems
- **Hierarchy inversion in hero:** the headline is emotional ("I've been thinking about starting a business for two years") but the *product* is never named or shown above the fold. 3-second test: fails. A first-time visitor cannot answer "what is this?"
- **One typographic gesture, overused:** `text-[9px]–[11px] uppercase tracking-[0.2em]` micro-labels appear on chapter labels, captions, stats, buttons, nav, footer. When everything whispers in small caps, nothing does. Reserve it for chapter labels only.
- **Type floor too low:** 9–10px labels fail readability and accessibility, especially for the 30+ local-business segment on budget Android screens.
- **Section sameness:** S02–S06 are all "centered headline + centered paragraph + centered cards." The chapters change content but not *shape*. By chapter 4 the eye knows the pattern and starts skimming. Editorial design lives on rhythm changes — full-bleed, asymmetry, side-by-side, interruption.
- **Grain + orbs + blur stacking:** GrainOverlay on every page plus radial glows plus backdrop-blur = murky contrast and a 2024-template smell. Grain alone is enough texture.
- **Icons:** default Lucide everywhere at default weight. Fine in the dashboard; on the marketing site, replace with custom-drawn spot illustrations or none — typography is your icon system.
- **Color:** the ink/paper/amber palette is good but underused — amber appears only decoratively. There's no single signature accent that screams "LaunchGrid" the way Stripe's blurple or Linear's purple-gray does.

### UX problems
- **Forced narrative = no random access.** JourneyNav exists, but the page punishes scanners. Verdict-seekers (price? features? proof?) have no fast path. Bounce.
- **ProgressBar** signals "long read" at the moment of arrival — honest, but demotivating. Replace with chapter dots that double as nav.
- **S_ToolComparison placed before the product is shown** — you're comparing against Shopify before the visitor knows what you are.
- **The live demo (S07) is the conversion moment and it's passive** — it plays *at* you. Nothing on the page lets the visitor *do* the magic.
- **Information architecture:** /features/* pages exist (good SEO pages) but aren't linked from the homepage nav. /discover (live stores — your best real proof!) is orphaned.
- **Missing emotional close:** S10_FinalCTA asks for signup, but nothing reminds the visitor what they *felt* in chapter 1. The narrative arc doesn't resolve.

### Conversion problems (why people leave)
| Leak | Cause | Severity |
|---|---|---|
| High-intent visitors bounce in hero | No CTA, no product, no "what is this" answer | 🔴 Critical |
| Skeptics bounce at first fake signal | Ticking counters, stock-feeling testimonials | 🔴 Critical |
| Scanners can't self-serve | No nav path to features/proof/pricing from hero | 🟠 High |
| Demo doesn't convert | Passive video-style demo, no input field | 🟠 High |
| Trial fear unaddressed at CTA | "Free trial" without "no card · 15 min · keep your data" microcopy at the button | 🟠 High |
| Mobile: 4,000px of scroll on 4G | Heavy motion sections, full-viewport chapters | 🟡 Medium |

---

## 2. The Redesign

### 2.1 Hero — "The 15-Minute Proof" (replaces S01)

**Structure (top to bottom):**
1. **Nav** (see 2.4) — logo, Product, Pricing, Examples (→/discover), Compare, Login, and a solid `Start free` button. Always visible.
2. **Eyebrow** (the one permitted small-caps): `FOR INDIA'S NEXT 10 LAKH FOUNDERS`
3. **H1 (Playfair, 56–72px):** keep the emotional voice but make it resolve:
   > **"You've thought about it for years. Launch it in 15 minutes."**
   This preserves the current line's insight (the two-year hesitation) but answers it in the same breath — momentum, not melancholy.
4. **Subhead (Inter, 18px, 60ch max):** "LaunchGrid turns your idea into a real online store — products, UPI & COD payments, GST handled. Type your idea below and watch."
5. **THE INPUT.** One field, autofocused glow, placeholder cycling through real niches ("handmade jewellery", "gym supplements", "home bakery"). Submit → the existing onboarding/provisioning flow with live store-preview generation. *The hero IS the product.* This is the single highest-leverage change on the entire site: Framer's "describe your site" hero, but for commerce.
6. **Under-input microcopy:** `Free for 7 days · No credit card · Your store stays yours`
7. **Real proof strip (replaces MetricTicker):** static, real, dated: `__ stores launched · ₹__ in merchant sales · last updated this week` — pulled from the real /api/stats/platform numbers, **never incremented client-side**. If the real numbers are small, use the small numbers with confidence ("147 stores and counting") or show recent activity instead ("3 stores launched today"). Small-but-real outperforms big-but-fake on trust, always.
8. **Behind the input:** a soft, slightly-3D-tilted screenshot of a real generated storefront (not a dashboard) that swaps when the placeholder niche cycles. Product-first visual without claiming to be live.

**Interaction:** as the visitor types, the storefront preview behind subtly shifts color/typography — "the store is listening." That's the screenshot-shareable moment.

### 2.2 Narrative restructure (10 chapters → 5 movements)

Keep the chaptered editorial format. Halve it. Each movement changes layout *shape*:

1. **The Proof** (hero above) — centered, input-first.
2. **The Pain → The Turn** (merge S02+S03+S04) — asymmetric two-column: left, the 11-tool mess every reseller lives in (WhatsApp + spreadsheet + Paytm screenshots — *illustrated, not stock*); right, one LaunchGrid screen replacing it. One scroll-pinned transition, not three sections.
3. **The Method** (merge S06+S07) — interactive horizontal timeline: Idea → Store → First Share → First Order, where each stop is a real product screenshot with one-line captions. End with the *working demo input* again for those who scrolled past it.
4. **The Money** (S05 + real proof) — keep the GST/UPI/0%-fees money story (it's differentiated); attach **real** case studies (see §4). Until real ones exist, show the founder's own test store with its real numbers — radical honesty as design.
5. **The Door** (S_FAQ condensed to 5 + final CTA) — close the loop emotionally: repeat the hero's H1 structure — *"Still thinking about it? You're 15 minutes away."* — same input field again.

ToolComparison moves off the homepage to /vs-shopify and /vs-dukaan (where that intent actually lives). FAQ keeps schema markup.

### 2.3 Design system

**Typography**
| Role | Font | Size/Weight | Notes |
|---|---|---|---|
| Display / H1 | Playfair Display | 56–72 / 800 | Marketing only, max 2 per page |
| H2 | Playfair Display | 36–44 / 700 | Movement titles |
| H3 / feature titles | Inter | 20–24 / 700 | Stop using Playfair below H2 |
| Body | Inter | 16–18 / 400–500 | 65ch measure |
| Small / meta | Inter | 13–14 / 500 | **12px absolute floor** |
| Eyebrow (chapter labels only) | Geist Mono | 12 / 600, tracking 0.15em | The *only* small-caps voice |

**Color**
- Base: keep paper `#FAF9F7`-family and ink `#1A1A18`.
- **Signature accent — commit to one: "Mango" `#FF8A00`-family amber-orange.** It's Indian, energetic, ownable, and already latent in the palette (`--color-mark-amber`). Use it for: the hero input focus ring, primary CTA, progress moments (score ring, confetti, "store live" states). Never for decoration.
- Support: emerald (money/success only), red (errors only). Kill purple/indigo/cyan gradients everywhere (currently in upsell cards and orbs) — they're the template tell.
- Dark surfaces: one consistent ink-black for storefront footers and code-like blocks; no `black/80` translucency over noise.

**Components**
- **Buttons:** 2 variants only. Primary = ink fill, white text, mango focus ring, 14px/700, 12px radius (not full pill — pills read "template"), subtle 1px inner highlight. Secondary = 1px ink border, transparent. Kill all gradient/uppercase-tracking buttons.
- **Cards:** one Card primitive, 16px radius (drop the 2rem+ mega-rounds), 1px `black/8` border, shadow only on hover/active. `variant="data"` (dashboard, no animation) vs `variant="story"` (marketing, may animate in).
- **Inputs:** 48px height, 1px border, mango focus ring + slight scale; the hero input is a 64px "monument" version of the same primitive.
- **Modals:** single Radix-based dialog, ink scrim 40%, no blur.
- **Tables (comparison, pricing):** left-aligned text, numeric tabular-nums right-aligned, row hover wash, sticky header. No green-wash column backgrounds (current comparison table) — bold the winning cell text instead.
- **Nav:** white/90 blur-on-scroll only after 80px, height 64px, active link = mango underline offset 8px.

**Layout & spacing**
- 4px base unit; section vertical rhythm at 96/128/160 (mobile 64/80); 12-col grid, max-w 1200 for content, 1440 for full-bleed moments.
- Each movement must alternate alignment (center → left-asym → right-asym → center) — rhythm is the anti-template weapon.

**Motion (purpose only)**
- One signature: **"materialize"** — elements assemble with a 250ms y-8 + fade staggered 40ms, used for store-preview generation and section entry. Nothing else animates on scroll.
- Microinteractions: input caret pulse in hero; CTA press-down 2px; checklist items check with a 150ms tick; copy-link button morphs to ✓. 
- Delete: infinite scroll-bounce chevron, fake ticker animation, drifting orbs, `animate-pulse` on anything informational.
- Respect `prefers-reduced-motion` globally (currently not handled).

### 2.4 Trust building (replaces fabrication)

Priority order — each strictly real:
1. **Live store gallery** on homepage: 6 real storefronts from /discover, screenshotted nightly, linking out. "These exist. Click them." Strongest possible proof and zero writing required.
2. **Founder's log:** a dated, personal "building LaunchGrid in public" note in the footer area (numbers, lessons, this week's merchants). Human-designed feel comes from *evidence of humans*.
3. **3 real case studies** (recruit beta merchants, concierge them to first sale — Boardroom Audit M1 plan): photo, store link, real screenshot of orders page, exact numbers with dates. One paragraph each, no superlatives.
4. **Platform stats:** real, static, dated, small-and-true.
5. **Authority signals:** GST-compliance explainer authored with a named CA; Razorpay partner badge if BYOK; "Made in India 🇮🇳" registered-entity footer line with CIN.
6. **Until real testimonials exist: run zero testimonials.** An absence is credible; an invention is fatal.

### 2.5 Mobile experience
- Hero input must be thumb-reachable and not keyboard-jumped: input pinned mid-viewport, preview *below* it on mobile.
- Movements 2–3 collapse pinned-scroll interactions into static stacked frames (no scroll-jacking on touch).
- Sticky bottom CTA bar (`Start free — 15 min`) appears after 50% scroll, dismissible, 56px, safe-area padded.
- Replace full-viewport `min-h-screen` sections with content-height + 64px padding on <768px — current build produces enormous empty scroll on small devices.
- Test class: ₹12k Android, Chrome, 4G, Lighthouse mobile ≥ 85 (currently animation JS will be the blocker; movements 2–3 should be CSS-only on mobile).

---

## 3. Priority-ranked implementation roadmap

| # | Change | Why first | Effort |
|---|---|---|---|
| P0 | **Delete MetricTicker fake increments + fictional testimonials** (replace with real static stats + store gallery) | Trust/legal; everything else is poisoned while these exist | S |
| P0 | **Hero: add CTA + product visual + 3-second clarity** (headline swap, input-first hero v1 can start as a button → onboarding) | Biggest conversion leak | M |
| P1 | Nav upgrade (links to Examples/Compare/Features, persistent Start free) | Gives scanners a path | S |
| P1 | Type floor 12px + small-caps diet + kill orbs/gradient buttons | Cheap premium-feel wins | S |
| P1 | Compress 10 chapters → 5 movements (merge, don't rewrite) | Halves bounce-length, keeps soul | M |
| P2 | Interactive hero input wired to onboarding preview | The signature moment | L |
| P2 | Real case studies + founder's log + /discover gallery on homepage | Compounding trust | M (content) |
| P3 | Motion system (materialize + reduced-motion), mobile pinned-scroll fallbacks | Polish layer | M |
| P3 | Design-token enforcement pass (Card/Button/Input primitives) across portal | Consistency debt | L |

---

## 4. The Premium Feel Test, applied to the plan
1. *Handcrafted or AI?* — Editorial chapters with rhythm changes + real store gallery + founder's log: handcrafted. ✓
2. *Would Linear's designer approve?* — After deleting fake tickers, orbs, gradient pills, and 9px caps: yes, with the mango accent as the memorable risk. ✓
3. *Screenshot-shareable?* — The type-your-idea-watch-store-form hero is the shareable artifact. ✓
4. *Creates curiosity?* — "What happens if I type my idea?" beats any headline. ✓
5. *Want to keep scrolling?* — 5 movements with shape changes, exit ramps everywhere. ✓

---

## 5. LaunchGrid-specific direction

This site must not feel like software being sold. It must feel like **momentum being offered.**

Every movement should make the visitor feel further along than they were a scroll ago: the hero starts the store *for* them, the method section shows them already at "first order," the CTA tells them they're 15 minutes away — not from using a tool, but from being someone who *did the thing they've been thinking about for two years.* Progress bars, score rings, materialize-motion, the input that responds as they type — every mechanism on this site is a physical metaphor for the same sentence:

> **"You are closer to launching than you think."**

The current site says it in chapter copy. The redesigned site makes the visitor *experience* it before they've signed up. That's the difference between a SaaS template and a launch platform — and it's a difference no competitor's template can copy.
