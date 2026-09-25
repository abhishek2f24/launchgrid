/**
 * SINGLE SOURCE OF TRUTH for the LaunchGrid tool catalogue.
 *
 * Drives the homepage grid, /tools, the sitemap, and the ItemList structured
 * data. Adding a tool means adding one entry here — nothing else needs editing
 * except the tool's own page under (marketing)/tools/<slug>.
 *
 * STATUS IS LOAD-BEARING, NOT DECORATIVE
 *   Only `live` entries are rendered to visitors (see `liveTools()`). `planned`
 *   entries exist so the roadmap is reviewable in code and so the intent
 *   buckets can be designed against the finished catalogue — they are NOT
 *   surfaced as "coming soon" tiles. A grid that advertises what does not exist
 *   converts worse than a smaller grid that is entirely true, and every planned
 *   tile is a click that ends in disappointment.
 *
 * `requiresAccount` must be accurate. The whole premise of the grid is that a
 * visitor can self-select and get value before being asked for anything, so
 * mislabelling a gated tool as free is the one lie that breaks the funnel.
 */

import {
  Barcode,
  Calculator,
  FlaskConical,
  IdCard,
  IndianRupee,
  Mail,
  MessageSquare,
  QrCode,
  Receipt,
  ShieldCheck,
  Sparkles,
  SearchCheck,
  Store,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { CALCULATORS } from '@/lib/calculators/registry';
import { GENERATORS } from '@/lib/generators/registry';
import {
  DOCUMENT_KINDS,
  DOCUMENT_KIND_LIST,
  documentSlug,
} from '@/lib/documents/kinds';
import type { DocumentKind } from '@/lib/documents/types';

/** One icon per document shape — 23 near-identical glyphs would be noise. */
const DOCUMENT_ICONS = {
  tabular: Receipt,
  payslip: Wallet,
  letter: Mail,
} as const;

/** What the business is trying to do — not what kind of thing the tool is. */
export type IntentBucket =
  | 'decide'
  | 'get-online'
  | 'get-paid'
  | 'run-business'
  | 'people'
  | 'know-numbers'
  | 'get-customers';

export type ToolStatus = 'live' | 'planned';

export interface Tool {
  /** URL segment under /tools, or the full path when the tool lives elsewhere. */
  slug: string;
  /** Full, search-oriented name. Used as the card heading and page <h1>. */
  name: string;
  /** Short label for dense layouts. Falls back to `name` when absent. */
  shortName?: string;
  /** One sentence, present tense, describing what the visitor gets. */
  description: string;
  href: string;
  icon: LucideIcon;
  bucket: IntentBucket;
  status: ToolStatus;
  /** False means usable immediately, with no signup wall. */
  requiresAccount: boolean;
  /** Category chip shown on the card. */
  badge: string;
  useCases: string[];
  ctaText: string;
  /** Feeds the tool page's own metadata.keywords. */
  keywords: string[];
  /** Sitemap priority. */
  priority: number;
  /** Roadmap wave. Absent on tools that already shipped. */
  wave?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * The shared implementation this tool is an output of.
   *
   * Tools sharing an engine are ONE build with different presets — not
   * separate products. `qr` covers every destination type (UPI, WhatsApp,
   * review, menu, vCard, Wi-Fi); `document` covers every paper output
   * (invoice, quotation, receipt, challan, certificate). Counting outputs as
   * builds is how a 25-engine roadmap gets mistaken for a 120-tool one.
   *
   * Absent means the tool is genuinely standalone.
   */
  engine?: EngineId;
}

/**
 * Shared implementations. Each is one build; the tools that name it are its
 * presets. Estimating work per engine rather than per tool is the difference
 * between a plan that ships and a backlog that does not.
 */
export type EngineId = 'qr' | 'document' | 'calculator' | 'generator';

export const ENGINES: Record<EngineId, { id: EngineId; label: string; note: string }> = {
  qr: {
    id: 'qr',
    label: 'QR engine',
    note: 'One dynamic-QR pipeline: code generation, editable destination, redirect, scan events. Destination type is a preset, not a product.',
  },
  document: {
    id: 'document',
    label: 'Document engine',
    note: 'One schema (business profile + party + line items + totals) feeding one PDF renderer. Invoice, quotation, receipt, challan and certificates are templates over it.',
  },
  calculator: {
    id: 'calculator',
    label: 'Calculator engine',
    note: 'Inputs → formula → result → shareable link. Each calculator is a formula definition, not a page build.',
  },
  generator: {
    id: 'generator',
    label: 'Asset generator',
    note: 'Text or image output from a short form — barcodes, business cards, email signatures.',
  },
};

export const INTENT_BUCKETS: Record<
  IntentBucket,
  { id: IntentBucket; label: string; blurb: string }
> = {
  decide: {
    id: 'decide',
    label: 'Figure out what to sell',
    blurb: 'Check demand, margins and names before you commit money to a product.',
  },
  'get-online': {
    id: 'get-online',
    label: 'Get your business online',
    blurb: 'A storefront, a link, a code customers can scan.',
  },
  'get-paid': {
    id: 'get-paid',
    label: 'Bill and get paid',
    blurb: 'The paperwork that turns work done into money received.',
  },
  'run-business': {
    id: 'run-business',
    label: 'Run the day to day',
    blurb: 'Orders out, goods moving, spending recorded.',
  },
  'people': {
    id: 'people',
    label: 'Hire and manage people',
    blurb: 'Offers, payslips and the letters employees ask you for.',
  },
  // Split out of 'get-paid' once the Wave 6 calculators landed: eighteen cards
  // under one heading is a wall, not a menu. Billing and pricing belong to the
  // moment of a sale; these are the numbers you check about the business.
  'know-numbers': {
    id: 'know-numbers',
    label: 'Understand your numbers',
    blurb: 'Margins, cash, loans and growth — the maths behind the decisions.',
  },
  'get-customers': {
    id: 'get-customers',
    label: 'Find customers',
    blurb: 'Reach people, measure what the spend returned.',
  },
};

/** Render order for the bucket sections. */
export const BUCKET_ORDER: IntentBucket[] = [
  'decide',
  'get-online',
  'get-paid',
  'run-business',
  'people',
  'know-numbers',
  'get-customers',
];

const CURATED_TOOLS: Tool[] = [
  // ── decide ────────────────────────────────────────────────────────────────
  {
    slug: 'research',
    name: 'Product Research',
    shortName: 'Research',
    description:
      'Compare supplier evidence, estimate landed cost, and get a launch verdict before you buy stock.',
    href: '/research',
    icon: FlaskConical,
    bucket: 'decide',
    status: 'live',
    requiresAccount: false,
    badge: 'Sourcing',
    useCases: [
      'Validate a product idea',
      'Compare supplier quotes',
      'Model landed cost and margin',
    ],
    ctaText: 'Research a Product',
    keywords: [
      'product research india',
      'supplier sourcing',
      'landed cost calculator',
      'dropshipping product validation',
    ],
    priority: 0.9,
  },
  {
    slug: 'store-name-generator',
    name: 'Store Name Generator',
    description:
      'Get brand name suggestions matched to Indian consumer psychology, and check domain availability.',
    href: '/tools/store-name-generator',
    icon: Sparkles,
    bucket: 'decide',
    status: 'live',
    requiresAccount: false,
    badge: 'Brand Identity',
    useCases: [
      'Brainstorm brand names',
      'Check domain availability',
      'Niche-focused suggestions',
    ],
    ctaText: 'Generate Names',
    keywords: [
      'store name generator',
      'business name generator india',
      'brand name ideas',
    ],
    priority: 0.7,
  },

  {
    slug: 'settlement-reconciliation',
    name: 'Marketplace Settlement Reconciliation',
    shortName: 'Settlement Check',
    description:
      'Upload your marketplace payout file and find the orders that do not add up — settled short, odd commission, duplicated, or never paid.',
    href: '/tools/settlement-reconciliation',
    icon: SearchCheck,
    bucket: 'get-paid',
    status: 'live',
    requiresAccount: false,
    badge: 'Accounts',
    useCases: [
      'Check a Meesho or Amazon payout',
      'Find orders settled short',
      'Spot duplicate deductions',
    ],
    ctaText: 'Check a Payout File',
    keywords: [
      'marketplace settlement reconciliation',
      'meesho payment reconciliation',
      'amazon settlement report checker',
      'flipkart payout reconciliation',
      'seller payment discrepancy',
    ],
    priority: 0.9,
  },

  // ── get-online ────────────────────────────────────────────────────────────
  {
    slug: 'online-store',
    name: 'Online Store',
    shortName: 'Store',
    description:
      'A branded storefront with UPI and COD checkout, GST invoices, and your own product catalogue.',
    href: '/onboarding',
    icon: Store,
    bucket: 'get-online',
    status: 'live',
    requiresAccount: true,
    badge: 'Storefront',
    useCases: [
      'Sell without a website build',
      'Take UPI and COD payments',
      'Issue GST-compliant invoices',
    ],
    ctaText: 'Open Your Store',
    keywords: [
      'online store builder india',
      'upi store',
      'sell online india',
      'shopify alternative india',
    ],
    priority: 0.9,
  },
  {
    slug: 'whatsapp-message-generator',
    name: 'WhatsApp Link & QR Generator',
    shortName: 'WhatsApp Link',
    description:
      'Turn any message into a click-to-chat link and a print-ready QR code customers can scan.',
    href: '/tools/whatsapp-message-generator',
    icon: MessageSquare,
    bucket: 'get-online',
    status: 'live',
    requiresAccount: false,
    badge: 'Growth Tool',
    useCases: [
      'Instagram story links',
      'Pre-filled support chats',
      'Printable counter QR',
    ],
    keywords: [
      'whatsapp link generator',
      'click to chat link',
      'whatsapp qr code',
      'wa.me link generator',
    ],
    ctaText: 'Generate a Link',
    priority: 0.8,
  },

  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    shortName: 'QR Codes',
    description:
      'One code for UPI payments, WhatsApp chats, Google reviews, Wi-Fi, contact cards or any link. Download print-ready SVG.',
    href: '/tools/qr-code-generator',
    icon: QrCode,
    bucket: 'get-online',
    status: 'live',
    requiresAccount: false,
    badge: 'Growth Tool',
    useCases: ['UPI payment QR', 'Google review QR', 'Table or menu QR'],
    ctaText: 'Make a QR Code',
    keywords: [
      'qr code generator',
      'upi qr code generator',
      'whatsapp qr code',
      'google review qr code',
      'wifi qr code generator',
    ],
    priority: 0.9,
  },

  // ── get-paid ──────────────────────────────────────────────────────────────
  {
    slug: 'gst-calculator',
    name: 'GST Calculator India',
    shortName: 'GST Calculator',
    description:
      'Split CGST, SGST and IGST across every Indian slab, and find the net amount behind any price.',
    href: '/tools/gst-calculator',
    icon: ShieldCheck,
    bucket: 'know-numbers',
    status: 'live',
    requiresAccount: false,
    badge: 'Compliance',
    useCases: [
      'Calculate tax for billing',
      'Find net amount excluding GST',
      'Quick quote preparation',
    ],
    ctaText: 'Calculate GST',
    keywords: [
      'gst calculator india',
      'cgst sgst igst calculator',
      'reverse gst calculator',
    ],
    priority: 0.8,
  },
  {
    slug: 'profit-margin-calculator',
    name: 'Profit Margin Calculator',
    description:
      'Work out markup, margin percentage and gross profit, and find the price that actually pays you.',
    href: '/tools/profit-margin-calculator',
    icon: IndianRupee,
    bucket: 'know-numbers',
    status: 'live',
    requiresAccount: false,
    badge: 'Finance',
    useCases: [
      'Determine markup rate',
      'Validate product pricing',
      'Compare cost vs revenue',
    ],
    ctaText: 'Calculate Margin',
    keywords: [
      'profit margin calculator',
      'markup calculator',
      'gross profit calculator india',
    ],
    priority: 0.8,
  },
  {
    slug: 'ecommerce-pricing-calculator',
    name: 'Ecommerce Pricing Calculator',
    shortName: 'Pricing Calculator',
    description:
      'Add shipping, packaging, gateway commission and acquisition cost to find your true break-even price.',
    href: '/tools/ecommerce-pricing-calculator',
    icon: Calculator,
    bucket: 'know-numbers',
    status: 'live',
    requiresAccount: false,
    badge: 'Pricing Strategy',
    useCases: [
      'Account for hidden costs',
      'Set profitable selling prices',
      'Break-even analysis',
    ],
    ctaText: 'Calculate Price',
    keywords: [
      'ecommerce pricing calculator',
      'break even calculator',
      'product pricing calculator india',
    ],
    priority: 0.8,
  },

  // ── get-customers ─────────────────────────────────────────────────────────
  {
    slug: 'roas-calculator',
    name: 'Meta Ads ROAS Calculator',
    shortName: 'ROAS Calculator',
    description:
      'Turn ad spend and order value into ROAS, CPA and purchase counts, so you know when to stop.',
    href: '/tools/roas-calculator',
    icon: TrendingUp,
    bucket: 'get-customers',
    status: 'live',
    requiresAccount: false,
    badge: 'Marketing',
    useCases: [
      'Measure Meta Ads efficiency',
      'Budget forecasting',
      'CPA threshold validation',
    ],
    ctaText: 'Calculate ROAS',
    keywords: [
      'roas calculator',
      'meta ads calculator',
      'cpa calculator',
      'facebook ads roi calculator',
    ],
    priority: 0.8,
  },

  // ── WAVE 1 · planned — NOT rendered. See the status note at the top. ──────
  //
  // This is the roadmap's first wave, deduplicated against what already ships
  // and collapsed onto engines. The source plan listed 20 Wave 1 tools; after
  // removing what is already live and folding presets into their engine, what
  // remains is 9 entries across 4 builds.
  //
  // DELIBERATELY NOT INCLUDED, and why:
  //   Background Remover, Image Resizer, PDF Compressor, PDF Merge — highest
  //     infrastructure cost (CPU, storage, bandwidth) of anything proposed,
  //     zero retained business data, and the search terms are owned by
  //     iLovePDF / remove.bg / TinyPNG. Worst cell in the matrix; revisit only
  //     once there is domain authority to spend.
  //   UPI QR, WhatsApp QR, Review QR, Menu QR, vCard QR, Wi-Fi QR — presets of
  //     `qr-generator`, not separate tools.
  //   Invoice → PDF, Payment Receipt — outputs of the document engine.
  //   GST Calculator, Profit Margin, Product Pricing, WhatsApp Link — live.
  {
    slug: 'dynamic-qr-generator',
    name: 'Dynamic QR Generator',
    shortName: 'Dynamic QR',
    description:
      'Branded QR codes with an editable destination and scan analytics, for tables, packaging and posters.',
    href: '/tools/dynamic-qr-generator',
    icon: QrCode,
    bucket: 'get-online',
    status: 'planned',
    requiresAccount: true,
    badge: 'Growth Tool',
    useCases: ['Table and menu QR', 'UPI payment QR', 'Google review QR'],
    ctaText: 'Create a QR Code',
    keywords: ['dynamic qr code generator', 'qr code with analytics', 'upi qr code', 'branded qr code'],
    priority: 0.9,
    wave: 1,
    engine: 'qr',
  },
  {
    slug: 'barcode-generator',
    name: 'Barcode Generator',
    description:
      'Generate EAN, UPC and Code 128 barcodes for your products, ready to print on labels and packaging.',
    href: '/tools/barcode-generator',
    icon: Barcode,
    bucket: 'get-online',
    status: 'planned',
    requiresAccount: false,
    badge: 'Catalogue',
    useCases: ['Label product stock', 'Print shelf labels', 'Prepare marketplace listings'],
    ctaText: 'Generate a Barcode',
    keywords: ['barcode generator', 'ean barcode generator', 'code 128 generator', 'product barcode india'],
    priority: 0.8,
    wave: 1,
    engine: 'generator',
  },
  {
    slug: 'business-card-generator',
    name: 'Business Card Generator',
    shortName: 'Business Card',
    description:
      'A print-ready card with your details, logo and a QR that opens your store or WhatsApp.',
    href: '/tools/business-card-generator',
    icon: IdCard,
    bucket: 'get-online',
    status: 'planned',
    requiresAccount: false,
    badge: 'Brand Identity',
    useCases: ['Print-ready card artwork', 'Add a scannable QR', 'Share a digital card'],
    ctaText: 'Design a Card',
    keywords: ['business card maker', 'visiting card design online', 'free business card generator'],
    priority: 0.7,
    wave: 1,
    engine: 'generator',
  },
  {
    slug: 'email-signature-generator',
    name: 'Email Signature Generator',
    shortName: 'Email Signature',
    description:
      'A tidy HTML signature with your name, business, phone and links, ready to paste into Gmail or Outlook.',
    href: '/tools/email-signature-generator',
    icon: Mail,
    bucket: 'get-customers',
    status: 'planned',
    requiresAccount: false,
    badge: 'Brand Identity',
    useCases: ['Consistent team signatures', 'Add store and WhatsApp links', 'Paste into Gmail or Outlook'],
    ctaText: 'Build a Signature',
    keywords: ['email signature generator', 'gmail signature maker', 'html email signature'],
    priority: 0.7,
    wave: 1,
    engine: 'generator',
  },

];



/**
 * Which part of running a business each document belongs to.
 *
 * Kept here rather than in kinds.ts because it is a merchandising decision
 * about this grid, not a property of the document itself — a delivery challan
 * does not change when we decide where to shelve it.
 */
const DOCUMENT_BUCKETS: Record<DocumentKind, IntentBucket> = {
  invoice: 'get-paid',
  'proforma-invoice': 'get-paid',
  quotation: 'get-paid',
  estimate: 'get-paid',
  'credit-note': 'get-paid',
  'debit-note': 'get-paid',
  receipt: 'get-paid',
  'rent-receipt': 'get-paid',
  'payment-reminder': 'get-paid',

  'purchase-order': 'run-business',
  'delivery-challan': 'run-business',
  'work-order': 'run-business',
  'job-card': 'run-business',
  'payment-voucher': 'run-business',
  'expense-voucher': 'run-business',

  'salary-slip': 'people',
  'offer-letter': 'people',
  'appointment-letter': 'people',
  'experience-certificate': 'people',
  'employment-certificate': 'people',
  'internship-certificate': 'people',
  'relieving-letter': 'people',
  'increment-letter': 'people',
};

/**
 * Document tools, derived from the kind configs. Same reasoning as the
 * calculators below: the document is defined once, in lib/documents/kinds.ts,
 * and the grid entry is generated from it rather than retyped.
 */
const DOCUMENT_TOOLS: Tool[] = DOCUMENT_KIND_LIST.map((kind) => {
  const config = DOCUMENT_KINDS[kind];
  return {
    slug: documentSlug(kind),
    name: config.pageTitle,
    shortName: config.shortTitle,
    description: config.pageDescription,
    href: `/tools/${documentSlug(kind)}`,
    icon: DOCUMENT_ICONS[config.shape],
    bucket: DOCUMENT_BUCKETS[kind],
    status: 'live',
    requiresAccount: false,
    badge: config.badge,
    useCases: config.useCases,
    ctaText: `Create a ${config.shortTitle ?? config.pageTitle}`,
    keywords: config.keywords,
    priority: kind === 'invoice' ? 0.9 : 0.8,
    engine: 'document',
  };
});

/**
 * Wave 6 calculators, derived from the calculator registry rather than retyped.
 *
 * A calculator is defined once, in src/lib/calculators/registry.ts. Copying its
 * name, description and keywords into a second list here is exactly the drift
 * this file exists to prevent — so the tool entry is generated from the
 * definition instead. They are all live, all free, and all standalone pages
 * under one shared engine.
 */
const CALCULATOR_TOOLS: Tool[] = CALCULATORS.map((calc) => ({
  slug: calc.slug,
  name: calc.title,
  shortName: calc.shortTitle,
  description: calc.description,
  href: `/tools/${calc.slug}`,
  icon: calc.icon,
  bucket: calc.bucket,
  status: 'live',
  requiresAccount: false,
  badge: calc.badge,
  useCases: calc.useCases,
  ctaText: `Open ${calc.shortTitle ?? calc.title}`,
  keywords: calc.keywords,
  priority: 0.7,
  engine: 'calculator',
}));


/** Text generators, derived from their registry for the same reason. */
const GENERATOR_TOOLS: Tool[] = GENERATORS.map((generator) => ({
  slug: generator.slug,
  name: generator.title,
  shortName: generator.shortTitle,
  description: generator.description,
  href: `/tools/${generator.slug}`,
  icon: generator.icon,
  bucket: generator.bucket,
  status: 'live',
  requiresAccount: false,
  badge: generator.badge,
  useCases: generator.useCases,
  ctaText: `Open ${generator.shortTitle ?? generator.title}`,
  keywords: generator.keywords,
  priority: 0.7,
  engine: 'generator',
}));

export const TOOLS: Tool[] = [
  ...CURATED_TOOLS,
  ...DOCUMENT_TOOLS,
  ...CALCULATOR_TOOLS,
  ...GENERATOR_TOOLS,
];

/** Everything a visitor is allowed to see. The only list the UI should render. */
export function liveTools(): Tool[] {
  return TOOLS.filter((tool) => tool.status === 'live');
}

/** Live tools in a bucket, in registry order. */
export function liveToolsInBucket(bucket: IntentBucket): Tool[] {
  return liveTools().filter((tool) => tool.bucket === bucket);
}

/** Buckets that currently have at least one live tool — never render an empty section. */
export function populatedBuckets(): IntentBucket[] {
  return BUCKET_ORDER.filter((bucket) => liveToolsInBucket(bucket).length > 0);
}

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

/** Roadmap view: everything not yet shipped, for a given wave. */
export function plannedInWave(wave: NonNullable<Tool['wave']>): Tool[] {
  return TOOLS.filter((tool) => tool.status === 'planned' && tool.wave === wave);
}

/**
 * How many distinct builds a wave actually is. Tools sharing an engine count
 * once; standalone tools count individually. Use this for scheduling, never
 * the raw tool count.
 */
export function buildCountForWave(wave: NonNullable<Tool['wave']>): number {
  const tools = plannedInWave(wave);
  const engines = new Set(tools.filter((t) => t.engine).map((t) => t.engine));
  const standalone = tools.filter((t) => !t.engine).length;
  return engines.size + standalone;
}
