// Deterministic supplier-page extractors.
//
// Each `extract` function is serialised and executed INSIDE the page by the CDP driver, so
// it must be self-contained (no imports, no closure over module scope).
//
// HARD RULES — these encode the bugs already found and fixed, do not relax them:
//  1. CURRENCY IS NEVER GUESSED. Read the symbol off the page; otherwise fall back to the
//     platform's documented quoting currency. Alibaba/Made-in-China quote USD — defaulting
//     those to INR previously understated landed cost ~83x and inflated margins.
//  2. NO EVIDENCE BOOLEANS ARE EVER EMITTED. Factory audit / business licence / export
//     history are compliance claims. A "Verified Supplier" ribbon is marketing, not proof.
//     Emitting nothing leaves those columns NULL ("unknown") instead of false ("we checked
//     and it's absent") — the latter is a stronger, wrong claim that skews confidence scores.
//  3. A PRICE LADDER DOES NOT START AT 1. Quantity 1 or 2 means the parser grabbed a stray
//     number, so such tiers are dropped rather than stored.

export const PLATFORMS = {
  alibaba: {
    name: 'Alibaba',
    quoteCurrency: 'USD',
    searchUrl: (q) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`,
    parserVersion: 'alibaba-cdp@1.0.0',
  },
  indiamart: {
    name: 'IndiaMART',
    quoteCurrency: 'INR',
    searchUrl: (q) => `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(q)}`,
    parserVersion: 'indiamart-cdp@1.0.0',
  },
};

/**
 * Pulls supplier cards off a SEARCH RESULTS page. Search pages are used rather than product
 * detail pages because they expose supplier name + MOQ + price ladder together, and cost one
 * page load per product instead of N.
 */
export function extractFromSearchPage(quoteCurrency) {
  const text = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  const detectCurrency = (s) => {
    if (/₹|INR|Rs\.?\s*\d/i.test(s)) return 'INR';
    if (/\$|USD/i.test(s)) return 'USD';
    if (/¥|CNY|RMB/i.test(s)) return 'CNY';
    return null;
  };

  const num = (s) => {
    if (!s) return null;
    const m = s.replace(/,/g, '').match(/\d+(?:\.\d{1,2})?/);
    if (!m) return null;
    const n = parseFloat(m[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  // Candidate card containers across both sites' current markup.
  const cardSelectors = [
    '.fy23-search-card', '.organic-list-offer-outter', '.list-no-v2-outter',
    '[data-content="abTest"]', '.J-offer-wrapper',
    '.lst', '.card', '.prd', '[class*="listing"]', '.brs',
  ];

  let cards = [];
  for (const sel of cardSelectors) {
    const found = Array.from(document.querySelectorAll(sel));
    if (found.length >= 3) { cards = found; break; }
  }
  if (!cards.length) return { cards: [], debug: 'no card container matched' };

  const out = [];
  for (const card of cards.slice(0, 12)) {
    const blob = text(card);
    if (!blob || blob.length < 20) continue;

    // Supplier / company name
    let supplierName = '';
    for (const sel of [
      'a[data-role="company-name"]', '.company-name', '[class*="company-name"]',
      '.cmpny_hdng a', '.companyName', '[class*="companyName"]', '.lcname', '.sn',
    ]) {
      const t = text(card.querySelector(sel));
      if (t && t.length > 2) { supplierName = t; break; }
    }
    if (!supplierName) continue;

    // Price + MOQ from the card's own text — resilient to class churn.
    const priceMatch = blob.match(/(?:₹|Rs\.?|\$|US\s*\$|¥)\s*[\d,]+(?:\.\d{1,2})?(?:\s*[-–]\s*(?:₹|Rs\.?|\$|¥)?\s*[\d,]+(?:\.\d{1,2})?)?/i);
    const moqMatch = blob.match(/(?:min(?:imum)?\.?\s*order|moq)[^\d]{0,12}([\d,]+)/i);

    const priceText = priceMatch ? priceMatch[0] : '';
    const unitPrice = num(priceText);
    const moq = moqMatch ? num(moqMatch[1]) : null;
    if (!unitPrice) continue;

    // Rule 1: page symbol wins; platform currency is the documented fallback.
    const currency = detectCurrency(priceText) || quoteCurrency;

    // Confidence = how much actually resolved, not how much we'd like to trust it.
    let confidence = 0.3;
    if (unitPrice) confidence += 0.3;
    if (moq) confidence += 0.25;
    if (/verified|gold|trusted/i.test(blob)) confidence += 0.05;
    confidence = Math.min(1, Math.round(confidence * 100) / 100);

    const link = card.querySelector('a[href]');
    let href = link ? link.href : location.href;
    if (href.startsWith('//')) href = 'https:' + href;

    out.push({
      supplierName: supplierName.slice(0, 180),
      unitPrice,
      currency,
      // Rule 3: a real ladder never starts at 1–2.
      moq: moq && moq >= 3 ? Math.round(moq) : null,
      sourceUrl: href.split('?')[0],
      extractionConfidence: confidence,
      // Rule 2: deliberately NO evidence booleans emitted.
    });
  }

  return { cards: out, debug: `${cards.length} containers` };
}
