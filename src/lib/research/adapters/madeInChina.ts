// Made-in-China adapter — CALIBRATED 2026-07-26. Note: the page's top
// carousel widget uses a different, non-representative template — the real
// results grid uses `.products-item`, which is what's targeted here.
import { createAdapter } from '@/lib/research/adapters/base';

export const madeInChinaAdapter = createAdapter({
  source: 'made_in_china',
  version: '0.2.0-uncalibrated',
  defaultCurrency: 'USD',
  urlPatterns: {
    searchResults: /made-in-china\.com\/.*(productdirectory|productlist|products-search)/i,
    productDetail: /made-in-china\.com\/product\/|\.en\.made-in-china\.com\/product\//i,
    supplierDetail: /made-in-china\.com\/showroom\//i,
  },
  searchResults: {
    itemSelector: 'div.products-item',
    titleSelector: 'h2.product-name',
    linkSelector: '.product-name-wrap a, h2.product-name a',
    priceSelector: 'div.price-new, span.attribute',
    moqSelector: 'span.moq-text',
    supplierNameSelector: 'a.compnay-name', // site's own typo, not ours
    imageSelector: 'img.J-firstLazyload.img-shadow',
  },
  productDetail: {
    titleSelector: 'h1.sr-proMainInfo-baseInfoH1, h1',
    priceSelector: 'span.only-one-priceNum-td-left',
    moqSelector: 'span.moq-text, [class*="min-order"]',
    specRowSelector: 'div.basic-info-list div.bsc-item',
    specLabelSelector: 'div.bac-item-label',
    specValueSelector: 'div.bac-item-value',
  },
  supplierDetail: {
    nameSelector: 'h1, [class*="company-name"]',
    countrySelector: '[class*="location"]',
    yearEstablishedSelector: '[class*="established"]',
    verificationSelector: '[class*="verified"], [class*="audited"]',
  },
  reviews: {
    itemSelector: '[class*="review-item"]',
    textSelector: '[class*="review-content"]',
  },
  nextPageSelector: 'a[class*="next"]',
});
