// Adapter framework tests.
//
// Run with:  node --test src/lib/research/adapters/adapters.test.ts
//
// NOTE: neither `vitest` nor `jsdom` is a dependency of this repo (checked
// package.json), and the porting brief forbids adding one. So this uses the
// built-in `node:test` runner, and the fixtures are plain `MinimalDocument`
// stub objects rather than parsed HTML. That is not a workaround — it is the
// point of the DOM-agnostic design: the adapters only ever touch
// querySelector/querySelectorAll/getAttribute/textContent, so a hand-rolled
// stub exercises exactly the same code path a real DOM would.
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The adapter modules import each other through the repo's `@/` path alias,
// which Next/tsc understand but the bare Node runtime does not. Teach the
// loader about it for the duration of this test file only.
const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');

// `module.registerHooks` is a Node >= 22.15 API that the repo's @types/node@20
// does not declare yet, so it is reached through a locally-typed view rather
// than by bumping a dependency.
type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => unknown,
) => unknown;
const nodeModule = (await import('node:module')) as unknown as {
  registerHooks?: (hooks: { resolve: ResolveHook }) => void;
};
if (!nodeModule.registerHooks) {
  throw new Error('This test needs Node >= 22.15 (module.registerHooks) and native TypeScript stripping.');
}
nodeModule.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const resolved = path.join(SRC_ROOT, specifier.slice(2)) + '.ts';
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { parseMoq, parsePriceRange } = await import('@/lib/research/adapters/types');
const { createAdapter } = await import('@/lib/research/adapters/base');
const { getAdapter, SUPPLIER_SOURCES } = await import('@/lib/research/adapters/registry');
type MinimalDocument = import('@/lib/research/adapters/types').MinimalDocument;
type MinimalElement = import('@/lib/research/adapters/types').MinimalElement;

// --- Fixture helpers: the smallest thing that satisfies MinimalElement. ---

interface NodeSpec {
  text?: string;
  attrs?: Record<string, string>;
  /** children keyed by the exact selector string the adapter will ask for */
  children?: Record<string, NodeSpec | NodeSpec[]>;
}

function makeElement(spec: NodeSpec): MinimalElement {
  const children = spec.children ?? {};
  const listFor = (selector: string): MinimalElement[] => {
    const found = children[selector];
    if (!found) return [];
    return (Array.isArray(found) ? found : [found]).map(makeElement);
  };
  return {
    textContent: spec.text ?? null,
    getAttribute: (name) => spec.attrs?.[name] ?? null,
    querySelector: (selector) => listFor(selector)[0] ?? null,
    querySelectorAll: (selector) => listFor(selector),
  };
}

function makeDocument(children: Record<string, NodeSpec | NodeSpec[]>, url: string): MinimalDocument {
  const root = makeElement({ children });
  return {
    querySelector: (s) => root.querySelector(s),
    querySelectorAll: (s) => root.querySelectorAll(s),
    location: { href: url },
  };
}

// --- Page-type detection ---

test('detectPage classifies search, product, supplier and unknown URLs', () => {
  const alibaba = getAdapter('alibaba');
  const doc = makeDocument({}, 'about:blank');
  const at = (url: string) => alibaba.detectPage({ document: doc, url });

  assert.equal(at('https://www.alibaba.com/trade/search?keyword=lamp'), 'search_results');
  assert.equal(at('https://www.alibaba.com/product-detail/LED-Lamp_123456.html'), 'product_detail');
  assert.equal(at('https://acme.trustpass.alibaba.com/'), 'supplier_detail');
  assert.equal(at('https://www.alibaba.com/'), 'unknown');
});

test('every registered supplier adapter detects its own search URL shape', () => {
  const doc = makeDocument({}, 'about:blank');
  const samples: Record<string, string> = {
    indiamart: 'https://dir.indiamart.com/search.mp?ss=lamp',
    alibaba: 'https://www.alibaba.com/trade/search?keyword=lamp',
    yiwugo_1688: 'https://s.1688.com/selloffer/offer_search.htm?keywords=lamp',
    made_in_china: 'https://www.made-in-china.com/productdirectory.html?word=lamp',
    tradeindia: 'https://www.tradeindia.com/search.html?keyword=lamp',
    global_sources: 'https://www.globalsources.com/manufacturers/lamp.html',
  };
  for (const source of SUPPLIER_SOURCES) {
    const adapter = getAdapter(source);
    assert.equal(adapter.detectPage({ document: doc, url: samples[source] }), 'search_results', `${source} search URL`);
  }
});

// --- MOQ parsing ---

test('parseMoq handles the common MOQ phrasings', () => {
  assert.deepEqual(parseMoq('500 Pieces'), { value: 500, unit: 'pieces' });
  assert.deepEqual(parseMoq('MOQ: 1,000 pcs'), { value: 1000, unit: 'pcs' });
  assert.deepEqual(parseMoq('Min. Order: 200 Sets'), { value: 200, unit: 'sets' });
  assert.deepEqual(parseMoq('MOQ - 10 Piece/Pieces'), { value: 10, unit: 'piece' });
  assert.deepEqual(parseMoq(''), {});
  // No recognised unit: value still extracted, unit left undefined rather
  // than guessed — honesty convention, no invented data.
  assert.deepEqual(parseMoq('50'), { value: 50, unit: undefined });
});

// --- Price-range parsing ---

test('parsePriceRange extracts currency and min/max', () => {
  assert.deepEqual(parsePriceRange('₹499'), { min: 499, max: 499, currency: 'INR' });
  assert.deepEqual(parsePriceRange('US $1.20 - 1.50'), { min: 1.2, max: 1.5, currency: 'USD' });
  assert.deepEqual(parsePriceRange('¥12 - 18'), { min: 12, max: 18, currency: 'CNY' });
  assert.deepEqual(parsePriceRange('1,999.00'), { min: 1999, max: 1999, currency: undefined });
  assert.deepEqual(parsePriceRange(''), {});
  // "Get Latest Price" style placeholders yield no numbers, not a zero price.
  assert.deepEqual(parsePriceRange('Get Latest Price'), { currency: undefined });
});

test('extractSearchResults carries parsed price and MOQ onto the listing', () => {
  const doc = makeDocument(
    {
      'div.card': [
        {
          children: {
            'h2.title': { text: 'Stainless Steel Water Bottle' },
            'a.link': { attrs: { href: '/products/bottle-1' } },
            'span.price': { text: '₹120 - ₹180' },
            'span.moq': { text: 'MOQ - 500 Pieces' },
          },
        },
      ],
    },
    'https://example.test/search.html?q=bottle',
  );

  const adapter = createAdapter({
    source: 'tradeindia',
    version: 'test',
    defaultCurrency: 'INR',
    urlPatterns: {},
    searchResults: {
      itemSelector: 'div.card',
      titleSelector: 'h2.title',
      linkSelector: 'a.link',
      priceSelector: 'span.price',
      moqSelector: 'span.moq',
    },
    productDetail: { titleSelector: 'h1' },
    supplierDetail: { nameSelector: 'h1' },
    reviews: { itemSelector: '.r', textSelector: '.t' },
  });

  const [listing] = adapter.extractSearchResults({ document: doc, url: 'https://example.test/search.html?q=bottle' });
  assert.equal(listing.titleOriginal, 'Stainless Steel Water Bottle');
  assert.equal(listing.sourceUrl, 'https://example.test/products/bottle-1');
  assert.equal(listing.currency, 'INR');
  assert.equal(listing.displayPriceMin, 120);
  assert.equal(listing.displayPriceMax, 180);
  assert.equal(listing.moqValue, 500);
  assert.equal(listing.moqUnit, 'pieces');
  assert.equal(listing.extractionConfidence, 1);
});

// --- Low-confidence quarantine ---

test('validate quarantines a low-confidence extraction', () => {
  const adapter = getAdapter('indiamart');

  const solid = adapter.validate({
    sourceUrl: 'https://www.indiamart.com/proddetail/x.html',
    titleOriginal: 'Cotton Tote Bag',
    extractionConfidence: 0.9,
  });
  assert.equal(solid.valid, true);
  assert.deepEqual(solid.errors, []);

  const shaky = adapter.validate({
    sourceUrl: 'https://www.indiamart.com/proddetail/x.html',
    titleOriginal: 'Cotton Tote Bag',
    extractionConfidence: 0.2,
  });
  assert.equal(shaky.valid, false);
  assert.ok(
    shaky.errors.some((e: string) => e.includes('quarantine threshold')),
    `expected a quarantine error, got ${JSON.stringify(shaky.errors)}`,
  );
});

test('a listing missing title and URL is invalid', () => {
  const result = getAdapter('alibaba').validate({ sourceUrl: '', titleOriginal: '', extractionConfidence: 0.8 });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['missing title', 'missing source URL']);
});

test('adapters expose a parserVersion-bearing version string', () => {
  for (const source of SUPPLIER_SOURCES) {
    const adapter = getAdapter(source);
    assert.match(adapter.version, /^\d+\.\d+\.\d+/, `${source} version`);
    assert.equal(adapter.source, source);
  }
});
