// TradeIndia adapter — CALIBRATED 2026-07-26. Multiple visual card templates
// coexist in the same results grid per the calibration report, so the
// generic `.card` container is intentionally broad; direct URL navigation
// to a product detail page redirected back to search, so detail selectors
// were captured by clicking through a card link instead — the extension's
// content script runs after that navigation completes, so this doesn't
// affect real usage.
import { createAdapter } from '@/lib/research/adapters/base';

export const tradeindiaAdapter = createAdapter({
  source: 'tradeindia',
  version: '0.2.0-uncalibrated',
  defaultCurrency: 'INR',
  urlPatterns: {
    searchResults: /tradeindia\.com\/search\.html/i,
    productDetail: /tradeindia\.com\/products\//i,
    supplierDetail: /tradeindia\.com\/[^/]+-company-/i,
  },
  searchResults: {
    itemSelector: 'div.card.d-flex.flex-column.justify-content-between',
    titleSelector: 'h2.card_title',
    linkSelector: 'a[href*="tradeindia.com/products/"]',
    priceSelector: 'p.priceHeight',
    moqSelector: '[class*="jSQhul"]', // hashed class holding "MOQ - N Piece/Pieces" — anchor on attribute-contains, not the exact hash
    supplierNameSelector: 'h3.coy-name',
    imageSelector: 'div.img_container img',
  },
  productDetail: {
    titleSelector: 'h1.product-title, h1',
    priceSelector: 'p.priceHeight', // many listings show "Get Latest Price" instead — treat a missing price as expected, not an error
    moqSelector: '[class*="jSQhul"]',
    specRowSelector: 'table.spec-table tr',
    specLabelSelector: 'td:first-child',
    specValueSelector: 'td:last-child',
  },
  supplierDetail: {
    nameSelector: 'h1, [class*="company-name"], h3.coy-name',
    countrySelector: '[class*="address"]',
    verificationSelector: '[class*="verified"]',
  },
  reviews: {
    itemSelector: '[class*="review-item"]',
    textSelector: '[class*="review-text"]',
  },
  nextPageSelector: 'a[class*="next"]',
});
