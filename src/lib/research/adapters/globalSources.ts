// Global Sources adapter — CALIBRATED 2026-07-26. Note the category search
// URL redirects to a manufacturers/ listing page; the ratingSelector below
// (`img.gs-tag.starImg.st-5`) encodes the star count in the class suffix
// rather than as text, so it won't populate a numeric rating via the
// standard text-based parser — left wired for future class-suffix parsing.
import { createAdapter } from '@/lib/research/adapters/base';

export const globalSourcesAdapter = createAdapter({
  source: 'global_sources',
  version: '0.2.0-uncalibrated',
  defaultCurrency: 'USD',
  urlPatterns: {
    searchResults: /globalsources\.com\/(products|manufacturers)\//i,
    productDetail: /globalsources\.com\/.*\d+p\.htm/i,
    supplierDetail: /globalsources\.com\/[^/]+\/supplier/i,
  },
  searchResults: {
    itemSelector: 'li.item.card-box',
    titleSelector: 'a.product-name',
    linkSelector: 'a.product-name',
    priceSelector: 'span.price',
    moqSelector: 'span.txt',
    supplierNameSelector: 'div.name',
    imageSelector: 'img.img',
  },
  productDetail: {
    titleSelector: 'h1.name, h1',
    priceSelector: 'span.price', // many listings are inquire-only and show no price — expected, not an error
    moqSelector: 'span.txt',
    specRowSelector: 'div.productAttributes-item',
    specLabelSelector: 'div.productAttributes-item-left',
    specValueSelector: 'div.productAttributes-item-right',
  },
  supplierDetail: {
    nameSelector: 'h1, [class*="supplier-name"]',
    countrySelector: '[class*="location"]',
    verificationSelector: '[class*="verified"]',
  },
  reviews: {
    itemSelector: '[class*="review-item"]',
    textSelector: '[class*="review-text"]',
  },
  nextPageSelector: 'a[class*="next"]',
});
