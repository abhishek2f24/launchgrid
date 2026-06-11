# LaunchGrid App Flow (User Journey Blueprint)

This document maps the conversion and lifecycle flow, heavily optimized for dopamine hits, frictionless onboarding, and extreme safety during the merchant's first e-commerce transactions.

## 1. Minimal Onboarding & Domain Reservation
- **Entry**: User clicks "Start Building" on `launchgrid.in`.
- **Short Intake**: User only provides **Email**, **Business Name**, and desired **Subdomain**.
- **Domain Lock**: The system queries active tenants and the `subdomain_locks` table. If available, it reserves the subdomain for 15 minutes.
- **Payment Wall**: User pays the ₹4,999 setup fee while their subdomain is safely locked.

## 2. The 15-Second "Immediate Win"
- **Flash Provisioning**: Post-payment, the backend takes a maximum of 15 seconds to instantly provision the `Tenant` row, secure the `subdomain`, and link the auth. Heavy tasks (AI branding, 50-item catalog imports) are dispatched to an **Asynchronous Background Queue**.
- **The Dopamine Hit**: The user is dropped directly into the Dashboard. Overtaking all settings is the **Immediate Win Card**: 
  - *"🎉 Your Store Is Live"*
  - The live URL is immediately clickable, and a placeholder screenshot proves the site exists.
- **Post-Payment Setup**: Now invested, the user is gently prompted to fill out their Brand Colors, Niche, and Logo preferences to finalize the background AI tasks.

## 3. The Live Storefront & JIT Inventory Reservation
- **Store Access**: Shoppers visit the active storefront.
- **Adding to Cart**: Shopper initiates checkout.
- **JIT Local Lock**: 
  - The backend intercepts the "Pay" click. The button reads: *"Securing your items..."*
  - The backend queries the `products` table, incrementing `reserved_quantity` and setting an `expires_at` timer (15 mins). This guarantees local stock availability without trusting supplier API locks.
- **Provisional Order**: A row is created in `orders` with an `expires_at` (30 mins) timer.
- **Razorpay**: The shopper successfully pays.

## 4. The Merchant Panic State (First Order Handling)
- **The Confetti Moment**: WebSockets push the `"payment_status" = "paid"` update to the Dashboard. Confetti erupts: *"🎉 FIRST SALE! Order #001 - ₹1,299"*.
- **The Panic Overlay**: Instead of leaving the founder confused, an unskippable modal overtakes the dashboard:
  - **Step 1:** Confirm inventory (Check GPay balance if Tier 0).
  - **Step 2:** Place supplier order (Working capital warning provided: *“Razorpay takes T+2 days to settle. Pay supplier immediately to ship.”*).
  - **Step 3:** Mark fulfilled.
  - **Step 4:** Send tracking.
- **Support Trigger**: If the merchant gets stuck on Step 2 for more than 12 hours, an automated WhatsApp alert is sent offering 1-on-1 human support.

## 5. The Extended Lifecycle & Referrals
- **Viral Trigger**: Only AFTER the first order is fulfilled does the dashboard surface the referral prompt: *"Share LaunchGrid, Earn 30 Free Days."*
- **The Post-Sale Journey**: The mission board continues past the First Sale, tracking:
  - Order Delivered
  - Review Collected
  - Repeat Customer Acquired (The ultimate definition of a successful business).
