// Parser tests against markup shaped like a real IndiaMART search card.
//
// Run with:  node --test src/lib/research/fetch/indiamartParser.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSearchHtml, parseSupplierDetailHtml } from './indiamartParser.ts';

const card = (opts: {
  name: string; price?: string; title?: string; loc?: string; moq?: string;
}) => `
<article class="im-lc-card fy23">
  <a class="im-lc-name" href="/p/1">${opts.title ?? 'Yoga Mat 6mm'}</a>
  <p class="price">${opts.price ?? '₹ 180'}/Piece</p>
  ${opts.moq ? `<span>Minimum Order ${opts.moq} Pieces</span>` : ''}
  <a class="im-lc-seller-name" href="/c/1">${opts.name}</a>
  <div>${opts.loc ?? 'Gurugram · 10 yrs'}</div>
  <span>TrustSEAL Verified</span>
</article>`;

describe('indiamart server parser', () => {
  it('extracts the fields a card actually exposes', () => {
    const [s] = parseSearchHtml(card({ name: 'Wiselife Wellness India Private Limited' }));
    assert.equal(s.supplierName, 'Wiselife Wellness India Private Limited');
    assert.equal(s.unitPrice, 180);
    assert.equal(s.currency, 'INR');
    assert.equal(s.city, 'Gurugram');
    assert.equal(s.yearsInBusiness, 10);
    assert.equal(s.productTitle, 'Yoga Mat 6mm');
  });

  it('parses thousands separators', () => {
    const [s] = parseSearchHtml(card({ name: 'Acme Traders', price: '₹ 14,990' }));
    assert.equal(s.unitPrice, 14990);
  });

  it('leaves MOQ null when the card does not state one', () => {
    const [s] = parseSearchHtml(card({ name: 'Acme Traders' }));
    assert.equal(s.moq, null);
  });

  it('reads MOQ when present', () => {
    const [s] = parseSearchHtml(card({ name: 'Acme Traders', moq: '500' }));
    assert.equal(s.moq, 500);
  });

  it('rejects an MOQ of 1 rather than storing a bogus ladder start', () => {
    const [s] = parseSearchHtml(card({ name: 'Acme Traders', moq: '1' }));
    assert.equal(s.moq, null);
  });

  it('never emits evidence booleans despite a TrustSEAL badge', () => {
    const [s] = parseSearchHtml(card({ name: 'Acme Traders' }));
    const keys = Object.keys(s);
    assert.equal(keys.some((k) => /audit|licence|license|verified|export/i.test(k)), false);
  });

  it('skips cards with no price rather than inventing one', () => {
    const html = `<article class="im-lc-card"><a class="im-lc-seller-name">Bharat Exports</a><p>Ask Price</p></article>`;
    assert.deepEqual(parseSearchHtml(html), []);
  });

  it('skips chunks with no seller anchor', () => {
    const html = `<article class="im-lc-card"><p>₹ 100</p></article>`;
    assert.deepEqual(parseSearchHtml(html), []);
  });

  it('parses several cards on one page', () => {
    const html = card({ name: 'Acme Traders' }) + card({ name: 'Bharat Exports', price: '₹ 250' }) + card({ name: 'Chetan Industries' });
    const rows = parseSearchHtml(html);
    assert.equal(rows.length, 3);
    assert.equal(rows[1].unitPrice, 250);
  });

  it('returns nothing for a 429 body, so the gate refunds instead of charging', () => {
    assert.deepEqual(parseSearchHtml('<html><body>429 Too Many Requests</body></html>'), []);
  });

  it('scores confidence higher when the card yielded more fields', () => {
    const bare = parseSearchHtml(card({ name: 'Acme Traders', loc: 'no location here' }))[0];
    const rich = parseSearchHtml(card({ name: 'Acme Traders', moq: '500' }))[0];
    assert.ok(rich.extractionConfidence > bare.extractionConfidence);
  });
});

describe('seller profile URL capture', () => {
  it('captures an absolute profile URL from the seller anchor', () => {
    const html = `<article class="im-lc-card"><p>₹ 180</p>
      <a class="im-lc-seller-name" href="https://www.indiamart.com/vsmart-solutions/">Vsmart Solutions</a></article>`;
    assert.equal(parseSearchHtml(html)[0].storeUrl, 'https://www.indiamart.com/vsmart-solutions/');
  });

  it('resolves a root-relative href against the directory host', () => {
    const html = `<article class="im-lc-card"><p>₹ 180</p>
      <a class="im-lc-seller-name" href="/acme-traders/">Acme Traders</a></article>`;
    assert.equal(parseSearchHtml(html)[0].storeUrl, 'https://www.indiamart.com/acme-traders/');
  });

  it('drops a javascript: href rather than storing a broken link', () => {
    const html = `<article class="im-lc-card"><p>₹ 180</p>
      <a class="im-lc-seller-name" href="javascript:void(0)">Acme Traders</a></article>`;
    assert.equal(parseSearchHtml(html)[0].storeUrl, null);
  });

  it('leaves storeUrl null when the anchor has no href', () => {
    const html = `<article class="im-lc-card"><p>₹ 180</p>
      <a class="im-lc-seller-name">Acme Traders</a></article>`;
    assert.equal(parseSearchHtml(html)[0].storeUrl, null);
  });
});

describe('supplier profile page parser', () => {
  const profile = `
    <html><body>
      <h1>Vsmart Solutions</h1>
      <a href="tel:+919876543210">Call</a>
      <a href="mailto:Sales@Vsmart.co.in">Email</a>
      <div>Registered Address: 14 Industrial Estate, Makarpura, Vadodara, Gujarat 390010</div>
      <div>Minimum Order Quantity: 100 Pieces</div>
      <div>ISO 9001 certified · GST No 24AABCU9603R1ZM · TrustSEAL Verified</div>
    </body></html>`;

  it('extracts the fields that make a report actionable', () => {
    const d = parseSupplierDetailHtml(profile);
    assert.equal(d.contactPhone, '9876543210');
    assert.equal(d.contactEmail, 'sales@vsmart.co.in');
    assert.ok(d.address && d.address.includes('Makarpura'));
    assert.equal(d.moq, 100);
  });

  it('records certifications as self-declared strings', () => {
    const d = parseSupplierDetailHtml(profile);
    assert.ok(d.certifications);
    assert.ok(d.certifications.includes('ISO 9001'));
    assert.ok(d.certifications.includes('GST registered'));
  });

  it('never maps a badge onto an evidence boolean', () => {
    const d = parseSupplierDetailHtml(profile);
    const keys = Object.keys(d);
    assert.equal(keys.some((k) => /audit|licence|license|factory|export/i.test(k)), false);
  });

  it('returns all-null for a page that publishes nothing', () => {
    const d = parseSupplierDetailHtml('<html><body><h1>Some Company</h1></body></html>');
    assert.deepEqual(d, { contactPhone: null, contactEmail: null, address: null, moq: null, certifications: null });
  });

  it('returns all-null for a 429 body rather than inventing contacts', () => {
    const d = parseSupplierDetailHtml('<html><body>429 Too Many Requests</body></html>');
    assert.equal(d.contactPhone, null);
    assert.equal(d.contactEmail, null);
  });

  it('does not mistake a GST number for a phone number', () => {
    const d = parseSupplierDetailHtml('<html><body>GST No 24AABCU9603R1ZM</body></html>');
    assert.equal(d.contactPhone, null);
  });

  it('rejects an MOQ of 1', () => {
    const d = parseSupplierDetailHtml('<html><body>Minimum Order Quantity: 1 Piece</body></html>');
    assert.equal(d.moq, null);
  });
});

describe('phone normalisation', () => {
  it('strips the country code from a tel: href', () => {
    const d = parseSupplierDetailHtml('<a href="tel:+919876543210">Call</a>');
    assert.equal(d.contactPhone, '9876543210');
  });
  it('strips a leading zero', () => {
    const d = parseSupplierDetailHtml('<a href="tel:09876543210">Call</a>');
    assert.equal(d.contactPhone, '9876543210');
  });
  it('rejects a number that is not a plausible Indian mobile', () => {
    const d = parseSupplierDetailHtml('<a href="tel:12345">Call</a>');
    assert.equal(d.contactPhone, null);
  });
});
