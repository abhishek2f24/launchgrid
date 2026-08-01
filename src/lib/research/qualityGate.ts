// Decides whether a fulfilled request is good enough to charge for.
//
// This is the only thing standing between a customer and paying for an empty report.
// Fulfilment scrapes sites that fail in ways that still "succeed" — a 429 page parses
// to zero suppliers, a mismatched search returns three sellers of something else — so
// "the worker finished without throwing" is NOT evidence of a usable report.
//
// The verdict is stored on the request (quality_report) so a delivery or refund
// decision can be explained to a customer months later.

export interface GateInput {
  query: string;
  suppliers: {
    supplierName: string;
    unitPrice: number | null;
    currency: string | null;
    city: string | null;
    extractionConfidence: number | null;
    productTitle?: string | null;
  }[];
}

export interface GateVerdict {
  pass: boolean;
  /** Machine-readable so the worker can branch; human-readable reasons ride alongside. */
  failures: string[];
  warnings: string[];
  metrics: {
    supplierCount: number;
    pricedCount: number;
    meanConfidence: number;
    distinctSuppliers: number;
    priceSpreadRatio: number | null;
    titleMatchRate: number | null;
  };
}

/** Below this, a report is not worth what a customer paid for it. */
export const MIN_SUPPLIERS = 3;
export const MIN_MEAN_CONFIDENCE = 0.5;
/** A ladder spanning more than this is almost always mixed products, not a price range. */
export const MAX_PRICE_SPREAD_RATIO = 50;

/**
 * Relevance thresholds.
 *
 * Below MIN_TITLE_MATCH_RATE the report is about something else and is REFUNDED, not
 * delivered. Measured failures that motivated this: "Macrame Wall Hanging" returned
 * agate and acrylic sellers; "Smart Door Lock" returned a modular-kitchen firm at
 * ₹8,500. Delivering those costs far more in trust than the refund costs in rupees.
 *
 * Between the two thresholds the report is delivered with a visible warning — supplier
 * directories genuinely return adjacent products, and a merchant can still use that.
 */
export const MIN_TITLE_MATCH_RATE = 0.34;
export const WARN_TITLE_MATCH_RATE = 0.6;

const STOPWORDS = new Set(['set', 'pack', 'kit', 'with', 'for', 'and', 'the', 'of', 'pair', 'mm', 'in']);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Fraction of suppliers whose listing title shares a meaningful token with the query.
 * Returns null when titles were not captured, so "unknown" is never scored as "bad" —
 * the same NULL-vs-false distinction the supplier evidence columns rely on.
 */
export function titleMatchRate(query: string, input: GateInput['suppliers']): number | null {
  const withTitles = input.filter((s) => s.productTitle);
  if (!withTitles.length) return null;

  const q = new Set(tokens(query));
  if (!q.size) return null;

  const hits = withTitles.filter((s) => tokens(s.productTitle!).some((t) => q.has(t)));
  return hits.length / withTitles.length;
}

export function evaluate(input: GateInput): GateVerdict {
  const failures: string[] = [];
  const warnings: string[] = [];

  const suppliers = input.suppliers ?? [];
  const priced = suppliers.filter((s) => typeof s.unitPrice === 'number' && s.unitPrice > 0);
  const distinct = new Set(suppliers.map((s) => s.supplierName.trim().toLowerCase())).size;

  const confidences = suppliers
    .map((s) => s.extractionConfidence)
    .filter((c): c is number => typeof c === 'number');
  const meanConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  const prices = priced.map((s) => s.unitPrice!).sort((a, b) => a - b);
  const priceSpreadRatio = prices.length >= 2 ? prices[prices.length - 1] / prices[0] : null;

  const matchRate = titleMatchRate(input.query, suppliers);

  if (distinct < MIN_SUPPLIERS) {
    failures.push(`Only ${distinct} distinct supplier(s); need ${MIN_SUPPLIERS}`);
  }
  if (!priced.length) {
    failures.push('No supplier had a usable price');
  }
  // A missing currency is a hard fail, never a guess. Defaulting a USD quote to INR
  // once understated landed cost by ~83x and turned a loss-making product into a
  // "LAUNCH READY" verdict.
  if (priced.some((s) => !s.currency)) {
    failures.push('At least one price tier has no currency');
  }
  if (meanConfidence < MIN_MEAN_CONFIDENCE) {
    failures.push(`Mean extraction confidence ${meanConfidence.toFixed(2)} below ${MIN_MEAN_CONFIDENCE}`);
  }

  // Relevance. A rate of null means titles were never captured — unknown, so not
  // scored either way, the same NULL-vs-false discipline the evidence columns use.
  if (matchRate !== null && matchRate < MIN_TITLE_MATCH_RATE) {
    failures.push(
      `Only ${Math.round(matchRate * 100)}% of listings match "${input.query}" — the suppliers found sell something else`,
    );
  } else if (matchRate !== null && matchRate < WARN_TITLE_MATCH_RATE) {
    warnings.push(`Only ${Math.round(matchRate * 100)}% of listings clearly match "${input.query}"`);
  }
  if (priceSpreadRatio !== null && priceSpreadRatio > MAX_PRICE_SPREAD_RATIO) {
    warnings.push(`Prices span ${priceSpreadRatio.toFixed(0)}x — likely mixed product types`);
  }

  return {
    pass: failures.length === 0,
    failures,
    warnings,
    metrics: {
      supplierCount: suppliers.length,
      pricedCount: priced.length,
      meanConfidence: Number(meanConfidence.toFixed(3)),
      distinctSuppliers: distinct,
      priceSpreadRatio: priceSpreadRatio === null ? null : Number(priceSpreadRatio.toFixed(2)),
      titleMatchRate: matchRate === null ? null : Number(matchRate.toFixed(3)),
    },
  };
}
