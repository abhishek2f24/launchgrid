/**
 * The calculator engine's contract.
 *
 * A calculator is DATA: a list of inputs, a pure function, and a list of
 * outputs. It is not a page. One shared component renders every definition, and
 * one statically-prerendered dynamic route serves all of them, so the marginal
 * cost of the sixteenth calculator is an entry in `registry.ts` — no new
 * component, no new bundle, no new server work.
 *
 * WHY THAT MATTERS HERE
 *   These pages are prerendered at build time and compute entirely in the
 *   visitor's browser. Serving one costs a static file read; the arithmetic
 *   happens on the visitor's device. At any traffic level this stays free,
 *   which is the whole point while we are waiting on the first sale.
 *
 * `compute` MUST BE PURE AND TOTAL
 *   No I/O, no Date.now(), no randomness — a prerendered page and a client
 *   rerender have to agree. And it must never return NaN or Infinity: when an
 *   input makes an output meaningless (a zero denominator, a negative
 *   contribution margin), return `null` for that output. The UI renders null as
 *   a dash with an explanation, which is honest. A calculator that confidently
 *   displays "Infinity%" is worse than one that admits it cannot answer.
 */

import type { LucideIcon } from 'lucide-react';
import type { IntentBucket } from '@/data/tools';

export type OutputFormat =
  | 'inr'
  | 'percent'
  | 'number'
  | 'days'
  | 'months'
  | 'ratio';

export interface CalcField {
  id: string;
  label: string;
  /** Rendered inside the input, e.g. '₹' or '%'. */
  unit?: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  /** One short line under the field. Use for assumptions, not instructions. */
  help?: string;
}

export interface CalcOutput {
  id: string;
  label: string;
  format: OutputFormat;
  /** The headline number. Exactly one output per calculator should set this. */
  primary?: boolean;
  help?: string;
}

export type CalcValues = Record<string, number>;
/** null means "not meaningful for these inputs" — see the note above. */
export type CalcResults = Record<string, number | null>;

export interface CalculatorDef {
  /** URL segment under /tools. */
  slug: string;
  /** Page <h1> and card heading. */
  title: string;
  /** Short label for the tool grid, when the full title is too long. */
  shortTitle?: string;
  /** One sentence, used for the card, the meta description and the intro. */
  description: string;
  icon: LucideIcon;
  bucket: IntentBucket;
  badge: string;
  fields: CalcField[];
  outputs: CalcOutput[];
  compute: (values: CalcValues) => CalcResults;
  /**
   * The arithmetic in words, shown on the page.
   *
   * Not decoration: someone pricing their own business needs to know whether
   * our definition of "margin" matches theirs, and showing the formula is the
   * difference between a tool they can check and a black box they have to
   * trust.
   */
  formula: string;
  /** Assumptions, exclusions, and anything that would otherwise mislead. */
  caveat?: string;
  keywords: string[];
  useCases: string[];
}

/** Guard for the arithmetic: turns NaN/Infinity into an honest null. */
export function finite(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

/** Division that refuses rather than returning Infinity. */
export function divide(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return finite(numerator / denominator);
}
