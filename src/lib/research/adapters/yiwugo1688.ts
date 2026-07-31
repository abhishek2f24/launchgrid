// 1688.com adapter. CALIBRATION ATTEMPTED 2026-07-26: submitting a search
// query redirected straight to login.taobao.com (Taobao/Alibaba unified
// login) — 1688 requires an authenticated session before showing search
// results at all, unlike the other supplier sources. Per PRD §21 ("avoid
// bypassing authentication controls"), this adapter is NOT to be driven
// unattended: it is excluded from DEFAULT_ENABLED_SOURCES in ./registry and
// should only be exercised through the
// browser extension while the user is already logged into 1688 themselves,
// browsing session-authenticated pages the extension can read but does not
// need to authenticate for. Selectors below remain best-effort/uncalibrated
// since a logged-out session never reaches the real results DOM.
import { createAdapter } from '@/lib/research/adapters/base';

export const yiwugo1688Adapter = createAdapter({
  source: 'yiwugo_1688',
  version: '0.1.0-uncalibrated-login-required',
  defaultCurrency: 'CNY',
  urlPatterns: {
    searchResults: /1688\.com\/.*(search|s\.htm)/i,
    productDetail: /detail\.1688\.com\/offer\//i,
    supplierDetail: /shop\d+\.1688\.com|winport\.1688\.com/i,
  },
  searchResults: {
    itemSelector: '.sm-offer-item, [class*="offer-card"]',
    titleSelector: '.title, [class*="title"] a',
    linkSelector: 'a[href*="detail.1688.com"]',
    priceSelector: '.price, [class*="price"]',
    moqSelector: '[class*="quantity"], .amount-range',
    supplierNameSelector: '[class*="company-name"]',
    imageSelector: 'img',
  },
  productDetail: {
    titleSelector: 'h1, [class*="title"]',
    priceSelector: '[class*="price"]',
    moqSelector: '[class*="quantity-range"]',
    specRowSelector: '.obj-property-item, [class*="attributes-item"]',
    specLabelSelector: '.property-name, [class*="attr-name"]',
    specValueSelector: '.property-value, [class*="attr-value"]',
  },
  supplierDetail: {
    nameSelector: 'h1, [class*="company-name"]',
    countrySelector: '[class*="location"]',
    yearEstablishedSelector: '[class*="established"]',
    verificationSelector: '[class*="certified"]',
    ratingSelector: '[class*="score"]',
    reviewCountSelector: '[class*="review-count"]',
  },
  reviews: {
    itemSelector: '[class*="feedback-item"]',
    textSelector: '[class*="feedback-content"]',
    dateSelector: '[class*="feedback-date"]',
  },
  nextPageSelector: 'a[class*="next"]',
});
