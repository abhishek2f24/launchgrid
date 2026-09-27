# Sales playbook — inbound sellers

Written 2026-09-27, after the first inbound WhatsApp lead.

The first draft of this file was wrong in a way worth recording: it claimed
LaunchGrid had no storefront product and advised selling manual setup work for
₹9,999. LaunchGrid *is* the storefront product. The lead's own words — "I want
to start my online store free trial" — were quoted off `/free-setup`. Anyone
answering leads must know what the site promises before replying to someone who
read it.

---

## 1. What the visitor was promised

`/free-setup`, linked from the homepage announcement bar, says:

> **Free Store Setup — We Build It For You in 15 Minutes.** Send 5 product
> photos. Your store goes live at `yourname.launchgrid.in` — products, UPI &
> COD checkout, GST-ready invoicing, order alerts on your phone.

The CTA opens WhatsApp to `919506212886`. So an inbound WhatsApp message about a
"free trial" or "store setup" is this funnel converting. Honour the offer as
written. Do not re-quote it, re-scope it, or attach a price to it.

## 2. What actually exists

Verified in the codebase, not assumed:

- Signup → `/onboarding` → `/setup`
- Dashboard: products (add / edit / import), orders, customers, coupons,
  marketing, ads, SEO, research
- Public storefront at `/store/[slug]` with shop, cart and checkout
- Payments: seller's own **UPI ID or QR**, **COD** toggle, or **your own
  Razorpay keys**
- New order → push notification to the seller **and** an email via Resend
- Shipped / delivered alerts to the buyer
- Plans: Free ₹0, then ₹1,999, ₹9,999, ₹24,999 per month

**Not available:** the managed Razorpay Route tier. It needs a Razorpay Partner
integration that isn't connected. The settings page says so honestly rather than
faking success — keep it that way, and put sellers on Merchant UPI or BYOK.

## 3. The qualification questions

Ask to configure the store, not to price the deal. Price is already published.

1. **What are you selling?** Sets GST rate and category.
2. **Selling anywhere already?** Existing Instagram sellers convert best — they
   have photos, prices and proven demand.
3. **Photos and prices ready?** The offer needs five photos. This is the one
   input the seller must supply.
4. **How many SKUs?** Decides whether import is worth it over manual adding.

## 4. The ladder

Free tier first, always. Someone on the free plan with real orders will upgrade
on their own; someone quoted ₹9,999 before their first order will not reply.

Upgrade conversations happen when the seller hits a limit they can feel — order
volume, staff access, ads or research — never on day one.

## 5. Where it breaks, and what to say

**Payment confirmation is manual on the UPI tier.** The buyer pays to the
seller's UPI; no callback tells LaunchGrid it happened. The seller checks their
UPI app and clicks *Mark as Paid*. Since 2026-09-27 that action also records the
UPI reference (UTR) and the time, so a later "I already paid" dispute has
evidence behind it. Tell sellers to enter the UTR — it takes five seconds and is
the only proof they will have.

Do not describe this as automatic. It isn't, and a seller who discovers that on
their third order will leave.

## 6. Scope boundary

- We don't take product photos.
- We don't run ads or manage social for you.
- **We don't guarantee sales.** The store being live is what's promised.
- Money goes to the seller's own UPI. It never passes through LaunchGrid.

## 7. The real gap

Not pricing, not features: **lead supply**. This lead arrived by luck. The free
tools — the largest part of the site — have no call to action pointing at
`/free-setup`. Adding one line to the pricing-relevant calculators and measuring
the taps is the highest-leverage thing left.
