/**
 * Rendering calculator results.
 *
 * `null` is a first-class result meaning "not meaningful for these inputs", and
 * it renders as an em dash rather than a zero. Showing 0 where the honest
 * answer is "this cannot be computed" is how a calculator misleads quietly.
 */

import type { OutputFormat } from './types';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
});

export function formatResult(
  value: number | null,
  format: OutputFormat
): string {
  if (value === null || !Number.isFinite(value)) return '—';

  switch (format) {
    case 'inr':
      // Whole rupees read better at scale; keep paise only for small amounts
      // where rounding would visibly change the answer.
      return Math.abs(value) >= 1000 ? inr.format(value) : inrPrecise.format(value);
    case 'percent':
      return `${plain.format(value)}%`;
    case 'ratio':
      return `${plain.format(value)}×`;
    case 'days':
      return `${plain.format(value)} days`;
    case 'months':
      return `${plain.format(value)} months`;
    case 'number':
    default:
      return plain.format(value);
  }
}
