// Config-driven adapter factory. Every concrete source is just a selector
// config passed to `createAdapter` — extraction logic, confidence scoring,
// and validation rules live here once instead of being copy-pasted per site.
// `import type` for the type-only names: this repo builds with
// `isolatedModules`, and it also lets the file run under Node's TypeScript
// type-stripping (used by the test file) without a bundler.
import type {
  MinimalDocument,
  PageContext,
  PageType,
  RawListing,
  RawProduct,
  RawReview,
  RawSupplier,
  SourceAdapter,
  SourceName,
  ValidationResult,
} from '@/lib/research/adapters/types';
import {
  parseMoq,
  parsePriceRange,
  parseRatingAndCount,
  textOf,
  toArray,
} from '@/lib/research/adapters/types';

export interface AdapterSelectorConfig {
  source: SourceName;
  version: string;
  defaultCurrency: string;

  // Page-type detection: URL substrings checked in order.
  urlPatterns: {
    searchResults?: RegExp;
    productDetail?: RegExp;
    supplierDetail?: RegExp;
  };

  searchResults: {
    itemSelector: string;
    titleSelector: string;
    linkSelector: string;
    priceSelector?: string;
    moqSelector?: string;
    supplierNameSelector?: string;
    imageSelector?: string;
    ratingSelector?: string;
    reviewCountSelector?: string;
  };

  productDetail: {
    titleSelector: string;
    priceSelector?: string;
    moqSelector?: string;
    specRowSelector?: string; // rows containing label/value pairs
    specLabelSelector?: string;
    specValueSelector?: string;
  };

  supplierDetail: {
    nameSelector: string;
    countrySelector?: string;
    yearEstablishedSelector?: string;
    verificationSelector?: string;
    ratingSelector?: string;
    reviewCountSelector?: string;
    responseRateSelector?: string;
  };

  reviews: {
    itemSelector: string;
    ratingSelector?: string;
    titleSelector?: string;
    textSelector: string;
    dateSelector?: string;
    verifiedSelector?: string;
  };

  nextPageSelector?: string;
}

function attr(el: ReturnType<MinimalDocument['querySelector']>, name: string): string | null {
  return el ? el.getAttribute(name) : null;
}

export function createAdapter(config: AdapterSelectorConfig): SourceAdapter {
  return {
    source: config.source,
    version: config.version,

    detectPage(context: PageContext): PageType {
      const { url } = context;
      if (config.urlPatterns.searchResults?.test(url)) return 'search_results';
      if (config.urlPatterns.productDetail?.test(url)) return 'product_detail';
      if (config.urlPatterns.supplierDetail?.test(url)) return 'supplier_detail';
      return 'unknown';
    },

    extractSearchResults(context: PageContext): RawListing[] {
      const items = toArray(context.document.querySelectorAll(config.searchResults.itemSelector));
      const results: RawListing[] = [];

      for (const item of items) {
        const titleEl = item.querySelector(config.searchResults.titleSelector);
        const linkEl = item.querySelector(config.searchResults.linkSelector);
        const title = textOf(titleEl);
        const href = attr(linkEl, 'href');
        if (!title || !href) continue; // §27: never silently produce empty required values

        const priceText = config.searchResults.priceSelector
          ? textOf(item.querySelector(config.searchResults.priceSelector))
          : '';
        const { min, max, currency } = parsePriceRange(priceText);

        const moqText = config.searchResults.moqSelector
          ? textOf(item.querySelector(config.searchResults.moqSelector))
          : '';
        const { value: moqValue, unit: moqUnit } = parseMoq(moqText);

        const ratingText = config.searchResults.ratingSelector
          ? textOf(item.querySelector(config.searchResults.ratingSelector))
          : '';
        const reviewCountText = config.searchResults.reviewCountSelector
          ? textOf(item.querySelector(config.searchResults.reviewCountSelector))
          : '';
        const { rating: reviewRating, count: reviewCount } = parseRatingAndCount(ratingText, reviewCountText);

        let confidence = 0.5;
        if (title) confidence += 0.15;
        if (href) confidence += 0.15;
        if (priceText) confidence += 0.1;
        if (moqText) confidence += 0.1;

        results.push({
          sourceUrl: absoluteUrl(context.url, href),
          titleOriginal: title,
          currency: currency ?? config.defaultCurrency,
          displayPriceMin: min,
          displayPriceMax: max,
          moqValue,
          moqUnit,
          supplierName: config.searchResults.supplierNameSelector
            ? textOf(item.querySelector(config.searchResults.supplierNameSelector)) || undefined
            : undefined,
          imageUrl: config.searchResults.imageSelector
            ? attr(item.querySelector(config.searchResults.imageSelector), 'src') ?? undefined
            : undefined,
          reviewRating,
          reviewCount,
          extractionConfidence: Math.min(1, confidence),
        });
      }
      return results;
    },

    extractProduct(context: PageContext): RawProduct | null {
      const titleEl = context.document.querySelector(config.productDetail.titleSelector);
      const title = textOf(titleEl);
      if (!title) return null;

      const priceText = config.productDetail.priceSelector
        ? textOf(context.document.querySelector(config.productDetail.priceSelector))
        : '';
      const { min, max, currency } = parsePriceRange(priceText);

      const moqText = config.productDetail.moqSelector
        ? textOf(context.document.querySelector(config.productDetail.moqSelector))
        : '';
      const { value: moqValue, unit: moqUnit } = parseMoq(moqText);

      const specifications: Record<string, string> = {};
      if (config.productDetail.specRowSelector) {
        const rows = toArray(context.document.querySelectorAll(config.productDetail.specRowSelector));
        for (const row of rows) {
          const label = config.productDetail.specLabelSelector
            ? textOf(row.querySelector(config.productDetail.specLabelSelector))
            : '';
          const value = config.productDetail.specValueSelector
            ? textOf(row.querySelector(config.productDetail.specValueSelector))
            : '';
          if (label && value) specifications[label] = value;
        }
      }

      let confidence = 0.5;
      if (title) confidence += 0.2;
      if (priceText) confidence += 0.15;
      if (Object.keys(specifications).length > 0) confidence += 0.15;

      return {
        sourceUrl: context.url,
        titleOriginal: title,
        currency: currency ?? config.defaultCurrency,
        displayPriceMin: min,
        displayPriceMax: max,
        moqValue,
        moqUnit,
        specifications: Object.keys(specifications).length ? specifications : undefined,
        extractionConfidence: Math.min(1, confidence),
      };
    },

    extractSupplier(context: PageContext): RawSupplier | null {
      const nameEl = context.document.querySelector(config.supplierDetail.nameSelector);
      const supplierName = textOf(nameEl);
      if (!supplierName) return null;

      const country = config.supplierDetail.countrySelector
        ? textOf(context.document.querySelector(config.supplierDetail.countrySelector)) || undefined
        : undefined;
      const yearText = config.supplierDetail.yearEstablishedSelector
        ? textOf(context.document.querySelector(config.supplierDetail.yearEstablishedSelector))
        : '';
      const yearEstablished = yearText ? Number((yearText.match(/\d{4}/) ?? [])[0]) || undefined : undefined;
      const verificationStatus = config.supplierDetail.verificationSelector
        ? textOf(context.document.querySelector(config.supplierDetail.verificationSelector)) || undefined
        : undefined;
      const ratingText = config.supplierDetail.ratingSelector
        ? textOf(context.document.querySelector(config.supplierDetail.ratingSelector))
        : '';
      const reviewRating = ratingText ? Number((ratingText.match(/[\d.]+/) ?? [])[0]) || undefined : undefined;
      const reviewCountText = config.supplierDetail.reviewCountSelector
        ? textOf(context.document.querySelector(config.supplierDetail.reviewCountSelector))
        : '';
      const reviewCount = reviewCountText ? Number((reviewCountText.match(/[\d,]+/) ?? [])[0]?.replace(/,/g, '')) || undefined : undefined;
      const responseRateText = config.supplierDetail.responseRateSelector
        ? textOf(context.document.querySelector(config.supplierDetail.responseRateSelector))
        : '';
      const responseRate = responseRateText ? Number((responseRateText.match(/[\d.]+/) ?? [])[0]) / 100 || undefined : undefined;

      let confidence = 0.5;
      if (supplierName) confidence += 0.2;
      if (country) confidence += 0.1;
      if (verificationStatus) confidence += 0.1;
      if (yearEstablished) confidence += 0.1;

      return {
        supplierName,
        storeUrl: context.url,
        country,
        yearEstablished,
        businessTypeClaimed: verificationStatus,
        verificationStatus,
        reviewRating,
        reviewCount,
        responseRate,
        extractionConfidence: Math.min(1, confidence),
      };
    },

    extractReviews(context: PageContext): RawReview[] {
      const items = toArray(context.document.querySelectorAll(config.reviews.itemSelector));
      const results: RawReview[] = [];
      for (const item of items) {
        const text = textOf(item.querySelector(config.reviews.textSelector));
        if (!text) continue;
        const ratingText = config.reviews.ratingSelector ? textOf(item.querySelector(config.reviews.ratingSelector)) : '';
        const rating = ratingText ? Number((ratingText.match(/[\d.]+/) ?? [])[0]) || undefined : undefined;
        const title = config.reviews.titleSelector ? textOf(item.querySelector(config.reviews.titleSelector)) || undefined : undefined;
        const dateText = config.reviews.dateSelector ? textOf(item.querySelector(config.reviews.dateSelector)) || undefined : undefined;
        const verifiedText = config.reviews.verifiedSelector ? textOf(item.querySelector(config.reviews.verifiedSelector)) : '';
        const verified = /verified/i.test(verifiedText);

        let confidence = 0.6;
        if (rating) confidence += 0.2;
        if (title) confidence += 0.1;

        results.push({ rating, title, text, reviewDate: dateText, verified, extractionConfidence: Math.min(1, confidence) });
      }
      return results;
    },

    getNextPageUrl(context: PageContext): string | null {
      if (!config.nextPageSelector) return null;
      const el = context.document.querySelector(config.nextPageSelector);
      const href = attr(el, 'href');
      return href ? absoluteUrl(context.url, href) : null;
    },

    validate(raw): ValidationResult {
      const errors: string[] = [];
      if ('titleOriginal' in raw && !raw.titleOriginal) errors.push('missing title');
      if ('sourceUrl' in raw && !raw.sourceUrl) errors.push('missing source URL');
      if ('supplierName' in raw && 'sourceUrl' in raw === false && !raw.supplierName) errors.push('missing supplier name');
      if (raw.extractionConfidence < 0.3) errors.push('extraction confidence below quarantine threshold (0.3)');
      return { valid: errors.length === 0, errors };
    },
  };
}

function absoluteUrl(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
