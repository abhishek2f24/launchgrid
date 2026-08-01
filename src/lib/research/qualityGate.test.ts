// Quality-gate tests.
//
// Run with:  node --test src/lib/research/qualityGate.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, titleMatchRate, MIN_SUPPLIERS } from './qualityGate.ts';

const supplier = (over: Partial<Parameters<typeof evaluate>[0]['suppliers'][number]> = {}) => ({
  supplierName: 'Acme Traders',
  unitPrice: 100,
  currency: 'INR',
  city: 'Surat',
  extractionConfidence: 0.75,
  productTitle: 'Yoga Mat 6mm',
  ...over,
});

describe('quality gate', () => {
  it('passes a healthy report', () => {
    const v = evaluate({
      query: 'Yoga Mat',
      suppliers: [
        supplier({ supplierName: 'A' }),
        supplier({ supplierName: 'B', unitPrice: 140 }),
        supplier({ supplierName: 'C', unitPrice: 180 }),
      ],
    });
    assert.equal(v.pass, true);
    assert.deepEqual(v.failures, []);
    assert.equal(v.metrics.distinctSuppliers, 3);
  });

  it('fails an empty harvest rather than charging for it', () => {
    const v = evaluate({ query: 'Yoga Mat', suppliers: [] });
    assert.equal(v.pass, false);
    assert.ok(String(v.failures.join(' ')).includes(`need ${MIN_SUPPLIERS}`));
  });

  it('does not count the same supplier three times', () => {
    const v = evaluate({
      query: 'Yoga Mat',
      suppliers: [supplier(), supplier(), supplier()],
    });
    assert.equal(v.metrics.distinctSuppliers, 1);
    assert.equal(v.pass, false);
  });

  it('fails hard when a currency is missing, never guessing one', () => {
    const v = evaluate({
      query: 'Yoga Mat',
      suppliers: [
        supplier({ supplierName: 'A' }),
        supplier({ supplierName: 'B' }),
        supplier({ supplierName: 'C', currency: null }),
      ],
    });
    assert.equal(v.pass, false);
    assert.ok(String(v.failures.join(' ')).includes('no currency'));
  });

  it('fails low-confidence extractions', () => {
    const v = evaluate({
      query: 'Yoga Mat',
      suppliers: [
        supplier({ supplierName: 'A', extractionConfidence: 0.3 }),
        supplier({ supplierName: 'B', extractionConfidence: 0.3 }),
        supplier({ supplierName: 'C', extractionConfidence: 0.3 }),
      ],
    });
    assert.equal(v.pass, false);
    assert.ok(String(v.failures.join(' ')).includes('confidence'));
  });

  it('REFUSES a report whose suppliers sell something else', () => {
    // The real failure this encodes: "Macrame Wall Hanging" returned agate sellers.
    const v = evaluate({
      query: 'Macrame Wall Hanging',
      suppliers: [
        supplier({ supplierName: 'A', productTitle: 'Crystal Agate Slab' }),
        supplier({ supplierName: 'B', productTitle: 'Acrylic Sheet' }),
        supplier({ supplierName: 'C', productTitle: 'Agate Coaster' }),
      ],
    });
    assert.equal(v.pass, false);
    assert.ok(String(v.failures.join(' ')).includes('sell something else'));
  });

  it('still delivers, with a warning, when relevance is partial', () => {
    // 2 of 4 match = 0.5 — above the refund threshold, below the clean bar.
    const v = evaluate({
      query: 'Yoga Mat',
      suppliers: [
        supplier({ supplierName: 'A', productTitle: 'Yoga Mat 6mm' }),
        supplier({ supplierName: 'B', productTitle: 'Yoga Mat TPE' }),
        supplier({ supplierName: 'C', productTitle: 'Acupressure Foot Roller' }),
        supplier({ supplierName: 'D', productTitle: 'Resistance Band' }),
      ],
    });
    assert.equal(v.pass, true);
    assert.ok(String(v.warnings.join(' ')).includes('clearly match'));
  });

  it('warns on an implausible price spread', () => {
    const v = evaluate({
      query: 'Yoga Mat',
      suppliers: [
        supplier({ supplierName: 'A', unitPrice: 100 }),
        supplier({ supplierName: 'B', unitPrice: 500 }),
        supplier({ supplierName: 'C', unitPrice: 90000 }),
      ],
    });
    assert.ok(String(v.warnings.join(' ')).includes('mixed product types'));
  });

  it('treats absent titles as unknown rather than as a mismatch', () => {
    assert.equal(titleMatchRate('Yoga Mat', [supplier({ productTitle: null })]), null);
    const v = evaluate({
      query: 'Yoga Mat',
      suppliers: [
        supplier({ supplierName: 'A', productTitle: null }),
        supplier({ supplierName: 'B', productTitle: null }),
        supplier({ supplierName: 'C', productTitle: null }),
      ],
    });
    assert.equal(v.pass, true);
    assert.equal(v.metrics.titleMatchRate, null);
  });
});
