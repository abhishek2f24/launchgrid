# Design System & Visual Standards
## LaunchGrid — SaaS-Level, Not AI-Template-Level

**Version:** 1.0  
**Date:** June 2026  
**Based on:** Live research of 12 premium SaaS sites

> [!IMPORTANT]
> LaunchGrid must look like **Linear, Vercel, or Stripe** — not like a Durable.co or Wix AI site. Every design decision must be justified against the 10 Non-Negotiables below.

> [!NOTE]
> **Shared Design DNA:** This precise design system (using Radix + shadcn/ui + Framer Motion) is engineered as the visual foundation for multiple premium ventures across our portfolio (e.g., Aeronix Holidays). It must remain unified, modular, and reusable.

---

## 1. The 10 Non-Negotiables (Research-Backed)

After analyzing Linear, Vercel, Stripe, Loom, Framer, Clerk, Raycast, Arc, Resend, Supabase, and PlanetScale, these are the universal signals of premium SaaS design:

| # | Principle | What AI Sites Do Wrong | LaunchGrid Standard |
|---|-----------|----------------------|-------------------|
| 1 | **Dark mode first** | Inverted light mode | Built on dark canvas from scratch |
| 2 | **Product as hero** | Stock photos / generic illustrations | Show actual dashboard UI in first fold |
| 3 | **One accent color** | Rainbow of decorative colors | Single electric indigo, used surgically |
| 4 | **Scroll storytelling** | Sections stacked vertically | Scroll has a narrative arc |
| 5 | **Bento feature grid** | Generic cards with equal visual weight | Modular, size = priority, interactive cells |
| 6 | **Code as visual design** | Text-only feature lists | Beautiful syntax-highlighted code blocks |
| 7 | **Grain + glassmorphism** | Flat plastic surfaces | SVG noise grain at 3–5% + backdrop-filter |
| 8 | **Physics-aware motion** | `all 0.3s ease` everywhere | Bespoke easing per element type |
| 9 | **Performance as brand** | Heavy assets, slow LCP | Sub-2s LCP is a design decision |
| 10 | **Interactive before signup** | User must register to see product | Animated mockups, demos in marketing |

---

## 2. Color System

### Design Philosophy
We use **OKLCH color space** for perceptually uniform gradients (the technique used by Linear). Colors at the same lightness value look equally bright to the human eye — no "muddy gray dead zone" in gradients.

### Core Palette

```css
:root {
  /* ─── BACKGROUNDS ─── */
  --bg-base: #06060f;           /* Near-black, not pure black */
  --bg-surface-1: #0d0d1f;      /* Card backgrounds */
  --bg-surface-2: #12122b;      /* Elevated cards, modals */
  --bg-surface-3: #1a1a38;      /* Hover state surface */
  
  /* ─── BORDERS ─── */
  --border-subtle: rgba(255, 255, 255, 0.06);    /* Default borders */
  --border-default: rgba(255, 255, 255, 0.10);   /* Card borders */
  --border-strong: rgba(255, 255, 255, 0.20);    /* Hover borders */
  --border-accent: rgba(99, 102, 241, 0.40);     /* Focused/active */
  
  /* ─── ACCENT (INDIGO — used sparingly) ─── */
  --accent-primary: #6366f1;        /* Primary CTA, focus rings */
  --accent-secondary: #818cf8;      /* Secondary accents */
  --accent-muted: rgba(99, 102, 241, 0.15);  /* Accent backgrounds */
  --accent-glow: rgba(99, 102, 241, 0.40);   /* Box shadows, glows */
  
  /* ─── VIOLET (used as gradient partner) ─── */
  --violet: #a78bfa;
  --violet-muted: rgba(167, 139, 250, 0.15);
  
  /* ─── TEXT ─── */
  --text-primary: #f1f5f9;      /* Main body text */
  --text-secondary: #94a3b8;    /* Subheadings, captions */
  --text-muted: #475569;        /* Placeholder, disabled */
  --text-inverse: #06060f;      /* Text on light backgrounds */
  
  /* ─── SEMANTIC ─── */
  --success: #22c55e;
  --success-muted: rgba(34, 197, 94, 0.15);
  --warning: #f59e0b;
  --warning-muted: rgba(245, 158, 11, 0.15);
  --danger: #ef4444;
  --danger-muted: rgba(239, 68, 68, 0.15);
  --info: #38bdf8;
  
  /* ─── PLAN COLORS ─── */
  --plan-starter: #22c55e;      /* Green */
  --plan-growth: #6366f1;       /* Indigo */
  --plan-premium: #a78bfa;      /* Violet */
  
  /* ─── STEP COLORS ─── */
  --step-completed: #22c55e;
  --step-active: #6366f1;
  --step-locked: #334155;
}
```

### Gradient System

```css
:root {
  /* Primary action gradient */
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #a78bfa 100%);
  
  /* Gradient text (headlines) */
  --gradient-text: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.65) 100%);
  
  /* Aurora background (hero) */
  --gradient-aurora: 
    radial-gradient(ellipse at 15% 30%, rgba(99,102,241,0.20) 0%, transparent 60%),
    radial-gradient(ellipse at 85% 70%, rgba(167,139,250,0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.10) 0%, transparent 50%);
    
  /* Glow (button hover, card accent) */
  --gradient-glow: radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%);
  
  /* Plan card gradients */
  --gradient-starter: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, transparent 50%);
  --gradient-growth: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 50%);
  --gradient-premium: linear-gradient(135deg, rgba(167,139,250,0.1) 0%, transparent 50%);
}
```

---

## 3. Typography

### Font Stack

```css
/* Import in layout.tsx */
/* Google Fonts: Inter Variable (weights 100–900) */
/* Google Fonts: JetBrains Mono (code blocks) */

:root {
  --font-sans: 'Inter Variable', 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Type scale */
  --text-xs: 0.75rem;       /* 12px */
  --text-sm: 0.875rem;      /* 14px */
  --text-base: 1rem;        /* 16px */
  --text-lg: 1.125rem;      /* 18px */
  --text-xl: 1.25rem;       /* 20px */
  --text-2xl: 1.5rem;       /* 24px */
  --text-3xl: 1.875rem;     /* 30px */
  --text-4xl: 2.25rem;      /* 36px */
  --text-5xl: 3rem;         /* 48px */
  --text-6xl: 3.75rem;      /* 60px */
  --text-7xl: 4.5rem;       /* 72px */
  --text-8xl: 6rem;         /* 96px */
  
  /* Letter spacing — tight on large text, normal on small */
  --tracking-hero: -0.04em;       /* For 60px+ headings */
  --tracking-display: -0.03em;    /* For 36px–60px */
  --tracking-heading: -0.02em;    /* For 24px–36px */
  --tracking-body: 0em;           /* Body text */
  --tracking-cap: 0.08em;         /* ALL CAPS labels */
  
  /* Line height */
  --leading-tight: 1.15;     /* Headlines */
  --leading-snug: 1.35;      /* Subheadings */
  --leading-normal: 1.6;     /* Body text */
  --leading-relaxed: 1.8;    /* Long-form content */
}
```

### Typography Hierarchy

```css
/* Hero headline — the "wow" moment */
.hero-headline {
  font-size: clamp(var(--text-5xl), 8vw, var(--text-8xl));
  font-weight: 700;
  letter-spacing: var(--tracking-hero);
  line-height: var(--leading-tight);
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Section headline */
.section-headline {
  font-size: clamp(var(--text-3xl), 4vw, var(--text-5xl));
  font-weight: 600;
  letter-spacing: var(--tracking-display);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Eyebrow label (above headlines) */
.eyebrow {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-cap);
  text-transform: uppercase;
  color: var(--accent-secondary);
}

/* Body text */
.body-text {
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Code block */
.code-block {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
```

---

## 4. Aurora Background (Hero Section)

The hero background uses layered blurred blobs (CSS approximation of Stripe's WebGL gradient):

```css
/* Hero section */
.hero-section {
  position: relative;
  background: var(--bg-base);
  overflow: hidden;
  
  /* Grain texture overlay */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='300' height='300' filter='url(%23noise)' opacity='1'/></svg>");
    opacity: 0.035;
    pointer-events: none;
    z-index: 1;
  }
}

/* Aurora blobs */
.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: aurora-drift 15s ease-in-out infinite;
  
  &.blob-1 {
    width: 800px; height: 600px;
    background: rgba(99, 102, 241, 0.18);
    top: -200px; left: -200px;
    animation-delay: 0s;
  }
  
  &.blob-2 {
    width: 700px; height: 700px;
    background: rgba(167, 139, 250, 0.12);
    top: -100px; right: -300px;
    animation-delay: -5s;
  }
  
  &.blob-3 {
    width: 500px; height: 500px;
    background: rgba(99, 102, 241, 0.10);
    bottom: -100px; left: 30%;
    animation-delay: -10s;
  }
}

@keyframes aurora-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.05); }
  66%       { transform: translate(-20px, 30px) scale(0.95); }
}
```

---

## 5. Glassmorphism Card System

```css
/* Base glass card */
.glass-card {
  background: var(--glass-bg, rgba(255,255,255,0.03));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  
  /* Inner highlight — top edge catches "light" */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255,255,255,0.15) 40%, 
      rgba(255,255,255,0.15) 60%, 
      transparent 100%
    );
  }
  
  /* Grain texture */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,..."); /* SVG noise */
    opacity: 0.04;
    pointer-events: none;
  }
  
  /* Hover state */
  &:hover {
    border-color: var(--border-strong);
    background: rgba(255,255,255,0.05);
    transform: translateY(-2px);
    transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

/* Glow card variant (featured plan, active step) */
.glass-card-glow {
  @extend .glass-card;
  border-color: var(--border-accent);
  box-shadow: 
    0 0 0 1px var(--border-accent),
    0 0 40px rgba(99, 102, 241, 0.15),
    inset 0 0 40px rgba(99, 102, 241, 0.05);
}
```

---

## 6. Bento Grid Layout

```css
/* Feature bento grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

/* Cell size variants */
.bento-cell-hero   { grid-column: span 8; grid-row: span 2; }  /* Main feature */
.bento-cell-tall   { grid-column: span 4; grid-row: span 2; }  /* Tall secondary */
.bento-cell-wide   { grid-column: span 8; grid-row: span 1; }  /* Wide feature */
.bento-cell-medium { grid-column: span 6; grid-row: span 1; }  /* Half width */
.bento-cell-small  { grid-column: span 4; grid-row: span 1; }  /* Thirds */

/* Each cell is a glass card */
.bento-cell {
  @extend .glass-card;
  padding: 28px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  /* Product mockup area */
  .cell-mockup {
    flex: 1;
    border-radius: 10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
  }
}
```

### Bento Layout for LaunchGrid Features

```
┌────────────────────────┬────────────────┐
│                        │                │
│  Step Journey          │  Payment       │
│  (large, animated)     │  Options       │
│  8/12 columns          │  4/12 columns  │
│                        │                │
├────────────┬───────────┴────────────────┤
│            │                            │
│  Referral  │   Analytics Dashboard      │
│  Counter   │   Preview                  │
│  4/12      │   8/12 columns             │
│            │                            │
└────────────┴────────────────────────────┘
```

---

## 7. Animation System

### Easing Curves (Physics-Aware)

```css
:root {
  /* Spring — for UI elements that should "snap into place" */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Out Expo — for fast reveals (content appearing) */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* In Out — for transitions between states */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Linear — for progress bars, counters */
  --ease-linear: linear;
  
  /* Duration tokens */
  --duration-instant: 80ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-story: 800ms;
}
```

### Framer Motion Variants (Reusable)

```typescript
// lib/motion-variants.ts

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
}

export const staggerChildren = {
  visible: {
    transition: { staggerChildren: 0.08 }
  }
}

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { 
    y: -4, 
    scale: 1.01,
    transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }
  }
}

export const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: { duration: 2, repeat: Infinity, ease: 'linear' }
  }
}

export const stepUnlock = {
  locked: { 
    filter: 'grayscale(0.7)',
    opacity: 0.5 
  },
  unlocked: { 
    filter: 'grayscale(0)',
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
}

export const confetti = {
  initial: { scale: 0, rotate: 0, opacity: 1 },
  animate: { 
    scale: [0, 1.2, 1],
    rotate: [0, 180, 360],
    y: [-20, -60],
    opacity: [1, 1, 0],
    transition: { duration: 1, ease: 'easeOut' }
  }
}
```

---

## 8. Step Journey — Visual Design Spec

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP JOURNEY                              │
│                                                              │
│  ●─────────────────────────────────────●                    │
│  │   Step 1                            │                    │
│  │   Business Intake        ✅ Done    │                    │
│  │   June 7 at 3:42 PM                │                    │
│  │   ▾ "Jewellery Store, Mumbai"       │                    │
│  ●                                                          │
│  │   Step 2                                                │
│  │   AI Generation          ⟳ Running                     │
│  │   Generating product descriptions... (12/20)            │
│  │   [████████████░░░░░░░░] 60%                            │
│  ●                                                          │
│  │   Step 3                                                │
│  │   Brand Identity         ○ Pending                      │
│  ●                                                          │
│  │   Step 6    🔒           LOCKED                         │
│  │   Analytics Connected    [Growth Plan]                  │
│  │   ░░░░░░░░░░░░░░░░░ (blurred preview)                   │
│  │   [Unlock with Growth →]                                │
│  ●                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Step Indicator States

```css
/* Step circle indicators */
.step-indicator {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  
  /* Connector line (vertical) */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 60px; /* Distance between steps */
    background: linear-gradient(180deg, var(--color), transparent);
  }
}

/* Completed step */
.step-indicator.completed {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: var(--success);
  --color: rgba(34, 197, 94, 0.4);
}

/* Active/in-progress step */
.step-indicator.active {
  background: var(--accent-muted);
  border: 1px solid var(--accent-primary);
  color: var(--accent-secondary);
  --color: var(--accent-primary);
  
  /* Pulsing ring */
  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  animation: pulse-ring 2s ease-out infinite;
}

/* Locked step */
.step-indicator.locked {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  --color: var(--border-subtle);
}

@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  70%  { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}
```

### Locked Step — Frosted Glass Overlay

```css
.step-content-locked {
  position: relative;
  
  /* Blurred content behind */
  .step-preview-content {
    filter: blur(4px);
    opacity: 0.4;
    pointer-events: none;
    user-select: none;
  }
  
  /* Glass overlay */
  .lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(6, 6, 15, 0.7);
    backdrop-filter: blur(2px);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    
    /* Shimmer border */
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.05) 0%,
      rgba(255,255,255,0.02) 100%
    );
  }
  
  /* Unlock CTA — gradient border button */
  .unlock-cta {
    background: transparent;
    border: 1px solid transparent;
    background-clip: padding-box;
    position: relative;
    padding: 8px 20px;
    border-radius: 8px;
    color: var(--text-primary);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    
    &::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 9px;
      background: var(--gradient-primary);
      z-index: -1;
    }
    
    /* Shimmer animation */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
  }
}
```

---

## 9. Referral Widget — Visual Design

```css
/* Circular progress ring */
.referral-ring {
  position: relative;
  width: 160px; height: 160px;
  
  svg {
    transform: rotate(-90deg); /* Start from top */
    
    .track {
      fill: none;
      stroke: rgba(255,255,255,0.06);
      stroke-width: 6;
    }
    
    .progress {
      fill: none;
      stroke: var(--accent-primary);
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: var(--circumference);
      stroke-dashoffset: var(--offset); /* Animated via JS */
      transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    /* Glow on the progress line */
    .progress-glow {
      @extend .progress;
      stroke: var(--accent-primary);
      filter: blur(4px);
      opacity: 0.4;
    }
  }
  
  /* Center counter */
  .ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .referral-count {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: var(--tracking-hero);
    }
    
    .referral-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: var(--tracking-cap);
    }
  }
}

/* "Days earned" toast notification */
.days-added-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-accent);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 0 40px rgba(99, 102, 241, 0.2);
  
  /* Entry animation */
  animation: slide-up-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 10. Pricing Page Design

### Layout Principle (Linear/Stripe approach)

- Annual/Monthly toggle: **Animated pill slider** — not a checkbox
- Recommended plan: `scale(1.03)`, glow border, "Most Popular" badge with indigo gradient
- Feature list: Scannable — ≤ 8 items per tier, most important bolded
- CTA: "Get started" — not "Sign up" or "Buy"
- Below fold: Comparison table (hidden by default, expandable)
- Trust signals: "30-day money back" + "Cancel anytime" directly under CTA

### Annual Toggle Animation

```css
.billing-toggle {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 100px;
  padding: 4px;
  display: flex;
  gap: 2px;
  position: relative;
  
  /* Sliding indicator */
  .toggle-pill {
    position: absolute;
    top: 4px; bottom: 4px;
    width: calc(50% - 4px);
    background: var(--accent-muted);
    border: 1px solid var(--border-accent);
    border-radius: 100px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    
    &.annual { transform: translateX(calc(100% + 2px)); }
  }
  
  button {
    flex: 1;
    padding: 8px 20px;
    border-radius: 100px;
    font-size: var(--text-sm);
    font-weight: 500;
    position: relative;
    z-index: 1;
    color: var(--text-muted);
    
    &.active { color: var(--text-primary); }
  }
}

/* "Save 30%" badge on annual option */
.savings-badge {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--success);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;
  letter-spacing: var(--tracking-cap);
  margin-left: 8px;
}
```

---

## 11. GSAP Scroll Animations

### Scroll-Driven Step Reveal

```javascript
// The "sticky storytelling" pattern
// Used by Framer, Linear, Apple — industry standard

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function initStepScrollAnimation() {
  const steps = document.querySelectorAll('.step-item')
  const connector = document.querySelector('.step-connector-line')
  
  // Draw the connector line as steps complete
  gsap.fromTo(connector, 
    { scaleY: 0, transformOrigin: 'top center' },
    {
      scaleY: 1,
      scrollTrigger: {
        trigger: '.step-journey',
        start: 'top 60%',
        end: 'bottom 60%',
        scrub: 1,        // Tied to scroll position
      }
    }
  )
  
  // Stagger steps appearing
  steps.forEach((step, i) => {
    gsap.fromTo(step,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: step,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    )
  })
}

// Counter animation (referral count, businesses launched)
function animateCounter(element: HTMLElement, target: number, duration = 2) {
  const obj = { value: 0 }
  gsap.to(obj, {
    value: target,
    duration,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
      once: true
    },
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toLocaleString('en-IN')
    }
  })
}

// SVG path draw (step connector lines)
function drawSVGPath(path: SVGPathElement) {
  const length = path.getTotalLength()
  
  gsap.fromTo(path,
    { strokeDasharray: length, strokeDashoffset: length },
    {
      strokeDashoffset: 0,
      scrollTrigger: {
        trigger: path.closest('section'),
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: true
      }
    }
  )
}
```

---

## 12. Three.js Hero (Floating Distort Spheres)

```typescript
// components/HeroScene.tsx
'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere, Environment } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'

function DistortSphere({ 
  position, 
  color, 
  distort = 0.3,
  speed = 2,
  scale = 1 
}: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.3
    meshRef.current.rotation.y += 0.003
  })
  
  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={speed}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  )
}

export function HeroScene() {
  return (
    <div 
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}  // Limit to 1.5x for performance
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.2} />
          <pointLight position={[5, 5, 5]} color="#6366f1" intensity={3} />
          <pointLight position={[-5, -5, -5]} color="#a78bfa" intensity={2} />
          
          {/* Large sphere — left, partially visible */}
          <DistortSphere 
            position={[-4, 1, -2]} 
            color="#4f46e5"
            distort={0.4}
            scale={1.8}
          />
          
          {/* Medium sphere — right */}
          <DistortSphere 
            position={[3.5, -1, -3]} 
            color="#7c3aed"
            distort={0.3}
            speed={1.5}
            scale={1.2}
          />
          
          {/* Small sphere — top */}
          <DistortSphere 
            position={[1, 3, -4]} 
            color="#6366f1"
            distort={0.5}
            speed={3}
            scale={0.6}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
```

---

## 13. Component Inventory

### Marketing Site Components

| Component | Visual Pattern | Animation |
|-----------|---------------|-----------|
| `HeroSection` | Full-screen, 3D spheres, aurora bg, gradient headline | Text fade-in-up, spheres float |
| `StepPreview` | Numbered steps, locked/unlocked states, icon per step | GSAP stagger reveal on scroll |
| `BentoFeatures` | Bento grid with glass cards, product mockups | Card cascade on scroll, hover lift |
| `PricingSection` | 3 plan cards, billing toggle, comparison table | Toggle spring animation, card hover glow |
| `ReferralShowcase` | Ring progress, day counter, share buttons | Counter animation, ring draw |
| `SocialProof` | Animated counter + logo strip + testimonials | Number count up, logo marquee |
| `InteractiveDemo` | Dashboard mockup, animated step through | Click-triggered step animations |
| `CTASection` | Full-width, aurora background, single CTA | Parallax scroll, glow button |

### Dashboard Components

| Component | Visual Pattern | Animation |
|-----------|---------------|-----------|
| `StepJourney` | Vertical timeline, live progress, Lottie per step | Sequential step activation, pulse indicators |
| `ReferralWidget` | SVG ring, day counter, share kit | Real-time counter, confetti on referral |
| `StoreThumbnail` | Browser frame mockup, live site screenshot | Hover zoom |
| `BillingCard` | Plan info, days remaining, usage bars | Smooth bar fills |
| `AnalyticsCards` | KPI numbers, sparkline charts | Count-up on load |
| `PaymentSetup` | BYOK / Route choice cards, key input form | Validation micro-animations |

---

## 14. What We Must NOT Do (AI-Generic Anti-Patterns)

❌ Use `all: 0.3s ease` — always specify properties and custom curves  
❌ Stock photos of laptops, teams, or handshakes  
❌ Generic gradient backgrounds (red-to-blue or similar)  
❌ Equal visual weight sections (vary density to create rhythm)  
❌ Long bullet lists with no visual hierarchy  
❌ Buttons that only change color on hover  
❌ Light mode as primary (dark canvas first)  
❌ Generic icon library icons without custom animations  
❌ Testimonials isolated in a separate "social proof" section — weave them into the story  
❌ Navigation that competes with content for attention  
❌ Lorem ipsum or placeholder content anywhere  
❌ Font size that doesn't respond to viewport  

---

*Document Status: v1.0 | Based on June 2026 live research of 12 premium SaaS sites*
