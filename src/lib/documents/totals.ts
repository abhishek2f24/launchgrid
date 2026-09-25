/**
 * GST for the document tools.
 *
 * NOT YET THE ONLY GST IMPLEMENTATION IN THE REPO.
 *   src/app/store/[slug]/invoice/[orderId]/page.tsx still computes its own
 *   split inline, in floats. It should move onto this function so a customer
 *   comparing a storefront invoice with a tool-generated one can never see
 *   different numbers — but it cannot simply be swapped in: that page compares
 *   state *names* (`business_configs.state` against a free-text shipping
 *   address), while this module compares GST state *codes*. Unifying needs a
 *   name→code resolution step, and getting that wrong would silently flip
 *   CGST/SGST to IGST on live invoices. Do it deliberately, not as a drive-by.
 */

import { toPaise } from './money';
import type { DocumentTotals, LineItem, PayRow, TaxMode } from './types';

/** Line value in paise, before tax. Quantity is clamped to a sane range. */
export function lineTotal(item: LineItem): number {
  const quantity = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
  return Math.round(toPaise(item.unitPrice) * quantity);
}

export interface ComputeTotalsInput {
  items: LineItem[];
  /** Whole-number percentage, e.g. 18. */
  gstRate: number;
  taxMode: TaxMode;
  /** Seller's GST state code. */
  sellerState: string;
  /** Buyer's GST state code. Empty is treated as intra-state (see below). */
  buyerState: string;
}

export function computeTotals({
  items,
  gstRate,
  taxMode,
  sellerState,
  buyerState,
}: ComputeTotalsInput): DocumentTotals {
  const gross = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const rate = Number.isFinite(gstRate) ? Math.max(0, gstRate) : 0;

  // Place of supply. An unknown buyer state defaults to intra-state: a
  // walk-in customer with no address on a counter receipt is overwhelmingly
  // local, and CGST+SGST is the safer default to show. The form surfaces the
  // buyer's state so this is a visible choice, not a hidden assumption.
  const isInterState =
    sellerState !== '' && buyerState !== '' && sellerState !== buyerState;

  let taxable: number;
  let tax: number;

  if (taxMode === 'none' || rate === 0) {
    taxable = gross;
    tax = 0;
  } else if (taxMode === 'inclusive') {
    // Prices already contain GST: back the tax out so the printed total still
    // equals what the seller quoted.
    taxable = Math.round((gross * 100) / (100 + rate));
    tax = gross - taxable;
  } else {
    taxable = gross;
    tax = Math.round((gross * rate) / 100);
  }

  // Halving an odd number of paise must not lose or invent one, so SGST takes
  // the remainder rather than both halves being rounded independently.
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (isInterState) {
    igst = tax;
  } else {
    cgst = Math.floor(tax / 2);
    sgst = tax - cgst;
  }

  // Indian invoices are conventionally rounded to the nearest rupee, with the
  // adjustment shown as its own line so the arithmetic stays checkable.
  const beforeRounding = taxable + tax;
  const rounded = Math.round(beforeRounding / 100) * 100;
  const roundOff = rounded - beforeRounding;

  return {
    taxable,
    cgst,
    sgst,
    igst,
    tax,
    roundOff,
    total: rounded,
    isInterState,
  };
}

/** Payslip totals, in paise. Earnings and deductions are independent sums. */
export interface PayslipTotals {
  gross: number;
  deductions: number;
  net: number;
}

export function computePayslip(
  earnings: PayRow[],
  deductions: PayRow[]
): PayslipTotals {
  const sum = (rows: PayRow[]) =>
    rows.reduce((total, row) => total + toPaise(row.amount), 0);

  const gross = sum(earnings);
  const deducted = sum(deductions);
  // Net can legitimately go negative (a recovery month), so it is not clamped —
  // showing a negative net is more useful than hiding an input error.
  return { gross, deductions: deducted, net: gross - deducted };
}
