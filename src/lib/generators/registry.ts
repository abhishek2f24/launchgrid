/**
 * The text-generator engine: a form in, one or more strings out.
 *
 * Same idea as the calculator engine — the tool is data, not a page. SKU codes,
 * coupon codes, referral codes and campaign URLs are all "fill a form, get
 * strings you can copy", so they share one component and one static route.
 *
 * TWO MODES, BECAUSE RANDOMNESS AND RENDERING DO NOT MIX
 *   'live' regenerates on every keystroke and must be a pure function of the
 *   inputs — that is the UTM builder. 'onDemand' produces different output each
 *   run and only fires on a click, because a random value computed during
 *   render would differ between the server's HTML and the client's first paint
 *   and break hydration.
 */

import { Link2, Percent, Tag, Users, type LucideIcon } from 'lucide-react';
import type { IntentBucket } from '@/data/tools';

export interface GenField {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  help?: string;
}

export interface GeneratorDef {
  slug: string;
  title: string;
  shortTitle?: string;
  description: string;
  icon: LucideIcon;
  bucket: IntentBucket;
  badge: string;
  mode: 'live' | 'onDemand';
  /** Label for the button in onDemand mode. */
  actionLabel?: string;
  fields: GenField[];
  /** Must be pure in 'live' mode. May use randomness in 'onDemand'. */
  generate: (values: Record<string, string>) => string[];
  note: string;
  keywords: string[];
  useCases: string[];
}

const get = (values: Record<string, string>, id: string) =>
  (values[id] ?? '').trim();

const int = (values: Record<string, string>, id: string, fallback: number) => {
  const parsed = Number(get(values, id));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

/** Uppercase, alphanumerics only, spaces collapsed to nothing. */
const slugPart = (raw: string, length?: number) => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return length ? cleaned.slice(0, length) : cleaned;
};

/**
 * Alphabet for generated codes.
 *
 * O, I, 0 and 1 are left out on purpose: these get read aloud over a phone and
 * written on a chit of paper, and confusing O with 0 turns a working coupon
 * into a support call.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export const GENERATORS: GeneratorDef[] = [
  {
    slug: 'sku-generator',
    title: 'SKU Generator',
    description:
      'Build consistent stock codes across every size and colour, so your listings, labels and stock counts all agree.',
    icon: Tag,
    bucket: 'run-business',
    badge: 'Catalogue',
    mode: 'live',
    fields: [
      { id: 'brand', label: 'Brand or business', placeholder: 'Sharma Traders', help: 'First few letters are used.' },
      { id: 'category', label: 'Category', placeholder: 'Kurta' },
      { id: 'product', label: 'Product name', placeholder: 'Cotton Straight' },
      { id: 'colour', label: 'Colour', placeholder: 'Navy' },
      { id: 'sizes', label: 'Sizes', defaultValue: 'S,M,L,XL', help: 'Comma separated. One SKU is produced per size.' },
      { id: 'start', label: 'Starting number', type: 'number', defaultValue: '001' },
    ],
    generate: (values) => {
      const parts = [
        slugPart(get(values, 'brand'), 3),
        slugPart(get(values, 'category'), 3),
        slugPart(get(values, 'product'), 4),
        slugPart(get(values, 'colour'), 3),
      ].filter(Boolean);
      if (parts.length === 0) return [];

      const sizes = get(values, 'sizes')
        .split(',')
        .map((size) => slugPart(size))
        .filter(Boolean);
      const startRaw = get(values, 'start') || '001';
      const start = int(values, 'start', 1);
      // Keep the operator's own zero-padding — SKU-001 and SKU-1 sort
      // differently in a spreadsheet, and they chose one.
      const pad = startRaw.length;

      if (sizes.length === 0) {
        return [`${parts.join('-')}-${String(start).padStart(pad, '0')}`];
      }
      return sizes.map((size, index) =>
        [...parts, size, String(start + index).padStart(pad, '0')].join('-')
      );
    },
    note:
      'A SKU only has to be unique and readable by you. Keep the pattern the same across every product — the value is in the consistency, not the cleverness.',
    keywords: ['sku generator', 'sku code format', 'product code generator india'],
    useCases: ['Code a new product range', 'Keep sizes consistent', 'Prepare a marketplace upload'],
  },

  {
    slug: 'coupon-code-generator',
    title: 'Coupon Code Generator',
    shortTitle: 'Coupon Codes',
    description:
      'Generate a batch of unique discount codes that are hard to guess and easy to read out over a phone.',
    icon: Percent,
    bucket: 'get-customers',
    badge: 'Marketing',
    mode: 'onDemand',
    actionLabel: 'Generate codes',
    fields: [
      { id: 'prefix', label: 'Prefix', placeholder: 'DIWALI', help: 'Optional. Makes the campaign obvious in your reports.' },
      { id: 'length', label: 'Random characters', type: 'number', defaultValue: '6' },
      { id: 'count', label: 'How many codes', type: 'number', defaultValue: '20' },
    ],
    generate: (values) => {
      const prefix = slugPart(get(values, 'prefix'));
      const length = Math.min(16, Math.max(3, int(values, 'length', 6)));
      const count = Math.min(500, int(values, 'count', 20));

      // A Set, because a duplicate coupon code is a discount given twice.
      const codes = new Set<string>();
      let attempts = 0;
      while (codes.size < count && attempts < count * 20) {
        codes.add(prefix ? `${prefix}${randomCode(length)}` : randomCode(length));
        attempts += 1;
      }
      return [...codes];
    },
    note:
      'Codes avoid O, I, 0 and 1 — they get read aloud and written down, and confusing O with 0 turns a working coupon into a support call. Six random characters give billions of combinations, which is enough that guessing is not worth anyone’s time.',
    keywords: ['coupon code generator', 'discount code generator', 'promo code maker'],
    useCases: ['Run a festival offer', 'Give influencers unique codes', 'Track a campaign by code'],
  },

  {
    slug: 'referral-code-generator',
    title: 'Referral Code Generator',
    shortTitle: 'Referral Codes',
    description:
      'Make a personal referral code per customer, so you can see who actually sends you business.',
    icon: Users,
    bucket: 'get-customers',
    badge: 'Marketing',
    mode: 'onDemand',
    actionLabel: 'Generate codes',
    fields: [
      { id: 'names', label: 'Customer names', placeholder: 'Priya, Rohit, Anjali', help: 'Comma separated. One code each, built from their name.' },
      { id: 'length', label: 'Random characters', type: 'number', defaultValue: '4' },
    ],
    generate: (values) => {
      const length = Math.min(10, Math.max(2, int(values, 'length', 4)));
      const names = get(values, 'names')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

      if (names.length === 0) return [randomCode(6)];
      return names.map(
        (name) => `${slugPart(name, 6) || 'REF'}${randomCode(length)}`
      );
    },
    note:
      'Keeping the person’s name in the code means you can see who referred whom without looking anything up. Do not use a code as proof of identity — anyone can type someone else’s.',
    keywords: ['referral code generator', 'referral program codes', 'unique referral link code'],
    useCases: ['Start a referral scheme', 'Track word of mouth', 'Reward repeat customers'],
  },

  {
    slug: 'utm-builder',
    title: 'UTM Campaign Link Builder',
    shortTitle: 'UTM Builder',
    description:
      'Tag a link so your analytics can tell you which post, ad or message actually sent the traffic.',
    icon: Link2,
    bucket: 'get-customers',
    badge: 'Marketing',
    mode: 'live',
    fields: [
      { id: 'url', label: 'Destination link', placeholder: 'https://yourstore.in/sale' },
      { id: 'source', label: 'Source', placeholder: 'instagram', help: 'Where it is posted: instagram, whatsapp, google.' },
      { id: 'medium', label: 'Medium', placeholder: 'social', help: 'The kind of traffic: social, cpc, email, story.' },
      { id: 'campaign', label: 'Campaign', placeholder: 'diwali-sale' },
      { id: 'content', label: 'Content', placeholder: 'story-1', help: 'Optional. Tells two versions of the same post apart.' },
      { id: 'term', label: 'Term', help: 'Optional. Paid keyword, if you are running search ads.' },
    ],
    generate: (values) => {
      const raw = get(values, 'url');
      if (!raw) return [];
      const withScheme = /^[a-z][\w+.-]*:/i.test(raw) ? raw : `https://${raw}`;

      let url: URL;
      try {
        url = new URL(withScheme);
      } catch {
        return [];
      }

      // Lower-cased and de-spaced: analytics tools treat Instagram and
      // instagram as two different sources, which silently splits a report.
      const tag = (value: string) => value.toLowerCase().replace(/\s+/g, '-');
      const params: [string, string][] = [
        ['utm_source', get(values, 'source')],
        ['utm_medium', get(values, 'medium')],
        ['utm_campaign', get(values, 'campaign')],
        ['utm_content', get(values, 'content')],
        ['utm_term', get(values, 'term')],
      ];
      for (const [key, value] of params) {
        if (value) url.searchParams.set(key, tag(value));
      }
      return [url.toString()];
    },
    note:
      'Pick one spelling for each value and stick to it forever. Analytics treats "Instagram" and "instagram" as different sources, and the report quietly splits in two.',
    keywords: ['utm builder', 'utm link generator', 'campaign url builder', 'utm parameters'],
    useCases: ['Tag an Instagram bio link', 'Measure a WhatsApp broadcast', 'Split-test two posts'],
  },
];

export function getGenerator(slug: string): GeneratorDef | undefined {
  return GENERATORS.find((generator) => generator.slug === slug);
}
