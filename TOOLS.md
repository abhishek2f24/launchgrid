# LaunchGrid tool catalogue

> Generated from the registries by `node scripts/generate-tool-catalogue.mjs`.
> Do not edit by hand — edit the source below and re-run it.
>
> - Live tools: `src/data/tools.ts`, `src/lib/documents/kinds.ts`, `src/lib/calculators/registry.ts`
> - Backlog: `src/data/roadmap.ts`

## Where things stand

| | Count |
| --- | ---: |
| Live now | **54** |
| Planned, already in the registry | 4 |
| On the roadmap (Waves 3–5) | 8 |
| **Total once the roadmap ships** | **66** |

Engines carry most of the weight: a document, a calculator and a QR destination
are configuration entries, not builds. That is why the totals are far below the
original ~120 item count while covering the same ground.

## Live

### Figure out what to sell (2)

_Check demand, margins and names before you commit money to a product._

| Tool | Access | Engine | URL |
| --- | --- | --- | --- |
| Research | Free | — | `/research` |
| Store Name Generator | Free | — | `/tools/store-name-generator` |

### Get your business online (3)

_A storefront, a link, a code customers can scan._

| Tool | Access | Engine | URL |
| --- | --- | --- | --- |
| Store | Account | — | `/onboarding` |
| WhatsApp Link | Free | — | `/tools/whatsapp-message-generator` |
| QR Codes | Free | — | `/tools/qr-code-generator` |

### Bill and get paid (10)

_The paperwork that turns work done into money received._

| Tool | Access | Engine | URL |
| --- | --- | --- | --- |
| Settlement Check | Free | — | `/tools/settlement-reconciliation` |
| Invoice | Free | document | `/tools/invoice-generator` |
| Proforma Invoice | Free | document | `/tools/proforma-invoice-generator` |
| Quotation | Free | document | `/tools/quotation-generator` |
| Estimate | Free | document | `/tools/estimate-generator` |
| Credit Note | Free | document | `/tools/credit-note-generator` |
| Debit Note | Free | document | `/tools/debit-note-generator` |
| Receipt | Free | document | `/tools/receipt-generator` |
| Rent Receipt | Free | document | `/tools/rent-receipt-generator` |
| Payment Reminder | Free | document | `/tools/payment-reminder-generator` |

### Run the day to day (7)

_Orders out, goods moving, spending recorded._

| Tool | Access | Engine | URL |
| --- | --- | --- | --- |
| Purchase Order | Free | document | `/tools/purchase-order-generator` |
| Delivery Challan | Free | document | `/tools/delivery-challan-generator` |
| Payment Voucher | Free | document | `/tools/payment-voucher-generator` |
| Expense Voucher | Free | document | `/tools/expense-voucher-generator` |
| Work Order | Free | document | `/tools/work-order-generator` |
| Job Card | Free | document | `/tools/job-card-generator` |
| SKU Generator | Free | generator | `/tools/sku-generator` |

### Hire and manage people (9)

_Offers, payslips and the letters employees ask you for._

| Tool | Access | Engine | URL |
| --- | --- | --- | --- |
| Salary Slip | Free | document | `/tools/salary-slip-generator` |
| Offer Letter | Free | document | `/tools/offer-letter-generator` |
| Appointment Letter | Free | document | `/tools/appointment-letter-generator` |
| Experience Certificate | Free | document | `/tools/experience-certificate-generator` |
| Employment Certificate | Free | document | `/tools/employment-certificate-generator` |
| Internship Certificate | Free | document | `/tools/internship-certificate-generator` |
| Relieving Letter | Free | document | `/tools/relieving-letter-generator` |
| Increment Letter | Free | document | `/tools/increment-letter-generator` |
| Salary Calculator | Free | calculator | `/tools/salary-calculator` |

### Understand your numbers (16)

_Margins, cash, loans and growth — the maths behind the decisions._

| Tool | Access | Engine | URL |
| --- | --- | --- | --- |
| GST Calculator | Free | — | `/tools/gst-calculator` |
| Profit Margin Calculator | Free | — | `/tools/profit-margin-calculator` |
| Pricing Calculator | Free | — | `/tools/ecommerce-pricing-calculator` |
| EMI Calculator | Free | calculator | `/tools/emi-calculator` |
| Marketplace Fees | Free | calculator | `/tools/marketplace-fee-calculator` |
| Shipping Weight | Free | calculator | `/tools/shipping-cost-calculator` |
| ROI Calculator | Free | calculator | `/tools/roi-calculator` |
| Break-even Calculator | Free | calculator | `/tools/break-even-calculator` |
| Cash Flow Calculator | Free | calculator | `/tools/cash-flow-calculator` |
| Revenue Calculator | Free | calculator | `/tools/revenue-calculator` |
| Commission Calculator | Free | calculator | `/tools/commission-calculator` |
| TDS Calculator | Free | calculator | `/tools/tds-calculator` |
| Markup Calculator | Free | calculator | `/tools/markup-calculator` |
| Discount Calculator | Free | calculator | `/tools/discount-calculator` |
| CAGR Calculator | Free | calculator | `/tools/cagr-calculator` |
| Inventory Turnover | Free | calculator | `/tools/inventory-turnover-calculator` |

### Find customers (7)

_Reach people, measure what the spend returned._

| Tool | Access | Engine | URL |
| --- | --- | --- | --- |
| ROAS Calculator | Free | — | `/tools/roas-calculator` |
| CAC Calculator | Free | calculator | `/tools/cac-calculator` |
| CLV Calculator | Free | calculator | `/tools/clv-calculator` |
| Ad Profitability | Free | calculator | `/tools/ad-profitability-calculator` |
| Coupon Codes | Free | generator | `/tools/coupon-code-generator` |
| Referral Codes | Free | generator | `/tools/referral-code-generator` |
| UTM Builder | Free | generator | `/tools/utm-builder` |

## Planned — in the registry, not yet built

These have entries in `src/data/tools.ts` with `status: 'planned'`. They are
deliberately **not rendered** on the site: a grid that advertises what does not
exist converts worse than a smaller grid that is entirely true.

| Tool | Engine | Bucket |
| --- | --- | --- |
| Dynamic QR | qr | Get your business online |
| Barcode Generator | generator | Get your business online |
| Business Card | generator | Get your business online |
| Email Signature | generator | Find customers |

## Roadmap — Waves 3 to 5

`cost` is the column that decides sequencing. **Free** runs in the visitor’s
browser and costs nothing to serve, like everything shipped so far.
**Metered** spends money on every use and cannot sit on a free tier without a
hard cap.

### Wave 3 — Selling on marketplaces (3)

- **Size Chart Generator** — free · no account · generator engine
- **Product Label Generator** — free · no account · generator engine
  <br>Print-ready labels with barcode and price. Shares the barcode engine.
- **Product Listing Builder** — **metered** · account · standalone
  <br>Title, description, bullets, specs and keywords from a short form. Replaces four separately-listed generators. AI cost per run, so it needs an account and a cap.

### Wave 4 — Images (3)

- **Image Resizer & Compressor** — free · no account · image engine
  <br>Canvas API in the browser, with marketplace and social presets (Amazon, Flipkart, Meesho, Instagram post/story, WhatsApp). Replaces seven separately-listed resizers. Free to run and no upload — same profile as the reconciliation tool.
- **Banner & Poster Maker** — free · no account · image engine
  <br>Template + text + product photo composited on canvas. Covers banner, poster, collage, price tag, sale and festival-offer variants as templates rather than tools.
- **Background Remover & Image Enhancer** — **metered** · account · standalone
  <br>Background removal, background generation, upscaling, enhancement. The only genuinely expensive thing on this roadmap: GPU cost per image. Must be account-gated with a hard cap before it ships, or one scripted loop empties the budget.

### Wave 5 — Marketing (2)

- **WhatsApp Message Templates** — free · no account · letter engine
  <br>Payment reminder, order confirmation, review request, thank-you, appointment reminder — templates over the existing letter engine, output as a wa.me link instead of a PDF.
- **Review Landing Page** — free · account · standalone
  <br>A hosted page behind a review QR. Needs an account and storage because it is a page we serve, not a file the visitor downloads — the first roadmap item that is not purely client-side.

## Shipped from the roadmap

| Originally listed | Shipped as |
| --- | --- |
| Marketplace / Amazon / Flipkart / Meesho fee calculators | /tools/marketplace-fee-calculator |
| Shipping Cost Calculator | /tools/shipping-cost-calculator |
| SKU Generator | /tools/sku-generator |
| Coupon Generator | /tools/coupon-code-generator |
| Referral Code Generator | /tools/referral-code-generator |
| UTM Generator / Campaign URL Builder | /tools/utm-builder |
| QR Generator and all seven QR destination variants | /tools/qr-code-generator — static codes, ten destination types. The DYNAMIC version (editable destination, scan analytics) stays planned: it needs an edge redirect, a database and an account. |

## Collapsed into engines

Listed in the original waves, but not separate builds. Recorded so the
catalogue reads as deduplicated rather than incomplete.

| Originally listed | Where it went |
| --- | --- |
| Amazon / Flipkart / Meesho fee calculators | Presets of Marketplace Fee Calculator |
| Product Pricing Calculator | Already live |
| Product Margin Calculator | Already live as Profit Margin Calculator |
| Break-even Calculator | Already live (Wave 6) |
| GST-inclusive / GST-exclusive Price Calculator | Modes of the live GST Calculator |
| Wholesale / Retail Price Calculator | Modes of the live Markup Calculator |
| Barcode Generator | Already planned in Wave 1 |
| Product Title / Description / Bullet / Specification Generators | One Product Listing Builder |
| Image Compressor, Marketplace Image Formatter, Instagram Post/Story Resizer, WhatsApp Image Resizer | Presets of Image Resizer |
| Product Banner / Poster / Collage / Comparison / Infographic / Social Post / Price Tag / Sale Banner / Festival Offer | Templates in Banner & Poster Maker |
| Background Generator, Product Image Enhancer, Image Upscaler | Modes of AI Image Tools |
| Size Chart Maker | Duplicate of Wave 3 Size Chart Generator |
| Google Review / Instagram / WhatsApp / Website / vCard / Wi-Fi / Menu QR | Destination presets of the QR engine |
| WhatsApp Payment Reminder / Order Confirmation / Review Request / Thank-you / Appointment Reminder | Templates in WhatsApp Message Templates |
| WhatsApp Business Link, WhatsApp Catalogue | Already live as WhatsApp Link & QR Generator |
| Campaign URL Builder | Same tool as UTM Generator |

## Declined

| Item | Why not |
| --- | --- |
| PDF Merge, PDF Compressor (Wave 1) | Highest infrastructure cost of anything proposed, zero retained business data, and the search terms belong to iLovePDF and TinyPNG. No path to a paying customer. |
| Standalone background remover as a free tool (Wave 1) | GPU cost per image on a free tier is an uncapped liability. Kept in Wave 4 as an account-gated, capped feature instead. |

## Known gaps

- The storefront invoice (`src/app/store/[slug]/invoice/[orderId]`) still computes
  its own GST split in floats, separate from `src/lib/documents/totals.ts`. Unifying
  needs a state-name→GST-code resolution step; getting it wrong would silently flip
  CGST/SGST to IGST on live invoices.
- No billing exists, so nothing is gated. The natural first paywall is the findings
  table and CSV export in the settlement reconciliation tool.

