/**
 * Regression tests for the reconciliation engine.
 *
 * Run with `npm test`. Node's built-in runner and its native TypeScript
 * support mean no test dependency at all.
 *
 * Every case here corresponds to a defect found by hand during development, or
 * to a file shape a real seller would upload. The planted-defect fixture is the
 * same one the tool ships as its sample, so the sample doubles as the fixture:
 * if the sample ever stops producing exactly these findings, this fails.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { parseCsv } from '../src/lib/reconcile/csv.ts';
import {
  detectCurrency,
  detectDecimalConvention,
  parseMoney,
} from '../src/lib/reconcile/currency.ts';
import { guessMapping, missingRequiredRoles } from '../src/lib/reconcile/columns.ts';
import { reconcile } from '../src/lib/reconcile/checks.ts';
import { SAMPLE_CSV } from '../src/lib/reconcile/sample.ts';

describe('CSV parsing', () => {
  it('handles a plain comma file', () => {
    const { headers, rows } = parseCsv('a,b\n1,2\n3,4\n');
    assert.deepEqual(headers, ['a', 'b']);
    assert.deepEqual(rows, [['1', '2'], ['3', '4']]);
  });

  it('strips a UTF-8 BOM and handles CRLF', () => {
    const { headers, rows } = parseCsv('﻿a,b\r\n1,2\r\n');
    assert.deepEqual(headers, ['a', 'b']);
    assert.deepEqual(rows, [['1', '2']]);
  });

  it('detects a semicolon delimiter from the header line', () => {
    const { headers, delimiter } = parseCsv('a;b;c\n1;2;3\n');
    assert.equal(delimiter, ';');
    assert.deepEqual(headers, ['a', 'b', 'c']);
  });

  it('keeps commas and newlines inside quoted fields', () => {
    const { rows } = parseCsv('a,b\n"1,234.00","line1\nline2"\n');
    assert.deepEqual(rows, [['1,234.00', 'line1\nline2']]);
  });

  it('treats a doubled quote as an escaped quote', () => {
    const { rows } = parseCsv('a\n"say ""hi"""\n');
    assert.deepEqual(rows, [['say "hi"']]);
  });

  it('pads short rows so every row can be indexed safely', () => {
    const { rows, raggedRows } = parseCsv('a,b,c\n1,2\n');
    assert.deepEqual(rows, [['1', '2', '']]);
    assert.equal(raggedRows, 1);
  });

  it('returns empty structure for empty input rather than throwing', () => {
    assert.deepEqual(parseCsv('').rows, []);
    assert.deepEqual(parseCsv('   ').rows, []);
  });
});

describe('money parsing', () => {
  it('reads plain and thousand-separated amounts as minor units', () => {
    assert.equal(parseMoney('1234.56'), 123456);
    assert.equal(parseMoney('1,234.56'), 123456);
    assert.equal(parseMoney('1,23,456.78'), 12345678); // Indian grouping
  });

  it('strips currency symbols and codes', () => {
    assert.equal(parseMoney('₹499.00'), 49900);
    assert.equal(parseMoney('$19.99'), 1999);
    assert.equal(parseMoney('£12.50'), 1250);
    assert.equal(parseMoney('Rs. 500'), 50000);
    assert.equal(parseMoney('USD 42.00'), 4200);
  });

  it('reads parentheses and leading minus as negative', () => {
    assert.equal(parseMoney('(85.00)'), -8500);
    assert.equal(parseMoney('-85.00'), -8500);
  });

  it('distinguishes an absent value from zero', () => {
    assert.equal(parseMoney(''), null);
    assert.equal(parseMoney('-'), null);
    assert.equal(parseMoney('n/a'), null);
    assert.equal(parseMoney('0.00'), 0);
  });

  it('reads the comma decimal convention without corrupting the value', () => {
    // The dangerous case: read with the wrong convention this is 1.23450.
    assert.equal(parseMoney('1.234,50', 'comma'), 123450);
    assert.equal(parseMoney('999,99', 'comma'), 99999);
    assert.equal(parseMoney('1.234.567,89', 'comma'), 123456789);
  });

  it('rounds to whole minor units rather than carrying a float', () => {
    assert.equal(parseMoney('0.1'), 10);
    assert.equal(parseMoney('33.33'), 3333);
    assert.equal(Number.isInteger(parseMoney('19.99') as number), true);
  });
});

describe('format detection', () => {
  it('detects the comma decimal convention from the data', () => {
    const rows = [
      ['1.234,50', '99,00'],
      ['2.000,00', '15,50'],
      ['3.100,25', '12,75'],
    ];
    assert.equal(detectDecimalConvention(rows), 'comma');
  });

  it('defaults to dot when the evidence is thin or tied', () => {
    assert.equal(detectDecimalConvention([['abc', 'def']]), 'dot');
    assert.equal(detectDecimalConvention([]), 'dot');
  });

  it('is not fooled by a single thousands separator', () => {
    const rows = [['1,234'], ['5.50'], ['6.75'], ['7.20']];
    assert.equal(detectDecimalConvention(rows), 'dot');
  });

  it('reads currency from an explicit currency column', () => {
    const headers = ['order', 'amount', 'Currency'];
    const rows = [['1', '10.00', 'GBP']];
    assert.equal(detectCurrency(headers, rows), 'GBP');
  });

  it('falls back to counting symbols in the cells', () => {
    const headers = ['order', 'amount'];
    const rows = [['1', '$10.00'], ['2', '$20.00']];
    assert.equal(detectCurrency(headers, rows), 'USD');
  });

  it('returns null when the file says nothing about currency', () => {
    assert.equal(detectCurrency(['order', 'amount'], [['1', '10.00']]), null);
  });
});

describe('column mapping', () => {
  it('maps a Meesho-style header row', () => {
    const headers = [
      'Sub Order No', 'Order Date', 'Live Order Status', 'Total Sale Amount',
      'Commission', 'Shipping Charge', 'Fixed Fee', 'Final Settlement Amount',
    ];
    const mapping = guessMapping(headers);
    assert.equal(mapping.orderId, 0);
    assert.equal(mapping.saleAmount, 3);
    assert.equal(mapping.commission, 4);
    assert.equal(mapping.shipping, 5);
    assert.equal(mapping.settlement, 7);
    assert.deepEqual(missingRequiredRoles(mapping), []);
  });

  it('maps a differently-named international header row', () => {
    const headers = [
      'Order ID', 'Order Date', 'Status', 'Item Price',
      'Referral Fee', 'Logistics', 'Net Amount',
    ];
    const mapping = guessMapping(headers);
    assert.equal(mapping.orderId, 0);
    assert.equal(mapping.saleAmount, 3);
    assert.equal(mapping.commission, 4);
    assert.equal(mapping.shipping, 5);
    assert.equal(mapping.settlement, 6);
  });

  it('maps a Shopify/Stripe-style header row', () => {
    const headers = [
      'Order ID', 'Order Date', 'Status', 'Order Total',
      'Commission', 'Shipping', 'Currency', 'Net Amount',
    ];
    const mapping = guessMapping(headers);
    assert.equal(mapping.orderId, 0);
    assert.equal(mapping.saleAmount, 3);
    assert.equal(mapping.commission, 4);
    assert.equal(mapping.shipping, 5);
    assert.equal(mapping.settlement, 7);
    assert.deepEqual(missingRequiredRoles(mapping), []);
  });

  it('maps an eBay-style header row', () => {
    const mapping = guessMapping([
      'Transaction ID', 'Item Total', 'Final Value Fee', 'Postage', 'Net',
    ]);
    assert.equal(mapping.orderId, 0);
    assert.equal(mapping.saleAmount, 1);
    assert.equal(mapping.commission, 2);
    assert.equal(mapping.shipping, 3);
    assert.equal(mapping.settlement, 4);
  });

  it('maps a real Shopify Payments transactions export', () => {
    const mapping = guessMapping([
      'Transaction Date', 'Type', 'Order', 'Card Brand',
      'Amount', 'Fee', 'Net', 'Checkout', 'Payment Method Name',
    ]);
    assert.equal(mapping.orderId, 2);
    assert.equal(mapping.saleAmount, 4);
    // Shopify's "Fee" IS its processing commission, so it maps to commission
    // rather than the catch-all — which is what enables the rate check.
    assert.equal(mapping.commission, 5);
    assert.equal(mapping.settlement, 6);
    assert.equal(mapping.status, 1);
    assert.deepEqual(missingRequiredRoles(mapping), []);
  });

  it('never assigns one column to two roles', () => {
    // "Shipping Fee" must not satisfy both `shipping` and the generic `fee`
    // pattern of `otherFees`.
    const mapping = guessMapping([
      'Order ID', 'Sale Amount', 'Settlement', 'Shipping Fee',
    ]);
    const used = Object.values(mapping);
    assert.equal(new Set(used).size, used.length);
  });

  it('reports what is missing when required columns are absent', () => {
    const missing = missingRequiredRoles(guessMapping(['foo', 'bar']));
    assert.equal(missing.length, 3);
  });
});

describe('reconciliation checks', () => {
  const { headers, rows } = parseCsv(SAMPLE_CSV);
  const mapping = guessMapping(headers);
  const result = reconcile(rows, mapping);

  const typesFor = (rowNumber: number) =>
    result.findings.filter((f) => f.rowNumber === rowNumber).map((f) => f.type);

  it('reads the fee sign convention from the data', () => {
    assert.equal(result.convention, 'deduct');
  });

  it('finds every planted defect and nothing else', () => {
    assert.equal(result.findings.length, 6);
  });

  it('flags rows that do not match their own arithmetic', () => {
    assert.deepEqual(typesFor(13), ['arithmetic']);
    assert.deepEqual(typesFor(14), ['arithmetic']);
    const short = result.findings.find((f) => f.rowNumber === 13);
    assert.equal(short?.amountAtStake, 30000); // 300.00
  });

  it('flags commission far above the median rate', () => {
    assert.deepEqual(typesFor(15), ['commission-outlier']);
    assert.equal(Math.round(result.medianCommissionPct ?? 0), 15);
  });

  it('flags a delivered order that settled at nothing', () => {
    assert.deepEqual(typesFor(16), ['zero-settlement']);
  });

  it('does NOT also raise an arithmetic finding on a zero settlement', () => {
    // Regression: this once produced two findings for one problem and
    // inflated the headline total by 862.15.
    assert.equal(typesFor(16).length, 1);
  });

  it('flags a negative settlement on a non-reversal row', () => {
    assert.deepEqual(typesFor(17), ['negative-settlement']);
  });

  it('does NOT flag a refund for being negative', () => {
    // Regression: a refund and a Shopify payout row are negative by
    // definition. Flagging them buried a real $24.62 finding under $2,012 of
    // noise on a genuine Shopify export.
    assert.deepEqual(typesFor(20), []);
  });

  it('does not flag a cancelled order that correctly settled at zero', () => {
    assert.deepEqual(typesFor(18), []);
  });

  it('flags a repeated order ID without counting it as money', () => {
    const duplicate = result.findings.find((f) => f.type === 'duplicate');
    assert.ok(duplicate);
    assert.equal(duplicate?.amountAtStake, 0);
  });

  it('totals only what it can quantify', () => {
    assert.equal(result.totalAtStake, 168390); // 1,683.90
  });

  it('counts the rows that reconcile', () => {
    assert.equal(result.reconciledRows, 15);
  });
});

describe('reconciliation edge cases', () => {
  const run = (csv: string, options = {}) => {
    const { headers, rows } = parseCsv(csv);
    return reconcile(rows, guessMapping(headers), options);
  };

  it('skips the arithmetic check when no fee column is mapped', () => {
    const result = run('Order ID,Sale Amount,Settlement\nA-1,100.00,90.00\n');
    assert.equal(result.convention, 'unknown');
    assert.ok(result.skippedChecks.some((c) => c.name === 'Row arithmetic'));
    assert.equal(result.findings.filter((f) => f.type === 'arithmetic').length, 0);
  });

  it('handles fees stored as already-negative values', () => {
    const csv = [
      'Order ID,Sale Amount,Commission,Settlement',
      'A-1,100.00,-15.00,85.00',
      'A-2,200.00,-30.00,170.00',
      'A-3,300.00,-45.00,200.00',
    ].join('\n');
    const result = run(csv);
    assert.equal(result.convention, 'signed');
    assert.equal(result.findings.filter((f) => f.type === 'arithmetic').length, 1);
  });

  it('reconciles a comma-decimal European file correctly', () => {
    const csv = [
      'Order ID;Sale Amount;Commission;Settlement',
      'A-1;1.000,00;150,00;850,00',
      'A-2;2.000,00;300,00;1.700,00',
      'A-3;500,00;75,00;300,00',
    ].join('\n');
    const result = run(csv, { convention: 'comma' as const });
    // Only A-3 is genuinely short: 500 - 75 = 425, settled 300.
    const arithmetic = result.findings.filter((f) => f.type === 'arithmetic');
    assert.equal(arithmetic.length, 1);
    assert.equal(arithmetic[0].amountAtStake, 12500); // 125,00
  });

  it('ignores rounding differences below the tolerance', () => {
    const csv = [
      'Order ID,Sale Amount,Commission,Settlement',
      'A-1,100.00,15.00,84.50',
    ].join('\n');
    assert.equal(run(csv).findings.filter((f) => f.type === 'arithmetic').length, 0);
  });

  it('respects a tighter tolerance when asked', () => {
    const csv = [
      'Order ID,Sale Amount,Commission,Settlement',
      'A-1,100.00,15.00,84.50',
    ].join('\n');
    const result = run(csv, { tolerance: 10 });
    assert.equal(result.findings.filter((f) => f.type === 'arithmetic').length, 1);
  });

  it('skips the commission check when there are too few priced rows', () => {
    const csv = [
      'Order ID,Sale Amount,Commission,Settlement',
      'A-1,100.00,15.00,85.00',
    ].join('\n');
    const result = run(csv);
    assert.ok(result.skippedChecks.some((c) => c.name === 'Commission rate'));
  });

  it('ignores blank padding rows', () => {
    const csv = 'Order ID,Sale Amount,Settlement\nA-1,100.00,90.00\n,,\n,,\n';
    const result = run(csv);
    assert.equal(result.rowsAnalysed, 1);
    assert.equal(result.rowsSkipped, 2);
  });

  it('ignores Shopify payout and adjustment rows when checking arithmetic', () => {
    const csv = [
      'Order,Type,Amount,Fee,Net',
      ...Array.from({ length: 11 }, (_, i) => `#10${i},charge,100.00,3.00,97.00`),
      // Bookkeeping rows: not sales, and checking them as sales would flag
      // every real payout file on its own summary lines.
      ',payout,0.00,0.00,-1067.00',
      '#2001,adjustment,50.00,0.00,0.00',
    ].join('\n');
    const result = run(csv);
    assert.equal(result.findings.filter((f) => f.type === 'arithmetic').length, 0);
    assert.equal(result.findings.filter((f) => f.type === 'zero-settlement').length, 0);
  });

  it('produces no findings for a clean file', () => {
    const csv = [
      'Order ID,Sale Amount,Commission,Settlement',
      ...Array.from({ length: 12 }, (_, i) => `A-${i},100.00,15.00,85.00`),
    ].join('\n');
    assert.deepEqual(run(csv).findings, []);
  });
});
