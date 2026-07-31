// IndiaMART adapter — CALIBRATED 2026-07-26 against live search results and
// one product-detail page (see calibration report). A mobile-number login
// popup overlays the results but does not block the underlying DOM, so
// extraction works underneath it; no CAPTCHA encountered.
import { createAdapter } from '@/lib/research/adapters/base';

export const indiamartAdapter = createAdapter({
  source: 'indiamart',
  version: '0.2.0-uncalibrated',
  defaultCurrency: 'INR',
  urlPatterns: {
    searchResults: /indiamart\.com\/(search\.mp|.*\/(search|proddetail-search))/i,
    productDetail: /indiamart\.com\/proddetail\//i,
    supplierDetail: /indiamart\.com\/[^/]+\/(about-us|profile)/i,
  },
  searchResults: {
    itemSelector: 'div.template7-product-card',
    titleSelector: 'a.prdtitle.template7-product-name',
    linkSelector: 'a.prdtitle.template7-product-name',
    priceSelector: 'span.prc.template7-product-price',
    moqSelector: '[class*="moq"]', // not present on this card layout; kept as a fallback for listings that do show it
    supplierNameSelector: 'a.template7-seller-name',
    imageSelector: 'img.product-image.template7-product-image',
    ratingSelector: 'div.dag5', // combined "4.4(192)" format — see parseRatingAndCount
  },
  productDetail: {
    titleSelector: 'h1.center-heading, h1',
    priceSelector: 'span.price-unit',
    moqSelector: '[class*="moq"]',
    specRowSelector: 'table.isq-table-ff tr',
    specLabelSelector: 'td.tdwdt',
    specValueSelector: 'td.tdwdt1',
  },
  supplierDetail: {
    nameSelector: 'h1, .company-name, [class*="companyname"]',
    countrySelector: '[class*="location"], .cmp-address',
    yearEstablishedSelector: '[class*="year-of-est"]',
    verificationSelector: '[class*="trustseal"], [class*="verified"]',
    ratingSelector: '[class*="rating"]',
    reviewCountSelector: '[class*="review-count"]',
    responseRateSelector: '[class*="response-rate"]',
  },
  reviews: {
    itemSelector: '.review-item, [class*="review-card"]',
    ratingSelector: '[class*="rating"]',
    textSelector: '.review-text, [class*="review-body"]',
    dateSelector: '[class*="review-date"]',
  },
  nextPageSelector: 'a[rel="next"], a.next',
});
