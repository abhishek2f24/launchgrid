// Source-adapter framework — supplier-side sources only.
//
// IMPORTANT CALIBRATION NOTE: extraction selectors below are best-effort,
// written from each site's publicly documented page structure and typical
// listing conventions. This environment has no live network access to the
// target sites, so the selectors have NOT been calibrated against a real,
// current DOM snapshot. Before relying on any adapter in production:
//   1. Capture a real page (the extension's "save page snapshot" feature).
//   2. Run `npm run adapter:healthcheck -- <source>` against that snapshot.
//   3. Adjust `selectors` in the adapter's config — extraction logic itself
//      should not need to change, only the selector strings.
// This is exactly why every record carries `parserVersion` and
// `extractionConfidence`, and why low-confidence records are quarantined
// rather than silently trusted (§27 adapter rules).
//
// PORT NOTE: only the six supplier-side sources are ported here. Retail
// marketplaces (Amazon.in, Flipkart, Meesho) are deliberately excluded —
// LaunchGrid handles retail via /api/products/fetch-url.
//
// VERSION-STRING NOTE (2026-07-30): the ported adapters arrived stamped
// `0.2.0-calibrated-2026-07-26`. That claim could not be substantiated and
// directly contradicted the calibration note above, so every one was
// downgraded to `0.2.0-uncalibrated`. This matters because `parserVersion` is
// persisted onto every ingested row (research_suppliers.parser_version) and is
// read downstream as a trust signal — a version string must never assert a
// verification that never happened.
//
// WHY SERVER-SIDE CALIBRATION IS NOT POSSIBLE: supplier sites bot-block
// datacentre traffic. A plain server-side GET of an IndiaMART search page
// returns a ~24KB JS/anti-bot shell containing none of these selectors. Real
// DOM only exists inside a logged-in browser, which is precisely why capture
// runs in the Chrome extension (launchgrid-extension/content-supplier.js) and
// not on the server. Calibrate by capturing a real page from the extension,
// then adjust the selector strings here.

export type SourceName =
  | 'indiamart'
  | 'alibaba'
  | 'yiwugo_1688'
  | 'made_in_china'
  | 'tradeindia'
  | 'global_sources';

export type PageType = 'search_results' | 'product_detail' | 'supplier_detail' | 'reviews' | 'unknown';

// A minimal structural subset of the DOM `Document`/`Element` interfaces —
// intentionally not importing `lib.dom` types so this same code can run
// inside a Chrome MV3 content script, in a Node test against jsdom, or in
// the local Playwright collector, without a bundler-specific DOM shim.
export interface MinimalElement {
  textContent: string | null;
  getAttribute(name: string): string | null;
  querySelector(selector: string): MinimalElement | null;
  querySelectorAll(selector: string): ArrayLike<MinimalElement>;
}

export interface MinimalDocument {
  querySelector(selector: string): MinimalElement | null;
  querySelectorAll(selector: string): ArrayLike<MinimalElement>;
  location?: { href: string };
}

export interface PageContext {
  document: MinimalDocument;
  url: string;
}

export interface RawListing {
  externalListingId?: string;
  sourceUrl: string;
  titleOriginal: string;
  titleTranslated?: string;
  currency?: string;
  displayPriceMin?: number;
  displayPriceMax?: number;
  moqValue?: number;
  moqUnit?: string;
  supplierName?: string;
  imageUrl?: string;
  reviewRating?: number;
  reviewCount?: number;
  extractionConfidence: number; // 0-1
}

export interface RawProduct extends RawListing {
  specifications?: Record<string, string>;
  packSize?: number;
}

export interface RawSupplier {
  supplierName: string;
  storeUrl?: string;
  country?: string;
  city?: string;
  yearEstablished?: number;
  businessTypeClaimed?: string;
  verificationStatus?: string;
  reviewRating?: number;
  reviewCount?: number;
  responseRate?: number;
  extractionConfidence: number;
}

export interface RawReview {
  rating?: number;
  title?: string;
  text: string;
  reviewDate?: string;
  verified?: boolean;
  extractionConfidence: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SourceAdapter {
  source: SourceName;
  version: string;
  detectPage(context: PageContext): PageType;
  extractSearchResults(context: PageContext): RawListing[];
  extractProduct(context: PageContext): RawProduct | null;
  extractSupplier(context: PageContext): RawSupplier | null;
  extractReviews(context: PageContext): RawReview[];
  getNextPageUrl(context: PageContext): string | null;
  validate(raw: RawListing | RawProduct | RawSupplier): ValidationResult;
}

export function textOf(el: MinimalElement | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function toArray<T>(list: ArrayLike<T>): T[] {
  return Array.prototype.slice.call(list);
}

// Parses common price formats: "₹499", "$1.20", "US $1.2 - 1.5", "1,999.00"
export function parsePriceRange(raw: string): { min?: number; max?: number; currency?: string } {
  if (!raw) return {};
  const currencyMatch = raw.match(/₹|Rs\.?|INR|US\$|\$|USD|¥|CNY|RMB/i);
  let currency: string | undefined;
  if (currencyMatch) {
    const symbol = currencyMatch[0].toUpperCase();
    if (symbol.includes('₹') || symbol.includes('RS') || symbol.includes('INR')) currency = 'INR';
    else if (symbol.includes('$') || symbol.includes('USD')) currency = 'USD';
    else if (symbol.includes('¥') || symbol.includes('CNY') || symbol.includes('RMB')) currency = 'CNY';
  }
  const numbers = (raw.match(/[\d,]+\.?\d*/g) ?? []).map((n) => Number(n.replace(/,/g, ''))).filter((n) => !Number.isNaN(n));
  if (numbers.length === 0) return { currency };
  return { min: Math.min(...numbers), max: Math.max(...numbers), currency };
}

// Parses MOQ text like "500 Pieces", "MOQ: 1000 pcs", "Min. Order: 200 Sets"
export function parseMoq(raw: string): { value?: number; unit?: string } {
  if (!raw) return {};
  const match = raw.match(/([\d,]+)\s*(pieces?|pcs?|sets?|units?|boxes?|bags?)?/i);
  if (!match) return {};
  return { value: Number(match[1].replace(/,/g, '')), unit: match[2]?.toLowerCase() };
}

// Parses rating/review text across the varied formats seen live:
// IndiaMART "4.4(192)" (combined) and sources that expose the rating and the
// review count as two separate nodes. Handles both a combined string and two
// separate strings by falling back across them.
export function parseRatingAndCount(ratingText: string, reviewCountText?: string): { rating?: number; count?: number } {
  const rating = ratingText ? Number((ratingText.match(/[\d.]+/) ?? [])[0]) || undefined : undefined;

  let count: number | undefined;
  if (reviewCountText) {
    const match = reviewCountText.match(/([\d,]+)/);
    count = match ? Number(match[1].replace(/,/g, '')) || undefined : undefined;
  } else {
    // Combined format, e.g. IndiaMART's "4.4(192)" — only trust a
    // parenthesised number as the count, not the rating's own digits.
    const match = ratingText.match(/\(([\d,]+)\)/);
    count = match ? Number(match[1].replace(/,/g, '')) || undefined : undefined;
  }

  return { rating, count };
}
