// Alibaba.com adapter — CALIBRATED 2026-07-26 against live search results and
// one product-detail page. Alibaba also has an official Open Platform for
// some product/buyer capabilities per PRD §5.1; this DOM adapter covers the
// fields the API doesn't. No CAPTCHA encountered during calibration, but
// Alibaba is known to challenge automated traffic more aggressively than
// IndiaMART — the extension's human-triggered model is the mitigation here,
// not selector design.
import { createAdapter } from '@/lib/research/adapters/base';

export const alibabaAdapter = createAdapter({
  source: 'alibaba',
  version: '0.2.0-uncalibrated',
  defaultCurrency: 'USD',
  urlPatterns: {
    searchResults: /alibaba\.com\/trade\/search/i,
    productDetail: /alibaba\.com\/product-detail\//i,
    supplierDetail: /\.trustpass\.alibaba\.com|alibaba\.com\/(company_profile|manufacturer)/i,
  },
  searchResults: {
    itemSelector: 'div.fy26-product-card-wrapper',
    titleSelector: 'h2.searchx-product-e-title',
    linkSelector: 'a.searchx-product-e-slider__link',
    priceSelector: 'div.searchx-product-price-price-main',
    moqSelector: 'div.searchx-moq',
    supplierNameSelector: 'a.searchx-product-e-company',
    imageSelector: 'img.searchx-product-e-slider__img',
    ratingSelector: 'span.searchx-review-score',
    reviewCountSelector: 'span.searchx-product-e-review',
  },
  productDetail: {
    // Alibaba's product-detail wrapper classes are long tailwind-style
    // utility strings that rotate frequently — anchored on the tag instead.
    titleSelector: 'h1',
    priceSelector: 'div.price-item',
    moqSelector: 'div.searchx-moq, [class*="quantity-range"]',
    specRowSelector: 'div.module_3_tab_key_attribute div.id-flex.id-flex-col.id-gap-5',
    specLabelSelector: 'div.id-min-w-0.id-flex-1:first-of-type p',
    specValueSelector: 'div.id-min-w-0.id-flex-1:last-of-type p',
  },
  supplierDetail: {
    nameSelector: 'h1, [class*="company-name"]',
    countrySelector: '[class*="country"]',
    yearEstablishedSelector: '[class*="established"]',
    verificationSelector: '[class*="verified"], [class*="gold-supplier"]',
    ratingSelector: '[class*="review-star"]',
    reviewCountSelector: '[class*="review-count"]',
    responseRateSelector: '[class*="response-rate"]',
  },
  reviews: {
    itemSelector: '[class*="feedback-item"]',
    ratingSelector: '[class*="star-level"]',
    textSelector: '[class*="feedback-content"]',
    dateSelector: '[class*="feedback-date"]',
  },
  nextPageSelector: 'a[class*="next"]',
});
