/**
 * The reconciliation checks.
 *
 * WHAT THIS TOOL CAN AND CANNOT PROVE
 *   A payout file alone cannot prove anyone was underpaid — that needs the
 *   seller's own order book to compare against. What it CAN do is find rows
 *   whose own numbers do not add up, fees that sit far outside the seller's
 *   normal rate, orders that settled at zero, and identifiers that appear more
 *   than once. Those are worth raising with the marketplace.
 *
 *   So every number this produces is "worth checking", never "owed". The UI
 *   uses that wording deliberately. A tool that tells a seller they are owed
 *   ₹18,400, and is wrong, costs them a support ticket and costs us their
 *   trust — permanently.
 *
 * All money is integer MINOR UNITS — cents, pence, paise. Floats would make the
 * arithmetic check flag rounding noise as discrepancies, which is exactly the
 * failure mode that would bury the real findings.
 *
 * Nothing here knows or cares which currency the file is in. The checks compare
 * integers; currency is a display concern handled in `currency.ts`.
 */

import { parseMoney, type DecimalConvention } from './currency';
import type { ColumnMapping } from './columns';

export type FindingType =
  | 'arithmetic'
  | 'commission-outlier'
  | 'duplicate'
  | 'zero-settlement'
  | 'negative-settlement';

export type Severity = 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  orderId: string;
  /** 1-based data row, so it can be found in the original file. */
  rowNumber: number;
  date: string;
  /** Absolute minor units this finding concerns. Zero when not quantifiable. */
  amountAtStake: number;
  detail: string;
}

export interface SkippedCheck {
  name: string;
  reason: string;
}

/**
 * Whether fee columns hold magnitudes to subtract, or values already negative.
 * Detected from the data rather than assumed — see `detectConvention`.
 */
export type FeeConvention = 'deduct' | 'signed' | 'unknown';

export interface ReconResult {
  rowsAnalysed: number;
  rowsSkipped: number;
  convention: FeeConvention;
  reconciledRows: number;
  findings: Finding[];
  /** Sum of amountAtStake across findings that quantify one. */
  totalAtStake: number;
  medianCommissionPct: number | null;
  skippedChecks: SkippedCheck[];
}

interface Row {
  rowNumber: number;
  orderId: string;
  status: string;
  date: string;
  sale: number | null;
  settlement: number | null;
  fees: number | null;
  commission: number | null;
}

/**
 * How far a row may be out before it counts as a discrepancy, in minor units.
 *
 * One major unit (₹1, $1, £1) by default. Marketplaces round settlements, and a
 * tolerance of a single cent would flood the findings with rounding noise and
 * bury the real ones. Exposed as a parameter so it can be tuned per
 * marketplace once real files show what their rounding actually looks like.
 */
export const DEFAULT_TOLERANCE = 100;

/** Commission this many percentage points above the seller's median is odd. */
const COMMISSION_OUTLIER_PP = 5;

/** Below this many rows, a median commission rate is not a meaningful baseline. */
const MIN_ROWS_FOR_MEDIAN = 10;

/**
 * Statuses whose rows are reversal accounting, not a straight sale.
 *
 * A cancelled order can legitimately show a sale amount with nothing settled
 * and no fees, and a return carries reverse shipping against no sale. Running
 * the sale-minus-fees arithmetic over these produces noise that buries the
 * genuine findings, so they are excluded from that check and from the sign
 * detection — but they are still checked for negative settlements.
 *
 * The list covers Shopify Payments' own `Type` values too: an `adjustment`,
 * `payout` or `transfer` row is bookkeeping, not a sale, and checking it as
 * one would flag every payout file as broken on its summary rows.
 *
 * These rows are excluded from the NEGATIVE-settlement check as well. A refund
 * is negative by definition and a payout row is negative because money left
 * the balance — flagging either is a false positive, and on a real Shopify
 * export those two rows alone buried a genuine $24.62 discrepancy under $2,012
 * of noise. A tool whose headline number is mostly false positives is worse
 * than no tool: the first real finding gets ignored with the rest.
 */
const REVERSAL_STATUS =
  /cancel|return|rto|refund|lost|damag|chargeback|dispute|adjust|payout|transfer|reserve/i;

function cell(row: string[], index: number | undefined): string {
  return index === undefined ? '' : (row[index] ?? '');
}

function amountAt(
  row: string[],
  index: number | undefined,
  convention: DecimalConvention
): number | null {
  if (index === undefined) return null;
  return parseMoney(row[index] ?? '', convention);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Decide whether fee columns hold magnitudes to subtract, or values that are
 * already negative.
 *
 * Picks whichever hypothesis produces the SMALLER TOTAL ERROR across the file,
 * not whichever clears the discrepancy tolerance more often.
 *
 * That distinction is load-bearing. Counting hits within the tolerance couples
 * sign detection to it, so tightening the tolerance to catch smaller
 * discrepancies made BOTH hypotheses miss, the convention came back 'unknown',
 * and the arithmetic check silently switched itself off — the user asked for a
 * stricter check and got no check. Total error is independent of the
 * tolerance, so the two settings no longer interfere.
 */
function detectConvention(
  rows: Row[],
  tolerance: number
): { convention: FeeConvention; reconciled: number } {
  let deductError = 0;
  let signedError = 0;
  let deductHits = 0;
  let signedHits = 0;
  let comparable = 0;

  for (const row of rows) {
    if (row.sale === null || row.settlement === null || row.fees === null) continue;
    if (REVERSAL_STATUS.test(row.status)) continue;
    comparable += 1;

    const deductDiff = Math.abs(row.settlement - (row.sale - row.fees));
    const signedDiff = Math.abs(row.settlement - (row.sale + row.fees));
    deductError += deductDiff;
    signedError += signedDiff;
    if (deductDiff <= tolerance) deductHits += 1;
    if (signedDiff <= tolerance) signedHits += 1;
  }

  if (comparable === 0) return { convention: 'unknown', reconciled: 0 };

  return deductError <= signedError
    ? { convention: 'deduct', reconciled: deductHits }
    : { convention: 'signed', reconciled: signedHits };
}

export interface ReconcileOptions {
  /** Decimal convention of the file. See currency.ts. */
  convention?: DecimalConvention;
  /** Minor units. Defaults to DEFAULT_TOLERANCE. */
  tolerance?: number;
}

export function reconcile(
  dataRows: string[][],
  mapping: ColumnMapping,
  options: ReconcileOptions = {}
): ReconResult {
  const decimals = options.convention ?? 'dot';
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const skippedChecks: SkippedCheck[] = [];

  const rows: Row[] = [];
  let rowsSkipped = 0;

  dataRows.forEach((raw, index) => {
    const orderId = cell(raw, mapping.orderId).trim();
    const sale = amountAt(raw, mapping.saleAmount, decimals);
    const settlement = amountAt(raw, mapping.settlement, decimals);

    // A row with no identifier and no money on it is padding, not data.
    if (orderId === '' && sale === null && settlement === null) {
      rowsSkipped += 1;
      return;
    }

    const commission = amountAt(raw, mapping.commission, decimals);
    const shipping = amountAt(raw, mapping.shipping, decimals);
    const other = amountAt(raw, mapping.otherFees, decimals);
    const feeParts = [commission, shipping, other].filter(
      (part): part is number => part !== null
    );

    rows.push({
      rowNumber: index + 1,
      orderId,
      status: cell(raw, mapping.status).trim(),
      date: cell(raw, mapping.date).trim(),
      sale,
      settlement,
      fees: feeParts.length > 0 ? feeParts.reduce((a, b) => a + b, 0) : null,
      commission,
    });
  });

  const findings: Finding[] = [];
  const { convention, reconciled } = detectConvention(rows, tolerance);

  // ── Check 1: does each row's own arithmetic hold? ────────────────────────
  if (convention === 'unknown') {
    skippedChecks.push({
      name: 'Row arithmetic',
      reason:
        rows.every((row) => row.fees === null)
          ? 'No fee column is mapped, so there is nothing to add up.'
          : 'No row had a sale, a settlement and a fee together, so there was nothing to recompute.',
    });
  } else {
    for (const row of rows) {
      if (row.sale === null || row.settlement === null || row.fees === null) continue;
      if (REVERSAL_STATUS.test(row.status)) continue;
      const expected =
        convention === 'deduct' ? row.sale - row.fees : row.sale + row.fees;
      const diff = row.settlement - expected;
      if (Math.abs(diff) <= tolerance) continue;

      findings.push({
        id: `arith-${row.rowNumber}`,
        type: 'arithmetic',
        severity: 'high',
        orderId: row.orderId,
        rowNumber: row.rowNumber,
        date: row.date,
        amountAtStake: Math.abs(diff),
        detail:
          diff < 0
            ? 'Settled for less than this row’s own sale minus fees.'
            : 'Settled for more than this row’s own sale minus fees.',
      });
    }
  }

  // ── Check 2: commission far above the seller's own normal rate ───────────
  const commissionPcts = rows
    .filter((row) => row.commission !== null && row.sale !== null && row.sale > 0)
    .map((row) => (Math.abs(row.commission as number) * 100) / (row.sale as number));

  let medianCommissionPct: number | null = null;

  if (mapping.commission === undefined) {
    skippedChecks.push({
      name: 'Commission rate',
      reason: 'No commission column is mapped.',
    });
  } else if (commissionPcts.length < MIN_ROWS_FOR_MEDIAN) {
    skippedChecks.push({
      name: 'Commission rate',
      reason: `Needs at least ${MIN_ROWS_FOR_MEDIAN} priced orders to know what your normal rate is; this file has ${commissionPcts.length}.`,
    });
  } else {
    medianCommissionPct = median(commissionPcts);
    const threshold = (medianCommissionPct as number) + COMMISSION_OUTLIER_PP;

    for (const row of rows) {
      if (row.commission === null || row.sale === null || row.sale <= 0) continue;
      const pct = (Math.abs(row.commission) * 100) / row.sale;
      if (pct <= threshold) continue;

      const excess = Math.round(
        ((pct - (medianCommissionPct as number)) / 100) * row.sale
      );
      findings.push({
        id: `comm-${row.rowNumber}`,
        type: 'commission-outlier',
        severity: 'medium',
        orderId: row.orderId,
        rowNumber: row.rowNumber,
        date: row.date,
        amountAtStake: Math.max(0, excess),
        detail: `Commission is ${pct.toFixed(1)}% here against your median of ${(medianCommissionPct as number).toFixed(1)}%.`,
      });
    }
  }

  // ── Check 3: the same order identifier more than once ────────────────────
  const byOrderId = new Map<string, Row[]>();
  for (const row of rows) {
    if (row.orderId === '') continue;
    const existing = byOrderId.get(row.orderId);
    if (existing) existing.push(row);
    else byOrderId.set(row.orderId, [row]);
  }

  for (const [orderId, group] of byOrderId) {
    if (group.length < 2) continue;
    findings.push({
      id: `dup-${orderId}`,
      type: 'duplicate',
      severity: 'medium',
      orderId,
      rowNumber: group[0].rowNumber,
      date: group[0].date,
      // Not counted towards the headline: a multi-item order legitimately
      // appears several times, so calling this money at stake would inflate
      // the number the seller takes to the marketplace.
      amountAtStake: 0,
      detail: `Appears ${group.length} times (rows ${group.map((row) => row.rowNumber).join(', ')}). Check it is not deducted twice.`,
    });
  }

  // ── Checks 4 and 5: nothing settled, or a negative settlement ────────────
  for (const row of rows) {
    // Reversal rows are negative on purpose — see REVERSAL_STATUS.
    const isReversal = REVERSAL_STATUS.test(row.status);

    if (!isReversal && row.settlement !== null && row.settlement < 0) {
      findings.push({
        id: `neg-${row.rowNumber}`,
        type: 'negative-settlement',
        severity: 'high',
        orderId: row.orderId,
        rowNumber: row.rowNumber,
        date: row.date,
        amountAtStake: Math.abs(row.settlement),
        detail: 'You paid the marketplace on this order rather than being paid.',
      });
      continue;
    }

    const nothingSettled = row.settlement === null || row.settlement === 0;
    if (!nothingSettled || row.sale === null || row.sale <= 0) continue;
    // A cancelled or returned order settling at zero is correct, not a finding.
    if (isReversal) continue;

    findings.push({
      id: `zero-${row.rowNumber}`,
      type: 'zero-settlement',
      severity: 'high',
      orderId: row.orderId,
      rowNumber: row.rowNumber,
      date: row.date,
      amountAtStake: row.sale,
      detail: row.status
        ? `Sold, but nothing settled. Status says “${row.status}”.`
        : 'Sold, but nothing settled, and no status explains it.',
    });
  }

  // A row that settled at zero, or negative, ALSO fails the sale-minus-fees
  // arithmetic — of course it does, that is the same problem seen twice. Left
  // in, it double-counts into the headline and sends the seller to the
  // marketplace with an inflated number, which is the fastest way to lose the
  // argument. The settlement finding describes the row better, so it wins.
  const settlementFlagged = new Set(
    findings
      .filter(
        (finding) =>
          finding.type === 'zero-settlement' ||
          finding.type === 'negative-settlement'
      )
      .map((finding) => finding.rowNumber)
  );

  const deduped = findings.filter(
    (finding) =>
      !(finding.type === 'arithmetic' && settlementFlagged.has(finding.rowNumber))
  );

  deduped.sort((a, b) => b.amountAtStake - a.amountAtStake);

  return {
    rowsAnalysed: rows.length,
    rowsSkipped,
    convention,
    reconciledRows: reconciled,
    findings: deduped,
    totalAtStake: deduped.reduce((sum, finding) => sum + finding.amountAtStake, 0),
    medianCommissionPct,
    skippedChecks,
  };
}

export const FINDING_LABELS: Record<FindingType, string> = {
  arithmetic: 'Does not add up',
  'commission-outlier': 'Commission above your normal rate',
  duplicate: 'Duplicate order ID',
  'zero-settlement': 'Nothing settled',
  'negative-settlement': 'Negative settlement',
};
