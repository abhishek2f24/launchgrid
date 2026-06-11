# LaunchGrid UI/UX Design System Document

This document defines the visual language, component logic, and psychological design choices for LaunchGrid. The goal is to exude a "Premium SaaS" aesthetic (similar to Stripe or Linear) that justifies a high-ticket price for offline merchants (Boutiques, Salons, Jewelers).

## 1. Core Visual Aesthetics
- **Theme**: Deep Dark Mode by default.
- **Backgrounds**: Deep blacks (`#0a0a0a`) combined with subtle "Aurora" radial gradients (e.g., violet and primary blue) mapped via CSS variables. A CSS noise/grain overlay is applied to give texture and depth.
- **Typography**: Geometric Sans-Serif (Inter/Outfit). High contrast for headings (white/off-white), muted grays for paragraphs.
- **Glassmorphism**: Cards and panels use semi-transparent backgrounds (`bg-white/5` or `bg-black/40`) with thin, subtle borders (`border-white/10`) and backdrop blur filters (`backdrop-blur-xl`).

## 2. Component Design (Tailwind v4 / Shadcn)
- **Cards (`.glass-card`)**: Rounded corners (`rounded-xl` or `rounded-2xl`), smooth hover states (`hover:bg-white/10`), and subtle drop shadows.
- **Buttons**:
  - *Primary*: Solid brand color (`bg-primary`), text white, slight scale effect on click (`active:scale-95`).
  - *Secondary*: Outline or transparent with hover effects.
- **Icons**: Lucide React icons with a consistent stroke width (`strokeWidth={2}`).
- **Layouts**: Bento Grids for feature displays and dashboard metrics to compartmentalize complex data visually.

## 3. Micro-Animations & Psychology
- **The Magic Loading Screen**: The onboarding screen uses an animated terminal log to visualize the "invisible" API work (generating brand, provisioning database). This builds psychological investment and justifies the setup fee.
- **JIT Checkout Transition**: When a buyer clicks "Pay," the button text instantly changes to "Securing your items..." while the backend verifies dropship inventory. This turns latency into a trust signal.
- **The Confetti Moment**: Realtime WebSockets trigger celebratory animations on the dashboard when a merchant gets their first sale.

## 4. Mobile-First Merchant Experience (The "One-Thumb" Rule)
- **The Problem**: Merchants (especially offline shop owners) manage their business while walking the floor, entirely from their phones.
- **The Solution**: 
  - The desktop sidebar collapses on mobile.
  - A fixed **Bottom Navigation Bar** is introduced.
  - Touch targets strictly adhere to Apple/Google HIG (minimum `44x44px` hit areas).

## 5. Defensive UI Guardrails
- **Working Capital Warning**: A highly visible notice inside the dashboard explaining the T+2 Razorpay settlement delay versus immediate supplier payment requirements.
- **Tier 0 UPI Manual Verification**: For free UPI payments, the UI flags orders in bright warning colors ("Awaiting Manual Verification") to prevent merchants from fulfilling fraudulent orders.
- **COD Restrictions**: Clear, contextual explanations in the payment settings as to why Cash On Delivery is disabled for lower tiers (protecting the founder from Return-To-Origin shipping penalties).
