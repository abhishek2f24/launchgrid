/**
 * Mapping a marketplace's column names onto the roles the checks need.
 *
 * Every marketplace names these differently, and the same marketplace renames
 * them between report versions. So: guess from the header text, then SHOW the
 * guess and let the seller correct it. An auto-mapping that silently picks the
 * wrong column produces confident, wrong money numbers — the worst possible
 * output for this tool.
 */

export type ColumnRole =
  | 'orderId'
  | 'saleAmount'
  | 'settlement'
  | 'commission'
  | 'shipping'
  | 'otherFees'
  | 'status'
  | 'date';

export interface RoleSpec {
  role: ColumnRole;
  label: string;
  /** Without these, the reconciliation cannot run at all. */
  required: boolean;
  help: string;
  /** Lower-cased substrings, most specific first. */
  patterns: string[];
}

export const ROLE_SPECS: RoleSpec[] = [
  {
    role: 'orderId',
    label: 'Order ID',
    required: true,
    help: 'Whatever identifies one order. Used to group and to spot duplicates.',
    patterns: ['sub order no', 'suborder', 'order id', 'order no', 'order_id', 'orderid', 'order item id', 'transaction id', 'order name', 'order number', 'awb', 'order'],
  },
  {
    role: 'saleAmount',
    label: 'Sale amount',
    required: true,
    help: 'What the customer paid for the item, before the marketplace took anything.',
    // Ordered from most specific to least. Shopify writes "Order Total",
    // Stripe "Gross", Etsy "Order Value", Amazon "Item Price", Meesho "Total
    // Sale Amount" — the same field under five names.
    patterns: ['total sale amount', 'order total', 'invoice amount', 'gross amount', 'gross sales', 'item price', 'sale amount', 'order value', 'selling price', 'taxable value', 'item total', 'mrp', 'gross', 'subtotal', 'amount'],
  },
  {
    role: 'settlement',
    label: 'Amount settled to you',
    required: true,
    help: 'The net figure the marketplace says it paid you for this order.',
    patterns: ['final settlement amount', 'settlement amount', 'net settlement', 'amount settled', 'net payout', 'payout amount', 'total payout', 'payout', 'net amount', 'net sales', 'settlement', 'net'],
  },
  {
    role: 'commission',
    label: 'Commission',
    required: false,
    help: 'Marketplace commission or referral fee. Optional, but the arithmetic check needs at least one fee column.',
    patterns: ['commission', 'referral fee', 'final value fee', 'marketplace fee', 'platform fee', 'transaction fee', 'processing fee', 'selling fee', 'seller fee', 'fee'],
  },
  {
    role: 'shipping',
    label: 'Shipping / logistics fee',
    required: false,
    help: 'Forward and reverse shipping charged to you.',
    patterns: ['shipping charge', 'shipping fee', 'shipping label', 'logistics', 'delivery charge', 'postage', 'courier', 'freight', 'shipping'],
  },
  {
    role: 'otherFees',
    label: 'Other fees',
    required: false,
    help: 'Collection fee, closing fee, fixed fee — any single further deduction column.',
    patterns: ['collection fee', 'closing fee', 'fixed fee', 'payment fee', 'gateway', 'other deduction', 'tcs', 'tds', 'penalty', 'fee'],
  },
  {
    role: 'status',
    label: 'Order status',
    required: false,
    help: 'Delivered, returned, cancelled. Used to explain a zero settlement rather than flag it wrongly.',
    // Shopify Payments calls this "Type" and uses it for charge / refund /
    // adjustment / payout / chargeback rows. Reading it lets the engine skip
    // the rows that are not sales.
    patterns: ['order status', 'live order status', 'transaction type', 'status', 'type'],
  },
  {
    role: 'date',
    label: 'Date',
    required: false,
    help: 'Order or settlement date. Shown alongside findings.',
    patterns: ['settlement date', 'order date', 'payment date', 'dispatch date', 'date'],
  },
];

export type ColumnMapping = Partial<Record<ColumnRole, number>>;

/**
 * Guess a mapping from header text.
 *
 * Scores by pattern specificity (earlier pattern = better) and refuses to
 * assign one column to two roles — "shipping fee" must not satisfy both
 * `shipping` and the generic `fee` of `otherFees`.
 */
export function guessMapping(headers: string[]): ColumnMapping {
  const normalised = headers.map((header) => header.toLowerCase().trim());
  const mapping: ColumnMapping = {};
  const taken = new Set<number>();

  for (const spec of ROLE_SPECS) {
    let bestIndex = -1;
    let bestScore = Infinity;

    normalised.forEach((header, index) => {
      if (taken.has(index)) return;
      const patternIndex = spec.patterns.findIndex((pattern) =>
        header.includes(pattern)
      );
      if (patternIndex === -1) return;
      if (patternIndex < bestScore) {
        bestScore = patternIndex;
        bestIndex = index;
      }
    });

    if (bestIndex !== -1) {
      mapping[spec.role] = bestIndex;
      taken.add(bestIndex);
    }
  }

  return mapping;
}

export function missingRequiredRoles(mapping: ColumnMapping): RoleSpec[] {
  return ROLE_SPECS.filter(
    (spec) => spec.required && mapping[spec.role] === undefined
  );
}

/** True when at least one deduction column is mapped. */
export function hasAnyFeeColumn(mapping: ColumnMapping): boolean {
  return (
    mapping.commission !== undefined ||
    mapping.shipping !== undefined ||
    mapping.otherFees !== undefined
  );
}
