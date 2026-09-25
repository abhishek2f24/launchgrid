/**
 * Currency and number-format handling for payout files.
 *
 * The reconciliation checks were always currency-agnostic — they compare
 * integers. Everything that tied this tool to India lived in presentation, and
 * this module replaces it.
 *
 * TWO SEPARATE PROBLEMS, OFTEN CONFUSED
 *   1. Which currency the amounts are in — affects display only.
 *   2. Which decimal convention the file uses — affects PARSING, and getting
 *      it wrong corrupts every number silently. A German Shopify export writes
 *      one thousand two hundred and thirty four euros fifty as "1.234,50".
 *      Read with the English convention that becomes 1.23450, and every row in
 *      the file is wrong by three orders of magnitude while still looking like
 *      a plausible number. This is the single most dangerous bug available to
 *      a tool that reads other people's money.
 *
 * Both are detected from the file and both are overridable, because a wrong
 * guess here is worse than a question.
 */

export interface Currency {
  code: string;
  symbol: string;
  /** For Intl grouping — en-IN groups as 1,23,456 rather than 123,456. */
  locale: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'Pound Sterling' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
  { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', locale: 'en-AE', name: 'UAE Dirham' },
  { code: 'NZD', symbol: 'NZ$', locale: 'en-NZ', name: 'New Zealand Dollar' },
];

export const DEFAULT_CURRENCY = CURRENCIES[0];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((entry) => entry.code === code) ?? DEFAULT_CURRENCY;
}

/** Amounts are held as integer minor units — cents, pence, paise. */
export function formatMoney(minorUnits: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}

export function formatCount(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale).format(value);
}

/**
 * Which character separates the decimal part.
 *
 * 'dot'   — 1,234.56  (US, UK, India, Australia)
 * 'comma' — 1.234,56  (Germany, France, Spain, Italy, Netherlands, Brazil)
 */
export type DecimalConvention = 'dot' | 'comma';

const DOT_DECIMAL = /\d\.\d{1,2}$/;
const COMMA_DECIMAL = /\d,\d{1,2}$/;

/**
 * Infer the decimal convention by counting which separator appears in the
 * final-two-digits position across the file.
 *
 * Counting across many cells rather than trusting the first one matters: a
 * single "1,234" (thousands) would mislead a one-row guess, but across a
 * hundred rows the real convention dominates. Ties fall back to 'dot', which
 * is what every marketplace we currently know writes.
 */
export function detectDecimalConvention(
  rows: string[][],
  columnHints: number[] = []
): DecimalConvention {
  let dot = 0;
  let comma = 0;

  const sample = rows.slice(0, 500);
  for (const row of sample) {
    const cells = columnHints.length > 0
      ? columnHints.map((index) => row[index] ?? '')
      : row;
    for (const cell of cells) {
      const value = cell.trim();
      if (value === '') continue;
      if (DOT_DECIMAL.test(value)) dot += 1;
      else if (COMMA_DECIMAL.test(value)) comma += 1;
    }
  }

  return comma > dot ? 'comma' : 'dot';
}

const CURRENCY_SYMBOLS = /[₹$£€¥]|A\$|C\$|S\$/g;
// The trailing dot is consumed as part of the code, not left behind: "Rs. 500"
// with the dot stranded parses as ".500" — five hundred becomes fifty paise.
const CURRENCY_CODES = /\b(USD|GBP|EUR|INR|AUD|CAD|SGD|AED|NZD|RS)\.?/gi;

/**
 * Guess the file's currency from an explicit currency column, then from
 * symbols in the cells. Returns null when nothing in the file says.
 */
export function detectCurrency(
  headers: string[],
  rows: string[][]
): string | null {
  // An explicit currency column is the most reliable signal.
  const currencyColumn = headers.findIndex((header) =>
    /^(currency|currency code|curr)$/i.test(header.trim())
  );
  if (currencyColumn !== -1) {
    for (const row of rows.slice(0, 50)) {
      const value = (row[currencyColumn] ?? '').trim().toUpperCase();
      if (CURRENCIES.some((entry) => entry.code === value)) return value;
    }
  }

  // Otherwise count symbols across the cells.
  const counts = new Map<string, number>();
  for (const row of rows.slice(0, 200)) {
    for (const cell of row) {
      for (const currency of CURRENCIES) {
        if (cell.includes(currency.symbol)) {
          counts.set(currency.code, (counts.get(currency.code) ?? 0) + 1);
        }
      }
    }
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = code;
    }
  }
  return best;
}

/**
 * Read a money value out of a cell, in integer minor units.
 *
 * Handles what payout exports actually contain: currency symbols and codes,
 * thousands separators in either convention, parentheses for negatives, and
 * blanks. Returns null when the cell holds no number — null and zero mean
 * different things here, and collapsing them would turn a missing settlement
 * into a settled zero.
 */
export function parseMoney(
  raw: string,
  convention: DecimalConvention = 'dot'
): number | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '—') return null;

  const negative = /^\(.*\)$/.test(trimmed) || trimmed.startsWith('-');

  let cleaned = trimmed
    .replace(/[()]/g, '')
    .replace(CURRENCY_SYMBOLS, '')
    .replace(CURRENCY_CODES, '')
    .replace(/\s/g, '')
    .replace(/^[+-]/, '');

  if (convention === 'comma') {
    // Dots are thousands separators here; the comma is the decimal point.
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  if (!/^\d*\.?\d+$/.test(cleaned)) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;

  const minorUnits = Math.round(value * 100);
  return negative ? -minorUnits : minorUnits;
}
