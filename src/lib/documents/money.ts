/**
 * Integer-paise money helpers and Indian-format rendering.
 *
 * Every amount that crosses this module is an integer number of paise. The
 * conversion from a human-entered rupee figure happens exactly once, in
 * `toPaise`, and the conversion back happens only at render time.
 */

/** Rupees (as typed by a person) → integer paise. Guards NaN and Infinity. */
export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

/**
 * ₹ with Indian digit grouping (1,23,456.78) and always two decimals.
 * `en-IN` gives the lakh/crore grouping that Indian readers expect.
 */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toRupees(paise));
}

/** Same grouping, no currency symbol — for table cells that carry their own. */
export function formatAmount(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toRupees(paise));
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty',
  'Ninety',
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = ONES[n % 10];
  return ones ? `${tens} ${ones}` : tens;
}

/** 0–999 in words. */
function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(' ');
}

/**
 * Indian-system words: crore, lakh, thousand, hundred.
 *
 * Indian tax invoices conventionally carry the total in words, and they use
 * the crore/lakh system rather than millions — `Intl` will not produce this,
 * so it is written out.
 */
function integerToWords(value: number): string {
  if (value === 0) return 'Zero';

  const crore = Math.floor(value / 10_000_000);
  const lakh = Math.floor((value % 10_000_000) / 100_000);
  const thousand = Math.floor((value % 100_000) / 1_000);
  const rest = value % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  return parts.join(' ');
}

/**
 * "Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six and Seventy
 * Eight Paise Only" — the line that goes under an invoice total.
 */
export function amountInWords(paise: number): string {
  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const rupees = Math.floor(absolute / 100);
  const remainder = absolute % 100;

  const parts = [`Rupees ${integerToWords(rupees)}`];
  if (remainder) parts.push(`and ${twoDigits(remainder)} Paise`);
  parts.push('Only');

  const words = parts.join(' ');
  return negative ? `Minus ${words}` : words;
}
