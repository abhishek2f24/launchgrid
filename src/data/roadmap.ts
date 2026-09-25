/**
 * The backlog: Waves 3, 4 and 5, deduplicated and collapsed onto engines.
 *
 * WHY THIS FILE EXISTS
 *   Waves 1, 2 and 6 are shipped and live in the registries, which are the
 *   source of truth for what exists. Waves 3–5 existed only in conversation,
 *   which meant re-deciding the scope every time it came up. This is the
 *   written version, so TOOLS.md can be generated from code rather than memory.
 *
 * DELIBERATELY NOT A LIST OF 60 TOOLS
 *   The original waves listed 60 items across these three. After removing what
 *   already ships, folding presets into their engine, and dropping the ones we
 *   decided not to build, what remains is the list below. `COLLAPSED` records
 *   every item that disappeared and where it went, so nothing looks forgotten.
 *
 * `cost` IS THE FIELD THAT MATTERS MOST
 *   'free' means it runs in the visitor's browser and costs nothing to serve,
 *   like everything shipped so far. 'metered' means a paid API on every use —
 *   those cannot sit on a free tier without a spend cap, and they are the only
 *   items here that change the hosting bill.
 */

export type RoadmapWave = 3 | 4 | 5;

export interface RoadmapItem {
  slug: string;
  name: string;
  wave: RoadmapWave;
  /** Shared implementation, or null when genuinely standalone. */
  engine: string | null;
  bucket: string;
  /** 'free' runs client-side. 'metered' costs money per use. */
  cost: 'free' | 'metered';
  requiresAccount: boolean;
  note?: string;
}

export const ROADMAP: RoadmapItem[] = [
  // ── Wave 3 · selling on marketplaces ──────────────────────────────────
  {
    slug: 'size-chart-generator',
    name: 'Size Chart Generator',
    wave: 3,
    engine: 'generator',
    bucket: 'run-business',
    cost: 'free',
    requiresAccount: false,
  },
  {
    slug: 'product-label-generator',
    name: 'Product Label Generator',
    wave: 3,
    engine: 'generator',
    bucket: 'run-business',
    cost: 'free',
    requiresAccount: false,
    note: 'Print-ready labels with barcode and price. Shares the barcode engine.',
  },
  {
    slug: 'listing-builder',
    name: 'Product Listing Builder',
    wave: 3,
    engine: null,
    bucket: 'get-online',
    cost: 'metered',
    requiresAccount: true,
    note: 'Title, description, bullets, specs and keywords from a short form. Replaces four separately-listed generators. AI cost per run, so it needs an account and a cap.',
  },

  // ── Wave 4 · images ───────────────────────────────────────────────────
  {
    slug: 'image-resizer',
    name: 'Image Resizer & Compressor',
    wave: 4,
    engine: 'image',
    bucket: 'get-online',
    cost: 'free',
    requiresAccount: false,
    note: 'Canvas API in the browser, with marketplace and social presets (Amazon, Flipkart, Meesho, Instagram post/story, WhatsApp). Replaces seven separately-listed resizers. Free to run and no upload — same profile as the reconciliation tool.',
  },
  {
    slug: 'image-template-composer',
    name: 'Banner & Poster Maker',
    wave: 4,
    engine: 'image',
    bucket: 'get-customers',
    cost: 'free',
    requiresAccount: false,
    note: 'Template + text + product photo composited on canvas. Covers banner, poster, collage, price tag, sale and festival-offer variants as templates rather than tools.',
  },
  {
    slug: 'ai-image-tools',
    name: 'Background Remover & Image Enhancer',
    wave: 4,
    engine: null,
    bucket: 'get-online',
    cost: 'metered',
    requiresAccount: true,
    note: 'Background removal, background generation, upscaling, enhancement. The only genuinely expensive thing on this roadmap: GPU cost per image. Must be account-gated with a hard cap before it ships, or one scripted loop empties the budget.',
  },

  // ── Wave 5 · marketing ────────────────────────────────────────────────
  {
    slug: 'whatsapp-template-generator',
    name: 'WhatsApp Message Templates',
    wave: 5,
    engine: 'letter',
    bucket: 'get-customers',
    cost: 'free',
    requiresAccount: false,
    note: 'Payment reminder, order confirmation, review request, thank-you, appointment reminder — templates over the existing letter engine, output as a wa.me link instead of a PDF.',
  },
  {
    slug: 'review-landing-page',
    name: 'Review Landing Page',
    wave: 5,
    engine: null,
    bucket: 'get-customers',
    cost: 'free',
    requiresAccount: true,
    note: 'A hosted page behind a review QR. Needs an account and storage because it is a page we serve, not a file the visitor downloads — the first roadmap item that is not purely client-side.',
  },
];

/**
 * Items from the original waves that are NOT separate builds, and where each
 * one went. Kept so the list reads as deduplicated rather than incomplete.
 */
export const COLLAPSED: { listed: string; becomes: string }[] = [
  // Wave 3
  { listed: 'Amazon / Flipkart / Meesho fee calculators', becomes: 'Presets of Marketplace Fee Calculator' },
  { listed: 'Product Pricing Calculator', becomes: 'Already live' },
  { listed: 'Product Margin Calculator', becomes: 'Already live as Profit Margin Calculator' },
  { listed: 'Break-even Calculator', becomes: 'Already live (Wave 6)' },
  { listed: 'GST-inclusive / GST-exclusive Price Calculator', becomes: 'Modes of the live GST Calculator' },
  { listed: 'Wholesale / Retail Price Calculator', becomes: 'Modes of the live Markup Calculator' },
  { listed: 'Barcode Generator', becomes: 'Already planned in Wave 1' },
  { listed: 'Product Title / Description / Bullet / Specification Generators', becomes: 'One Product Listing Builder' },
  // Wave 4
  { listed: 'Image Compressor, Marketplace Image Formatter, Instagram Post/Story Resizer, WhatsApp Image Resizer', becomes: 'Presets of Image Resizer' },
  { listed: 'Product Banner / Poster / Collage / Comparison / Infographic / Social Post / Price Tag / Sale Banner / Festival Offer', becomes: 'Templates in Banner & Poster Maker' },
  { listed: 'Background Generator, Product Image Enhancer, Image Upscaler', becomes: 'Modes of AI Image Tools' },
  { listed: 'Size Chart Maker', becomes: 'Duplicate of Wave 3 Size Chart Generator' },
  // Wave 5
  { listed: 'Google Review / Instagram / WhatsApp / Website / vCard / Wi-Fi / Menu QR', becomes: 'Destination presets of the QR engine' },
  { listed: 'WhatsApp Payment Reminder / Order Confirmation / Review Request / Thank-you / Appointment Reminder', becomes: 'Templates in WhatsApp Message Templates' },
  { listed: 'WhatsApp Business Link, WhatsApp Catalogue', becomes: 'Already live as WhatsApp Link & QR Generator' },
  { listed: 'Campaign URL Builder', becomes: 'Same tool as UTM Generator' },
];

/**
 * Roadmap items that have since shipped and moved into the live registries.
 * Kept so the wave numbering still makes sense against the original plan.
 */
export const SHIPPED: { listed: string; shippedAs: string }[] = [
  { listed: 'Marketplace / Amazon / Flipkart / Meesho fee calculators', shippedAs: '/tools/marketplace-fee-calculator' },
  { listed: 'Shipping Cost Calculator', shippedAs: '/tools/shipping-cost-calculator' },
  { listed: 'SKU Generator', shippedAs: '/tools/sku-generator' },
  { listed: 'Coupon Generator', shippedAs: '/tools/coupon-code-generator' },
  { listed: 'Referral Code Generator', shippedAs: '/tools/referral-code-generator' },
  { listed: 'UTM Generator / Campaign URL Builder', shippedAs: '/tools/utm-builder' },
  {
    listed: 'QR Generator and all seven QR destination variants',
    shippedAs: '/tools/qr-code-generator — static codes, ten destination types. The DYNAMIC version (editable destination, scan analytics) stays planned: it needs an edge redirect, a database and an account.',
  },
];

/** Things we decided NOT to build, and why. */
export const DECLINED: { listed: string; reason: string }[] = [
  {
    listed: 'PDF Merge, PDF Compressor (Wave 1)',
    reason:
      'Highest infrastructure cost of anything proposed, zero retained business data, and the search terms belong to iLovePDF and TinyPNG. No path to a paying customer.',
  },
  {
    listed: 'Standalone background remover as a free tool (Wave 1)',
    reason:
      'GPU cost per image on a free tier is an uncapped liability. Kept in Wave 4 as an account-gated, capped feature instead.',
  },
];
